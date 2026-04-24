import { Events } from "bf6-portal-utils/events";
import type { GameUI } from "./gameUi";
import type { TeamManager } from "../modules/teamManager";
import { PlayerManager } from "../modules/playerManager";
import type { Player } from "../entities/player";
import type { Team } from "../entities/team";
import type { CapturePointManager } from "../modules/capturePointManager";

export class GameUIManager {
    private static _instance: GameUIManager | undefined;

    private constructor(private _gameUI: GameUI, private _teamManager: TeamManager, playerManager: PlayerManager, private _capturePointManager: CapturePointManager) {
        playerManager.subscribePlayerJoinGame(this.handlePlayerJoinGame.bind(this));
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
    }

    static getInstance(gameUI: GameUI, teamManager: TeamManager, playerManager: PlayerManager, capturePointManager: CapturePointManager): GameUIManager {
        if (!GameUIManager._instance) {
            GameUIManager._instance = new GameUIManager(gameUI, teamManager, playerManager, capturePointManager);
        }
        return GameUIManager._instance;
    }

    private handleGameModeStarted(): void {
        const team1 = this._teamManager.getTeam(1);
        const team2 = this._teamManager.getTeam(2);
        this.showActivePlayers(team1, team2);
        this.showTeamScores(team1, team2);
        this.showTeamScoreBars(team1, team2);
        this.showCapturePoints();
    }

    // todo implement handlePlayerLeaveGame?
    private handlePlayerJoinGame(player: Player): void {
        this.showPlayerLives(player);
    }

    private showPlayerLives(player: Player): void {
        this._gameUI.playerLives(player.modObject, player.livesAccessor);
    }

    private showTeamScores(team1: Team, team2: Team): void {
        this._gameUI.teamScore(team1?.modObject, team1?.scoreAccessor, 'leftVariant');
        this._gameUI.teamScore(team1?.modObject, team2?.scoreAccessor, 'rightVariant');
        this._gameUI.teamScore(team2?.modObject, team2?.scoreAccessor, 'leftVariant');
        this._gameUI.teamScore(team2?.modObject, team1?.scoreAccessor, 'rightVariant');
    }

    private showActivePlayers(team1: Team, team2: Team): void {
        this._gameUI.activePlayers(team1?.modObject, team1?.activePlayersAccessor, team2?.activePlayersAccessor);
        this._gameUI.activePlayers(team2?.modObject, team2?.activePlayersAccessor, team1?.activePlayersAccessor);
    }

    private showTeamScoreBars(team1: Team, team2: Team): void {
        // todo get max score from game mode settings instead of hardcoding it
        this._gameUI.teamScoreBar(team1?.modObject, team1?.scoreAccessor, 'leftVariant', 50);
        this._gameUI.teamScoreBar(team1?.modObject, team2?.scoreAccessor, 'rightVariant', 50);
        this._gameUI.teamScoreBar(team2?.modObject, team2?.scoreAccessor, 'leftVariant', 50);
        this._gameUI.teamScoreBar(team2?.modObject, team1?.scoreAccessor, 'rightVariant', 50);
    }

    private showCapturePoints(): void {
        const capturePoints = this._capturePointManager.getCapturePoints();
        const boxWidth = 32;
        const gap = 20;
        const step = boxWidth + gap;
        const totalWidth = capturePoints.length * step;
        const start = -totalWidth / 2 + step / 2;
        const boxPositions: number[] = [];
        for (let i = 0; i < capturePoints.length; i++) {
            boxPositions.push(start + i * step);
        }
        const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        for (let i = 0; i < capturePoints.length; i++) {
            this._gameUI.capturePoint(capturePoints[i].ownerTeamIdAccessor, labels[i], boxPositions[i]);
        }
    }
}