export const joinTypes = {
  inner: 'INNER',
  left: 'LEFT',
  left_outer: 'LEFT OUTER',
  right: 'RIGHT',
  right_outer: 'RIGHT OUTER',
  full: 'FULL',
  full_outer: 'FULL OUTER',
  cross: 'CROSS'
};

export const isIndex = /^\d+$/;
export const backSlashes = /\\/g;
export const doubleQuotes = /"/g;

/**
 * Escapes backslashes in a string by 
 * replacing them with double backslashes.
 */
export function escapeBackSlashes(value: string) {
  return value.replace(backSlashes, '\\\\');
};

/**
 * Escapes double quotes in a string by 
 * replacing them with backslash-double quote.
 */
export function escapeDoubleQuotes(value: string) {
  return value.replace(doubleQuotes, '\\"');
};

/**
 * Escapes backslashes and double quotes 
 * in a string to make it safe for JSON.
 */
export function safeJsonValue(value: string) {
  return escapeDoubleQuotes(escapeBackSlashes(value));
};

/**
 * Returns true if the two objects are the same
 */
export function jsonCompare(from: any, to: any) {
  return JSON.stringify(from) === JSON.stringify(to);
}