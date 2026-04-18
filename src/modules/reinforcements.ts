import { Clocks } from "bf6-portal-utils/clocks/index.ts";
import { Events } from "bf6-portal-utils/events/index.ts";
import type { GameUI } from "../ui/gameUi.ts";
import { debug } from "../debugTool/adminDebugTool.ts";
import { SolidUI } from "bf6-portal-utils/solid-ui/index.ts";

export class Reinforcements {
    private static _instance: Reinforcements | undefined;
    private _nextReinforcementsTimeSignal = SolidUI.createSignal(0);
    private DEFAULT_REINFORCEMENTS_TIME = 60;
    private _onReinforcementsArrived?: () => void;

    private constructor(gameUI: GameUI) {
        Events.OnGameModeStarted.subscribe(this.onGameModeStarted.bind(this));
        gameUI.displayNextReinforcements(this._nextReinforcementsTimeSignal[0]).show();
    }

    static getInstance(gameUI: GameUI): Reinforcements {
        if (!Reinforcements._instance) {
            Reinforcements._instance = new Reinforcements(gameUI);
        }
        return Reinforcements._instance;
    }

    public subscribeReinforcementsArrived(callback: () => void): void {
        this._onReinforcementsArrived = callback;
    }

    private onGameModeStarted(): void {
        this.nextReinforcementsClock.start();
    }

    private nextReinforcementsClock = new Clocks.CountDownClock(this.DEFAULT_REINFORCEMENTS_TIME, {
        onSecond: (seconds) => { this.nextReinforcementsTime = seconds },
        onComplete: () => {
            debug?.dynamicLog('first')
            this._onReinforcementsArrived?.();
            this.nextReinforcementsClock.reset().start();
        },
    });

    get nextReinforcementsTime(): number {
        return this._nextReinforcementsTimeSignal[0]();
    }
    set nextReinforcementsTime(value: number) {
        this._nextReinforcementsTimeSignal[1](value);
    }
}