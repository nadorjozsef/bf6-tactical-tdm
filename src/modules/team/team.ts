import { SolidUI } from 'bf6-portal-utils/solid-ui';

export class Team {
    private _scoreSignal = SolidUI.createSignal(0);
    private _activePlayersSignal = SolidUI.createSignal(0);

    constructor(private _modTeam: mod.Team) { }

    get id(): number {
        return mod.GetObjId(this._modTeam);
    }

    get modObject(): mod.Team {
        return this._modTeam;
    }

    get scoreAccessor(): SolidUI.Accessor<number> {
        return this._scoreSignal[0];
    }

    get score(): number {
        return this._scoreSignal[0]();
    }
    set score(value: number) {
        this._scoreSignal[1](value);
    }

    get activePlayersAccessor(): SolidUI.Accessor<number> {
        return this._activePlayersSignal[0];
    }

    get activePlayers(): number {
        return this._activePlayersSignal[0]();
    }
    set activePlayers(value: number) {
        this._activePlayersSignal[1](value);
    }
}