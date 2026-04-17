import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import type { GameUI } from '../ui/gameUi.ts';


export class Player {
    private _livesSignal = SolidUI.createSignal(1);

    get id() {
        return mod.GetObjId(this._modPlayer);
    }

    get teamId() {
        return mod.GetObjId(mod.GetTeam(this._modPlayer));
    }

    get isAlive() {
        return mod.GetSoldierState(this._modPlayer, mod.SoldierStateBool.IsAlive);
    }

    get lives(): number {
        return this._livesSignal[0]();
    }
    set lives(value: number) {
        this._livesSignal[1](value);
    }

    public score = 0;
    public kills = 0;

    constructor(
        private _modPlayer: mod.Player,
        gameUI: GameUI
    ) {
        gameUI.playerLivesUI(_modPlayer, this._livesSignal[0]).show();
    }
}