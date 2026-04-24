import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';

export class Player {
    private _livesSignal = SolidUI.createSignal(1);

    constructor(private _modPlayer: mod.Player) { }

    get id(): number {
        return mod.GetObjId(this._modPlayer);
    }

    get modObject(): mod.Player {
        return this._modPlayer;
    }

    get teamId(): number {
        return mod.GetObjId(mod.GetTeam(this._modPlayer));
    }

    get isAlive() {
        return mod.GetSoldierState(this._modPlayer, mod.SoldierStateBool.IsAlive);
    }

    get livesAccessor(): SolidUI.Accessor<number> {
        return this._livesSignal[0];
    }

    get lives(): number {
        return this._livesSignal[0]();
    }
    set lives(value: number) {
        this._livesSignal[1](value);
    }

    public score = 0;
    public kills = 0;
}