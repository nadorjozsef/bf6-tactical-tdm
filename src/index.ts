import { Events } from 'bf6-portal-utils/events/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { MultiClickDetector } from 'bf6-portal-utils/multi-click-detector/index.ts';

import { DebugTool } from './debug-tool/index.ts';
import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';
import { UI } from 'bf6-portal-utils/ui/index.ts';
import { Clocks } from 'bf6-portal-utils/clocks/index.ts';
import { equals, getAllPlayers } from './helpers/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';

const DEFAULT_REINFORCEMENTS_TIME = 60;
const GAME_MODE_TARGET_SCORE = 15
const GAME_MODE_TIMELIMIT = 600;
const SOUND_LOOP_2D = mod.RuntimeSpawn_Common.SFX_UI_EOR_RankUp_Normal_OneShot2D;


let adminDebugTool: DebugTool | undefined;
const ScorePlayerVar = 0;
const KillsPlayerVar = 1;

const ScoreTeamVar = 2;
const ActivePlayersTeamVar = 3;

let nextReinforcementsTime = DEFAULT_REINFORCEMENTS_TIME;
let reinforcementsText: UIText | undefined;
let team1ScoreText: UIText | undefined;
let team2ScoreText: UIText | undefined;
let team1ActivePlayersText: UIText | undefined;
let team2ActivePlayersText: UIText | undefined;

function createAdminDebugTool(player: mod.Player): void {
    // The admin player is player id 0 for non-persistent test servers,
    // so don't do the rest of this unless it's the admin player.
    if (mod.GetObjId(player) != 0) return;

    // Create a debug tool with a static logger visible by default.
    const debugToolOptions: DebugTool.Options = {
        staticLogger: {
            visible: false,
        },
        dynamicLogger: {
            visible: false,
        },
        debugMenu: {
            visible: false,
        },
    };

    adminDebugTool = new DebugTool(player, debugToolOptions);

    // Create a multi-click detector to open the debug menu when the player triple-clicks the interact key.
    new MultiClickDetector(player, () => {
        adminDebugTool?.showDebugMenu();
    });

    // Log a message to the static logger.
    adminDebugTool?.staticLog(`Triple-click interact key to open debug menu.`, 0);
}

function destroyAdminDebugTool(playerId: number): void {
    // If the player is not the admin player, then we know the admin is still in the game, so we can exit this function.
    if (playerId !== 0) return;

    adminDebugTool?.destroy();
    adminDebugTool = undefined;
}

Events.OnPlayerJoinGame.subscribe(createAdminDebugTool);
Events.OnPlayerLeaveGame.subscribe(destroyAdminDebugTool);
Events.OnPlayerJoinGame.subscribe(handlePlayerJoinGame);
Events.OnPlayerUndeploy.subscribe(handlePlayerUndeploy);
Events.OnPlayerDeployed.subscribe(handlePlayerDeployed);
Events.OnGameModeStarted.subscribe(startCountDownClock);
Events.OnGameModeStarted.subscribe(handleGameModeStarted);
Events.OnPlayerEarnedKill.subscribe(handlePlayerEarnedKill);
Events.OnCapturePointCaptured.subscribe(handleCapturePointCaptured)

export class SoldierManager {
    private _soldiers: Soldier[] = [];

    constructor(private _gameUI: GameUI) {
        Events.OnPlayerJoinGame.subscribe(this.handlePlayerJoinGame.bind(this));
        Events.OnPlayerLeaveGame.subscribe(this.handlePlayerLeaveGame.bind(this));
    }

    private handlePlayerJoinGame(player: mod.Player): void {
        const soldier = new Soldier(player, this._gameUI);
        this._soldiers.push(soldier);
    }

    private handlePlayerLeaveGame(playerId: number): void {
        const index = this._soldiers.findIndex(player => player.Id === playerId);
        if (index !== -1) {
            this._soldiers.splice(index, 1);
        }
    }

    public getSoldierById(playerId: number): Soldier {
        const soldier = this._soldiers.find(soldiers => soldiers.Id === playerId);
        if (!soldier) {
            throw "Soldier has not found!"
        }
        return soldier;
    }

    public getSoldier(player: mod.Player): Soldier {
        const playerId = mod.GetObjId(player)
        return this.getSoldierById(playerId)
    }
}

export class Soldier {
    private _id: number;
    private _livesSignal = SolidUI.createSignal(1);

    get Id() {
        return this._id;
    }

    get lives(): number {
        return this._livesSignal[0]();
    }

