import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import type { GameUI } from '../ui/gameUi.ts';

export class Team {
    private _scoreSignal = SolidUI.createSignal(0);

    get Id(): number {
        return this._id;
    }

    get score(): number {
        return this._scoreSignal[0]();
    }
    set score(value: number) {
        this._scoreSignal[1](value);
    }

    constructor(
        private _id: number,
        gameUI: GameUI
    ) {
        if (_id === 1) {
            gameUI.leftTeamScoreUI(this._scoreSignal[0]).show();
        } else {
            gameUI.rightTeamScoreUI(this._scoreSignal[0]).show();
        }
    }
}