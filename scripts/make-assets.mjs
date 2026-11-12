// Generates favicon, app icons and the Open Graph image from the logo tile.
// Run: pnpm assets   (needs Playwright's Chromium: pnpm exec playwright install chromium)
import sharp from 'sharp';
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (f) => path.join(root, 'public', f);
const tile = path.join(root, 'public/logo/logo-tile-720.png');

// PNG icons (transparent rounded tile, as supplied)
for (const size of [192, 512]) {
  await sharp(tile)
    .resize(size, size)
    .png()
    .toFile(pub(`icon-${size}.png`));
}
// Apple touch icon: iOS fills transparency with black, so sit the tile on the page colour.
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#060A22' } })
  .composite([{ input: await sharp(tile).resize(150, 150).png().toBuffer(), gravity: 'centre' }])
  .png()
  .toFile(pub('apple-touch-icon.png'));

// favicon.ico: a single 48x48 PNG wrapped in an ICO container.
const png48 = await sharp(tile).resize(48, 48).png().toBuffer();
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(1, 4);
head[6] = 48;
head[7] = 48;
head.writeUInt16LE(1, 10);
head.writeUInt16LE(32, 12);
head.writeUInt32LE(png48.length, 14);
head.writeUInt32LE(22, 18);
await writeFile(pub('favicon.ico'), Buffer.concat([head, png48]));

// Open Graph image 1200x630
const b64 = async (p) => (await readFile(p)).toString('base64');
const jakarta = await b64(path.join(root, 'scripts/fonts/plus-jakarta-sans-latin.woff2'));
const mono = await b64(path.join(root, 'scripts/fonts/jetbrains-mono-latin.woff2'));
const logo = await b64(tile);
const html = `<!doctype html><html><head><style>
@font-face{font-family:J;font-weight:200 800;src:url(data:font/woff2;base64,${jakarta}) format('woff2')}
@font-face{font-family:M;font-weight:100 800;src:url(data:font/woff2;base64,${mono}) format('woff2')}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#060A22;position:relative;overflow:hidden;font-family:J,sans-serif;color:#EAF0FF}
.b{position:absolute;border-radius:50%;filter:blur(100px)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(130,160,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(130,160,255,.07) 1px,transparent 1px);background-size:60px 60px}
.wrap{position:absolute;inset:0;padding:70px 80px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:16px;font-weight:800;font-size:30px;letter-spacing:-.02em}
.brand img{width:64px;height:64px;border-radius:16px}
h1{margin:0;font-weight:800;font-size:96px;line-height:1.02;letter-spacing:-.038em;max-width:900px}
.g{background:linear-gradient(90deg,#6F96FF,#B08BFF 55%,#34DBF2);-webkit-background-clip:text;color:transparent}
.m{font:500 22px M,monospace;letter-spacing:.08em;text-transform:uppercase;color:#9DBAFF}
</style></head><body>
<div class="grid"></div>
<div class="b" style="width:560px;height:560px;right:-120px;top:-120px;background:#3B5BFF;opacity:.5"></div>
<div class="b" style="width:460px;height:460px;left:-180px;bottom:-200px;background:#7C4DFF;opacity:.35"></div>
<div class="wrap"><div class="brand"><img src="data:image/png;base64,${logo}">smph.tech</div>
<h1>We engineer <span class="g">growth</span> for your business.</h1>
<div class="m">Software, systems and marketing</div></div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: pub('og.png') });
await browser.close();
console.log('Wrote favicon.ico, icon-192/512.png, apple-touch-icon.png, og.png to public/');
