import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import type { GameUI } from '../ui/gameUi.ts';

export class Game {
    private static _instance: Game | undefined;
    private _nextReinforcementsTimeSignal = SolidUI.createSignal(0);

    private constructor(gameUI: GameUI) {
        gameUI.displayNextReinforcements(this._nextReinforcementsTimeSignal[0]).show();
    }

    static GetInstance(gameUI: GameUI): Game {
        if (!Game._instance) {
            Game._instance = new Game(gameUI);
        }
        return Game._instance;
    }

    get nextReinforcementsTime(): number {
        return this._nextReinforcementsTimeSignal[0]();
    }
    set nextReinforcementsTime(value: number) {
        this._nextReinforcementsTimeSignal[1](value);
    }
}