import { Events } from "bf6-portal-utils/events/index.ts";
import { Team } from "../entities/team.ts";
import type { GameUI } from "../ui/gameUi.ts";

export class TeamManager {
    private _teams: Team[] = [];

    constructor(private _gameUI: GameUI) {
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
        this._teams.push(new Team(mod.GetTeam(1)));
        this._teams.push(new Team(mod.GetTeam(2)));
    }

    public getTeam(teamId: number) {
        return this._teams[teamId - 1];
    }

    private handleGameModeStarted(): void {
        this.showActivePlayers();
        this.showScores();
    }

    private showActivePlayers() {
        this._gameUI.activePlayersUI(mod.GetTeam(1), this.getTeam(1).activePlayersSignal[0], this.getTeam(2).activePlayersSignal[0]).show();
        this._gameUI.activePlayersUI(mod.GetTeam(2), this.getTeam(2).activePlayersSignal[0], this.getTeam(1).activePlayersSignal[0]).show();
    }

    private showScores() {
        this._gameUI.leftTeamScoreUI(mod.GetTeam(1), this.getTeam(1).scoreSignal[0]).show();
        this._gameUI.rightTeamScoreUI(mod.GetTeam(1), this.getTeam(2).scoreSignal[0]).show();
        this._gameUI.leftTeamScoreUI(mod.GetTeam(2), this.getTeam(2).scoreSignal[0]).show();
        this._gameUI.rightTeamScoreUI(mod.GetTeam(2), this.getTeam(1).scoreSignal[0]).show();
    }
}