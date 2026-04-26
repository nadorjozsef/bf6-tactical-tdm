# Tactical TDM

## What is this?

`Tactical TDM` is a ready-made template for Battlefield 6 Portal mods. It provides a modular starting point for building custom Portal experiences with gameplay systems, UI wiring, and Battlefield Portal-specific utilities already structured and configured.

This template is designed to help mod creators ship faster by giving them:

- A clean project layout for Battlefield 6 Portal mod development
- Working build and deployment scripts using `bf6-portal-bundler`
- Prebuilt game systems such as teams, score tracking, capture points, player state, and reinforcements
- A separation between game rules and rendering/UI so logic stays reusable and maintainable

## Underlying utilities

This project depends on `bf6-portal-utils` as its core helper library. That package provides Battlefiend Portal-safe abstractions for:

- event handling (`Events`)
- UI creation and SolidUI reactivity (`UI`, `SolidUI`)
- timers (`Timers`)
- game object and team utilities
- type-safe Portal mod typing and accessors

Using `bf6-portal-utils` helps keep this template consistent with Portal best practices and makes the code easier to extend.

## Components

### `GameMode`

The `GameMode` component contains the core rules and state for the mod. It is intentionally independent from UI and presentation logic, which means:

- game rules can be tested or reused separately
- it does not require any UI module imports to function
- UI is only added by the manager layer

### `GameUI`

`GameUI` is the pure presentation layer for the mod. Its responsibility is to render Portal UI elements using the accessors and data provided by other modules. Key principles:

- no direct dependency on game rules
- no direct dependency on other logic modules
- only consumes data and accessors
- handles layout, colors, and reactive updates

### `GameUIManager`

`GameUIManager` is the glue between game state and the UI. It listens for game events, fetches team/player state, and instructs `GameUI` to build or refresh displays. This layer keeps the UI renderer separate from the game logic and ensures the UI is initialized only when the game mode starts.

### `PlayerManager`

`PlayerManager` tracks player lifecycle, join events, and per-player state such as lives or equipment. It is responsible for:

- subscribing to player join/leave/game events
- maintaining valid player registries
- exposing player accessors for use by UI and gameplay systems

### `TeamManager`

`TeamManager` holds team-related state and accessors, including:

- team scores
- active player counts
- team-owned capture points
- division of team-specific UI receivers

This module centralizes team logic so the rest of the game can use a single source of truth.

### `CapturePointManager`

`CapturePointManager` handles control-point state and ownership logic. It provides:

- capture point owners
- capture progress and active capturing state
- accessors for UI rendering

### `Scoreboard`

The scoreboard system centralizes score and team progress display. It is responsible for:

- collecting team score accessors
- exposing team score bars and UI values
- keeping score rendering independent from core game rules

## Project structure

- `src/` — TypeScript source files for the mod
- `scripts/` — helper scripts for init, build, deploy, and thumbnail export
- `spatials/` — spatial definitions used by the experience
- `dist/` — generated output from the build process

## Notes

This template is built to keep gameplay and UI concerns separate, with a strong emphasis on clean architecture and reuse. `GameMode` defines the rules, while `GameUI` renders the state, and the manager layer connects them.
