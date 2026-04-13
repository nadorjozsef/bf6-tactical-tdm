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
Events.OnPlayerUndeploy.subscribe(handlePlayerDied);

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
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetScoreboardHeader(mod.Message(mod.stringkeys.scoreboard.team1), mod.Message(mod.stringkeys.scoreboard.team2));
    mod.SetScoreboardColumnNames(mod.Message(mod.stringkeys.scoreboard.score), mod.Message(mod.stringkeys.scoreboard.kills), mod.Message(mod.stringkeys.scoreboard.lives));
    mod.SetScoreboardColumnWidths(1, 1, 1);

    mod.SetGameModeTargetScore(1000);
    mod.SetGameModeTimeLimit(600);

    Sounds.preload(SOUND_LOOP_2D);

    // displayNextReinforcementsWidget();
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
    const stopSound = Sounds.play2D(SOUND_LOOP_2D, {
        amplitude: 1,
        duration: 2000,
    });
    nextReinforcementsClock.reset().start();
}

function handlePlayerJoinGame(player: mod.Player): void {
    mod.SetVariable(mod.ObjectVariable(player, LivesPlayerVar), DEFAULT_PLAYER_LIVES);
    // if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
    displayLifeWidget(player);
    // }
    displayNextReinforcementsWidget(player);
    updateScoreboard(player);
}

function handlePlayerDied(player: mod.Player): void {
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

function updateLivesText(player: mod.Player, newValue: number) {
    const widgetName = mod.GetVariable(mod.ObjectVariable(player, LivesTextPlayerVar)) as string;
    const widget = mod.FindUIWidgetWithName(widgetName)
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.lifeCount, newValue));
}

function updateReinforcementsText(newValue: number) {
    reinforcementsText?.setMessage(mod.Message(mod.stringkeys.nextReinforcementsTimer, newValue));
}

function displayLifeWidget(player: mod.Player): void {
    const container = new UIContainer({
        width: 100,
        height: 80,
        bgColor: UI.COLORS.BLACK,
        bgFill: mod.UIBgFill.Solid,
        bgAlpha: 0.8,
        visible: true,
        depth: mod.UIDepth.AboveGameUI,
        position: { x: 0, y: 130 },
        anchor: mod.UIAnchor.TopCenter,
        receiver: player,
    }) ;
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

function displayNextReinforcementsWidget(player: mod.Player): void {
    const container = new UIContainer({
        width: 300,
        height: 80,
        bgColor: UI.COLORS.BLACK,
        bgFill: mod.UIBgFill.Solid,
        bgAlpha: 0.8,
        visible: true,
        depth: mod.UIDepth.AboveGameUI,
        position: { x: 0, y: 50 },
        anchor: mod.UIAnchor.TopCenter,
        receiver: player,
    });
    reinforcementsText = new UIText({
        message: mod.Message(mod.stringkeys.nextReinforcementsTimer, nextReinforcementsTime),
        textSize: 20,
        width: 280,
        textColor: UI.COLORS.WHITE,
        parent: container,
        receiver: player
    });
    container.show();
    // 9
}