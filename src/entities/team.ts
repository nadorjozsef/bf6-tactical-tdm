import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';

export class Team {
    private _id;
    private _scoreSignal = SolidUI.createSignal(0);
    private _activePlayersSignal = SolidUI.createSignal(0);

    constructor(modTeam: mod.Team) {
        this._id = mod.GetObjId(modTeam);
    }

    get id(): number {
        return this._id;
    }

    get activePlayersSignal() {
        return this._activePlayersSignal;
    }

    get scoreSignal() {
        return this._scoreSignal;
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