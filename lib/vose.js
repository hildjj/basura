/**
 * Vose's Alias Method.
 *
 * @param {number[]} weights Weights of the the N choices.
 * @see https://www.keithschwarz.com/darts-dice-coins/
 * @see https://en.wikipedia.org/wiki/Alias_method
 */
export class Vose {
  #alias;
  #prob;
  #random;

  /**
   * Prepare the probability and alias tables.
   *
   * @param {number[]} weights Relative weights, per pick array item.  If
   *   undefined, `1` is the default.
   * @param {import('./random').Random} random Random source.
   */
  constructor(weights, random) {
    this.#random = random;

    // Vose is based on total probability === 1.
    let n = 0;
    const tot = weights.reduce((t, v) => {
      n++;
      v ??= 1;
      if (v < 0) {
        throw new Error(`All probabilities must be non-negative.  Got "${v}".`);
      }
      return t + v;
    }, 0);
    if (n !== weights.length) {
      // Sparse arrays skip their empty members, rather than mapping them
      // from undefined.
      throw new Error('Sparse array not allowed');
    }
    if (tot === 0) {
      throw new Error('Total probability of 0.');
    }

    const scaled = weights.map(p => (p ?? 1) * n / tot);

    /** @type {number[]} */
    this.#alias = new Array(n);

    /** @type {number[]} */
    this.#prob = new Array(n);

    /** @type {number[]} */
    const small = [];

    /** @type {number[]} */
    const large = [];

    scaled.forEach((pi, i) => {
      ((pi < 1) ? small : large).push(i);
    });

    while (small.length && large.length) {
      const l = small.shift();
      const g = large.shift();
      this.#prob[l] = scaled[l];
      this.#alias[l] = g;
      scaled[g] = (scaled[g] + scaled[l]) - 1;
      ((scaled[g] < 1) ? small : large).push(g);
    }

    large.forEach(g => {
      this.#prob[g] = 1;
    });

    // This is only possible due to numerical instability.
    small.forEach(l => {
      this.#prob[l] = 1;
    });
  }

  get _tables() {
    return [this.#prob, this.#alias];
  }

  /**
   * Pick a random position in the weighted array.
   *
   * @param {string} reason Reason for generation.
   * @returns {number} The *position*, not the item in the array.
   */
  pick(reason = 'unspecified') {
    const n = this.#prob.length;
    const i = this.#random.upto(n, `Vose.pick.die(${n}),${reason}`);
    const flip = this.#random.random(`Vose.pick.flip,${reason}`);
    if (flip < this.#prob[i]) {
      return i; // Heads
    }
    return this.#alias[i]; // Tails
  }
}
