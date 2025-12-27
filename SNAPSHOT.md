# Project Snapshot

## Project
Dungeon Crawler RPG (browser-based)

## Current state
Phase 2 complete: vertical-slice implementation exists and is runnable in a browser.

Implementation constraints (corrected):
- Runs via a simple static file server (example: `python -m http.server`)
- No mandatory build step, dev server, bundler, or framework assumptions
- Plain browser JavaScript using ES modules + static `index.html`/CSS

## Last completed step
Phase 2 — Vertical slice complete (playable via simple static server; no build/dev server required).

## Status
- Phase: Phase 2 — Vertical slice (completed)
- State: Ready for Phase 3 (Iteration & robustness) — not started

## Notes
This project uses an explicit AI-agent-driven development process
with persistent project memory stored in markdown files.

Issue fix (Phase 2):
- Problem: A Vite + TypeScript + npm toolchain was introduced, making Phase 2 depend on a build/dev server that was not agreed in `DECISIONS.md`.
- Fix: Refactored the implementation to plain browser ES modules and removed Vite/TypeScript tooling from the critical path. The game now runs from a simple static file server.

Phase 2 verification (manual):
- Verified the vertical slice runs correctly via a simple static server.
- Verified grid-based exploration works.
- Verified turn-based combat works according to this SNAPSHOT.
- Verified no build step or dev server is required.
- Verified no Phase 3 work has started.

## Game Dev Profile
- Engine: Engine-agnostic (not chosen yet)
- Engine version:
- Target platform(s): Web / Browser
- Target FPS / performance budget: 60 FPS baseline (turn-based; avoid unnecessary per-frame work)
- Camera & controls: 2D top-down grid; player issues discrete actions (Move N/S/E/W, Interact, Use Item, End Turn)
- Core loop (30 sec summary): Choose class -> select dungeon from world map -> enter floor -> explore grid tile-by-tile, collect consumables/loot, overcome blockers (walls/traps), fight enemies in turn-based dice combat -> reach exit to next floor -> clear final floor to complete dungeon -> return to world map for next dungeon.
- Game pillars (3–5 bullets):
  - Tactical turn-based combat with dice rolls and readable outcomes
  - Grid exploration with meaningful tile choices (blockers, consumables, risk/reward)
  - Class identity (Warrior/Mage/Priest) via distinct actions and stat scaling
  - Lightweight progression via equipment and small permanent stat growth
- Content pipeline (assets, scenes/levels): Data-defined dungeons composed of floors (A×B grids) with tile types + enemy/loot placement
- Save/Load approach: Run-based (single run state); persistence TBD in Phase 2+
- Tuning / data approach (ScriptableObjects / DataAssets / JSON / other): Data-driven configs (engine-agnostic; exact format TBD)

## Phase 1 Output — Rules & Systems Definition (no UI/visuals)

### High-level goal
Clear dungeons on a world map by progressing through multiple grid-based floors, surviving turn-based encounters, and using class abilities + equipment effects to adapt.

### Game entities
- **Player character**: Exactly one controllable hero per run; choose 1 of 3 starting classes.
- **Enemies**: Spawn per floor; act turn-by-turn with simple rules-based AI.
- **Equipment**: Items that modify stats and may add special effects.
- **Consumables**: One-time bonuses obtained from bonus tiles and/or drops.

### Classes (starting set)
- **Warrior**: Physical offense/defense. Scales primarily with Strength + Armor. Has at least one active that improves survivability or burst.
- **Mage**: Magical offense/control. Scales primarily with Intelligence + Mana. Has at least one spell action (damage or control).
- **Priest**: Support/healing. Scales primarily with Faith + Mana. Has at least one heal/buff action.

### Stats (conceptual)
- **HP**: When HP reaches 0 -> run ends (loss).
- **Mana**: Resource for spells/abilities (Mage/Priest, optional for others).
- **Strength / Intelligence / Faith**: Primary scaling stats for class actions.
- **Armor Class (AC)**: Target number for attack rolls.
- **Attack Bonus / Spell Power**: Bonuses used in hit and/or damage formulas.
- **Speed**: Affects initiative and movement allowance (see below).

