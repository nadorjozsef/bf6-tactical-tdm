import { Events } from 'bf6-portal-utils/events/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { MultiClickDetector } from 'bf6-portal-utils/multi-click-detector/index.ts';

import { DebugTool } from './debug-tool/index.ts';
import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';
import { UI } from 'bf6-portal-utils/ui/index.ts';
import { Clocks } from 'bf6-portal-utils/clocks/index.ts';
import { getAllPlayers } from './helpers/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';

const DEFAULT_PLAYER_LIVES = 1;
const DEFAULT_REINFORCEMENTS_TIME = 60;
const SOUND_LOOP_2D = mod.RuntimeSpawn_Common.SFX_UI_EOR_RankUp_Normal_OneShot2D;

let adminDebugTool: DebugTool | undefined;
const LivesPlayerVar = 0;
const ScorePlayerVar = 1;
const KillsPlayerVar = 2;
const LivesTextPlayerVar = 3;
let nextReinforcementsTime = DEFAULT_REINFORCEMENTS_TIME;
let reinforcementsText: UIText | undefined;
let reinforcementsText2: UIText | undefined;

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
Events.OnGameModeStarted.subscribe(startCountDownClock);
Events.OnGameModeStarted.subscribe(handleGameModeStarted);
Events.OnPlayerEarnedKill.subscribe(handlePlayerEarnedKill);

mod.RuntimeSpawn_Abbasid

function handlePlayerEarnedKill(player: mod.Player, victim: mod.Player): void {
    if (player === victim) return;
    const playerScore = mod.GetVariable(mod.ObjectVariable(player, ScorePlayerVar)) as number;
    mod.SetVariable(mod.ObjectVariable(player, ScorePlayerVar), playerScore + 100);
    const team = mod.GetTeam(player);
    const gameModeScore = mod.GetGameModeScore(team);
    mod.SetGameModeScore(team, gameModeScore + 100);
    updateScoreboard(player);
}

function handleGameModeStarted(): void {
    setupScoreboard();
    setupGameMode();
    displayNextReinforcementsWidget();
    displayNextReinforcementsWidget2();
    Sounds.preload(SOUND_LOOP_2D);
}

function setupGameMode() {
    mod.SetGameModeTargetScore(2000);
    mod.SetGameModeTimeLimit(600);
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

function handlePlayerUndeploy(player: mod.Player): void {
    adminDebugTool?.dynamicLog(`Player ${mod.GetObjId(player)} died.`);
    let lives = mod.GetVariable(mod.ObjectVariable(player, LivesPlayerVar)) as number;
    if (lives >= 1) lives--;
    mod.SetVariable(mod.ObjectVariable(player, LivesPlayerVar), lives);
    if (lives <= 0) {
        mod.EnablePlayerDeploy(player, false);
    }
    updateLivesText(player, lives);
    updateScoreboard(player);
}

function scheduleScoreboardUpdates(player: mod.Player): void {
    for (let seconds = 0; seconds <= 5; seconds++) {
        Timers.setTimeout(() => updateScoreboard(player), seconds * 1000);
    }
}

function updateLivesText(player: mod.Player, newValue: number) {
    const widgetName = mod.GetVariable(mod.ObjectVariable(player, LivesTextPlayerVar)) as string;
    const widget = mod.FindUIWidgetWithName(widgetName)
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.lifeCount, newValue));
}

function updateReinforcementsText(newValue: number) {
    reinforcementsText?.setMessage(mod.Message(mod.stringkeys.nextReinforcementsTimer, newValue));
    reinforcementsText2?.setMessage(mod.Message(mod.stringkeys.reinforcementsTime, newValue));
}

function displayLifeWidget(player: mod.Player): void {
    const container = new UIContainer({
        width: 100,
        height: 80,
        bgColor: UI.COLORS.BLACK,
        bgFill: mod.UIBgFill.Solid,
        bgAlpha: 0.8,
        visible: true,
        depth: mod.UIDepth.BelowGameUI,
        position: { x: 0, y: 130 },
        anchor: mod.UIAnchor.TopRight,
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
    mod.SetVariable(mod.ObjectVariable(player, LivesTextPlayerVar), livesText.name);
    container.show();
}

function displayNextReinforcementsWidget(): void {
    const container = new UIContainer({
        width: 300,
        height: 80,
        bgColor: UI.COLORS.BLACK,
        bgFill: mod.UIBgFill.Solid,
        bgAlpha: 0.8,
        visible: true,
        position: { x: 0, y: 50 },
        anchor: mod.UIAnchor.TopRight
    });
    reinforcementsText = new UIText({
        message: mod.Message(mod.stringkeys.nextReinforcementsTimer, nextReinforcementsTime),
        textSize: 20,
        width: 280,
        textColor: UI.COLORS.WHITE,
        parent: container
    });
    container.show();
}

const team1ScoreContainer = new UIContainer({
    position: { x: -120, y: 60 },
    size: { width: 100, height: 50 },
    anchor: mod.UIAnchor.TopCenter,
    visible: true,
    bgColor: mod.CreateVector(0.0745, 0.1843, 0.2471),
    bgAlpha: 0.75,
    bgFill: mod.UIBgFill.Solid
});

team1ScoreContainer.show();

const team1ScoreText = new UIText({
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
    anchor: mod.UIAnchor.Center,
    visible: true,
    bgColor: mod.CreateVector(0.4392, 0.9216, 1),
    bgAlpha: 0.75,
    bgFill: mod.UIBgFill.None,
    message: mod.Message(mod.stringkeys.team1Score, 42),
    textColor: mod.CreateVector(0.4392, 0.9216, 1),
    textSize: 28,
    textAnchor: mod.UIAnchor.Center,
    parent: team1ScoreContainer
});

const team2ScoreContainer = new UIContainer({
    position: { x: 120, y: 60 },
    size: { width: 100, height: 50 },
    anchor: mod.UIAnchor.TopCenter,
    visible: true,
    bgColor: mod.CreateVector(0.251, 0.0941, 0.0667),
    bgAlpha: 0.75,
    bgFill: mod.UIBgFill.Solid
});

team2ScoreContainer.show();

const team2ScoreText = new UIText({
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
    anchor: mod.UIAnchor.Center,
    visible: true,
    padding: 0,
    bgColor: mod.CreateVector(0.4392, 0.9216, 1),
    bgAlpha: 0.75,
    bgFill: mod.UIBgFill.None,
    message: mod.Message(mod.stringkeys.team2Score, 60),
    textColor: mod.CreateVector(1, 0.5137, 0.3804),
    textSize: 28,
    textAnchor: mod.UIAnchor.Center,
    parent: team2ScoreContainer
})

function displayNextReinforcementsWidget2(): void {
    const reinforcementsTimerContainer = new UIContainer({
        position: { x: 0, y: 60 },
        size: { width: 100, height: 50 },
        anchor: mod.UIAnchor.TopCenter,
        visible: true,
        bgColor: mod.CreateVector(0.3294, 0.3686, 0.3882),
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.Solid
    });

    reinforcementsText2 = new UIText({
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
        textSize: 11,
        textAnchor: mod.UIAnchor.Center,
        parent: reinforcementsTimerContainer
    })

    reinforcementsTimerContainer.show();
}