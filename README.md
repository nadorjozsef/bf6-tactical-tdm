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

1. **Start with game logic**: adapt `src/modules/gameMode.ts` and implement your new rules/event handling.
2. **Extend the data model if needed**: add new properties to `src/entities/*` (`Player`, `Team`, `CapturePoint`).
3. **Add UI elements if needed**: implement new UI widgets in `src/ui/gameUI.ts`.
4. **Wire UI to state**: connect entity accessors to UI widgets via `src/ui/gameUIManager.ts`.

## Architecture

The code is split into three main concerns:

- **Entities** (`src/entities/*`): domain objects with state.
- **Modules** (`src/modules/*`): game systems that own rules, orchestration, and event subscriptions.
- **UI** (`src/ui/*`): presentation-only layer that renders state from accessors.

### Entities

Entities are small object wrappers around `mod.*` objects, plus local state.

- `Player` (`src/entities/player.ts`)
    - Wraps `mod.Player` and stores per-player state.
    - Use it to keep stats or reactive values you want to show on the scoreboard/UI.

- `Team` (`src/entities/team.ts`)
    - Wraps `mod.Team` and stores per-team state.
    - Useful for team-level values like score, tickets, or other mode-specific counters.

- `CapturePoint` (`src/entities/capturePoint.ts`)
    - Wraps `mod.CapturePoint` and stores capture point state.
    - Designed for objective-based modes where the UI needs to reflect ownership/capture progress.

### Modules

Modules are event-driven “systems”. They subscribe to Portal events (via `bf6-portal-utils/events`) and update entity
state.

- `PlayerManager` (`src/modules/playerManager.ts`)
    - Tracks players and exposes lookup helpers.
    - Central place to create/cleanup per-player state when players join/leave.

- `TeamManager` (`src/modules/teamManager.ts`)
    - Tracks teams and exposes lookup helpers.
    - Keeps team state in one place so rules and UI wiring can stay simple.

- `CapturePointManager` (`src/modules/capturePointManager.ts`)
    - Tracks capture points and updates their state from events.
    - Good spot to configure capture-point settings and translate events into entity updates.

- `Scoreboard` (`src/modules/scoreboard.ts`)
    - Configures and updates the scoreboard.
    - Helps keep scoreboard logic out of your game mode rules.

- `GameMode` (`src/modules/gameMode.ts`)
    - Central rules + orchestration layer for the game mode.
    - This is where you typically connect events, update entities, and decide win conditions.

### UI

UI is split into two layers, and it’s designed to be independent from gameplay/business logic: UI elements only need
accessors/signals, so you can refactor rules without rewriting UI rendering. This also makes the UI layer reusable
across game modes, because it isn’t hard-wired to your game logic.

- `GameUI` (`src/ui/gameUI.ts`)
    - Stateless UI builder that renders values from accessors.
    - It should not contain any game rules—only layout and presentation.

- `GameUIManager` (`src/ui/gameUIManager.ts`)
    - Wires **game state → UI** (connects entity/module accessors to `GameUI`).
    - If you add a new accessor, this is usually the only place you need to hook it up.

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
import type { Team } from '../entities/team.ts';

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

### Entities (`src/entities/*`)

#### `Player` (`src/entities/player.ts`)

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

#### `Team` (`src/entities/team.ts`)

Per-team state wrapper around `mod.Team`, used for team score and derived counters like alive/active players.

- `constructor(modTeam: mod.Team)`
- `id: number` _(getter)_
- `modObject: mod.Team` _(getter)_
- `scoreAccessor: SolidUI.Accessor<number>` _(getter)_
- `score: number` _(getter/setter)_
- `activePlayersAccessor: SolidUI.Accessor<number>` _(getter)_
- `activePlayers: number` _(getter/setter)_

#### `CapturePoint` (`src/entities/capturePoint.ts`)

Capture-point state wrapper around `mod.CapturePoint`, tracking owner and “capturing” status for objective UI.

- `constructor(modCapturePoint: mod.CapturePoint)`
- `id: number` _(getter)_
- `modObject: mod.CapturePoint` _(getter)_
- `ownerTeamIdAccessor: SolidUI.Accessor<number>` _(getter)_
- `ownerTeamId: number` _(getter/setter)_
- `isCapturingAccessor: SolidUI.Accessor<boolean>` _(getter)_
- `isCapturing: boolean` _(getter/setter)_

### Modules (`src/modules/*`)

#### `PlayerManager` (`src/modules/playerManager.ts`)

Player registry and lookup helpers, created once and kept in sync via Portal join/leave events.

- `static getInstance(): PlayerManager`
- `subscribePlayerJoinGame(callback: (player: Player) => void): void`
- `getPlayer(modPlayer: mod.Player): Player`
- `getPlayer(playerId: number): Player`
- `getPlayers(modPlayers: mod.Player[]): Player[]`
- `getAllPlayers(): Player[]`

#### `TeamManager` (`src/modules/teamManager.ts`)

Team registry and lookup helpers, initialized at game start.

- `static getInstance(): TeamManager`
- `getTeam(modTeam: mod.Team): Team`
- `getTeam(teamId: number): Team`

#### `CapturePointManager` (`src/modules/capturePointManager.ts`)

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

#### `GameMode` (`src/modules/gameMode.ts`)

Contains the custom game mode logic.

- `static GetInstance(playerManager: PlayerManager, teamManager: TeamManager, capturePointManager: CapturePointManager, reinforcements: Reinforcements): GameMode`
- `GAME_MODE_TARGET_SCORE: number` _(field; read by UI wiring)_

### UI (`src/ui/*`)

#### `GameUI` (`src/ui/gameUI.ts`)

Stateless UI builder that renders HUD widgets from SolidUI accessors (no rules/state ownership).

- `static getInstance(): GameUI`
- `capturePoints(modTeam: mod.Team, ownerTeamIdAccessors: SolidUI.Accessor<number>[], isCapturingAccessors: SolidUI.Accessor<boolean>[]): void`
- `teamScores(modTeam: mod.Team, teamScoreAccessor: SolidUI.Accessor<number>, opponentScoreAccessor: SolidUI.Accessor<number>): void`
- `teamScoreBars(modTeam: mod.Team, teamScoreAccessor: SolidUI.Accessor<number>, opponentScoreAccessor: SolidUI.Accessor<number>, maxScore: number): void`
- `activePlayers(modTeam: mod.Team, leftActivePlayerAccessor: SolidUI.Accessor<number>, rightActivePlayerAccessor: SolidUI.Accessor<number>): UIContainer`
- `playerLives(player: mod.Player, livesAccessor: SolidUI.Accessor<number>): UIContainer`
- `nextReinforcements(team: mod.Team, nextReinforcementsTimeAccessor: SolidUI.Accessor<number>): UIContainer`

#### `GameUIManager` (`src/ui/gameUIManager.ts`)

UI wiring layer that bridges entities/modules → `GameUI` methods at game start and when players join.

- `static getInstance(gameUI: GameUI, playerManager: PlayerManager, teamManager: TeamManager, capturePointManager: CapturePointManager, reinforcements: Reinforcements, gameMode: GameMode): GameUIManager`
