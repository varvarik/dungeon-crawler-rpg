# Project Decisions

This file records important project decisions that must not be changed
without explicit agreement.

If a decision is missing, it may be proposed and added here.

---

## Scope
- The project is a browser-based dungeon crawler RPG.
- Initial playable scope includes: 3 starting classes (Warrior, Mage, Priest), a world map with multiple dungeons, and multi-floor dungeons made of A×B tile grids.
- No UI/visual design is defined at this stage; Phase 1 focuses on rules/systems definitions only.
- No pathfinding algorithms are a requirement of the project scope unless explicitly added later.

## Architecture
- Keep core gameplay rules engine-agnostic where possible.
- Keep engine bindings as thin adapters (input, rendering, physics).

## UX / Product
- The “Definition of working” applies: any implemented feature must be demonstrable in gameplay within 60 seconds (when in implementation phases).

## Quality & Constraints
- Prefer deterministic, debuggable gameplay systems.
- Avoid hidden global state.
- Avoid unnecessary per-frame allocations / work; prefer event-driven logic over Tick/Update when possible.

# Engine & Platform
- Engine: Not chosen yet (engine-agnostic until selected)
- Platform(s): Web / Browser
- Minimum supported hardware:

# Gameplay Architecture
- Architecture pattern (OOP / ECS / Hybrid): TBD (do not commit until engine is selected)
- State management (FSM / BT / GOAP / other): FSM for run/exploration/combat state transitions (exact shape TBD)
- Event system approach: Simple event bus / messaging between domain systems and adapters (exact shape TBD)

# Data & Tuning
- Balancing data format: Data-driven (exact format TBD; must be editable without code changes where possible)
- Localization approach: Not in scope yet

# Performance Constraints
- Target frame budget: 60 FPS baseline on web
- Allocation / Tick rules: Avoid per-frame allocations; avoid unnecessary Tick/Update; prefer event-driven updates