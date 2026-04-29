import { Events } from "bf6-portal-utils/events";
import { Team } from "../team/team";

export class TeamManager {
    private static _instance: TeamManager | undefined;
    private _teams: Team[] = [];

    private constructor() {
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
    }

    static getInstance(): TeamManager {
        if (!TeamManager._instance) {
            TeamManager._instance = new TeamManager();
        }
        return TeamManager._instance;
    }

    public getTeam(modTeam: mod.Team): Team;
    public getTeam(teamId: number): Team;

    public getTeam(team: number | mod.Team): Team {
        let teamId: number;
        if (typeof team === 'number') {
            teamId = team;
        } else {
            teamId = mod.GetObjId(team);
        }
        return this._teams[teamId - 1];
    }

    private handleGameModeStarted(): void {
        this._teams.push(new Team(mod.GetTeam(1)));
        this._teams.push(new Team(mod.GetTeam(2)));
    }
}