import { Clocks } from "bf6-portal-utils/clocks/index.ts";
import { Events } from "bf6-portal-utils/events/index.ts";
import type { GameUI } from "../ui/gameUI2.ts";
import { SolidUI } from "bf6-portal-utils/solid-ui/index.ts";

export class Reinforcements {
    private static _instance: Reinforcements | undefined;
    private _nextReinforcementsTimeSignal = SolidUI.createSignal(0);
    private DEFAULT_REINFORCEMENTS_TIME = 120;
    private TIME_TO_REDUCE = 10;
    private _onReinforcementsArrived?: () => void;

    private constructor(gameUI: GameUI) {
        Events.OnGameModeStarted.subscribe(this.onGameModeStarted.bind(this));
        gameUI.nextReinforcements(this._nextReinforcementsTimeSignal[0]);
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

    public reduceTime(): void {
        const timeToSubstract = this.nextReinforcementsTime - this.TIME_TO_REDUCE;
        if (timeToSubstract > this.TIME_TO_REDUCE) {
            this.nextReinforcementsClock.subtractSeconds(timeToSubstract);
        }
    }

    private onGameModeStarted(): void {
        this.nextReinforcementsClock.start();
    }

    private nextReinforcementsClock = new Clocks.CountDownClock(this.DEFAULT_REINFORCEMENTS_TIME, {
        onSecond: (seconds) => this.onSecond(seconds),
        onComplete: () => { this.onComplete() },
    });

    private onSecond(seconds: number) {
        this.nextReinforcementsTime = seconds;
        if (seconds === 10) {
            mod.PlayMusic(mod.MusicEvents.Core_PhaseEnded);
        }
    }

    private onComplete() {
        this._onReinforcementsArrived?.();
        this.nextReinforcementsClock.reset().start();
        mod.PlayMusic(mod.MusicEvents.Core_PhaseBegin);
    }

    get nextReinforcementsTime(): number {
        return this._nextReinforcementsTimeSignal[0]();
    }
    set nextReinforcementsTime(value: number) {
        this._nextReinforcementsTimeSignal[1](value);
    }
}