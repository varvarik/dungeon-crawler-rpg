export function isAlive(a) {
  return a.hp > 0;
}

export function clampHp(hp, maxHp) {
  return Math.max(0, Math.min(maxHp, hp));
}


