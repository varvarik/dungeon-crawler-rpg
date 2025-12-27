export class Rng {
  constructor(seed) {
    this.state = seed >>> 0;
  }

  // Deterministic LCG: https://en.wikipedia.org/wiki/Linear_congruential_generator
  nextU32() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state;
  }

  intInclusive(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new Error(`Invalid range: [${min}, ${max}]`);
    }
    const span = max - min + 1;
    const u = this.nextU32();
    return min + (u % span);
  }

  d20() {
    return this.intInclusive(1, 20);
  }

  d6() {
    return this.intInclusive(1, 6);
  }

  d8() {
    return this.intInclusive(1, 8);
  }
}


