import { clampHp } from "./actors.js";

export function rollInitiative(rng, speed) {
  const roll = rng.d20();
  return { roll, total: roll + speed };
}

export function basicMeleeAttack(rng, attacker, defender) {
  const roll = rng.d20();
  const totalToHit = roll + attacker.stats.attackBonus;
  const targetAc = defender.stats.ac;
  const hit = totalToHit >= targetAc;

  if (!hit) {
    return {
      result: {
        attacker: attacker.name,
        defender: defender.name,
        roll,
        totalToHit,
        targetAc,
        hit: false,
        defenderHpAfter: defender.hp
      },
      defenderAfter: defender
    };
  }

  const damageRoll = rng.d8(); // weapon die for the slice
  const damageTotal = Math.max(0, damageRoll + attacker.stats.strengthMod);
  const nextHp = clampHp(defender.hp - damageTotal, defender.stats.maxHp);
  const defenderAfter = { ...defender, hp: nextHp };

  return {
    result: {
      attacker: attacker.name,
      defender: defender.name,
      roll,
      totalToHit,
      targetAc,
      hit: true,
      damageRoll,
      damageTotal,
      defenderHpAfter: defenderAfter.hp
    },
    defenderAfter
  };
}


