/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const createdFunctions = new Map<string, (...args: unknown[]) => unknown>();

/**
 * Creates a function from a string.
 *
 * @internal
 */
export const createFunction = (
  functionValue: string
): ((...args: unknown[]) => unknown) => {
  let fn = createdFunctions.get(functionValue);
  if (fn) {
    return fn;
  }
  fn = new Function(`return ${functionValue}`)() as (
    ...args: unknown[]
  ) => unknown;
  createdFunctions.set(functionValue, fn);
  return fn;
};

/**
 * @internal
 */
export function stringifyFunction(fn: (...args: never) => unknown): string {
  let value;
  if (
    typeof fn === 'function' &&
    globalThis.navigator?.userAgent === 'Cloudflare-Workers'
  ) {
    // function is most likely bundled with wrangler,
    // which uses esbuild with keepNames enabled.
    // See: https://github.com/cloudflare/workers-sdk/issues/7107
    value = `((__name => (${fn}))(t => t))`;
  } else {
    value = fn.toString();
  }

  /**
   * We remove the check for the ability for dynamic javascript to be
   * serializable, because the Workers runtime does not allow dynamic
   * javascript to be executed, as a security precaution. In the
   * future, we can consider the serialization check in the back end
   * but before the message gets to the remote browser.
   */
  // original implementationn
  // try {
  //   new Function(`(${value})`);
  // } catch {
  //   // This means we might have a function shorthand (e.g. `test(){}`). Let's
  //   // try prefixing.
  //   let prefix = 'function ';
  //   if (value.startsWith('async ')) {
  //     prefix = `async ${prefix}`;
  //     value = value.substring('async '.length);
  //   }
  //   value = `${prefix}${value}`;
  //   try {
  //     new Function(`(${value})`);
  //   } catch {
  //     console.log('functions::::', value);
  //     // We tried hard to serialize, but there's a weird beast here.
  //     throw new Error('Passed function cannot be serialized!');
  //   }
  // }
  return value;
}

/**
 * Replaces `PLACEHOLDER`s with the given replacements.
 *
 * All replacements must be valid JS code.
 *
 * @example
 *
 * ```ts
 * interpolateFunction(() => PLACEHOLDER('test'), {test: 'void 0'});
 * // Equivalent to () => void 0
 * ```
 *
 * @internal
 */
export const interpolateFunction = <T extends (...args: never[]) => unknown>(
  fn: T,
  replacements: Record<string, string>
): T => {
  let value = stringifyFunction(fn);
  for (const [name, jsValue] of Object.entries(replacements)) {
    value = value.replace(
      new RegExp(`PLACEHOLDER\\(\\s*(?:'${name}'|"${name}")\\s*\\)`, 'g'),
      // Wrapping this ensures tersers that accidentally inline PLACEHOLDER calls
      // are still valid. Without, we may get calls like ()=>{...}() which is
      // not valid.
      `(${jsValue})`
    );
  }
  return createFunction(value) as unknown as T;
};

declare global {
  /**
   * Used for interpolation with {@link interpolateFunction}.
   *
   * @internal
   */
  function PLACEHOLDER<T>(name: string): T;
}
