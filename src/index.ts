import { Events } from 'bf6-portal-utils/events/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { MultiClickDetector } from 'bf6-portal-utils/multi-click-detector/index.ts';
import { MapDetector } from 'bf6-portal-utils/map-detector/index.ts';
import { Vectors } from 'bf6-portal-utils/vectors/index.ts';

import { DebugTool } from './debug-tool/index.ts';
import { getPlayerStateVectorString } from './helpers/index.ts';
import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';
import { UI } from 'bf6-portal-utils/ui/index.ts';
import { Clocks } from 'bf6-portal-utils/clocks/index.ts';

let adminDebugTool: DebugTool | undefined;
let telemetryInterval: number | undefined;

async function spawnVehicle(player: mod.Player, vehicleType: mod.VehicleList): Promise<void> {
    const playerPosition = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
    const playerFacingDirection = mod.GetSoldierState(player, mod.SoldierStateVector.GetFacingDirection);

    // Create position 20 meters in front of player (facing direction).
    const position = mod.CreateVector(
        mod.XComponentOf(playerPosition) + mod.XComponentOf(playerFacingDirection) * 20,
        mod.YComponentOf(playerPosition),
        mod.ZComponentOf(playerPosition) + mod.ZComponentOf(playerFacingDirection) * 20
    );

    adminDebugTool?.dynamicLog(`Spawning vehicle spawner at ${Vectors.getVectorString(position)}`);

    const spawner = mod.SpawnObject(
        mod.RuntimeSpawn_Common.VehicleSpawner,
        position,
        mod.CreateVector(0, 0, 0)
    ) as mod.VehicleSpawner;

    // Need to wait a bit before setting the vehicle spawner settings.
    await mod.Wait(1);

    adminDebugTool?.dynamicLog(`Setting vehicle spawner settings.`);

    mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
    mod.SetVehicleSpawnerAutoSpawn(spawner, true);
    mod.SetVehicleSpawnerRespawnTime(spawner, 1);

    adminDebugTool?.dynamicLog(`Spawning vehicle in 1 second.`);

    // We do not want the vehicle spawner to spawn another vehicle after the first one has been destroyed, and if we
    // simply set the auto spawn to false, the vehicle will still exist as an object, which is a waste of resourced.
    // Instead, we subscribe to the OnVehicleSpawned event to know when a vehicle has spawned, determine if it is the
    // vehicle we're looking for (based on its proximity to this spawner), and if it is, we disable automatic vehicle
    // respawning from the vehicle spawner. Then, we subscribe to the OnVehicleDestroyed event to know when a vehicle]
    // has been destroyed, and if it is the vehicle we're looking for (the one we just spawned), we can safely unspawn
    // the spawner. This block shows the power of the `Events` module, and how it can be used to subscribe to and
    // unsubscribe from events dynamically and in a specific context, to isolate and modularize code.
    const unsubscribeFromOnVehicleSpawned = Events.OnVehicleSpawned.subscribe((vehicle) => {
        const vehiclePosition = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);

        // If the vehicle is not within 10 meters of the spawner, ignore it as it's not the vehicle we're looking for.
        if (mod.DistanceBetween(vehiclePosition, position) > 10) return;

        // Unsubscribe from the OnVehicleSpawned event as this context no longer needs to know when a vehicle has spawned.
        unsubscribeFromOnVehicleSpawned();

        adminDebugTool?.dynamicLog(`Vehicle spawned.`);

        // Disable automatic vehicle respawning for the spawner as we're going to unspawn it once the vehicle's destroyed.
        mod.SetVehicleSpawnerAutoSpawn(spawner, false);

        const unsubscribeFromOnVehicleDestroyed = Events.OnVehicleDestroyed.subscribe((destroyedVehicle) => {
            // If the destroyed vehicle is not the specific vehicle we're looking for, ignore it.
            if (mod.GetObjId(destroyedVehicle) !== mod.GetObjId(vehicle)) return;

            // Unsubscribe from the OnVehicleDestroyed event as this context no longer needs to know when the vehicle is destroyed.
            unsubscribeFromOnVehicleDestroyed();

            adminDebugTool?.dynamicLog(`Vehicle destroyed.`);

            // Unspawn the vehicle spawner.
            mod.UnspawnObject(spawner);

            adminDebugTool?.dynamicLog(`Vehicle spawner unspawned.`);
        });
    });
}

