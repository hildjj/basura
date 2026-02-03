/* eslint-disable no-invalid-this */
import util from 'node:util';

class Foo {
  bar;
  baz;

  constructor(bar, baz) {
    this.bar = bar;
    this.baz = baz;
  }
}

/** @import {BasuraGenerator} from '../../lib/index.js' */
/**
 * Generate a Foo.
 *
 * @type {BasuraGenerator}
 */
export default function generate_Foo(depth = 0) {
  if (depth > this.opts.depth) {
    return null;
  }

  const f = new Foo(this.generate(depth + 1), this.generate(depth + 1));
  if (this.opts.output) {
    f[util.inspect.custom] =
      (_d, opts, inspect) => `new Foo(${inspect(f.bar, opts)}, ${inspect(f.baz, opts)})`;
  }
  return f;
}
generate_Foo.freq = 10; // Much more likely to get Foo.
generate_Foo.jsonUnsafe = true;
generate_Foo.cborUnsafe = true;
generate_Foo.weak = true; // Can be used as a key in WeakMaps, etc.
