import { Player } from '../entities/player.ts';
import { Events } from 'bf6-portal-utils/events/index.ts';

type PlayerJoinCallback = (player: Player) => void;

export class PlayerManager {
    private static _instance: PlayerManager | undefined;
    private _players: Player[] = [];
    private _onPlayerJoinGame: PlayerJoinCallback[] = [];

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
        for (const callback of this._onPlayerJoinGame) {
            callback(player);
        }
    }

    private handlePlayerLeaveGame(playerId: number): void {
        const index = this._players.findIndex((player) => player.id === playerId);
        if (index !== -1) {
            this._players.splice(index, 1);
        }
        this.unsubscribePlayerJoinGame(player => player.id === playerId);
    }

    public subscribePlayerJoinGame(callback: PlayerJoinCallback): void {
        this._onPlayerJoinGame.push(callback);
    }

    public unsubscribePlayerJoinGame(callback: PlayerJoinCallback): void {
        const index = this._onPlayerJoinGame.indexOf(callback);
        if (index !== -1) {
            this._onPlayerJoinGame.splice(index, 1);
        }
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