import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import type { GameUI } from '../ui/gameUi.ts';
import { Events } from 'bf6-portal-utils/events/index.ts';

export class Game {
    private static _instance: Game | undefined;

    private _gameUI: GameUI;
    private _team1ActivePlayersSignal = SolidUI.createSignal(0);
    private _team2ActivePlayersSignal = SolidUI.createSignal(0);
    private _nextReinforcementsTimeSignal = SolidUI.createSignal(0);

    private constructor(gameUI: GameUI) {
        this._gameUI = gameUI;
        this._gameUI.displayNextReinforcements(this._nextReinforcementsTimeSignal[0]).show();
        Events.OnPlayerJoinGame.subscribe(this.handlePlayerJoinGame.bind(this));
    }

    static GetInstance(gameUI: GameUI): Game {
        if (!Game._instance) {
            Game._instance = new Game(gameUI);
        }
        return Game._instance;
    }

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

    private handlePlayerJoinGame(modPlayer: mod.Player): void {
        const modTeam = mod.GetTeam(modPlayer);
        this.showActivePlayers(modTeam);
    }

    private showActivePlayers(modTeam: mod.Team) {
        const teamId = mod.GetObjId(modTeam);
        if (teamId === 1) {
            this._gameUI.activePlayersUI(modTeam, this._team1ActivePlayersSignal[0], this._team2ActivePlayersSignal[0]).show();
        } else if (teamId === 2) {
            this._gameUI.activePlayersUI(modTeam, this._team2ActivePlayersSignal[0], this._team1ActivePlayersSignal[0]).show();
        }
    }
}