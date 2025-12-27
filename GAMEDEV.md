# Game Dev Operating Rules

## Definition of "working"
A feature is considered done only if it can be demonstrated in gameplay within 60 seconds.

## Playtest discipline
- Every change must be quickly testable.
- Prefer small parameters and toggles over rewrites.

## Separation of concerns
- Core gameplay logic should be engine-agnostic when possible.
- Engine bindings must be thin adapters.

## Common pitfalls
- Avoid hidden global state.
- Avoid per-frame allocations.
- Avoid unnecessary Tick / Update usage.