    set lives(value: number) {
        this._livesSignal[1](value);
    }

    constructor(player: mod.Player, gameUI: GameUI) {
        this._id = mod.GetObjId(player);
        gameUI.showLivesUI(player, this._livesSignal[0])
    }
}

export class GameUI {
    public showLivesUI(player: mod.Player, signal: SolidUI.Accessor<number>) {
        const livesUI = SolidUI.h(UIContainer, {
            position: { x: 300, y: 60 },
            size: { width: 100, height: 50 },
            bgColor: UI.COLORS.BLACK,
            bgFill: mod.UIBgFill.Solid,
            bgAlpha: 0.75,
            visible: true,
            depth: mod.UIDepth.BelowGameUI,
            anchor: mod.UIAnchor.TopCenter,
            receiver: player
        });
        SolidUI.h(UIText, {
            message: () => mod.Message(mod.stringkeys.lifeCount, signal()),
            textSize: 20,
            width: 80,
            textColor: UI.COLORS.WHITE,
            receiver: player,
            parent: livesUI
        });
        livesUI.show();
    }
}

const gameUI = new GameUI();
const soldierManager = new SoldierManager(gameUI);

function handleCapturePointCaptured(capturePoint: mod.CapturePoint): void {
    const ownerTeam = mod.GetCurrentOwnerTeam(capturePoint);
}

function handleGameModeStarted(): void {
    setupScoreboard();
    setupGameMode();
    displayTeam1ScoreWidget()
    displayTeam2ScoreWidget();
    displayNextReinforcementsWidget();
    displayActivePlayersWidget();
    Sounds.preload(SOUND_LOOP_2D);
    mod.LoadMusic(mod.MusicPackages.Core);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(1), ScoreTeamVar), 0);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(2), ScoreTeamVar), 0);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(1), ActivePlayersTeamVar), 0);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(2), ActivePlayersTeamVar), 0);
    mod.EnableGameModeObjective(mod.GetCapturePoint(100), true);
    mod.SetCapturePointCapturingTime(mod.GetCapturePoint(100), 10);
    mod.SetCapturePointNeutralizationTime(mod.GetCapturePoint(100), 10)
    mod.SetMaxCaptureMultiplier(mod.GetCapturePoint(100), 1)
}

function setupGameMode() {
    mod.SetGameModeTimeLimit(GAME_MODE_TIMELIMIT);
}

function handlePlayerJoinGame(player: mod.Player): void {
    scheduleScoreboardUpdates(player);
}

function setupScoreboard() {
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetScoreboardHeader(mod.Message(mod.stringkeys.scoreboard.team1), mod.Message(mod.stringkeys.scoreboard.team2));
    mod.SetScoreboardColumnNames(mod.Message(mod.stringkeys.scoreboard.score), mod.Message(mod.stringkeys.scoreboard.kills), mod.Message(mod.stringkeys.scoreboard.lives));
    mod.SetScoreboardColumnWidths(1, 1, 1);
}

function updateScoreboard(player: mod.Player): void {
    const score = mod.GetVariable(mod.ObjectVariable(player, ScorePlayerVar)) as number;
    const kills = mod.GetVariable(mod.ObjectVariable(player, KillsPlayerVar)) as number;
    const lives = soldierManager.getSoldier(player)?.lives ?? -1;
    mod.SetScoreboardPlayerValues(player, score, kills, lives);
}

function startCountDownClock(): void {
    nextReinforcementsClock.start();
}

const nextReinforcementsClock = new Clocks.CountDownClock(DEFAULT_REINFORCEMENTS_TIME, {
    onSecond: (seconds) => updateNextReinforcementDisplay(seconds),
    onComplete: () => handleReinforcementsArrived(),
});

function updateNextReinforcementDisplay(seconds: number): void {
    updateReinforcementsText(seconds);
}

