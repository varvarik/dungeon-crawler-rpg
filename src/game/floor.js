import { isWalkableTile } from "./tiles.js";

export function idx(width, p) {
  return p.y * width + p.x;
}

export function inBounds(f, p) {
  return p.x >= 0 && p.y >= 0 && p.x < f.width && p.y < f.height;
}

export function getTile(f, p) {
  return f.tiles[idx(f.width, p)];
}

export function setTile(f, p, kind) {
  const i = idx(f.width, p);
  const next = f.tiles.slice();
  next[i] = { kind };
  return { ...f, tiles: next };
}

export function isWalkable(f, p) {
  if (!inBounds(f, p)) return false;
  return isWalkableTile(getTile(f, p));
}

export function makeFixedFloor8x8() {
  const width = 8;
  const height = 8;
  const tiles = Array.from({ length: width * height }, () => ({
    kind: "floor"
  }));

  const entrance = { x: 1, y: 1 };
  const exit = { x: 6, y: 6 };

  const set = (p, kind) => {
    tiles[idx(width, p)] = { kind };
  };

  // Perimeter walls
  for (let x = 0; x < width; x++) {
    set({ x, y: 0 }, "wall");
    set({ x, y: height - 1 }, "wall");
  }
  for (let y = 0; y < height; y++) {
    set({ x: 0, y }, "wall");
    set({ x: width - 1, y }, "wall");
  }

  // Internal walls to force a small detour
  set({ x: 3, y: 1 }, "wall");
  set({ x: 3, y: 2 }, "wall");
  set({ x: 3, y: 3 }, "wall");
  set({ x: 4, y: 3 }, "wall");

  // Blocking trap as a "gate"
  set({ x: 2, y: 4 }, "trap_blocking");

  // One bonus tile
  set({ x: 5, y: 2 }, "bonus");

  set(entrance, "entrance");
  set(exit, "exit");

  return {
    width,
    height,
    tiles,
    entrance,
    exit
  };
}


