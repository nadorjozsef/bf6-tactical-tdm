import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import type { GameUI } from '../ui/gameUi.ts';

export class Global {
    private static _instance: Global | undefined;
    private _nextReinforcementsTimeSignal = SolidUI.createSignal(0);

    private constructor(gameUI: GameUI) {
        gameUI.displayNextReinforcements(this._nextReinforcementsTimeSignal[0]).show();
    }

    static GetInstance(gameUI: GameUI): Global {
        if (!Global._instance) {
            Global._instance = new Global(gameUI);
        }
        return Global._instance;
    }

    get nextReinforcementsTime(): number {
        return this._nextReinforcementsTimeSignal[0]();
    }
    set nextReinforcementsTime(value: number) {
        this._nextReinforcementsTimeSignal[1](value);
    }
}