export const compare = (a: number, b: number) => {
  if (a === b) return 0

  return a > b ? 1 : -1
}

/**
 * @returns whether the provided parameter is defined.
 */
export function isDefined<T>(arg: T | null | undefined): arg is T {
  return !isUndefinedOrNull(arg)
}

/**
 * @returns whether the provided parameter is undefined or null.
 */
export function isUndefinedOrNull(obj: unknown): obj is undefined | null {
  return isUndefined(obj) || obj === null
}

/**
 * @returns whether the provided parameter is undefined.
 */
export function isUndefined(obj: unknown): obj is undefined {
  return typeof obj === 'undefined'
}
