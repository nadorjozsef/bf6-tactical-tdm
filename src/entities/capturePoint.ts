import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';

export class CapturePoint {
    private _ownerTeamId = SolidUI.createSignal(0);

    constructor(private _modCapturePoint: mod.CapturePoint) { }

    get id(): number {
        return mod.GetObjId(this._modCapturePoint);
    }

    get modObject(): mod.CapturePoint {
        return this._modCapturePoint;
    }

    get ownerTeamIdAccessor(): SolidUI.Accessor<number> {
        return this._ownerTeamId[0];
    }

    get ownerTeamId(): number {
        return this._ownerTeamId[0]();
    }
    set ownerTeamId(value: number) {
        this._ownerTeamId[1](value);
    }
}