import { isAlive, clampHp } from "./actors.js";
import { getTile, isWalkable, makeFixedFloor8x8, setTile } from "./floor.js";
import { rollInitiative, basicMeleeAttack } from "./combat.js";
import { Rng } from "./rng.js";
import { manhattan, samePoint, step } from "./types.js";

export function makeInitialState(seed = Date.now()) {
  const rng = new Rng(seed);
  return {
    phase: "menu",
    seed,
    rng,
    floor: null,
    positions: {
      player: { x: 0, y: 0 },
      enemy_1: { x: 0, y: 0 }
    },
    actors: {
      player: {
        id: "player",
        kind: "player",
        name: "Warrior",
        hp: 18,
        stats: {
          maxHp: 18,
          ac: 14,
          speed: 2,
          attackBonus: 4,
          strengthMod: 2
        }
      },
      enemy_1: {
        id: "enemy_1",
        kind: "enemy",
        name: "Goblin",
        hp: 10,
        stats: {
          maxHp: 10,
          ac: 12,
          speed: 1,
          attackBonus: 3,
          strengthMod: 1
        }
      }
    },
    turn: null,
    log: [
      {
        text: "Vertical slice: pick a class (only Warrior is playable).",
        kind: "info"
      }
    ],
    selectedClass: null
  };
}

export function moveRangeFromSpeed(speed) {
  // Visible effect of Speed, simple and tunable:
  // speed 1 => 2 tiles, speed 2 => 3 tiles, speed 3 => 4 tiles, ...
  return 1 + speed;
}

function pushLog(s, entry) {
  const next = [...s.log, entry];
  const cap = 120;
  return { ...s, log: next.length > cap ? next.slice(next.length - cap) : next };
}

function actorAt(s, p) {
  for (const id of Object.keys(s.positions)) {
    if (samePoint(s.positions[id], p) && isAlive(s.actors[id])) return id;
  }
  return null;
}

function isOccupied(s, p) {
  return actorAt(s, p) !== null;
}

function ensureInFloor(s) {
  if (!s.floor || !s.turn) {
    throw new Error("Expected in-floor state");
  }
}

export function canPlayerAct(s) {
  return s.phase === "in_floor" && s.turn?.side === "player";
}

export function startRunAsWarrior(s) {
  const floor = makeFixedFloor8x8();
  const playerStart = floor.entrance;
  const enemyStart = { x: 6, y: 2 };

  const playerInit = rollInitiative(s.rng, s.actors.player.stats.speed);
  const enemyInit = rollInitiative(s.rng, s.actors.enemy_1.stats.speed);

  let next = {
    ...s,
    phase: "in_floor",
    selectedClass: "warrior",
    floor,
    positions: { ...s.positions, player: playerStart, enemy_1: enemyStart },
    turn: {
      side: playerInit.total >= enemyInit.total ? "player" : "enemy",
      moveRemaining: 0,
      actionAvailable: true,
      round: 1
    }
  };

  next = pushLog(next, {
    text: `Seed=${next.seed}. Initiative: Warrior ${playerInit.roll}+${next.actors.player.stats.speed}=${playerInit.total}, Goblin ${enemyInit.roll}+${next.actors.enemy_1.stats.speed}=${enemyInit.total}.`,
    kind: "info"
  });

  next = beginSideTurn(next);
  return next;
}

function beginSideTurn(s) {
  ensureInFloor(s);
  const side = s.turn.side;
  const actor = side === "player" ? s.actors.player : s.actors.enemy_1;
  const moveRemaining = moveRangeFromSpeed(actor.stats.speed);
  let next = { ...s, turn: { ...s.turn, moveRemaining, actionAvailable: true } };
  next = pushLog(next, { text: `${actor.name} turn. Move=${moveRemaining}.`, kind: "info" });

  if (side === "enemy") {
    next = resolveEnemyTurn(next);
  }
  return next;
}

function endSideTurn(s) {
  ensureInFloor(s);
  const nextSide = s.turn.side === "player" ? "enemy" : "player";
  const nextRound = nextSide === "player" ? s.turn.round + 1 : s.turn.round;
  return beginSideTurn({ ...s, turn: { ...s.turn, side: nextSide, round: nextRound } });
}

