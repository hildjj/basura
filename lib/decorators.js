/**
 * @typedef {(
 *   target: any,
 *   propertyKey: string|symbol,
 *   descriptor: PropertyDescriptor
 * ) => PropertyDescriptor|undefined} MethodDecorator
 */

/**
 * Simplified version of TypeScript's __decorate function.
 *
 * @param {MethodDecorator[]} decorators List of decorators, possibly returned
 *   from factories.
 * @param {any} target Object being decorated.
 * @param {string|symbol} key Method name.
 * @returns {PropertyDescriptor} Current property.
 */
export function decorateMethod(decorators, target, key) {
  let r = Object.getOwnPropertyDescriptor(target, key);

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
     * @param {any} target Target object.
     * @param {string|symbol} key Method name.
     * @param {PropertyDescriptor} _desc Property description.
     * @returns {undefined}
     */
    (target, key, _desc) => {
      target[key].freq = fq;
    });
}

/**
 * Boxed decorator.
 *
 * @param {any} target Target object.
 * @param {string|symbol} key Method name.
 * @param {PropertyDescriptor} _desc Property description.
 * @returns {undefined}
 */
export function boxed(target, key, _desc) {
  target[key].boxed = true;
}

/**
 * Decorator for jsonUnsafe.
 *
 * @param {any} target Target object.
 * @param {string|symbol} key Method name.
 * @param {PropertyDescriptor} _desc Property description.
 * @returns {undefined}
 */
export function jsonUnsafe(target, key, _desc) {
  target[key].jsonUnsafe = true;
}

/**
 * Decorator for cborUnsafe.
 *
 * @param {any} target Target object.
 * @param {string|symbol} key Method name.
 * @param {PropertyDescriptor} _desc Property description.
 * @returns {undefined}
 */
export function cborUnsafe(target, key, _desc) {
  target[key].cborUnsafe = true;
}

/**
 * Decorator for generators that can be used as weak keys.
 *
 * @param {any} target Target object.
 * @param {string|symbol} key Method name.
 * @param {PropertyDescriptor} _desc Property description.
 * @returns {undefined}
 */
export function weak(target, key, _desc) {
  target[key].weak = true;
}
