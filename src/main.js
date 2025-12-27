import {
  attack,
  canAttack,
  canInteract,
  canPlayerAct,
  endTurn,
  interact,
  makeInitialState,
  startRunAsWarrior,
  tryMovePlayer
} from "./game/game.js";
import { getTile } from "./game/floor.js";
import { isAlive } from "./game/actors.js";
import { manhattan } from "./game/types.js";

const app = document.querySelector("#app");
if (!app) throw new Error("Missing #app");

let state = makeInitialState();

function setState(next) {
  state = next;
  render();
}

function tileChar(p) {
  if (state.phase !== "in_floor" || !state.floor) return "?";
  if (isAlive(state.actors.player) && manhattan(state.positions.player, p) === 0) return "@";
  if (isAlive(state.actors.enemy_1) && manhattan(state.positions.enemy_1, p) === 0) return "g";
  const t = getTile(state.floor, p);
  switch (t.kind) {
    case "wall":
      return "#";
    case "floor":
      return ".";
    case "entrance":
      return "S";
    case "exit":
      return "X";
    case "trap_blocking":
      return "T";
    case "bonus":
      return "+";
  }
}

function tileClass(p) {
  if (state.phase !== "in_floor" || !state.floor) return "cell";
  const t = getTile(state.floor, p);
  const base = ["cell"];
  if (t.kind === "wall") base.push("wall");
  if (t.kind === "trap_blocking") base.push("trap");
  if (t.kind === "bonus") base.push("bonus");
  if (t.kind === "exit") base.push("exit");
  return base.join(" ");
}

function adjacentDir(from, to) {
  if (to.x === from.x && to.y === from.y - 1) return "up";
  if (to.x === from.x && to.y === from.y + 1) return "down";
  if (to.x === from.x - 1 && to.y === from.y) return "left";
  if (to.x === from.x + 1 && to.y === from.y) return "right";
  return null;
}

function onKeyDown(e) {
  if (state.phase !== "in_floor") return;
  if (!canPlayerAct(state)) return;

  let dir = null;
  if (e.key === "ArrowUp") dir = "up";
  if (e.key === "ArrowDown") dir = "down";
  if (e.key === "ArrowLeft") dir = "left";
  if (e.key === "ArrowRight") dir = "right";
  if (dir) {
    e.preventDefault();
    setState(tryMovePlayer(state, dir));
    return;
  }

  if (e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
    setState(endTurn(state));
    return;
  }

  if (e.key.toLowerCase() === "a") {
    e.preventDefault();
    setState(attack(state));
    return;
  }

  if (e.key.toLowerCase() === "e") {
    e.preventDefault();
    setState(interact(state));
    return;
  }
}

window.addEventListener("keydown", onKeyDown);

function renderMenu() {
  const root = document.createElement("div");
  root.className = "panel menu";
  root.innerHTML = `
    <div class="title">
      <h1>Dungeon Crawler RPG — Vertical Slice</h1>
      <div class="muted">Seed: <span id="seed"></span></div>
    </div>
    <h2>Choose a class</h2>
    <div class="classList" id="classList"></div>
    <div class="muted" style="margin-top:10px">
      Controls (in game): Arrow keys = move, A = attack, E = interact, Space = end turn.
    </div>
  `;

  const seedEl = root.querySelector("#seed");
  if (seedEl) seedEl.textContent = String(state.seed);

  const list = root.querySelector("#classList");
  if (!list) return root;

  const mk = (name, desc, enabled, onPick) => {
    const card = document.createElement("div");
    card.className = "classCard";
    const btn = document.createElement("button");
    btn.textContent = enabled ? "Play" : "Not in slice";
    btn.disabled = !enabled;
    if (enabled && onPick) btn.addEventListener("click", onPick);
    card.innerHTML = `<div><strong>${name}</strong><div class="muted">${desc}</div></div>`;
    card.appendChild(btn);
    return card;
  };

  list.appendChild(
    mk("Warrior", "Melee fighter. Uses Strength. (Playable in this slice.)", true, () => {
      setState(startRunAsWarrior(state));
    })
  );
  list.appendChild(mk("Mage", "Spells and control. (Not implemented in this slice.)", false));
  list.appendChild(mk("Priest", "Healing and buffs. (Not implemented in this slice.)", false));

  return root;
}

