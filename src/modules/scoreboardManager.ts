import type { PlayerManager } from './playerManager';
import type { Player } from '../entities/player';
import type { Scoreboard } from './scoreboard';
import { SolidUI } from 'bf6-portal-utils/solid-ui';
import { Timers } from 'bf6-portal-utils/timers';

export class ScoreboardManager {
    private static _instance: ScoreboardManager | undefined;

    private constructor(private _scoreboard: Scoreboard, playerManager: PlayerManager) {
        playerManager.subscribePlayerJoinGame(this.handlePlayerJoinGame.bind(this));
    }

    static getInstance(scoreboard: Scoreboard, playerManager: PlayerManager): ScoreboardManager {
        if (!ScoreboardManager._instance) {
            ScoreboardManager._instance = new ScoreboardManager(scoreboard, playerManager);
        }
        return ScoreboardManager._instance;
    }

    private handlePlayerJoinGame(player: Player): void {
        SolidUI.createEffect(() => {
            this._scoreboard.update(
                player.modObject,
                player.scoreAccessor(),
                player.killsAccessor(),
                player.livesAccessor()
            );
        });
        this.initialize(player);
    }

    private initialize(player: Player): void {
        for (let seconds = 0; seconds <= 5; seconds++) {
            Timers.setTimeout(() => this._scoreboard.update(player.modObject, 0, 0, 0), seconds * 1000);
        }
    }
}
