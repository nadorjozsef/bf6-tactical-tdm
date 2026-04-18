import { Events } from 'bf6-portal-utils/events/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { Clocks } from 'bf6-portal-utils/clocks/index.ts';
import { getAllPlayers } from '../helpers/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { Global } from '../entities/global.ts';
import { PlayerManager } from './playerManager.ts';
import { TeamManager } from './teamManager.ts';
import { debug } from '../debugTool/adminDebugTool.ts';
import type { GlobalManager } from './globalManager.ts';

export class GameModeManager {
    private static _instance: GameModeManager | undefined;

    private GAME_MODE_TARGET_SCORE = 15;
    private GAME_MODE_TIMELIMIT = 600;
    private SOUND_LOOP_2D = mod.RuntimeSpawn_Common.SFX_UI_EOR_RankUp_Normal_OneShot2D;

    private constructor(
        private playerManager: PlayerManager,
        private teamManager: TeamManager,
        private globalManager: GlobalManager
    ) {
        Events.OnPlayerJoinGame.subscribe(this.handlePlayerJoinGame.bind(this));
        Events.OnPlayerUndeploy.subscribe(this.handlePlayerUndeploy.bind(this));
        Events.OnPlayerDeployed.subscribe(this.handlePlayerDeployed.bind(this));

        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
        Events.OnPlayerEarnedKill.subscribe(this.handlePlayerEarnedKill.bind(this));
        Events.OnCapturePointCaptured.subscribe(this.handleCapturePointCaptured.bind(this));
        globalManager.subscribeReinforcementsArrived(this.handleReinforcementsArrived.bind(this));
    }

    static GetInstance(
        playerManager: PlayerManager,
        teamManager: TeamManager,
        globalManager: GlobalManager
    ): GameModeManager {
        if (!GameModeManager._instance) {
            GameModeManager._instance = new GameModeManager(playerManager, teamManager, globalManager);
        }
        return GameModeManager._instance;
    }

    private handleCapturePointCaptured(capturePoint: mod.CapturePoint): void {
        // const ownerTeam = mod.GetCurrentOwnerTeam(capturePoint);
    }

    private handleGameModeStarted(): void {
        this.setupScoreboard();
        mod.SetGameModeTimeLimit(this.GAME_MODE_TIMELIMIT);
        Sounds.preload(this.SOUND_LOOP_2D);
        mod.LoadMusic(mod.MusicPackages.Core);
        mod.EnableGameModeObjective(mod.GetCapturePoint(100), true);
        mod.SetCapturePointCapturingTime(mod.GetCapturePoint(100), 10);
        mod.SetCapturePointNeutralizationTime(mod.GetCapturePoint(100), 10);
        mod.SetMaxCaptureMultiplier(mod.GetCapturePoint(100), 1);
    }

    private handlePlayerJoinGame(modPlayer: mod.Player): void {
        // if (mod.GetObjId(modPlayer) === 0) {
        //     mod.SetTeam(modPlayer, mod.GetTeam(2))
        // }
        this.scheduleScoreboardUpdates(modPlayer);
    }

    private setupScoreboard() {
        mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
        mod.SetScoreboardHeader(mod.Message(mod.stringkeys.scoreboard.team1), mod.Message(mod.stringkeys.scoreboard.team2));
        mod.SetScoreboardColumnNames(
            mod.Message(mod.stringkeys.scoreboard.score),
            mod.Message(mod.stringkeys.scoreboard.kills),
            mod.Message(mod.stringkeys.scoreboard.lives)
        );
        mod.SetScoreboardColumnWidths(1, 1, 1);
    }

    private updateScoreboard(modPlayer: mod.Player): void {
        const player = this.playerManager.getPlayer(modPlayer);
        const score = player.score;
        const kills = player.kills;
        const lives = player.lives;
        mod.SetScoreboardPlayerValues(modPlayer, score, kills, lives);
    }

    private handlePlayerEarnedKill(modPlayer: mod.Player, victim: mod.Player): void {
        this.updateActivePlayers();
        if (modPlayer === victim) return;
        const player = this.playerManager.getPlayer(modPlayer);
        player.kills++;
        player.score += 100;
        const team1 = this.teamManager.getTeam(1);
        const team2 = this.teamManager.getTeam(2);
        if (player.teamId === 1) {
            team1.score++;
        } else if (player.teamId === 2) {
            team2.score++;
        }
        if (team1.score >= this.GAME_MODE_TARGET_SCORE) {
            mod.EndGameMode(mod.GetTeam(1));
        } else if (team2.score >= this.GAME_MODE_TARGET_SCORE) {
            mod.EndGameMode(mod.GetTeam(2));
        }
        this.updateScoreboard(modPlayer);

        //Todo: set winning, losing teams, run it once
        if (team1.score === this.GAME_MODE_TARGET_SCORE - 3 || team2.score === this.GAME_MODE_TARGET_SCORE - 3) {
            mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
        }
    }

    private handleReinforcementsArrived(): void {
        debug?.dynamicLog("second")
        for (const modPlayer of getAllPlayers()) {
            const player = this.playerManager.getPlayer(modPlayer);
            player.lives = player.lives + 1;
            this.updateScoreboard(modPlayer);
        }
        debug?.dynamicLog("third")
        mod.EnableAllPlayerDeploy(true);
        Sounds.play2D(this.SOUND_LOOP_2D, {
            amplitude: 1,
            duration: 2000,
        });
        debug?.dynamicLog("fourth")
        debug?.dynamicLog('' + this.GAME_MODE_TARGET_SCORE)
    }

    private handlePlayerDeployed(): void {
        this.updateActivePlayers();
    }

    private handlePlayerUndeploy(modPlayer: mod.Player): void {
        const player = this.playerManager.getPlayer(modPlayer);
        let lives = player.lives;
        if (lives >= 1) {
            lives--;
        }
        if (lives <= 0) {
            mod.EnablePlayerDeploy(modPlayer, false);
        }
        player.lives = lives;
        this.updateActivePlayers();
        this.updateScoreboard(modPlayer);
    }

    private scheduleScoreboardUpdates(modPlayer: mod.Player): void {
        for (let seconds = 0; seconds <= 5; seconds++) {
            Timers.setTimeout(() => this.updateScoreboard(modPlayer), seconds * 1000);
        }
    }

    private updateActivePlayers() {
        let team1ActivePlayers = 0;
        let team2ActivePlayers = 0;
        for (const player of this.playerManager.getAllPlayers()) {
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
        this.teamManager.getTeam(1).activePlayers = team1ActivePlayers;
        this.teamManager.getTeam(2).activePlayers = team2ActivePlayers;
    }
}