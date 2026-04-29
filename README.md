## Battlefield 6 Portal Generic Template

This is a ready-made template for starting Battlefield 6 Portal development. It’s built as a thin, structured layer on
top of `bf6-portal-utils`, that gives you a clean, object-oriented structure plus a set of core gameplay mechanics out
of the box.

## Why use this template?

- **Solid starting feature set**: included familiar UI elements, handling of capture points, team/player state, and a
  scoreboard.
- **Grows with your mod**: object-oriented structure that stays readable as your project expands.
- **Easy to extend**: clear separation of concerns and event-driven modules.
- **Reusable UI layer**: UI is driven by accessors/signals instead of being hard-wired to game logic.

## Getting started

```sh
git clone https://github.com/nadorjozsef/bf6-tactical-tdm.git
cd bf6-tactical-tdm
npm init
npm run build
```

After the build completes, you copy the contents of the `dist/` folder into the Script editor on the Battlefield Portal
website. For more info about building and deployment workflows, see: https://github.com/deluca-mike/bf6-portal-bundler

## Create your own Portal mod

1. **Start with game logic**: adapt `src/modules/gameMode/gameMode.ts` and implement your new rules/event handling.
2. **Extend the data model if needed**: add new properties to state classes in modules such as `src/modules/player/player.ts`, `src/modules/team/team.ts`, or `src/modules/capturePoint/capturePoint.ts`.
3. **Add UI elements if needed**: implement new UI widgets in `src/modules/gameUI/gameUI.ts`.
4. **Wire UI to state**: connect accessors and game state via `src/modules/gameUI/gameUIManager.ts`.

## Architecture

### Core modules

The repo currently includes several module folders under `src/modules`:

- `gameMode`
    - Central rules and orchestration for the game mode.
    - Connects events, updates state, and decides win conditions.

- `player`
    - Tracks players and stores per-player state.
    - Central place to create/cleanup per-player data when players join/leave.

- `team`
    - Tracks teams and stores per-team state.
    - Useful for team-level values like score, lives, and active player counts.

- `capturePoint`
    - Tracks capture points and updates their state from events.
    - Designed for objective-based modes where ownership and capture progress matter.

- `scoreboard`
    - Configures and updates the scoreboard.
    - Keeps scoreboard logic separate from game rules.

- `gameUI`
    - Renders UI elements from accessors.
    - Wires game state to UI components without embedding game logic in the UI layer.

## Example: display an entity property on the UI

Use these steps whenever you want a gameplay value to appear on the UI and stay in sync.

### 1) Add an entity property + UI accessor

Keep your “source of truth” on an entity, exposed as a normal property. If you want to display that property on the UI,
also expose an **accessor** (a bindable read function) so the UI can react to updates.

TypeScript example (entity):

```ts
import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';

export class Team {
    private _scoreSignal = SolidUI.createSignal(0);

    // normal property used by gameplay code
    get score(): number {
        return this._scoreSignal[0]();
    }
    set score(value: number) {
        this._scoreSignal[1](value);
    }

    // accessor used by the UI (only needed if you want to render it)
    get scoreAccessor(): SolidUI.Accessor<number> {
        return this._scoreSignal[0];
    }
}
```

### 2) Create a text element in `GameUI`

Add (or reuse) a `GameUI` method that creates a `UIText` and sets its `message` from the accessor.

TypeScript example (UI method):

```ts
import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';

export class GameUI {
    public teamScore(team: mod.Team, scoreAccessor: SolidUI.Accessor<number>): void {
        SolidUI.h(UIText, {
            // ...position/size/etc...
            message: () => mod.Message(scoreAccessor()),
            receiver: team,
        });
    }
}
```

### 3) Wire the accessor into the UI using `GameUIManager`

`GameUIManager` is the bridge. It grabs the accessor from your entity and passes it into the `GameUI` method. After
that, whenever your gameplay code updates the entity property, the UI stays synced because it’s reading the accessor.

```ts
import type { GameUI } from './gameUI.ts';
import type { Team } from '../team/team.ts';

export class GameUIManager {
    constructor(private _gameUI: GameUI) {}

    public showTeamScore(team: Team): void {
        this._gameUI.teamScore(team.modObject, team.scoreAccessor);
    }
}
```

Now, any time gameplay updates the entity property:

```ts
team.score = team.score + 1;
```

…`scoreAccessor()` returns the new value and the UI text updates automatically.

## API reference

This template isn’t published as an npm library—your “public API” is the set of classes you instantiate/use from inside
your own Portal script (typically from `src/index.ts`). Below is a quick reference of the main classes and their
callable surfaces.

### State classes (`src/modules/*`)

#### `Player` (`src/modules/player/player.ts`)

Per-player state wrapper around `mod.Player`, with SolidUI accessors for reactive UI/scoreboard updates.

