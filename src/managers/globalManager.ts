import { Clocks } from "bf6-portal-utils/clocks/index.ts";
import { Events } from "bf6-portal-utils/events/index.ts";
import { Global } from "../entities/global.ts";
import type { GameUI } from "../ui/gameUi.ts";
import { debug } from "../debugTool/adminDebugTool.ts";

export class GlobalManager {
    private DEFAULT_REINFORCEMENTS_TIME = 60;
    private _global: Global;
    private _onReinforcementsArrived?: () => void;

    constructor(gameUI: GameUI) {
        Events.OnGameModeStarted.subscribe(this.onGameModeStarted.bind(this));
        this._global = Global.GetInstance(gameUI);
    }

    public subscribeReinforcementsArrived(callback: () => void): void {
        this._onReinforcementsArrived = callback;
    }

    private onGameModeStarted(): void {
        this.nextReinforcementsClock.start();
    }

    private nextReinforcementsClock = new Clocks.CountDownClock(this.DEFAULT_REINFORCEMENTS_TIME, {
        onSecond: (seconds) => { this._global.nextReinforcementsTime = seconds },
        onComplete: () => {
            debug?.dynamicLog('first')
            this._onReinforcementsArrived?.();
            this.nextReinforcementsClock.reset().start();
        },
    });
}