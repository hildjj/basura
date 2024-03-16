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
export function decorateMethod(decorators: MethodDecorator[], target: any, key: string | symbol): PropertyDescriptor;
/**
 * What the frequency, Kenneth?
 *
 * @param {number} fq How often this generator should be chosen.
 * @returns {MethodDecorator} Actual decorator.
 */
export function freq(fq: number): MethodDecorator;
/**
 * Boxed decorator.
 *
 * @param {any} target Target object.
 * @param {string|symbol} key Method name.
 * @param {PropertyDescriptor} _desc Property description.
 * @returns {undefined}
 */
export function boxed(target: any, key: string | symbol, _desc: PropertyDescriptor): undefined;
/**
 * Decorator for jsonUnsafe.
 *
 * @param {any} target Target object.
 * @param {string|symbol} key Method name.
 * @param {PropertyDescriptor} _desc Property description.
 * @returns {undefined}
 */
export function jsonUnsafe(target: any, key: string | symbol, _desc: PropertyDescriptor): undefined;
/**
 * Decorator for cborUnsafe.
 *
 * @param {any} target Target object.
 * @param {string|symbol} key Method name.
 * @param {PropertyDescriptor} _desc Property description.
 * @returns {undefined}
 */
export function cborUnsafe(target: any, key: string | symbol, _desc: PropertyDescriptor): undefined;
/**
 * Decorator for generators that can be used as weak keys.
 *
 * @param {any} target Target object.
 * @param {string|symbol} key Method name.
 * @param {PropertyDescriptor} _desc Property description.
 * @returns {undefined}
 */
export function weak(target: any, key: string | symbol, _desc: PropertyDescriptor): undefined;
export type MethodDecorator = (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor | undefined;
