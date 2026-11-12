// Full-page screenshots of every route and its reference page, plus a rough pixel diff.
// Usage: pnpm build && pnpm start -p 3100 &   then   pnpm shots   (BASE, ONLY, SIZES optional)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE ?? 'http://localhost:3100';
const OUT = path.join(root, 'shots');
// V4 design reference (design-handoff-v4/reference). The earlier design is in design-handoff/.
const REF = path.join(root, process.env.REFDIR ?? 'design-handoff-v5/reference');

const PAGES = [
  ['home', '/', 'index.html'],
  ['services', '/services', 'services.html'],
  ['web-applications', '/services/web-applications', 'service-web.html'],
  ['mobile-apps', '/services/mobile-apps', 'service-mobile.html'],
  ['management-systems', '/services/management-systems', 'service-systems.html'],
  ['digital-marketing', '/services/digital-marketing', 'service-marketing.html'],
  ['tech-consulting-automation', '/services/tech-consulting-automation', 'service-consulting.html'],
  ['how-we-work', '/how-we-work', 'how-we-work.html'],
  ['about', '/about', 'about.html'],
  ['contact', '/contact', null],
  ['thank-you', '/thank-you', null],
];
const SIZES = (process.env.SIZES ?? '1440x900,390x844')
  .split(',')
  .map((s) => s.split('x').map(Number));
const only = process.env.ONLY?.split(',');

async function shoot(browser, url, file, [width, height]) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  // Overlays that exist only in the live site (not in the design reference): hide them so full-page shots compare cleanly.
  await page.addStyleTag({ content: '.upnext,.wafab{display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  // load lazy images
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await Promise.race([
      new Promise((r) => setTimeout(r, 4000)),
      Promise.all(
        [...document.images]
          .filter((i) => i.offsetParent !== null)
          .map((i) =>
            i.complete
              ? 1
              : new Promise((r) => {
                  i.onload = i.onerror = r;
                }),
          ),
      ),
    ]);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: file, fullPage: true });
  await ctx.close();
}

async function diff(a, b) {
  const [ia, ib] = await Promise.all([
    sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const w = Math.min(ia.info.width, ib.info.width),
    h = Math.min(ia.info.height, ib.info.height);
  let bad = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = (y * ia.info.width + x) * 4,
        q = (y * ib.info.width + x) * 4;
      if (
        Math.abs(ia.data[p] - ib.data[q]) +
          Math.abs(ia.data[p + 1] - ib.data[q + 1]) +
          Math.abs(ia.data[p + 2] - ib.data[q + 2]) >
        60
      )
        bad++;
    }
  return { pct: ((bad / (w * h)) * 100).toFixed(1), hSite: ia.info.height, hRef: ib.info.height };
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const [name, route, ref] of PAGES) {
  if (only && !only.includes(name)) continue;
  for (const size of SIZES) {
    const tag = `${name}-${size[0]}`;
    const siteFile = path.join(OUT, `site-${tag}.png`);
    await shoot(browser, BASE + route, siteFile, size);
    let line = `${tag.padEnd(36)} site h=?`;
    if (ref) {
      const refFile = path.join(OUT, `ref-${tag}.png`);
      await shoot(browser, pathToFileURL(path.join(REF, ref)).href, refFile, size);
      const d = await diff(siteFile, refFile);
      line = `${tag.padEnd(36)} site h=${d.hSite} ref h=${d.hRef}  differing px: ${d.pct}%`;
    }
    console.log(line);
  }
}
await browser.close();