function createAdminDebugTool(player: mod.Player): void {
    // The admin player is player id 0 for non-persistent test servers,
    // so don't do the rest of this unless it's the admin player.
    if (mod.GetObjId(player) != 0) return;

    // Create a debug tool with a static logger visible by default.
    const debugToolOptions: DebugTool.Options = {
        staticLogger: {
            visible: true,
        },
        dynamicLogger: {
            visible: false,
        },
        debugMenu: {
            visible: false,
        },
    };

    adminDebugTool = new DebugTool(player, debugToolOptions);

    // Create a multi-click detector to open the debug menu when the player triple-clicks the interact key.
    new MultiClickDetector(player, () => {
        adminDebugTool?.showDebugMenu();
    });

    // Add a debug menu button to spawn an AH64 helicopter.
    adminDebugTool?.addDebugMenuButton(mod.Message(mod.stringkeys.template.debug.buttons.spawnHelicopter), () =>
        spawnVehicle(player, mod.VehicleList.AH64)
    );

    // Add a debug menu button to spawn a golf cart.
    adminDebugTool?.addDebugMenuButton(mod.Message(mod.stringkeys.template.debug.buttons.spawnGolfCart), () =>
        spawnVehicle(player, mod.VehicleList.GolfCart)
    );

    // Log a message to the static logger.
    adminDebugTool?.staticLog(`Triple-click interact key to open debug menu.`, 0);
}

function destroyAdminDebugTool(playerId: number): void {
    // If the player is not the admin player, then we know the admin is still in the game, so we can exit this function.
    if (playerId !== 0) return;

    // Clear the telemetry interval so it doesn't continue to log the admin's position and facing direction, and
    // destroy the debug tool.
    Timers.clearInterval(telemetryInterval);
    adminDebugTool?.destroy();
    telemetryInterval = undefined;
    adminDebugTool = undefined;
}

function showTelemetry(player: mod.Player): void {
    // The admin player is player id 0 for non-persistent test servers,
    // so don't do the rest of this unless it's the admin player.
    if (mod.GetObjId(player) != 0) return;

    // Log the admin's position and facing direction to the static logger, in rows 1 and 2, every second.
    telemetryInterval = Timers.setInterval(() => {
        adminDebugTool?.staticLog(
            `Position: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetPosition)}`,
            1
        );

        adminDebugTool?.staticLog(
            `Facing: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetFacingDirection)}`,
            2
        );
    }, 1000);
}

function stopTelemetry(player: mod.Player): void {
    // The admin player is player id 0 for non-persistent test servers,
    // so don't do the rest of this unless it's the admin player.
    if (mod.GetObjId(player) != 0) return;

    // Clear the telemetry interval so it doesn't continue to log the admin's position and facing direction.
    Timers.clearInterval(telemetryInterval);
}

function handlePlayerDeployed(player: mod.Player): void {
    // Log a message to the dynamic logger that the player has deployed.
    adminDebugTool?.dynamicLog(`Player ${mod.GetObjId(player)} deployed.`);

    // Get the current map (Can be undefined if the map cannot be determined).
    const map = MapDetector.currentMap();

    if (map) {
        mod.DisplayNotificationMessage(
            mod.Message(mod.stringkeys.template.notifications.deployedOnMap, player, mod.stringkeys.template.maps[map]),
            player
        );
    } else {
        mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.template.notifications.deployed, player), player);
    }
}

// Event subscriptions for the admin debug tool.
Events.OnPlayerJoinGame.subscribe(createAdminDebugTool);
Events.OnPlayerDeployed.subscribe(showTelemetry);
Events.OnPlayerUndeploy.subscribe(stopTelemetry);
Events.OnPlayerLeaveGame.subscribe(destroyAdminDebugTool);

// Event subscriptions for notifying players of their name and the current map.
Events.OnPlayerDeployed.subscribe(handlePlayerDeployed);

const playerLives: Map<number, number> = new Map();
let nextReinforcementsTime = 60;