function renderGame() {
  const root = document.createElement("div");
  root.className = "layout";

  const left = document.createElement("div");
  left.className = "panel";

  const right = document.createElement("div");
  right.className = "panel";

  left.innerHTML = `
    <div class="title">
      <h1>Floor 1 (8×8)</h1>
      <div class="muted">Legend: @ you, g enemy, # wall, T trap, + bonus, S entrance, X exit</div>
    </div>
    <div class="grid" id="grid" aria-label="Dungeon grid"></div>
  `;

  const hud = document.createElement("div");
  const log = document.createElement("div");
  log.className = "log";

  const canAct = canPlayerAct(state);
  const attackEnabled = canAttack(state);
  const interactEnabled = canInteract(state);

  const p = state.actors.player;
  const e = state.actors.enemy_1;

  const status =
    state.phase === "victory"
      ? "Victory"
      : state.phase === "defeat"
        ? "Defeat"
        : canAct
          ? "Your turn"
          : "Enemy turn";

  hud.innerHTML = `
    <div class="title">
      <h1>Status: ${status}</h1>
      <div class="muted">Round: ${state.turn?.round ?? "-"}</div>
    </div>
    <div class="hudRow">
      <div class="kv"><div class="k">Warrior HP</div><div class="v">${p.hp}/${p.stats.maxHp}</div></div>
      <div class="kv"><div class="k">Warrior AC</div><div class="v">${p.stats.ac}</div></div>
      <div class="kv"><div class="k">Move left</div><div class="v">${state.turn?.side === "player" ? state.turn.moveRemaining : "-"}</div></div>
      <div class="kv"><div class="k">Action</div><div class="v">${state.turn?.side === "player" && state.turn.actionAvailable ? "Ready" : "-"}</div></div>
      <div class="kv"><div class="k">Goblin HP</div><div class="v">${isAlive(e) ? `${e.hp}/${e.stats.maxHp}` : "DEAD"}</div></div>
      <div class="kv"><div class="k">Goblin AC</div><div class="v">${e.stats.ac}</div></div>
    </div>
    <div class="buttons">
      <button id="btnAttack" ${!attackEnabled ? "disabled" : ""}>Attack (A)</button>
      <button id="btnInteract" ${!interactEnabled ? "disabled" : ""}>Interact (E)</button>
      <button id="btnEnd" ${!canAct ? "disabled" : ""}>End Turn (Space)</button>
      <button id="btnRestart">Restart</button>
    </div>
    <div class="muted">
      Objective: defeat the goblin, then stand on X and Interact to escape.
    </div>
  `;

  const btnAttack = hud.querySelector("#btnAttack");
  btnAttack?.addEventListener("click", () => setState(attack(state)));

  const btnInteract = hud.querySelector("#btnInteract");
  btnInteract?.addEventListener("click", () => setState(interact(state)));

  const btnEnd = hud.querySelector("#btnEnd");
  btnEnd?.addEventListener("click", () => setState(endTurn(state)));

  const btnRestart = hud.querySelector("#btnRestart");
  btnRestart?.addEventListener("click", () => setState(makeInitialState()));

  for (const entry of state.log) {
    const pEl = document.createElement("p");
    pEl.className = `logLine ${entry.kind === "ok" ? "ok" : entry.kind === "danger" ? "danger" : ""}`;
    pEl.textContent = entry.text;
    log.appendChild(pEl);
  }

  const grid = left.querySelector("#grid");
  if (grid && state.floor) {
    grid.innerHTML = "";
    for (let y = 0; y < state.floor.height; y++) {
      for (let x = 0; x < state.floor.width; x++) {
        const pnt = { x, y };
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = tileClass(pnt);
        cell.textContent = tileChar(pnt);
        cell.title = `(${x},${y})`;
        cell.addEventListener("click", () => {
          if (!canPlayerAct(state)) return;
          const dir = adjacentDir(state.positions.player, pnt);
          if (!dir) return;
          setState(tryMovePlayer(state, dir));
        });
        grid.appendChild(cell);
      }
    }
  }

  right.appendChild(hud);
  right.appendChild(log);

  root.appendChild(left);
  root.appendChild(right);
  return root;
}

function renderEndScreen() {
  const root = document.createElement("div");
  root.className = "panel";
  const title = state.phase === "victory" ? "Victory" : "Defeat";
  root.innerHTML = `
    <div class="title">
      <h1>${title}</h1>
      <div class="muted">Seed: ${state.seed}</div>
    </div>
    <div class="muted">Restart to play again.</div>
    <div style="margin-top:12px">
      <button id="btnRestart">Restart</button>
    </div>
  `;
  root.querySelector("#btnRestart")?.addEventListener("click", () => setState(makeInitialState()));
  return root;
}

function render() {
  app.innerHTML = "";
  if (state.phase === "menu") {
    app.appendChild(renderMenu());
    return;
  }
  if (state.phase === "victory" || state.phase === "defeat") {
    app.appendChild(renderEndScreen());
    return;
  }
  app.appendChild(renderGame());
}

render();


