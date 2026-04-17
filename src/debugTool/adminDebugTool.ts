import { Events } from 'bf6-portal-utils/events/index.ts';
import { MultiClickDetector } from 'bf6-portal-utils/multi-click-detector/index.ts';
import { DebugTool } from './index.ts';

export let debug!: DebugTool | undefined;

function createAdminDebugTool(player: mod.Player): void {
    // The admin player is player id 0 for non-persistent test servers,
    // so don't do the rest of this unless it's the admin player.
    if (mod.GetObjId(player) != 0) return;

    // Create a debug tool with a static logger visible by default.
    const debugToolOptions: DebugTool.Options = {
        staticLogger: {
            visible: false,
        },
        dynamicLogger: {
            visible: false,
        },
        debugMenu: {
            visible: false,
        },
    };

    debug = new DebugTool(player, debugToolOptions);

    // Create a multi-click detector to open the debug menu when the player triple-clicks the interact key.
    new MultiClickDetector(player, () => {
        debug?.showDebugMenu();
    });

    // Log a message to the static logger.
    debug?.staticLog(`Triple-click interact key to open debug menu.`, 0);
}

function destroyAdminDebugTool(playerId: number): void {
    // If the player is not the admin player, then we know the admin is still in the game, so we can exit this function.
    if (playerId !== 0) return;

    debug?.destroy();
    debug = undefined;
}

Events.OnPlayerJoinGame.subscribe(createAdminDebugTool);
Events.OnPlayerLeaveGame.subscribe(destroyAdminDebugTool);
