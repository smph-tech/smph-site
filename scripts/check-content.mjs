// Content rules check. Run after `pnpm build`.
//  - banned words in source and built HTML
//  - every [placeholder] shown on any page is listed in CONFIRM.md
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = async (dir, out = []) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
};
let failed = 0;
const fail = (m) => {
  failed++;
  console.log('FAIL ', m);
};

const htmlFiles = (await walk(path.join(root, '.next/server/app'))).filter((f) =>
  f.endsWith('.html'),
);
const srcFiles = [...(await walk(path.join(root, 'src'))), path.join(root, 'content.json')];
const BANNED = [
  /\bfounders?\b/i,
  /four friends/i,
  /case stud/i,
  /portfolio/i,
  /\bour work\b(?!\s*(?:before|$))/i,
];
const stripTags = (h) =>
  h
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, '\u0001');

for (const f of [...htmlFiles, ...srcFiles]) {
  const t = await readFile(f, 'utf8');
  for (const re of BANNED)
    if (re.test(f.endsWith('.html') ? stripTags(t) : t)) {
      // "Where we share our work" (About) is the one allowed use of the phrase.
      if (re.source.includes('our work') && /Where we share our work/i.test(t)) continue;
      fail(`${path.relative(root, f)} matches ${re}`);
    }
}
// nav / link text must not be Work, Projects, Portfolio
for (const f of htmlFiles) {
  const t = await readFile(f, 'utf8');
  for (const m of t.matchAll(/<a [^>]*>([^<]*)<\/a>/g))
    if (/^\s*(work|projects?|portfolio|case studies)\s*$/i.test(m[1]))
      fail(`${path.basename(f)} has a "${m[1]}" link`);
  if (/href="[^"]*(\/work|\/projects?|\/portfolio|\/case-stud)/i.test(t))
    fail(`${path.basename(f)} links to a work/projects page`);
  if (/href="[^"]*\.html/.test(t)) fail(`${path.basename(f)} links to a .html file`);
}
console.log(failed ? '' : 'PASS  no banned content, no work/projects links, no .html links');

// placeholders
const found = new Map();
for (const f of htmlFiles) {
  const text = stripTags(await readFile(f, 'utf8')).replace(/&amp;/g, '&');
  for (const m of text.matchAll(/\[[^\]\u0001]{2,120}\]/g)) {
    const key = m[0];
    if (!found.has(key)) found.set(key, new Set());
    found
      .get(key)
      .add(path.relative(path.join(root, '.next/server/app'), f).replace(/\.html$/, '') || 'index');
  }
}
const confirm = await readFile(path.join(root, 'CONFIRM.md'), 'utf8').catch(() => '');
let missing = 0;
for (const [ph, pages] of [...found].sort()) {
  const covered = confirm.includes(ph);
  if (!covered) {
    missing++;
    fail(`CONFIRM.md is missing ${ph}  (on: ${[...pages].join(', ')})`);
  }
}
console.log(
  `${missing ? 'FAIL ' : 'PASS '} ${found.size} distinct placeholders found in built pages; ${missing} missing from CONFIRM.md`,
);
process.exit(failed ? 1 : 0);
