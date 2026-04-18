import { Events } from "bf6-portal-utils/events/index.ts";
import type { PlayerManager } from "./playerManager.ts";
import { Timers } from "bf6-portal-utils/timers/index.ts";

export class Scoreboard {
    private static _instance: Scoreboard | undefined;

    private constructor(private _playerManager: PlayerManager) {
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
        Events.OnPlayerJoinGame.subscribe(this.handlePlayerJoinGame.bind(this));
    }

    static getInstance(playerManager: PlayerManager): Scoreboard {
        if (!Scoreboard._instance) {
            Scoreboard._instance = new Scoreboard(playerManager);
        }
        return Scoreboard._instance;
    }

    public update(modPlayer: mod.Player): void {
        const player = this._playerManager.getPlayer(modPlayer);
        const score = player.score;
        const kills = player.kills;
        const lives = player.lives;
        mod.SetScoreboardPlayerValues(modPlayer, score, kills, lives);
    }

    private handleGameModeStarted(): void {
        mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
        mod.SetScoreboardHeader(mod.Message(mod.stringkeys.scoreboard.team1), mod.Message(mod.stringkeys.scoreboard.team2));
        mod.SetScoreboardColumnNames(
            mod.Message(mod.stringkeys.scoreboard.score),
            mod.Message(mod.stringkeys.scoreboard.kills),
            mod.Message(mod.stringkeys.scoreboard.lives)
        );
        mod.SetScoreboardColumnWidths(1, 1, 1);
    }

    private handlePlayerJoinGame(modPlayer: mod.Player): void {
        for (let seconds = 0; seconds <= 5; seconds++) {
            Timers.setTimeout(() => this.update(modPlayer), seconds * 1000);
        }
    }
}