import { Events } from 'bf6-portal-utils/events';
import { PlayerManager } from '../player/playerManager';
import { TeamManager } from '../team/teamManager';
import type { Player } from '../player/player';
import type { Team } from '../team/team';
import { convertArray } from '../../helpers';

export class GameMode {
    private static _instance: GameMode | undefined;
    public GAME_MODE_TARGET_SCORE = 50;
    private GAME_MODE_TIMELIMIT = 600;

    private constructor(
        private _playerManager: PlayerManager,
        private _teamManager: TeamManager
    ) {
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
        Events.OnPlayerEarnedKill.subscribe(this.handlePlayerEarnedKill.bind(this));
        Events.OnCapturePointCaptured.subscribe(this.handleCapturePointCaptured.bind(this));
    }

    static GetInstance(
        playerManager: PlayerManager,
        teamManager: TeamManager
    ): GameMode {
        if (!GameMode._instance) {
            GameMode._instance = new GameMode(playerManager, teamManager);
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
}
