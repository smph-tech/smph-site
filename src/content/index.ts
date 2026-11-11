import raw from '../../content.json';
import { TOKEN_MAP } from './site';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function fill<T extends Json>(value: T): T {
  if (typeof value === 'string') {
    let out: string = value;
    for (const [token, replacement] of Object.entries(TOKEN_MAP)) {
      out = out.split(token).join(replacement);
    }
    return out as T;
  }
  if (Array.isArray(value)) return value.map((v) => fill(v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v)])) as T;
  }
  return value;
}

/** All site copy, with SITE placeholders applied. Edit content.json to change copy. */
export const content = fill(raw as Json) as typeof raw;
export type Content = typeof content;
