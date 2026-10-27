import assert from 'node:assert/strict';

/**
 * @typedef {(
 *   target: unknown,
 *   propertyKey: string|symbol,
 *   descriptor: PropertyDescriptor
 * ) => PropertyDescriptor|undefined} MethodDecorator
 */

/**
 * Simplified version of TypeScript's __decorate function.
 *
 * @param {MethodDecorator[]} decorators List of decorators, possibly returned
 *   from factories.
 * @param {unknown} target Object being decorated.
 * @param {string|symbol} key Method name.
 * @returns {PropertyDescriptor} Current property.
 */
export function decorateMethod(decorators, target, key) {
  let r = Object.getOwnPropertyDescriptor(target, key);
  assert(r);

  for (const d of decorators) {
    r = d(target, key, r) ?? r;
  }
  Object.defineProperty(target, key, r);
  return r;
}

/**
 * What the frequency, Kenneth?
 *
 * @param {number} fq How often this generator should be chosen.
 * @returns {MethodDecorator} Actual decorator.
 */
export function freq(fq) {
  return (

    /**
     * Frequency decorator.
     *
     * @type {MethodDecorator}
     */
    (target, key, _desc) => {
      /** @type {Record<string|symbol, {freq: number}>} */(target)[key]
        .freq = fq;
      return undefined;
    }
  );
}

/**
 * Decorator for boxed.
 * @type {MethodDecorator}
 */
export function boxed(target, key, _desc) {
  /** @type {Record<string|symbol, {boxed: boolean}>} */(target)[key]
    .boxed = true;
  return undefined;
}

/**
 * Decorator for jsonUnsafe.
 *
 * @type {MethodDecorator}
 */
export function jsonUnsafe(target, key, _desc) {
  /** @type {Record<string|symbol, {jsonUnsafe: boolean}>} */(target)[key]
    .jsonUnsafe = true;
  return undefined;
}

/**
 * Decorator for cborUnsafe.
 *
 * @type {MethodDecorator}
 */
export function cborUnsafe(target, key, _desc) {
  /** @type {Record<string|symbol, {cborUnsafe: boolean}>} */(target)[key]
    .cborUnsafe = true;
  return undefined;
}

/**
 * Weak decorator.
 * @type {MethodDecorator}
 */
export function weak(target, key, _desc) {
  /** @type {Record<string|symbol, {weak: boolean}>} */(target)[key]
    .weak = true;
  return undefined;
}