- `constructor(modPlayer: mod.Player)`
- `id: number` _(getter)_
- `modObject: mod.Player` _(getter)_
- `teamId: number` _(getter)_
- `isAlive: boolean` _(getter)_
- `livesAccessor: SolidUI.Accessor<number>` _(getter)_
- `lives: number` _(getter/setter)_
- `scoreAccessor: SolidUI.Accessor<number>` _(getter)_
- `score: number` _(getter/setter)_
- `killsAccessor: SolidUI.Accessor<number>` _(getter)_
- `kills: number` _(getter/setter)_

#### `Team` (`src/modules/team/team.ts`)

Per-team state wrapper around `mod.Team`, used for team score and derived counters like alive/active players.

- `constructor(modTeam: mod.Team)`
- `id: number` _(getter)_
- `modObject: mod.Team` _(getter)_
- `scoreAccessor: SolidUI.Accessor<number>` _(getter)_
- `score: number` _(getter/setter)_
- `activePlayersAccessor: SolidUI.Accessor<number>` _(getter)_
- `activePlayers: number` _(getter/setter)_

#### `CapturePoint` (`src/modules/capturePoint/capturePoint.ts`)

Capture-point state wrapper around `mod.CapturePoint`, tracking owner and “capturing” status for objective UI.

- `constructor(modCapturePoint: mod.CapturePoint)`
- `id: number` _(getter)_
- `modObject: mod.CapturePoint` _(getter)_
- `ownerTeamIdAccessor: SolidUI.Accessor<number>` _(getter)_
- `ownerTeamId: number` _(getter/setter)_
- `isCapturingAccessor: SolidUI.Accessor<boolean>` _(getter)_
- `isCapturing: boolean` _(getter/setter)_

### Modules (`src/modules/*`)

#### `PlayerManager` (`src/modules/player/playerManager.ts`)

Player registry and lookup helpers, created once and kept in sync via Portal join/leave events.

- `static getInstance(): PlayerManager`
- `subscribePlayerJoinGame(callback: (player: Player) => void): void`
- `getPlayer(modPlayer: mod.Player): Player`
- `getPlayer(playerId: number): Player`
- `getPlayers(modPlayers: mod.Player[]): Player[]`
- `getAllPlayers(): Player[]`

#### `TeamManager` (`src/modules/team/teamManager.ts`)

Team registry and lookup helpers, initialized at game start.

- `static getInstance(): TeamManager`
- `getTeam(modTeam: mod.Team): Team`
- `getTeam(teamId: number): Team`

#### `CapturePointManager` (`src/modules/capturePoint/capturePointManager.ts`)

Capture-point registry that wires Portal capture events into `CapturePoint` entity state.

- `static getInstance(): CapturePointManager`
- `getCapturePoints(): CapturePoint[]`
- `getCapturePoint(modCapturePoint: mod.CapturePoint): CapturePoint`
- `getCapturePoint(capturePointId: number): CapturePoint`

#### `Scoreboard` (`src/modules/scoreboard.ts`)

Custom scoreboard configuration + a single update method to push per-player values.

- `static getInstance(): Scoreboard`
- `update(modPlayer: mod.Player, score: number, kills: number, lives: number): void`

#### `ScoreboardManager` (`src/modules/scoreboardManager.ts`)

Wiring layer that binds `Player` accessors into `Scoreboard.update()` using a SolidUI effect.

- `static getInstance(scoreboard: Scoreboard, playerManager: PlayerManager): ScoreboardManager`

#### `GameMode` (`src/modules/gameMode/gameMode.ts`)

Contains the custom game mode logic.

- `static GetInstance(playerManager: PlayerManager, teamManager: TeamManager): GameMode`
- `GAME_MODE_TARGET_SCORE: number` _(field; read by UI wiring)_

### UI (`src/modules/gameUI/*`)

#### `GameUI` (`src/modules/gameUI/gameUI.ts`)

Stateless UI builder that renders HUD widgets from SolidUI accessors (no rules/state ownership).

- `static getInstance(): GameUI`
- `capturePoints(modTeam: mod.Team, ownerTeamIdAccessors: SolidUI.Accessor<number>[], isCapturingAccessors: SolidUI.Accessor<boolean>[]): void`
- `teamScores(modTeam: mod.Team, teamScoreAccessor: SolidUI.Accessor<number>, opponentScoreAccessor: SolidUI.Accessor<number>): void`
- `teamScoreBars(modTeam: mod.Team, teamScoreAccessor: SolidUI.Accessor<number>, opponentScoreAccessor: SolidUI.Accessor<number>, maxScore: number): void`

#### `GameUIManager` (`src/modules/gameUI/gameUIManager.ts`)

UI wiring layer that bridges entities/modules → `GameUI` methods at game start.

- `static getInstance(gameUI: GameUI, teamManager: TeamManager, capturePointManager: CapturePointManager, gameMode: GameMode): GameUIManager`