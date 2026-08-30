import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const dir = process.argv[2];
const icon = readFileSync(`${dir}/assets/brand/icon.svg`);
const mark = readFileSync(`${dir}/assets/brand/mark.svg`);

// The Android adaptive-icon foreground must stay inside the 66% safe zone, so
// the mark is scaled down and centred on a transparent canvas.
async function padded(svg, size, scale, out) {
  const inner = await sharp(svg).resize(Math.round(size * scale)).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: inner, gravity: 'centre' }])
    .png()
    .toFile(out);
}

const monochrome = readFileSync(`${dir}/assets/brand/mark-mono.svg`);

await sharp(icon).resize(1024, 1024).png().toFile(`${dir}/assets/icon.png`);
await sharp(icon).resize(48, 48).png().toFile(`${dir}/assets/favicon.png`);
await padded(mark, 1024, 0.62, `${dir}/assets/android-icon-foreground.png`);
await padded(monochrome, 1024, 0.62, `${dir}/assets/android-icon-monochrome.png`);
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#4A2461' } })
  .png()
  .toFile(`${dir}/assets/android-icon-background.png`);
await padded(mark, 512, 0.7, `${dir}/assets/splash-icon.png`);

console.log('rendered');
