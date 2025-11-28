/**
 * Mathematical constants and utility functions with floating-point safety
 */

/**
 * Epsilon for floating-point comparisons
 * Used to handle floating-point precision errors
 */
export const EPSILON = 1e-10;

/**
 * Epsilon squared - for squared distance comparisons
 * More efficient than taking square root for distance checks
 */
export const EPSILON_SQ = EPSILON * EPSILON;

/**
 * Check if two numbers are approximately equal within epsilon tolerance
 */
export function approxEqual(a: number, b: number, epsilon = EPSILON): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if a number is approximately zero
 */
export function approxZero(value: number, epsilon = EPSILON): boolean {
  return Math.abs(value) < epsilon;
}
