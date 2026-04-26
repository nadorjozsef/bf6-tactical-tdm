import { Events } from "bf6-portal-utils/events";
import type { GameUI } from "./gameUI";
import type { TeamManager } from "../modules/teamManager";
import { PlayerManager } from "../modules/playerManager";
import type { Player } from "../entities/player";
import type { Team } from "../entities/team";
import type { CapturePointManager } from "../modules/capturePointManager";
import type { Reinforcements } from "../modules/reinforcements";
import type { GameMode } from "../modules/gameMode";

export class GameUIManager {
    private static _instance: GameUIManager | undefined;

    private constructor(private _gameUI: GameUI, private _playerManager: PlayerManager, private _teamManager: TeamManager, private _capturePointManager: CapturePointManager, private _reinforcements: Reinforcements, private _gameMode: GameMode) {
        this._playerManager.subscribePlayerJoinGame(this.handlePlayerJoinGame.bind(this));
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
    }

    static getInstance(gameUI: GameUI, playerManager: PlayerManager, teamManager: TeamManager, capturePointManager: CapturePointManager, reinforcements: Reinforcements, gameMode: GameMode): GameUIManager {
        if (!GameUIManager._instance) {
            GameUIManager._instance = new GameUIManager(gameUI, playerManager, teamManager, capturePointManager, reinforcements, gameMode);
        }
        return GameUIManager._instance;
    }

    private handleGameModeStarted(): void {
        const team1 = this._teamManager.getTeam(1);
        const team2 = this._teamManager.getTeam(2);
        this.showActivePlayers(team1, team2);
        this.showTeamScores(team1, team2);
        this.showTeamScoreBars(team1, team2);
        this.showCapturePoints(team1, team2);
        this.showNextReinforcementsTime();
    }

    // todo implement handlePlayerLeaveGame?
    private handlePlayerJoinGame(player: Player): void {
        this.showPlayerLives(player);
    }

    private showPlayerLives(player: Player): void {
        this._gameUI.playerLives(player.modObject, player.livesAccessor);
    }

    private showTeamScores(team1: Team, team2: Team): void {
        this._gameUI.teamScores(team1.modObject, team1.scoreAccessor, team2.scoreAccessor);
        this._gameUI.teamScores(team2.modObject, team2.scoreAccessor, team1.scoreAccessor);
    }

    private showActivePlayers(team1: Team, team2: Team): void {
        this._gameUI.activePlayers(team1.modObject, team1.activePlayersAccessor, team2.activePlayersAccessor);
        this._gameUI.activePlayers(team2.modObject, team2.activePlayersAccessor, team1.activePlayersAccessor);
    }

    private showTeamScoreBars(team1: Team, team2: Team): void {
        const maxScore = this._gameMode.GAME_MODE_TARGET_SCORE;
        this._gameUI.teamScoreBars(team1.modObject, team1.scoreAccessor, team2.scoreAccessor, maxScore);
        this._gameUI.teamScoreBars(team2.modObject, team2.scoreAccessor, team1.scoreAccessor, maxScore);
    }

    private showNextReinforcementsTime(): void {
        this._gameUI.nextReinforcements(this._reinforcements.nextReinforcementsTimeAccessor);
    }

    private showCapturePoints(team1: Team, team2: Team): void {
        const capturePoints = this._capturePointManager.getCapturePoints();
        this._gameUI.capturePoints(team1.modObject, capturePoints.map(cp => cp.ownerTeamIdAccessor), capturePoints.map(cp => cp.isCapturingAccessor));
        this._gameUI.capturePoints(team2.modObject, capturePoints.map(cp => cp.ownerTeamIdAccessor), capturePoints.map(cp => cp.isCapturingAccessor));
    }
}