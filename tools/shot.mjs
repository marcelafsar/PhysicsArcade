// Quick screenshot helper: node tools/shot.mjs <url-or-file> <out.png> [width] [height] [--dark] [--eval "js"] [--wait ms]
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , target, out, w = '1366', h = '768', ...rest] = process.argv;
const flag = n => rest.includes(n);
const opt = n => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : null; };
const url = /^(https?|file):/.test(target) ? target : pathToFileURL(resolve(target)).href;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, colorScheme: flag('--dark') ? 'dark' : 'light' });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url);
await page.waitForTimeout(+(opt('--wait') || 600));
if (opt('--eval')) { console.log(await page.evaluate(opt('--eval'))); await page.waitForTimeout(+(opt('--after') || 800)); }
await page.screenshot({ path: out, fullPage: flag('--full') });
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
