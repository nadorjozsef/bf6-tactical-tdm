import { Events } from 'bf6-portal-utils/events/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { PlayerManager } from './playerManager.ts';
import { TeamManager } from './teamManager.ts';
import type { Reinforcements } from './reinforcements.ts';
import { Scoreboard } from './scoreboard.ts';
import type { Player } from '../entities/player.ts';
import type { Team } from '../entities/team.ts';
import { convertArray } from '../helpers/index.ts';
import { CapturePointManager } from './capturePointManager.ts';

export class GameMode {
    private static _instance: GameMode | undefined;

    public GAME_MODE_TARGET_SCORE = 50;
    private GAME_MODE_TIMELIMIT = 600;
    private SOUND_LOOP_2D = mod.RuntimeSpawn_Common.SFX_UI_EOR_RankUp_Normal_OneShot2D;

    private constructor(
        private _playerManager: PlayerManager,
        private _teamManager: TeamManager,
        private _capturePointManager: CapturePointManager,
        private _reinforcements: Reinforcements,
        private _scoreboard: Scoreboard
    ) {
        Events.OnPlayerUndeploy.subscribe(this.handlePlayerUndeploy.bind(this));
        Events.OnPlayerDeployed.subscribe(this.handlePlayerDeployed.bind(this));
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
        Events.OnPlayerEarnedKill.subscribe(this.handlePlayerEarnedKill.bind(this));
        Events.OnCapturePointCaptured.subscribe(this.handleCapturePointCaptured.bind(this));
        _reinforcements.subscribeReinforcementsArrived(this.handleReinforcementsArrived.bind(this));
    }

    static GetInstance(
        playerManager: PlayerManager,
        teamManager: TeamManager,
        capturePointManager: CapturePointManager,
        reinforcements: Reinforcements,
        scoreboard: Scoreboard
    ): GameMode {
        if (!GameMode._instance) {
            GameMode._instance = new GameMode(
                playerManager,
                teamManager,
                capturePointManager,
                reinforcements,
                scoreboard
            );
        }
        return GameMode._instance;
    }

    private handleCapturePointCaptured(capturePoint: mod.CapturePoint): void {
        const modTeam = mod.GetCurrentOwnerTeam(capturePoint);
        this._teamManager.getTeam(modTeam).score += 10;
        const modPlayersArray = mod.GetPlayersOnPoint(capturePoint);
        const modPlayers = convertArray<mod.Player>(modPlayersArray);
        for (const player of this._playerManager.getPlayers(modPlayers)) {
            player.score += 300;
        }
    }

    private handleGameModeStarted(): void {
        mod.SetGameModeTimeLimit(this.GAME_MODE_TIMELIMIT);
        mod.LoadMusic(mod.MusicPackages.Core);
    }

    private handlePlayerEarnedKill(modPlayer: mod.Player, victim: mod.Player): void {
        this.updateActivePlayers();
        this.reduceTimeIfNoActivePlayer();
        if (modPlayer === victim) {
            return;
        }
        const player = this._playerManager.getPlayer(modPlayer);
        const team1 = this._teamManager.getTeam(1);
        const team2 = this._teamManager.getTeam(2);
        this.updateTeamScore(player, team1, team2);
        this.updatePlayerScore(player);

        // Todo: set winning, losing teams?, repeat?
        if (team1.score === this.GAME_MODE_TARGET_SCORE - 5 || team2.score === this.GAME_MODE_TARGET_SCORE - 5) {
            mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
        }
    }

    private updateTeamScore(player: Player, team1: Team, team2: Team) {
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
    }

    private updatePlayerScore(player: Player) {
        player.kills++;
        player.score += 100;
    }

    private handleReinforcementsArrived(): void {
        for (const player of this._playerManager.getAllPlayers()) {
            player.lives = player.lives + 1;
        }
        mod.EnableAllPlayerDeploy(true);
        Sounds.Sound2D.play(this.SOUND_LOOP_2D, {
            amplitude: 1,
            duration: 2000,
        });
    }

    private handlePlayerDeployed(modPlayer: mod.Player): void {
        this.updateActivePlayers();
        // if (mod.IsSoldierClass(modPlayer, mod.SoldierClass.Recon)) {
        //     mod.SetTeam(modPlayer, mod.GetTeam(2));
        // }
    }

    private handlePlayerUndeploy(modPlayer: mod.Player): void {
        const player = this._playerManager.getPlayer(modPlayer);
        if (player.lives >= 1) {
            player.lives--;
        }
        if (player.lives <= 0) {
            mod.EnablePlayerDeploy(modPlayer, false);
        }
        this.updateActivePlayers();
    }

    private reduceTimeIfNoActivePlayer() {
        if (this._teamManager.getTeam(1).activePlayers === 0 || this._teamManager.getTeam(2).activePlayers === 0) {
            this._reinforcements.reduceTime();
        }
    }

    private updateActivePlayers() {
        let team1ActivePlayers = 0;
        let team2ActivePlayers = 0;
        for (const player of this._playerManager.getAllPlayers()) {
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
        this._teamManager.getTeam(1).activePlayers = team1ActivePlayers;
        this._teamManager.getTeam(2).activePlayers = team2ActivePlayers;
    }
}
