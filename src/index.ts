import { GameMode } from "./modules/gameMode.ts";
import { GameUI } from './ui/gameUi.ts';
import { PlayerManager } from './modules/playerManager.ts';
import { TeamManager } from './modules/teamManager.ts';
import { Reinforcements } from "./modules/reinforcements.ts";
import { Scoreboard } from "./modules/scoreboard.ts";
import { CapturePointManager } from "./modules/capturePointManager.ts";
import { GameUIManager } from "./ui/gameUIManager.ts";

const gameUI = GameUI.getInstance();
const playerManager = PlayerManager.getInstance();
const scoreboard = Scoreboard.getInstance(playerManager);
const teamManager = TeamManager.getInstance();
const reinforcements = Reinforcements.getInstance(gameUI);
const capturePointManager = CapturePointManager.getInstance();
GameUIManager.getInstance(gameUI, teamManager, playerManager, capturePointManager);
GameMode.GetInstance(playerManager, teamManager, capturePointManager, reinforcements, scoreboard);