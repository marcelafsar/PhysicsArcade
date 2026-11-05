// Solve a scenario with its own answer key and capture the outcome animation at several moments.
// node tools/cine-shot.mjs <baseUrl> <outDir> <level|id> [more level|id ...]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [, , base, out, ...ids] = process.argv;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(base + '#play1');
await page.waitForFunction(() => document.body.classList.contains('booted'));
for (const v of ids) {
  await page.evaluate(v => { const j = document.getElementById('jump'); j.value = v; j.dispatchEvent(new Event('change')); }, v);
  await page.waitForFunction(v => document.getElementById('stage').dataset.scene === v.split('|')[1], v);
  await page.waitForTimeout(500);
  await page.evaluate(() => { document.getElementById('showSol').click(); globalThis.submit(); });
  const name = v.replace('|', '_');
  await page.waitForTimeout(450); await page.locator('#stage').screenshot({ path: `${out}/${name}_0stamp.png` });
  await page.waitForFunction(() => document.body.classList.contains('cinematic'), null, { timeout: 5000 }).catch(() => errors.push('no cinematic ' + v));
  for (const [t, tag] of [[1100, 'a'], [1500, 'b'], [1600, 'c']]) { await page.waitForTimeout(t); await page.locator('#stage').screenshot({ path: `${out}/${name}_${tag}.png` }); }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/${name}_after.png` });
}
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
