import { GameMode } from './modules/gameMode/gameMode.ts';
import { GameUI } from './modules/gameUI/gameUI.ts';
import { PlayerManager } from './modules/player/playerManager.ts';
import { TeamManager } from './modules/team/teamManager.ts';
import { Reinforcements } from './modules/reinforcement/reinforcements.ts';
import { Scoreboard } from './modules/scoreboard/scoreboard.ts';
import { CapturePointManager } from './modules/capturePoint/capturePointManager.ts';
import { GameUIManager } from './modules/gameUI/gameUIManager.ts';
import { ScoreboardManager } from './modules/scoreboard/scoreboardManager.ts';
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
