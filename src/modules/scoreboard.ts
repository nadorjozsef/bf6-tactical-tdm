import { Events } from 'bf6-portal-utils/events/index.ts';

export class Scoreboard {
    private static _instance: Scoreboard | undefined;

    private constructor() {
        Events.OnGameModeStarted.subscribe(this.handleGameModeStarted.bind(this));
    }

    static getInstance(): Scoreboard {
        if (!Scoreboard._instance) {
            Scoreboard._instance = new Scoreboard();
        }
        return Scoreboard._instance;
    }

    public update(modPlayer: mod.Player, score: number, kills: number, lives: number): void {
        mod.SetScoreboardPlayerValues(modPlayer, score, kills, lives);
    }

    private handleGameModeStarted(): void {
        mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
        mod.SetScoreboardHeader(mod.Message(mod.stringkeys.scoreboard.team1), mod.Message(mod.stringkeys.scoreboard.team2));
        mod.SetScoreboardColumnNames(mod.Message(mod.stringkeys.scoreboard.score), mod.Message(mod.stringkeys.scoreboard.kills), mod.Message(mod.stringkeys.scoreboard.lives));
        mod.SetScoreboardColumnWidths(1, 1, 1);
    }
}
