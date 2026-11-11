// Side-by-side crop: reference on the left, site on the right. Usage: node scripts/sbs.mjs <name> <width> <y> <height> [out]
import sharp from 'sharp';
const [name, w, y, h, out] = process.argv.slice(2);
const crop = async (f) => {
  const m = await sharp(f).metadata();
  const top = Math.min(Number(y), Math.max(0, m.height - 10));
  const height = Math.min(Number(h), m.height - top);
  return sharp(f)
    .extract({ left: 0, top, width: m.width, height })
    .png()
    .toBuffer({ resolveWithObject: true });
};
const a = await crop(`shots/ref-${name}-${w}.png`);
const b = await crop(`shots/site-${name}-${w}.png`);
const H = Math.max(a.info.height, b.info.height);
await sharp({
  create: {
    width: a.info.width + b.info.width + 20,
    height: H,
    channels: 4,
    background: '#ff00ff',
  },
})
  .composite([
    { input: a.data, left: 0, top: 0 },
    { input: b.data, left: a.info.width + 20, top: 0 },
  ])
  .png()
  .toFile(out ?? `shots/sbs-${name}-${w}-${y}.png`);
console.log(out ?? `shots/sbs-${name}-${w}-${y}.png`);