Events.OnPlayerJoinGame.subscribe(initializePlayer);
Events.OnMandown.subscribe(handlePlayerDown);
Events.OnGameModeStarted.subscribe(startCountDownClock);

function startCountDownClock(): void {
    nextReinforcementsClock.start();
}

const nextReinforcementsClock = new Clocks.CountDownClock(60, {
    onSecond: (seconds) => updateNextReinforcementDisplay(seconds),
    onComplete: () => handleReinforcementsArrived(),
});

function updateNextReinforcementDisplay(seconds: number): void {
    adminDebugTool?.dynamicLog(`updateNextReinforcementDisplay`);
    updateText2(displayReinforcementsText, seconds.toString());
    adminDebugTool?.dynamicLog(`Next reinforcements in: ${seconds} seconds`);
}

function handleReinforcementsArrived(): void {
    adminDebugTool?.dynamicLog(`handleReinforcementsArrived`);
    for (const [playerId, lives] of playerLives) {
        if (lives === 0) {
            playerLives.set(playerId, 2);
            updateText(displayLifeText, '2');
        }
    }
    mod.EnableAllPlayerDeploy(true);
    nextReinforcementsClock.reset().start();
}

function initializePlayer(player: mod.Player): void {
    adminDebugTool?.dynamicLog(`initializePlayer`);
    playerLives.set(mod.GetObjId(player), 2);
    displayLife(player);
    displayNextReinforcements();
}

function handlePlayerDown(player: mod.Player): void {
    adminDebugTool?.dynamicLog(`handlePlayerDown`);
    adminDebugTool?.dynamicLog(`Player ${mod.GetObjId(player)} down. Total lives (before): ${playerLives.get(mod.GetObjId(player))}`);
    const lives = playerLives.get(mod.GetObjId(player))! - 1;
    playerLives.set(mod.GetObjId(player), lives);
    adminDebugTool?.dynamicLog(`Player ${mod.GetObjId(player)} down. Total lives (after): ${lives}`);
    if (lives === 0) {
        adminDebugTool?.dynamicLog(`Player ${mod.GetObjId(player)} has died, disabling deploy.`);
        mod.EnablePlayerDeploy(player, false);
    }
    updateText(displayLifeText, lives.toString());
}

let displayLifeText: UIText | undefined;
let displayReinforcementsText: UIText | undefined;

function updateText(uiText: UIText | undefined, newText: string) {
    adminDebugTool?.dynamicLog(`updateText called with newText: ${newText}`);
    if (!uiText) return;
    const widget = uiText.uiWidget;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.lifeCount, newText));
}

function updateText2(uiText: UIText | undefined, newText: string) {
    adminDebugTool?.dynamicLog(`updateText called with newText: ${newText}`);
    if (!uiText) return;
    const widget = uiText.uiWidget;
    mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.nextReinforcementsTimer, newText));
}

function displayLife(player: mod.Player): void {
    adminDebugTool?.dynamicLog(`displayLife`);
    const container = new UIContainer({
        width: 300,
        height: 100,
        bgColor: UI.COLORS.BLACK,
        bgAlpha: 0.8,
        visible: true,
        position: { x: 0, y: 100 },
        anchor: mod.UIAnchor.TopCenter,
        receiver: player,
    });

    displayLifeText = new UIText({
        message: mod.Message(mod.stringkeys.lifeCount, playerLives.get(mod.GetObjId(player))!.toString()),
        textSize: 30,
        textColor: UI.COLORS.WHITE,
        receiver: player,
        parent: container,
    });

    container.show();
}

function displayNextReinforcements(): void {
    adminDebugTool?.dynamicLog(`displayNextReinforcements`);
    const container2 = new UIContainer({
        width: 300,
        height: 100,
        bgColor: UI.COLORS.BLACK,
        bgAlpha: 0.8,
        visible: true,
        position: { x: 0, y: 100 },
        anchor: mod.UIAnchor.TopRight,
    });

    displayReinforcementsText = new UIText({
        message: mod.Message(mod.stringkeys.nextReinforcementsTimer, nextReinforcementsTime.toString()),
        textSize: 30,
        textColor: UI.COLORS.WHITE,
        parent: container2,
    });

    container2.show();
}