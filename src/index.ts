import { Events } from 'bf6-portal-utils/events/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { Clocks } from 'bf6-portal-utils/clocks/index.ts';
import { getAllPlayers } from './helpers/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { GameUI } from './ui/gameUi.ts';
import { Team, TeamManager } from './entities/team.ts';
import { Game } from './entities/game.ts';
import { PlayerManager } from './managers/playerManager.ts';
import { debug } from './debugTool/adminDebugTool.ts';

const DEFAULT_REINFORCEMENTS_TIME = 60;
const GAME_MODE_TARGET_SCORE = 15;
const GAME_MODE_TIMELIMIT = 600;
const SOUND_LOOP_2D = mod.RuntimeSpawn_Common.SFX_UI_EOR_RankUp_Normal_OneShot2D;

Events.OnPlayerJoinGame.subscribe(handlePlayerJoinGame);
Events.OnPlayerUndeploy.subscribe(handlePlayerUndeploy);
Events.OnPlayerDeployed.subscribe(handlePlayerDeployed);
Events.OnGameModeStarted.subscribe(startCountDownClock);
Events.OnGameModeStarted.subscribe(handleGameModeStarted);
Events.OnPlayerEarnedKill.subscribe(handlePlayerEarnedKill);
Events.OnCapturePointCaptured.subscribe(handleCapturePointCaptured);

const gameUI = GameUI.GetInstance();
const playerManager = new PlayerManager(gameUI);
const game = Game.GetInstance(gameUI);
const teamManager = new TeamManager(gameUI);
const team1 = teamManager.getTeam1();
const team2 = teamManager.getTeam2();

function handleCapturePointCaptured(capturePoint: mod.CapturePoint): void {
    // const ownerTeam = mod.GetCurrentOwnerTeam(capturePoint);
}

function handleGameModeStarted(): void {
    setupScoreboard();
    setupGameMode();
    Sounds.preload(SOUND_LOOP_2D);
    mod.LoadMusic(mod.MusicPackages.Core);
    mod.EnableGameModeObjective(mod.GetCapturePoint(100), true);
    mod.SetCapturePointCapturingTime(mod.GetCapturePoint(100), 10);
    mod.SetCapturePointNeutralizationTime(mod.GetCapturePoint(100), 10);
    mod.SetMaxCaptureMultiplier(mod.GetCapturePoint(100), 1);
}

function setupGameMode() {
    mod.SetGameModeTimeLimit(GAME_MODE_TIMELIMIT);
}

function handlePlayerJoinGame(modPlayer: mod.Player): void {
    if (mod.GetObjId(modPlayer) === 0) {
        mod.SetTeam(modPlayer, mod.GetTeam(2))
    }
    scheduleScoreboardUpdates(modPlayer);
}

function setupScoreboard() {
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetScoreboardHeader(mod.Message(mod.stringkeys.scoreboard.team1), mod.Message(mod.stringkeys.scoreboard.team2));
    mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.scoreboard.score),
        mod.Message(mod.stringkeys.scoreboard.kills),
        mod.Message(mod.stringkeys.scoreboard.lives)
    );
    mod.SetScoreboardColumnWidths(1, 1, 1);
}

function updateScoreboard(modPlayer: mod.Player): void {
    const player = playerManager.getPlayer(modPlayer);
    const score = player.score;
    const kills = player.kills;
    const lives = player.lives;
    mod.SetScoreboardPlayerValues(modPlayer, score, kills, lives);
}

function startCountDownClock(): void {
    nextReinforcementsClock.start();
}

const nextReinforcementsClock = new Clocks.CountDownClock(DEFAULT_REINFORCEMENTS_TIME, {
    onSecond: (seconds) => updateNextReinforcementDisplay(seconds),
    onComplete: () => handleReinforcementsArrived(),
});

function updateNextReinforcementDisplay(seconds: number): void {
    game.nextReinforcementsTime = seconds;
}

function handlePlayerEarnedKill(modPlayer: mod.Player, victim: mod.Player): void {
    updateActivePlayers();
    if (modPlayer === victim) return;
    const player = playerManager.getPlayer(modPlayer);
    player.kills++;
    player.score += 100;
    if (player.teamId === 1) {
        team1.score++;
    } else if (player.teamId === 2) {
        team2.score++;
    }
    if (team1.score >= GAME_MODE_TARGET_SCORE) {
        mod.EndGameMode(mod.GetTeam(1));
    } else if (team2.score >= GAME_MODE_TARGET_SCORE) {
        mod.EndGameMode(mod.GetTeam(2));
    }
    updateScoreboard(modPlayer);

    //Todo: set winning, losing teams, run it once
    if (team1.score === GAME_MODE_TARGET_SCORE - 3 || team2.score === GAME_MODE_TARGET_SCORE - 3) {
        mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
    }
}

function handleReinforcementsArrived(): void {
    for (const modPlayer of getAllPlayers()) {
        const player = playerManager.getPlayer(modPlayer);
        player.lives = player.lives + 1;
        updateScoreboard(modPlayer);
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

function handlePlayerUndeploy(modPlayer: mod.Player): void {
    const player = playerManager.getPlayer(modPlayer);
    let lives = player.lives;
    if (lives >= 1) {
        lives--;
    }
    if (lives <= 0) {
        mod.EnablePlayerDeploy(modPlayer, false);
    }
    player.lives = lives;
    updateActivePlayers();
    updateScoreboard(modPlayer);
}

function scheduleScoreboardUpdates(modPlayer: mod.Player): void {
    for (let seconds = 0; seconds <= 5; seconds++) {
        Timers.setTimeout(() => updateScoreboard(modPlayer), seconds * 1000);
    }
}

function updateActivePlayers() {
    let team1ActivePlayers = 0;
    let team2ActivePlayers = 0;
    for (const player of playerManager.getAllPlayers()) {
        const teamId = player.teamId;
        const isAlive = player.isAlive;
        if (isAlive) {
            if (teamId === 1) {
                team1ActivePlayers++;
            } else if (teamId === 2) {
                team2ActivePlayers++;
            }
        }
    }
    teamManager.getTeam1().activePlayers = team1ActivePlayers;
    teamManager.getTeam2().activePlayers = team2ActivePlayers;
}