function handlePlayerEarnedKill(player: mod.Player, victim: mod.Player): void {
    updateActivePlayers();
    if (player === victim) return;
    const playerKills = mod.GetVariable(mod.ObjectVariable(player, KillsPlayerVar)) as number;
    mod.SetVariable(mod.ObjectVariable(player, KillsPlayerVar), playerKills + 1);
    const playerScore = mod.GetVariable(mod.ObjectVariable(player, ScorePlayerVar)) as number;
    mod.SetVariable(mod.ObjectVariable(player, ScorePlayerVar), playerScore + 100);
    if (equals(mod.GetTeam(player), mod.GetTeam(1))) {
        updateTeam1Score(1);
    } else if (equals(mod.GetTeam(player), mod.GetTeam(2))) {
        updateTeam2Score(1);
    }
    updateScoreboard(player);

    //Todo: set winning, losing teams, run it once
    const team1Score = mod.GetVariable(mod.ObjectVariable(mod.GetTeam(1), ScoreTeamVar)) as number;
    const team2Score = mod.GetVariable(mod.ObjectVariable(mod.GetTeam(2), ScoreTeamVar)) as number;
    if (team1Score === GAME_MODE_TARGET_SCORE - 3 || team2Score === GAME_MODE_TARGET_SCORE - 3) {
        mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
    }
}

function handleReinforcementsArrived(): void {
    for (const player of getAllPlayers()) {
        const soldier = soldierManager.getSoldier(player);
        soldier.lives = soldier.lives + 1;
        updateScoreboard(player);
    }
    mod.EnableAllPlayerDeploy(true);
    Sounds.play2D(SOUND_LOOP_2D, {
        amplitude: 1,
        duration: 2000,
    });
    nextReinforcementsClock.reset().start();
}

function handlePlayerDeployed(): void {
    updateActivePlayers();
}

function handlePlayerUndeploy(player: mod.Player): void {
    const soldier = soldierManager.getSoldier(player);
    let lives = soldier.lives
    if (lives >= 1) {
        lives--;
    }
    if (lives <= 0) {
        mod.EnablePlayerDeploy(player, false);
    }
    soldier.lives = lives;
    updateActivePlayers();
    updateScoreboard(player);
}

function scheduleScoreboardUpdates(player: mod.Player): void {
    for (let seconds = 0; seconds <= 5; seconds++) {
        Timers.setTimeout(() => updateScoreboard(player), seconds * 1000);
    }
}

function updateReinforcementsText(newValue: number) {
    reinforcementsText?.setMessage(mod.Message(mod.stringkeys.reinforcementsTime, newValue));
}

function updateTeam1Score(increment: number) {
    let teamScore = mod.GetVariable(mod.ObjectVariable(mod.GetTeam(1), ScoreTeamVar)) as number;
    teamScore += increment;
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(1), ScoreTeamVar), teamScore);
    if (teamScore >= GAME_MODE_TARGET_SCORE) {
        mod.EndGameMode(mod.GetTeam(1));
    }
    team1ScoreText?.setMessage(mod.Message(mod.stringkeys.team1Score, teamScore));
}

function updateTeam2Score(increment: number) {
    let teamScore = mod.GetVariable(mod.ObjectVariable(mod.GetTeam(2), ScoreTeamVar)) as number;
    teamScore += increment;
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(2), ScoreTeamVar), teamScore);
    if (teamScore >= GAME_MODE_TARGET_SCORE) {
        mod.EndGameMode(mod.GetTeam(2));
    }
    team2ScoreText?.setMessage(mod.Message(mod.stringkeys.team2Score, teamScore));
}

function updateActivePlayers() {
    let team1ActivePlayers = 0;
    let team2ActivePlayers = 0;
    for (const player of getAllPlayers()) {
        const team = mod.GetTeam(player);
        const isAlive = mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
        if (equals(mod.GetTeam(1), team) && isAlive) {
            team1ActivePlayers++
        } else if (equals(mod.GetTeam(2), team) && isAlive) {
            team2ActivePlayers++
        }
    }
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(1), ActivePlayersTeamVar), team1ActivePlayers);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(2), ActivePlayersTeamVar), team2ActivePlayers);
    team1ActivePlayersText?.setMessage(mod.Message(mod.stringkeys.team1ActivePlayersText, team1ActivePlayers));
    team2ActivePlayersText?.setMessage(mod.Message(mod.stringkeys.team2ActivePlayersText, team2ActivePlayers));
}

function displayTeam1ScoreWidget(): void {
    const team1ScoreContainer = new UIContainer({
        position: { x: -120, y: 60 },
        size: { width: 100, height: 50 },
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        bgColor: mod.CreateVector(0.0745, 0.1843, 0.2471),
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.Solid
    });
    const teamScore = mod.GetVariable(mod.ObjectVariable(mod.GetTeam(1), ScoreTeamVar)) as number;
    team1ScoreText = new UIText({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        anchor: mod.UIAnchor.Center,
        visible: true,
        bgColor: mod.CreateVector(0.4392, 0.9216, 1),
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.None,
        message: mod.Message(mod.stringkeys.team1Score, teamScore),
        textColor: mod.CreateVector(0.4392, 0.9216, 1),
        textSize: 28,
        textAnchor: mod.UIAnchor.Center,
        parent: team1ScoreContainer
    });
    team1ScoreContainer.show();
}

