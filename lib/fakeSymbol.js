import util from 'node:util';

export class FakeSymbol {
  sym;
  /**
   * @param {string} name
   */
  constructor(name) {
    this.sym = Symbol.for(name);
  }

  valueOf() {
    return this.sym;
  }

  /**
   *
   * @param {number} _depth
   * @param {import('node:util').InspectOptions} opts
   * @param {typeof import('node:util').inspect} inspect
   * @returns
   */
  [util.inspect.custom](_depth, opts, inspect) {
    return `Symbol.for(${inspect(this.sym.description, opts)})`;
  }

  toString() {
    return `Symbol.for('${this.sym.description}')`;
  }
}