export function endTurn(s) {
  if (s.phase !== "in_floor" || !s.turn) return s;
  if (s.turn.side !== "player") return s;
  return endSideTurn(s);
}

export function tryMovePlayer(s, dir) {
  if (!canPlayerAct(s)) return s;
  ensureInFloor(s);
  if (s.turn.moveRemaining <= 0) return pushLog(s, { text: "No move left this turn.", kind: "danger" });

  const from = s.positions.player;
  const to = step(from, dir);
  if (!isWalkable(s.floor, to)) return pushLog(s, { text: "Blocked.", kind: "danger" });
  if (isOccupied(s, to)) return pushLog(s, { text: "Occupied.", kind: "danger" });

  let next = {
    ...s,
    positions: { ...s.positions, player: to },
    turn: { ...s.turn, moveRemaining: s.turn.moveRemaining - 1 }
  };

  const tile = getTile(next.floor, to);
  if (tile.kind === "bonus") {
    const heal = 5;
    const p = next.actors.player;
    const healedHp = clampHp(p.hp + heal, p.stats.maxHp);
    next = {
      ...next,
      actors: { ...next.actors, player: { ...p, hp: healedHp } },
      floor: setTile(next.floor, to, "floor")
    };
    next = pushLog(next, { text: `Bonus consumed: +${heal} HP.`, kind: "ok" });
  }

  return next;
}

function isAdjacent(a, b) {
  return manhattan(a, b) === 1;
}

export function canAttack(s) {
  if (!canPlayerAct(s)) return false;
  if (!s.turn?.actionAvailable) return false;
  if (!isAlive(s.actors.enemy_1)) return false;
  return isAdjacent(s.positions.player, s.positions.enemy_1);
}

export function attack(s) {
  if (!canAttack(s)) return s;
  ensureInFloor(s);

  const attacker = s.actors.player;
  const defender = s.actors.enemy_1;
  const { result, defenderAfter } = basicMeleeAttack(s.rng, attacker, defender);

  let next = { ...s, actors: { ...s.actors, enemy_1: defenderAfter }, turn: { ...s.turn, actionAvailable: false } };

  if (!result.hit) {
    next = pushLog(next, {
      text: `${result.attacker} attacks: d20=${result.roll} +${attacker.stats.attackBonus} => ${result.totalToHit} vs AC ${result.targetAc}: MISS`,
      kind: "info"
    });
  } else {
    next = pushLog(next, {
      text: `${result.attacker} attacks: d20=${result.roll} +${attacker.stats.attackBonus} => ${result.totalToHit} vs AC ${result.targetAc}: HIT`,
      kind: "ok"
    });
    next = pushLog(next, {
      text: `Damage: d8=${result.damageRoll} +${attacker.stats.strengthMod} => ${result.damageTotal}. ${result.defender} HP=${result.defenderHpAfter}.`,
      kind: "ok"
    });
  }

  if (!isAlive(next.actors.enemy_1)) {
    next = pushLog(next, { text: "Goblin defeated. Exit unlocked.", kind: "ok" });
  }
  return next;
}

export function canInteract(s) {
  if (!canPlayerAct(s)) return false;
  ensureInFloor(s);

  const p = s.positions.player;
  const tile = getTile(s.floor, p);
  if (tile.kind === "exit") return true;

  // Interact with adjacent blocking trap (disarm)
  const dirs = ["up", "left", "down", "right"];
  for (const d of dirs) {
    const q = step(p, d);
    if (!isWalkable(s.floor, q)) {
      const t = getTile(s.floor, q);
      if (t.kind === "trap_blocking") return true;
    }
  }
  return false;
}

