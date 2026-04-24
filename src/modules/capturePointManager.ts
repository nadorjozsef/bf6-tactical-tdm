import { Events } from "bf6-portal-utils/events/index.ts";
import { CapturePoint } from "../entities/capturePoint.ts";
import { convertArray } from "../helpers/index.ts";

export class CapturePointManager {
    private static _instance: CapturePointManager | undefined;
    private _capturePoints: CapturePoint[] = [];

    private constructor() {
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
        Events.OnCapturePointCaptured.subscribe(this.handleCapturePointCaptured.bind(this));
    }

    static getInstance(): CapturePointManager {
        if (!CapturePointManager._instance) {
            CapturePointManager._instance = new CapturePointManager();
        }
        return CapturePointManager._instance;
    }

    public getCapturePoints(): CapturePoint[] {
        return this._capturePoints;
    }

    public getCapturePoint(modCapturePoint: mod.CapturePoint): CapturePoint;
    public getCapturePoint(capturePointId: number): CapturePoint;

    public getCapturePoint(capturePoint: number | mod.CapturePoint): CapturePoint {
        let capturePointId: number;
        if (typeof capturePoint === 'number') {
            capturePointId = capturePoint;
        } else {
            capturePointId = mod.GetObjId(capturePoint);
        }
        const found = this._capturePoints.find(capturePoint => capturePoint.id === capturePointId);
        if (!found) {
            throw new Error(`Capture point not found for ID: ${capturePointId}`);
        }
        return found;
    }

    private handleGameModeStarted(): void {
        const modCapturePoints = convertArray<mod.CapturePoint>(mod.AllCapturePoints());
        for (const modCapturePoint of modCapturePoints) {
            this._capturePoints.push(new CapturePoint(modCapturePoint));
        }
        for (const capturePoint of this._capturePoints) {
            mod.EnableGameModeObjective(capturePoint.modObject, true);
            mod.SetCapturePointCapturingTime(capturePoint.modObject, 5);
            mod.SetCapturePointNeutralizationTime(capturePoint.modObject, 5);
            mod.SetMaxCaptureMultiplier(capturePoint.modObject, 1);
        }
    }

    private handleCapturePointCaptured(modCapturePoint: mod.CapturePoint): void {
        const capturePoint = this.getCapturePoint(modCapturePoint);
        capturePoint.ownerTeamId = mod.GetObjId(mod.GetCurrentOwnerTeam(modCapturePoint));
    }
}