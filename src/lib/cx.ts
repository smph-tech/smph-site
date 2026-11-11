/** Joins class names, skipping anything falsy. Plain strings, so no formatter can touch spacing. */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');
