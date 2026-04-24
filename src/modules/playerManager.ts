import { Player } from '../entities/player.ts';
import { Events } from 'bf6-portal-utils/events/index.ts';

export class PlayerManager {
    private static _instance: PlayerManager | undefined;
    private _players: Player[] = [];
    private _onPlayerJoinGame?: (player: Player) => void;

    private constructor() {
        Events.OnPlayerJoinGame.subscribe(this.handlePlayerJoinGame.bind(this));
        Events.OnPlayerLeaveGame.subscribe(this.handlePlayerLeaveGame.bind(this));
    }

    static getInstance(): PlayerManager {
        if (!PlayerManager._instance) {
            PlayerManager._instance = new PlayerManager();
        }
        return PlayerManager._instance;
    }

    private handlePlayerJoinGame(modPlayer: mod.Player): void {
        const player = new Player(modPlayer);
        this._players.push(player);
        this._onPlayerJoinGame?.(player);
    }

    private handlePlayerLeaveGame(playerId: number): void {
        const index = this._players.findIndex((player) => player.id === playerId);
        if (index !== -1) {
            this._players.splice(index, 1);
        }
    }

    public subscribePlayerJoinGame(callback: (player: Player) => void): void {
        this._onPlayerJoinGame = callback;
    }

    public getPlayer(modPlayer: mod.Player): Player;
    public getPlayer(playerId: number): Player;

    public getPlayer(player: mod.Player | number): Player {
        let playerId: number;
        if (typeof player === 'number') {
            playerId = player;
        } else {
            playerId = mod.GetObjId(player);
        }
        return this.getPlayerById(playerId);
    }

    public getPlayers(modPlayers: mod.Player[]): Player[] {
        const players: Player[] = [];
        for (const modPlayer of modPlayers) {
            players.push(this.getPlayer(modPlayer));
        }
        return players;
    }

    public getAllPlayers(): Player[] {
        return this._players;
    }

    private getPlayerById(playerId: number): Player {
        const found = this._players.find((players) => players.id === playerId);
        if (!found) {
            throw 'Player has not found for ID: ' + playerId;
        }
        return found;
    }
}