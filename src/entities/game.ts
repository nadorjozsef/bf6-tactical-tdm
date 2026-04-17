import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import type { GameUI } from '../ui/gameUi.ts';

export class Game {
    private _team1ActivePlayersSignal = SolidUI.createSignal(0);
    private _team2ActivePlayersSignal = SolidUI.createSignal(0);
    private _nextReinforcementsTimeSignal = SolidUI.createSignal(0);

    get team1ActivePlayers(): number {
        return this._team1ActivePlayersSignal[0]();
    }
    set team1ActivePlayers(value: number) {
        this._team1ActivePlayersSignal[1](value);
    }

    get team2ActivePlayers(): number {
        return this._team2ActivePlayersSignal[0]();
    }
    set team2ActivePlayers(value: number) {
        this._team2ActivePlayersSignal[1](value);
    }

    get nextReinforcementsTime(): number {
        return this._nextReinforcementsTimeSignal[0]();
    }
    set nextReinforcementsTime(value: number) {
        this._nextReinforcementsTimeSignal[1](value);
    }

    constructor(gameUI: GameUI) {
        gameUI.activePlayersUI(this._team1ActivePlayersSignal[0], this._team2ActivePlayersSignal[0]).show();
        gameUI.displayNextReinforcements(this._nextReinforcementsTimeSignal[0]).show();
    }
}