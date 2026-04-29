import { GameMode } from './modules/gameMode/gameMode.ts';
import { GameUI } from './modules/gameUI/gameUI.ts';
import { PlayerManager } from './modules/player/playerManager.ts';
import { TeamManager } from './modules/team/teamManager.ts';
import { Scoreboard } from './modules/scoreboard/scoreboard.ts';
import { CapturePointManager } from './modules/capturePoint/capturePointManager.ts';
import { GameUIManager } from './modules/gameUI/gameUIManager.ts';
import { ScoreboardManager } from './modules/scoreboard/scoreboardManager.ts';
import { debug } from './debugTool/adminDebugTool.ts';

const gameUI = GameUI.getInstance();
const playerManager = PlayerManager.getInstance();
const scoreboard = Scoreboard.getInstance();
const teamManager = TeamManager.getInstance();
const capturePointManager = CapturePointManager.getInstance();
const gameModeManager = GameMode.GetInstance(
    playerManager,
    teamManager
);
GameUIManager.getInstance(gameUI, teamManager, capturePointManager, gameModeManager);
ScoreboardManager.getInstance(scoreboard, playerManager);
