import { GameMode } from "./modules/gameMode.ts";
import { GameUI } from './ui/gameUi.ts';
import { PlayerManager } from './modules/playerManager.ts';
import { TeamManager } from './modules/teamManager.ts';
import { Reinforcements } from "./modules/reinforcements.ts";
import { Scoreboard } from "./modules/scoreboard.ts";
import { SolidUI } from "bf6-portal-utils/solid-ui/index.ts";

const gameUI = GameUI.getInstance();
const playerManager = PlayerManager.getInstance(gameUI);
const scoreboard = Scoreboard.getInstance(playerManager);
const teamManager = TeamManager.getInstance(gameUI);
const globalManager = Reinforcements.getInstance(gameUI);

gameUI.capturePointAIcon();

GameMode.GetInstance(playerManager, teamManager, globalManager, scoreboard);