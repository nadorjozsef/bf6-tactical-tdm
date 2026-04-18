import { Events } from 'bf6-portal-utils/events/index.ts';
import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import type { GameUI } from '../ui/gameUi.ts';

export class TeamManager {
    private _teams: Team[] = [];

    constructor(private _gameUI: GameUI) {
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
        this._teams.push(new Team(mod.GetTeam(1)));
        this._teams.push(new Team(mod.GetTeam(2)));
    }

    public getTeam1() {
        return this._teams[0];
    }

    public getTeam2() {
        return this._teams[1];
    }

    private handleGameModeStarted(): void {
        this.showActivePlayers();
        this.showScores();
    }

    private showActivePlayers() {
        this._gameUI.activePlayersUI(mod.GetTeam(1), this._teams[0]._activePlayersSignal[0], this._teams[1]._activePlayersSignal[0]).show();
        this._gameUI.activePlayersUI(mod.GetTeam(2), this._teams[1]._activePlayersSignal[0], this._teams[0]._activePlayersSignal[0]).show();
    }

    private showScores() {
        this._gameUI.leftTeamScoreUI(mod.GetTeam(1), this._teams[0]._scoreSignal[0]).show();
        this._gameUI.rightTeamScoreUI(mod.GetTeam(1), this._teams[1]._scoreSignal[0]).show();
        this._gameUI.leftTeamScoreUI(mod.GetTeam(2), this._teams[1]._scoreSignal[0]).show();
        this._gameUI.rightTeamScoreUI(mod.GetTeam(2), this._teams[0]._scoreSignal[0]).show();
    }
}

export class Team {
    private _id;
    public _scoreSignal = SolidUI.createSignal(0);
    public _activePlayersSignal = SolidUI.createSignal(0);

    constructor(modTeam: mod.Team) {
        this._id = mod.GetObjId(modTeam);
    }

    get id(): number {
        return this._id;
    }

    get score(): number {
        return this._scoreSignal[0]();
    }
    set score(value: number) {
        this._scoreSignal[1](value);
    }

    get activePlayers(): number {
        return this._activePlayersSignal[0]();
    }
    set activePlayers(value: number) {
        this._activePlayersSignal[1](value);
    }
}