### World map
- A set of dungeon locations. A run progresses by selecting a dungeon, clearing it, then returning to the map to choose the next target.
- Map representation and navigation UI are out of scope for Phase 1; only the structure/intent is defined here.

### Dungeons and floors
- Each dungeon consists of **multiple floors**.
- Each floor is a **2D grid** of size **A×B tiles**.
- Each floor includes at minimum:
  - **Entrance tile** (player spawn)
  - **Exit tile** (advance to next floor; on final floor, exits the dungeon as “dungeon cleared”)

### Tiles (floor primitives)
- **Floor**: Walkable.
- **Wall**: Non-walkable; blocks movement.
- **Trap (blocking)**: Non-walkable by default; represents a puzzle-like blocker. Can be removed/bypassed only via an interaction/check/item (exact check rules can be tuned in Phase 2).
- **Bonus (consumable)**: Walkable; grants a one-time consumable effect when entered; then becomes Floor.
- **Entrance**: Walkable; starting position.
- **Exit**: Walkable; interaction to transition floors (or complete dungeon on final floor).

### Exploration rules (grid movement)
- Player movement is **grid-based** with cardinal directions (N/S/E/W).
- Movement into non-walkable tiles (Wall, blocking Trap) is not allowed.
- **Movement allowance** is derived from **Speed**:
  - Define a tunable **MoveRange** (tiles per turn) as a function of Speed, e.g. `MoveRange = BaseMove + SpeedFactor` (exact numbers tuned in Phase 2).
  - Exploration may be step/turn-driven to support deterministic enemy turns (implementation detail deferred); the key requirement is: higher Speed -> more movement potential and better initiative.

### Combat rules (turn-based, DnD-style dice)
- Combat is **turn-based**; actors act in initiative order.
- **Initiative**: `d20 + InitiativeBonus` (InitiativeBonus derived from Speed).
- On a turn, an actor chooses:
  - **Move**: Up to MoveRange tiles (derived from Speed; typically smaller in combat than in exploration if desired).
  - **Action**: One of: basic attack, class ability/spell, use item.
- **Basic attack (example model)**:
  - **Hit check**: `d20 + AttackBonus >= target AC` => hit, else miss.
  - **Damage**: weapon dice + relevant stat modifier (+ equipment effects).
- **Spells/abilities**: Either use a hit check (spell attack) or saving throw model (both are acceptable; pick one consistently during Phase 2).

### Enemy AI (simple, deterministic)
- On enemy turn:
  - If a valid attack action is available (e.g., player in range) -> perform it.
  - Else -> move toward the player using local rules (e.g., choose a legal step that reduces Manhattan distance; if multiple, pick a stable priority order).
- No global pathfinding requirement is introduced in Phase 1.

### Equipment & effects
- Equipment provides:
  - **Stat modifiers** (flat or percent; exact representation tuned later)
  - Optional **special effects**, defined as triggers:
    - OnHit / OnKill / OnDamageTaken / StartOfTurn / EndOfTurn
  - Effects are deterministic and fully described by data + simple rules.

### Win / lose conditions
- **Lose**: Player HP reaches 0.
- **Win (dungeon)**: Reach the Exit on the final floor and transition out (exact requirement like “defeat boss” is optional and can be decided in Phase 2).
- **Win (session)**: Not defined in Phase 1; can be “clear all available dungeons” or “reach a target dungeon tier”.

### Vertical slice acceptance criteria (Phase 2 target)
A build is considered a successful vertical slice if within 60 seconds it can demonstrate:
- Start a run and pick 1 of 3 classes.
- Enter a small floor (e.g., 8×8) containing at least: walls, 1 blocking trap, 1 bonus, entrance, exit, and 1 enemy.
- Grid movement obeying walkability rules; Speed visibly affects movement allowance and/or initiative.
- A full combat encounter with dice rolls (hit/miss + damage) and enemy turn-taking.
- At least one class-specific action (Warrior/Mage/Priest) impacting outcome.
- Clear success/failure: either exit the floor (success) or die (failure).