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
export type MethodDecorator = (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor | undefined;
