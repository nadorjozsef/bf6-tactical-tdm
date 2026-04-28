import { GameMode } from './modules/gameMode.ts';
import { GameUI } from './ui/gameUI.ts';
import { PlayerManager } from './modules/playerManager.ts';
import { TeamManager } from './modules/teamManager.ts';
import { Reinforcements } from './modules/reinforcements.ts';
import { Scoreboard } from './modules/scoreboard.ts';
import { CapturePointManager } from './modules/capturePointManager.ts';
import { GameUIManager } from './ui/gameUIManager.ts';
import { ScoreboardManager } from './modules/scoreboardManager.ts';
import { debug } from './debugTool/adminDebugTool.ts';


const gameUI = GameUI.getInstance();
const playerManager = PlayerManager.getInstance();
const scoreboard = Scoreboard.getInstance();
const teamManager = TeamManager.getInstance();
const reinforcements = Reinforcements.getInstance();
const capturePointManager = CapturePointManager.getInstance();
const gameModeManager = GameMode.GetInstance(
    playerManager,
    teamManager,
    capturePointManager,
    reinforcements
);
GameUIManager.getInstance(gameUI, playerManager, teamManager, capturePointManager, reinforcements, gameModeManager);
ScoreboardManager.getInstance(scoreboard, playerManager);
