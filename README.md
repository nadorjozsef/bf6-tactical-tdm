## Battlefield 6 Portal Generic Template

This repo is a ready-made template for starting Battlefield 6 Portal development.

It’s built as a thin, structured layer on top of `bf6-portal-utils`, and gives you a clean, object-oriented structure
plus a set of core gameplay mechanics out of the box.

## Benefits

- **Fully object-oriented**: scales from small prototypes to larger projects without turning into a single-file script.
- **UI is fully separated from business logic**: the UI layer only consumes reactive accessors/signals and doesn’t need
  to know where the values come from.
- **Core gameplay mechanics included**: teams, players, capture points, scoreboard wiring.
- **Easy to extend and maintain**: clear responsibilities, event-driven managers, minimal coupling.

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
