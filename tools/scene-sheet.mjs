// Renders every scenario's stage and builds contact sheets for visual review.
// node tools/scene-sheet.mjs <baseUrl> <outDir> [--ids a,b,c] [--level n] [--dark] [--w 900 --h 620]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [, , base = 'http://localhost:5173/', out = 'screenshots/dev/sheets', ...rest] = process.argv;
const opt = n => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : null; };
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +(opt('--w') || 1280), height: +(opt('--h') || 860) }, colorScheme: rest.includes('--dark') ? 'dark' : 'light' });
await page.addInitScript(() => { try { localStorage.setItem('physics-arcade-coach-v1', '1'); } catch { /* blocked */ } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
await page.goto(base + '#play1');
await page.waitForFunction(() => window.__arcade && document.body.classList.contains('booted'));
await page.waitForTimeout(800);
let ids = await page.evaluate(() => [...document.querySelectorAll('#jump option')].map(o => o.value));
if (opt('--ids')) { const want = opt('--ids').split(','); ids = ids.filter(v => want.includes(v.split('|')[1])); }
if (opt('--level')) ids = ids.filter(v => v.startsWith(opt('--level') + '|'));
const files = [];
for (const v of ids) {
  const before = errors.length;
  await page.evaluate(v => { const j = document.getElementById('jump'); j.value = v; j.dispatchEvent(new Event('change')); }, v);
  await page.waitForFunction(v => document.getElementById('stage').dataset.scene === v.split('|')[1], v, { timeout: 8000 }).catch(() => errors.push('timeout ' + v));
  await page.waitForTimeout(450);
  const f = `${out}/${v.replace('|', '_')}.png`;
  await page.locator('#stage').screenshot({ path: f });
  files.push(f);
  if (errors.length > before) console.log(v, errors.slice(before).join(' | ').slice(0, 300));
}
await browser.close();
// contact sheets of 12
execFileSync('python', ['tools/contact.py', out, ...files], { stdio: 'inherit' });
console.log(`rendered ${files.length} scenes, ${errors.length} console messages`);
