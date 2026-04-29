import { Events } from "bf6-portal-utils/events";
import type { GameUI } from "../gameUI/gameUI";
import type { TeamManager } from "../team/teamManager";
import type { Team } from "../team/team";
import type { CapturePointManager } from "../capturePoint/capturePointManager";
import type { GameMode } from "../gameMode/gameMode";

export class GameUIManager {
    private static _instance: GameUIManager | undefined;

    private constructor(private _gameUI: GameUI, private _teamManager: TeamManager, private _capturePointManager: CapturePointManager, private _gameMode: GameMode) {
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
    }

    static getInstance(gameUI: GameUI, teamManager: TeamManager, capturePointManager: CapturePointManager, gameMode: GameMode): GameUIManager {
        if (!GameUIManager._instance) {
            GameUIManager._instance = new GameUIManager(gameUI, teamManager, capturePointManager, gameMode);
        }
        return GameUIManager._instance;
    }

    private handleGameModeStarted(): void {
        const team1 = this._teamManager.getTeam(1);
        const team2 = this._teamManager.getTeam(2);
        this.showTeamScores(team1, team2);
        this.showTeamScoreBars(team1, team2);
        this.showCapturePoints(team1, team2);
    }

    private showTeamScores(team1: Team, team2: Team): void {
        this._gameUI.teamScores(team1.modObject, team1.scoreAccessor, team2.scoreAccessor);
        this._gameUI.teamScores(team2.modObject, team2.scoreAccessor, team1.scoreAccessor);
    }

    private showTeamScoreBars(team1: Team, team2: Team): void {
        const maxScore = this._gameMode.GAME_MODE_TARGET_SCORE;
        this._gameUI.teamScoreBars(team1.modObject, team1.scoreAccessor, team2.scoreAccessor, maxScore);
        this._gameUI.teamScoreBars(team2.modObject, team2.scoreAccessor, team1.scoreAccessor, maxScore);
    }

    private showCapturePoints(team1: Team, team2: Team): void {
        const capturePointsData = this._capturePointManager.getCapturePoints().map(capturePoint => ({
            ownerTeamIdAccessor: capturePoint.ownerTeamIdAccessor,
            isCapturingAccessor: capturePoint.isCapturingAccessor,
        }));

        this._gameUI.capturePoints(team1.modObject, capturePointsData);
        this._gameUI.capturePoints(team2.modObject, capturePointsData);
    }
}