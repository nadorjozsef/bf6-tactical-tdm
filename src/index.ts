import { GameModeManager } from "./managers/gameModeManager.ts";
import { GameUI } from './ui/gameUi.ts';
import { PlayerManager } from './managers/playerManager.ts';
import { TeamManager } from './managers/teamManager.ts';
import { GlobalManager } from "./managers/globalManager.ts";

const gameUI = GameUI.GetInstance();
const playerManager = new PlayerManager(gameUI);
const teamManager = new TeamManager(gameUI);
const globalManager = new GlobalManager(gameUI);

GameModeManager.GetInstance(playerManager, teamManager, globalManager);