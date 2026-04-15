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

const DEFAULT_PLAYER_LIVES = 1;
const DEFAULT_REINFORCEMENTS_TIME = 60;
const GAME_MODE_TARGET_SCORE = 15
const GAME_MODE_TIMELIMIT = 600;
const SOUND_LOOP_2D = mod.RuntimeSpawn_Common.SFX_UI_EOR_RankUp_Normal_OneShot2D;

let adminDebugTool: DebugTool | undefined;
const LivesPlayerVar = 0;
const ScorePlayerVar = 1;
const KillsPlayerVar = 2;
const LivesWidgetNamePlayerVar = 3;

const ScoreTeamVar = 4;
const ActivePlayersTeamVar = 5;

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

mod.RuntimeSpawn_Abbasid

function handleGameModeStarted(): void {
    setupScoreboard();
    setupGameMode();
    displayTeam1ScoreWidget()
    displayTeam2ScoreWidget();
    displayNextReinforcementsWidget();
    displayActivePlayersWidget();
    Sounds.preload(SOUND_LOOP_2D);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(1), ScoreTeamVar), 0);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(2), ScoreTeamVar), 0);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(1), ActivePlayersTeamVar), 0);
    mod.SetVariable(mod.ObjectVariable(mod.GetTeam(2), ActivePlayersTeamVar), 0);
}

function setupGameMode() {
    mod.SetGameModeTimeLimit(GAME_MODE_TIMELIMIT);
}

function handlePlayerJoinGame(player: mod.Player): void {
    mod.SetVariable(mod.ObjectVariable(player, LivesPlayerVar), DEFAULT_PLAYER_LIVES);
    displayLifeWidget(player);
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
    const lives = mod.GetVariable(mod.ObjectVariable(player, LivesPlayerVar)) as number;
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
}

function handleReinforcementsArrived(): void {
    for (const player of getAllPlayers()) {
        let lives = mod.GetVariable(mod.ObjectVariable(player, LivesPlayerVar)) as number;
        lives += DEFAULT_PLAYER_LIVES;
        mod.SetVariable(mod.ObjectVariable(player, LivesPlayerVar), lives);
        updateLivesText(player, lives);
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
    let lives = mod.GetVariable(mod.ObjectVariable(player, LivesPlayerVar)) as number;
    if (lives >= 1) lives--;
    mod.SetVariable(mod.ObjectVariable(player, LivesPlayerVar), lives);
    if (lives <= 0) {
        mod.EnablePlayerDeploy(player, false);
    }
    updateActivePlayers();
    updateLivesText(player, lives);
    updateScoreboard(player);
}

function scheduleScoreboardUpdates(player: mod.Player): void {
    for (let seconds = 0; seconds <= 5; seconds++) {
        Timers.setTimeout(() => updateScoreboard(player), seconds * 1000);
    }
}

function updateLivesText(player: mod.Player, newValue: number) {
    const widgetName = mod.GetVariable(mod.ObjectVariable(player, LivesWidgetNamePlayerVar)) as string;
    const widget = mod.FindUIWidgetWithName(widgetName)
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.lifeCount, newValue));
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

function displayLifeWidget(player: mod.Player): void {
    const container = new UIContainer({
        position: { x: 300, y: 60 },
        size: { width: 100, height: 50 },
        bgColor: UI.COLORS.BLACK,
        bgFill: mod.UIBgFill.Solid,
        bgAlpha: 0.75,
        visible: true,
        depth: mod.UIDepth.BelowGameUI,
        anchor: mod.UIAnchor.TopCenter,
        receiver: player,
    });
    const lifeCount = mod.GetVariable(mod.ObjectVariable(player, LivesPlayerVar)) as number;
    const livesText = new UIText({
        message: mod.Message(mod.stringkeys.lifeCount, lifeCount),
        textSize: 20,
        width: 80,
        textColor: UI.COLORS.WHITE,
        receiver: player,
        parent: container,
    });
    mod.SetVariable(mod.ObjectVariable(player, LivesWidgetNamePlayerVar), livesText.name);
    container.show();
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
