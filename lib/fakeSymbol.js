import util from 'node:util';

/**
 * @import {InspectOptions} from 'node:util'
 */

/**
 * Symbol-like class that always interns with Symbol.for.
 */
export class FakeSymbol {
  sym;

  /**
   * Create.
   *
   * @param {string} name Symbol name.
   */
  constructor(name) {
    this.sym = Symbol.for(name);
  }

  /**
   * Cast to the actual symbol.
   *
   * @returns {Symbol} The symbol.
   */
  valueOf() {
    return this.sym;
  }

  /**
   * Node-specific conversion to string.
   *
   * @param {number} _depth Depth of inspection.
   * @param {InspectOptions} opts Options.
   * @param {typeof util.inspect} inspect Inspect function.
   * @returns {string} Formatted.
   */
  [util.inspect.custom](_depth, opts, inspect) {
    return `Symbol.for(${inspect(this.sym.description, opts)})`;
  }

  toString() {
    return `Symbol.for('${this.sym.description}')`;
  }
}
