import { Player } from '../entities/player.ts';
import type { GameUI } from '../ui/gameUi.ts';
import { Events } from 'bf6-portal-utils/events/index.ts';

export class PlayerManager {
    private _players: Player[] = [];

    constructor(private _gameUI: GameUI) {
        Events.OnPlayerJoinGame.subscribe(this.handlePlayerJoinGame.bind(this));
        Events.OnPlayerLeaveGame.subscribe(this.handlePlayerLeaveGame.bind(this));
    }

    private handlePlayerJoinGame(modPlayer: mod.Player): void {
        const player = new Player(modPlayer, this._gameUI);
        this._players.push(player);
    }

    private handlePlayerLeaveGame(playerId: number): void {
        const index = this._players.findIndex((player) => player.id === playerId);
        if (index !== -1) {
            this._players.splice(index, 1);
        }
    }

    public getPlayerById(playerId: number): Player {
        const player = this._players.find((players) => players.id === playerId);
        if (!player) {
            throw 'Soldier has not found!';
        }
        return player;
    }

    public getPlayer(player: mod.Player): Player {
        const playerId = mod.GetObjId(player);
        return this.getPlayerById(playerId);
    }

    public getAllPlayers(): Player[] {
        return this._players;
    }
}