export function interact(s) {
  if (!canPlayerAct(s)) return s;
  ensureInFloor(s);

  const ppos = s.positions.player;
  const here = getTile(s.floor, ppos);
  if (here.kind === "exit") {
    if (isAlive(s.actors.enemy_1)) {
      return pushLog(s, { text: "Exit is locked. Defeat the goblin first.", kind: "danger" });
    }
    return pushLog({ ...s, phase: "victory" }, { text: "You escaped the floor. Victory!", kind: "ok" });
  }

  const dirs = ["up", "left", "down", "right"];
  for (const d of dirs) {
    const q = step(ppos, d);
    if (!inRangeForDisarm(s, q)) continue;
    const t = getTile(s.floor, q);
    if (t.kind !== "trap_blocking") continue;

    const dc = 12;
    const roll = s.rng.d20();
    const total = roll + s.actors.player.stats.strengthMod;
    if (total >= dc) {
      const nextFloor = setTile(s.floor, q, "floor");
      return pushLog(
        { ...s, floor: nextFloor },
        { text: `Disarm trap: d20=${roll} +${s.actors.player.stats.strengthMod} => ${total} vs DC ${dc}: SUCCESS`, kind: "ok" }
      );
    }
    return pushLog(s, { text: `Disarm trap: d20=${roll} +${s.actors.player.stats.strengthMod} => ${total} vs DC ${dc}: FAIL`, kind: "danger" });
  }

  return pushLog(s, { text: "Nothing to interact with.", kind: "info" });
}

function inRangeForDisarm(s, p) {
  if (!s.floor) return false;
  // Adjacent only; bounds check is inside tile access in this slice via walls perimeter,
  // but keep safe:
  return p.x >= 0 && p.y >= 0 && p.x < s.floor.width && p.y < s.floor.height;
}

function resolveEnemyTurn(s) {
  ensureInFloor(s);
  if (!isAlive(s.actors.enemy_1)) {
    return endSideTurn(s);
  }

  let next = s;
  const epos = next.positions.enemy_1;
  const ppos = next.positions.player;

  // If adjacent: attack.
  if (isAdjacent(epos, ppos)) {
    const attacker = next.actors.enemy_1;
    const defender = next.actors.player;
    const { result, defenderAfter } = basicMeleeAttack(next.rng, attacker, defender);
    next = { ...next, actors: { ...next.actors, player: defenderAfter }, turn: { ...next.turn, actionAvailable: false } };

    if (!result.hit) {
      next = pushLog(next, {
        text: `${result.attacker} attacks: d20=${result.roll} +${attacker.stats.attackBonus} => ${result.totalToHit} vs AC ${result.targetAc}: MISS`,
        kind: "info"
      });
    } else {
      next = pushLog(next, {
        text: `${result.attacker} attacks: d20=${result.roll} +${attacker.stats.attackBonus} => ${result.totalToHit} vs AC ${result.targetAc}: HIT`,
        kind: "danger"
      });
      next = pushLog(next, {
        text: `Damage: d8=${result.damageRoll} +${attacker.stats.strengthMod} => ${result.damageTotal}. ${result.defender} HP=${result.defenderHpAfter}.`,
        kind: "danger"
      });
    }

    if (!isAlive(next.actors.player)) {
      return pushLog({ ...next, phase: "defeat" }, { text: "You died. Defeat.", kind: "danger" });
    }
    return endSideTurn(next);
  }

  // Otherwise: local greedy step to reduce Manhattan distance (no global pathfinding).
  const priorities = ["up", "left", "down", "right"];
  const currentDist = manhattan(epos, ppos);
  for (let i = 0; i < next.turn.moveRemaining; i++) {
    const cur = next.positions.enemy_1;
    const distNow = manhattan(cur, ppos);
    if (distNow <= 1) break;

    let moved = false;
    for (const d of priorities) {
      const cand = step(cur, d);
      if (!isWalkable(next.floor, cand)) continue;
      if (isOccupied(next, cand)) continue;
      if (manhattan(cand, ppos) >= distNow) continue;

      next = {
        ...next,
        positions: { ...next.positions, enemy_1: cand },
        turn: { ...next.turn, moveRemaining: next.turn.moveRemaining - 1 }
      };
      moved = true;
      break;
    }
    if (!moved) break;
  }

  const newDist = manhattan(next.positions.enemy_1, ppos);
  if (newDist < currentDist) {
    next = pushLog(next, { text: "Goblin moves closer.", kind: "info" });
  } else {
    next = pushLog(next, { text: "Goblin hesitates.", kind: "info" });
  }

  return endSideTurn(next);
}


