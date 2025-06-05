import util from 'node:util';

export class FakeSymbol {
  sym;
  constructor(name) {
    this.sym = Symbol.for(name);
  }

  valueOf() {
    return this.sym;
  }

  [util.inspect.custom](_depth, opts, inspect) {
    return `Symbol.for(${inspect(this.sym.description, opts)})`;
  }

  toString() {
    return `Symbol.for('${this.sym.description}')`;
  }
}
