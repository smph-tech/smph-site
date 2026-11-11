// Compare section heights between each site route and its reference page.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE ?? 'http://localhost:3100';
const W = Number(process.env.W ?? 1440);
const pages = [
  ['/', 'index.html'],
  ['/services', 'services.html'],
  ['/services/web-applications', 'service-web-applications.html'],
  ['/how-we-work', 'how-we-work.html'],
  ['/about', 'about.html'],
];
const b = await chromium.launch();
const heights = async (url) => {
  const p = await b.newPage({ viewport: { width: W, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(url);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const r = await p.evaluate(() =>
    [
      ...document.querySelectorAll(
        '.pg > section, .pg > div > section, .pg main > section, .pg > .mq, .pg main > .mq, footer.ft',
      ),
    ].map((e) => Math.round(e.getBoundingClientRect().height)),
  );
  await p.close();
  return r;
};
for (const [route, ref] of pages) {
  const s = await heights(BASE + route),
    r = await heights(pathToFileURL(path.join(root, 'design-handoff/reference', ref)).href);
  console.log(route.padEnd(30), 'site', s.join(','), '\n'.padEnd(31), 'ref ', r.join(','));
}
await b.close();
