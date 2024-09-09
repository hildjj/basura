import {Buffer} from 'node:buffer';
import {Random} from '../../lib/random.js';
import {Vose} from '../../lib/vose.js';
import assert from 'node:assert';
import util from 'node:util';

/**
 * Run "Random" backwards to inject data into a faux "random" number generator.
 * This "random" source can then be used to have Random generate known data
 * for testing.
 */
export class Modnar {
  /** @type {[Buffer, string][]} */
  #record = [];
  #freqs = new WeakMap();
  #spareGauss = null;
  #realRandom = null;

  get source() {
    return this.#playback.bind(this);
  }

  get isDone() {
    if (this.#record.length !== 0) {
      throw new Error(this.toString());
    }
    return true;
  }

  get #random() {
    if (!this.#realRandom) {
      // Lazy, only used for gauss.
      this.#realRandom = new Random();
    }
    return this.#realRandom;
  }

  drop(reason) {
    if (this.#record.length === 0) {
      throw new Error("Can't drop from empty");
    }
    const [_buf, r] = this.#record.shift();
    assert.equal(reason, r);
  }

  #playback(num, reason = 'unspecified') {
    if (!this.#record.length) {
      throw new Error(`Out of playback data (${num}): "${reason}"`);
    }
    const [buf, origReason] = this.#record.shift();
    if (buf.length !== num) {
      const r = (reason === origReason) ?
        `"${reason}"` :
        `"${reason}" != "${origReason}"`;
      throw new Error(`Expected ${num} bytes, got ${buf.length}.  (${r})`);
    }
    if (reason !== origReason) {
      throw new Error(
        `Invalid reason "${reason}", expected "${origReason}" (${num} bytes).`
      );
    }
    return buf;
  }

  bytes(buf, reason = 'unspecified') {
    this.#record.push([buf, reason]);
  }

  uInt32(i, reason = 'unspecified') {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(i);
    this.bytes(b, `uInt32,${reason}`);
  }

  upto(i, size, reason = 'unspecified') {
    if (size !== 0) {
      this.uInt32(i, `upto(${size}),${reason}`);
    }
  }

  uBigInt(n, _bytes, reason = 'unspecified') {
    assert(n >= 0n);
    let str = n.toString(16);
    if (str.length % 2 !== 0) {
      str = `0${str}`;
    }
    const buf = Buffer.from(str, 'hex');
    this.bytes(buf, `uBigInt,${reason}`);
  }

  random(n, reason = 'unspecified') {
    if (n < 0 || n >= 1) {
      throw new Error(`Invalid range: ${n}`);
    }
    const buf = Buffer.alloc(8);
    new DataView(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength
    ).setFloat64(0, 1 + n, true);
    this.bytes(buf, `random,${reason}`);
  }

  // Run this in the forward direction, but keep track of the intermediate
  // values.
  gauss(mean, stdDev, reason = 'unspecified') {
    if (this.#spareGauss != null) {
      const ret = mean + (stdDev * this.#spareGauss);
      this.#spareGauss = null;
      return ret;
    }
    let v1 = 0;
    let v2 = 0;
    let r1 = 0;
    let r2 = 0;
    let s = 0;
    const r = this.#random;
    do {
      r1 = r.random(reason);
      r2 = r.random(reason);
      v1 = (2 * r1) - 1;
      v2 = (2 * r2) - 1;
      s = (v1 * v1) + (v2 * v2);
    } while (s >= 1);
    if (s === 0) {
      return mean;
    }
    this.random(r1, reason);
    this.random(r2, reason);
    s = Math.sqrt(-2.0 * Math.log(s) / s);
    this.#spareGauss = v2 * s;
    return mean + (stdDev * v1 * s);
  }

  pick(m, ary, reason = 'unspecified') {
    const i = ary.indexOf(m);
    if (i === -1) {
      throw new Error(`not found: ${m} in ${ary}`, {ary, m, reason});
    }
    const weights = ary[Random.FREQS];
    if (weights) {
      let freqs = this.#freqs.get(ary);
      if (!freqs) {
        freqs = new Vose(weights, this);
        this.#freqs.set(ary, freqs);
      }
      // Reverse the Vose.  If i is in the alias table, coin was tails and
      // that side came up on the die.  If not, we got heads on die roll of i.
      const [_prob, alias] = freqs._tables;
      const a = alias.indexOf(i);
      if (a === -1) {
        this.upto(i, ary.length, `Vose.pick.die(${ary.length}),${reason}`);
        this.random(0, `Vose.pick.flip,${reason}`);
      } else {
        this.upto(a, ary.length, `Vose.pick.die(${ary.length}),${reason}`);
        this.random(1 - Number.EPSILON, `Vose.pick.flip,${reason}`);
      }
      return;
    }
    this.upto(i, ary.length, `pick(${ary.length}),${reason}`);
  }

  bool(tf, reason = 'unspecified') {
    this.upto(tf, 2, `bool,${reason}`);
  }

  some(found, ary, reason = 'unspecified') {
    // Won't work for arrays/strings with repeated items
    if (typeof ary === 'string') {
      ary = [...ary];
    }
    if (typeof found === 'string') {
      found = [...found];
    }
    ary.forEach(c => this.bool(found.includes(c), `some,${reason}`));
  }

  toString() {
    return `Modnar pending ${util.inspect(this.#record)}`;
  }
}