function displayTeam2ScoreWidget(): void {
    const team2ScoreContainer = new UIContainer({
        position: { x: 120, y: 60 },
        size: { width: 100, height: 50 },
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        bgColor: mod.CreateVector(0.251, 0.0941, 0.0667),
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.Solid
    });
    const teamScore = mod.GetVariable(mod.ObjectVariable(mod.GetTeam(1), ScoreTeamVar)) as number;
    team2ScoreText = new UIText({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        anchor: mod.UIAnchor.Center,
        visible: true,
        padding: 0,
        bgColor: mod.CreateVector(0.4392, 0.9216, 1),
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.None,
        message: mod.Message(mod.stringkeys.team2Score, teamScore),
        textColor: mod.CreateVector(1, 0.5137, 0.3804),
        textSize: 28,
        textAnchor: mod.UIAnchor.Center,
        parent: team2ScoreContainer
    })
    team2ScoreContainer.show();
}

function displayNextReinforcementsWidget(): void {
    const reinforcementsTimerContainer = new UIContainer({
        position: { x: 0, y: 60 },
        size: { width: 100, height: 50 },
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        bgColor: mod.CreateVector(0.3294, 0.3686, 0.3882),
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.Solid
    });

    reinforcementsText = new UIText({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 34.79 },
        anchor: mod.UIAnchor.BottomCenter,
        visible: true,
        bgColor: mod.CreateVector(0.4392, 0.9216, 1),
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.None,
        message: mod.Message(mod.stringkeys.reinforcementsTime, nextReinforcementsTime),
        textColor: mod.CreateVector(1, 1, 1),
        textSize: 28,
        textAnchor: mod.UIAnchor.Center,
        parent: reinforcementsTimerContainer
    })

    new UIText({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 20.24 },
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        bgColor: mod.CreateVector(0.2, 0.2, 0.2),
        bgAlpha: 1,
        bgFill: mod.UIBgFill.None,
        message: mod.Message(mod.stringkeys.reinforcementsLabel),
        textColor: mod.CreateVector(1, 1, 1),
        textSize: 12,
        textAnchor: mod.UIAnchor.Center,
        parent: reinforcementsTimerContainer
    })

    reinforcementsTimerContainer.show();
}

function displayActivePlayersWidget(): void {
    const playerCountContainer = new UIContainer({
        position: { x: 0, y: 130 },
        size: { width: 150, height: 50 },
        anchor: mod.UIAnchor.TopCenter,
        bgColor: mod.CreateVector(0.2, 0.2, 0.2),
        bgAlpha: 0,
        bgFill: mod.UIBgFill.None,
    });

    team1ActivePlayersText = new UIText({
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
        anchor: mod.UIAnchor.CenterLeft,
        bgColor: mod.CreateVector(0.2, 0.2, 0.2),
        bgAlpha: 1,
        bgFill: mod.UIBgFill.None,
        message: mod.Message(mod.stringkeys.team1ActivePlayersText),
        textColor: mod.CreateVector(0.4392, 0.9216, 1),
        textSize: 24,
        textAnchor: mod.UIAnchor.Center,
        parent: playerCountContainer,
    });

    team2ActivePlayersText = new UIText({
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
        anchor: mod.UIAnchor.CenterRight,
        bgColor: mod.CreateVector(0.2, 0.2, 0.2),
        bgAlpha: 1,
        bgFill: mod.UIBgFill.None,
        message: mod.Message(mod.stringkeys.team2ActivePlayersText),
        textColor: mod.CreateVector(1, 0.5137, 0.3804),
        textSize: 24,
        textAnchor: mod.UIAnchor.Center,
        parent: playerCountContainer,
    });

    new UIText({
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
        anchor: mod.UIAnchor.Center,
        visible: true,
        padding: 0,
        bgColor: mod.CreateVector(0.2, 0.2, 0.2),
        bgAlpha: 1,
        bgFill: mod.UIBgFill.None,
        message: mod.Message(mod.stringkeys.activePlayersTextCenter),
        textColor: mod.CreateVector(1, 1, 1),
        textSize: 24,
        textAnchor: mod.UIAnchor.Center,
        parent: playerCountContainer,
    });

    playerCountContainer.show();
}
