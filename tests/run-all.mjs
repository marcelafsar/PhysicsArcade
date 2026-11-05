// Physics Arcade test suite — runs against the built offline file (dist/Physics_Arcade.html).
//   npm run build && npm test
// Writes tests/results.json and screenshots/test/*.png. Exit code 1 on any failure.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { TEACHER_HTML, TEACHER_JS, teacherScript, sha256 } from '../tools/extract-teacher.mjs';

const DIST = resolve('dist/Physics_Arcade.html');
const SHOTS = 'screenshots/test';
mkdirSync(SHOTS, { recursive: true });
const results = [];
let current = '';
const ok = (name, pass, detail = '') => { results.push({ group: current, name, pass: !!pass, detail: String(detail).slice(0, 400) }); console.log(`${pass ? '  ✓' : '  ✗'} ${name}${detail && !pass ? ' — ' + detail : detail ? ' (' + String(detail).slice(0, 120) + ')' : ''}`); };
const group = g => { current = g; console.log(`\n${g}`); };

/* ---------------- 1. content integrity (no browser) ---------------- */
group('1. Teacher content is untouched');
const origHtml = readFileSync(TEACHER_HTML, 'utf8');
const origJs = teacherScript(origHtml);
ok('src/teacher/fbd-original.js is byte-identical to the teacher script', readFileSync(TEACHER_JS, 'utf8') === origJs, `sha256 ${sha256(origJs).slice(0, 16)}`);
ok('built game embeds the teacher script byte-for-byte', existsSync(DIST) && readFileSync(DIST, 'utf8').includes(`<script id="teacher-engine">${origJs}</script>`));
const backup = 'backup/Free Body Diagram Practice.original.html';
ok('teacher original matches its backup copy', existsSync(backup) && readFileSync(backup, 'utf8') === origHtml);

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
async function open(url, viewport = { width: 1366, height: 768 }, opts = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: !!opts.touch, colorScheme: opts.dark ? 'dark' : 'light', reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.errors = []; page.failed = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('requestfailed', r => page.failed.push(r.url().slice(0, 80)));
  if (!opts.coach) await ctx.addInitScript(() => { try { localStorage.setItem('physics-arcade-coach-v1', '1'); } catch { /* blocked */ } });
  if (opts.offline) await ctx.route('**/*', r => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
  await page.goto(url);
  return page;
}
const gameUrl = pathToFileURL(DIST).href;
const ready = p => p.waitForFunction(() => document.body.classList.contains('booted'), null, { timeout: 30000 });
const snapshotFn = () => {
  const out = {};
  for (const l of LEVEL_IDS) out[l] = LEVELS[l].bank.map(s => JSON.parse(JSON.stringify(s, (k, v) => typeof v === 'function' ? 'fn:' + v.toString() : v)));
  return out;
};

/* data-level comparison: original page vs the running game */
const orig = await open(pathToFileURL(TEACHER_HTML).href);
const origSnap = await orig.evaluate(snapshotFn);
await orig.close();
const page = await open(gameUrl);
await ready(page);
const gameSnap = await page.evaluate(snapshotFn);
const counts = Object.values(gameSnap).map(b => b.length);
ok('scenario counts are 52 / 50 / 50 (152 total)', counts.join('/') === '52/50/50', counts.join('/'));
const diffs = [];
for (const l of Object.keys(origSnap)) origSnap[l].forEach((s, i) => { if (JSON.stringify(s) !== JSON.stringify(gameSnap[l][i])) diffs.push(`L${l}:${s.id}`); });
ok('every scenario (ids, text, givens, forces, answers, hints, explanations) equals the original at runtime', diffs.length === 0, diffs.join(', ') || '152 identical');
const ids = Object.values(gameSnap).flat().map(s => s.id);
ok('scenario ids are unique', new Set(ids).size === ids.length);

/* ---------------- 2. answer keys ---------------- */
group('2. Answer keys and grading');
const keys = await page.evaluate(() => {
  const bad = [], wrongAccepted = [];
  for (const l of LEVEL_IDS) for (const s of LEVELS[l].bank) {
    const prev = state.level; state.level = l;
    const k = new Set(solKeys(s)), sol = solution(s);
    if (!gradeIdentify(s, k).ok || !gradeDirections(s, sol, k).ok || !gradeAny(s, sol).ok) bad.push(s.id);
    // representative wrong answers must be rejected
    const missing = sol.slice(1);
    if (gradeAny(s, missing).ok) wrongAccepted.push(s.id + ':missing');
    const flipped = sol.map((a, i) => i === 0 ? { ...a, ang: (a.ang + 180) % 360 } : a);
    if (gradeAny(s, flipped).ok) wrongAccepted.push(s.id + ':flipped');
    const sized = sol.map((a, i) => i === 0 ? (a.val !== undefined ? { ...a, val: a.val * 1.25 + 1 } : { ...a, len: a.len + 2 }) : a);
    if (gradeAny(s, sized).ok) wrongAccepted.push(s.id + ':size');
    const extra = sol.concat([{ id: 9999, obj: 0, label: s.objects[0].forces.some(f => f.label === 'Fapp') ? 'Fsp' : 'Fapp', by: s.multi ? 'student' : null, ang: 45, len: 2, val: 5 }]);
    if (gradeAny(s, extra).ok) wrongAccepted.push(s.id + ':extra');
    const k2 = new Set(k); k2.delete([...k][0]);
    if (gradeIdentify(s, k2).ok) wrongAccepted.push(s.id + ':id-missing');
    state.level = prev;
  }
  return { bad, wrongAccepted, selftest: window.__bad, n: LEVEL_IDS.reduce((a, l) => a + LEVELS[l].bank.length, 0) };
});
ok(`all ${keys.n} correct answer keys pass all three graders`, keys.bad.length === 0, keys.bad.join(', ') || `${keys.n}/${keys.n}`);
ok("the engine's own self-test reports no failing keys", Array.isArray(keys.selftest) && keys.selftest.length === 0);
ok('wrong answers (missing, reversed, wrong size, extra force, unchecked force) are rejected for every scenario', keys.wrongAccepted.length === 0, keys.wrongAccepted.slice(0, 12).join(', ') || `${keys.n * 5} wrong answers rejected`);

/* ---------------- 3. menu & navigation ---------------- */
group('3. Menu, levels, settings');
ok('menu is the first screen; game hidden', await page.evaluate(() => !document.getElementById('menu').hidden && document.getElementById('game').hidden));
ok('three level tags, all enabled', await page.evaluate(() => [...document.querySelectorAll('.level-tag')].filter(b => !b.disabled).length) === 3);
for (const lv of [3, 1, 2]) {
  await page.evaluate(() => window.__arcade.showMenu());
  await page.click(`.level-tag[data-level="${lv}"]`);
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({ level: state.level, scLevel: sc.level, game: !document.getElementById('game').hidden, tab: document.querySelector('#tabs button.on')?.dataset.l }));
  ok(`Level ${lv} opens immediately from the menu`, st.game && st.level === lv && st.scLevel === lv && +st.tab === lv, JSON.stringify(st));
}
await page.click('#tabs button[data-l="3"]'); await page.waitForTimeout(300);
ok('switching levels with the in-game tabs works', await page.evaluate(() => state.level === 3 && sc.level === 3));
await page.click('#homeBtn'); await page.waitForTimeout(300);
await page.click('#continueBtn'); await page.waitForTimeout(400);
ok('Home → Continue resumes the same level', await page.evaluate(() => state.level === 3 && !document.getElementById('game').hidden));
const before = await page.evaluate(() => document.body.classList.contains('dark'));
await page.click('#darkToggle'); await page.waitForTimeout(150);
ok('theme toggle switches light/dark', await page.evaluate(b => document.body.classList.contains('dark') !== b, before));
await page.click('#darkToggle');
await page.click('#hudSettings'); await page.waitForTimeout(250);
ok('settings dialog opens from the game', await page.evaluate(() => !document.getElementById('settings').hidden));
const setChecks = await page.evaluate(async () => {
  const r = {}, click = id => document.getElementById(id).click();
  const p = window.__arcade.prefs;
  click('setSfx'); r.sfxOff = p.sfx === false; click('setSfx'); r.sfxOn = p.sfx === true;
  const v = document.getElementById('setSfxVol'); v.value = 30; v.dispatchEvent(new Event('input')); r.vol = p.sfxVol === 30;
  click('setMusic'); r.music = p.music === true; click('setMusic');
  click('setCine'); r.cine = p.cinematics === false; click('setCine');
  click('setLabels'); r.labels = p.motionLabels === false; click('setLabels');
  click('setReduce'); r.reduce = document.body.classList.contains('reduce-motion'); click('setReduce');
  click('setContrast'); r.contrast = document.body.classList.contains('high-contrast'); click('setContrast');
  click('setClassic'); await new Promise(z => setTimeout(z, 200)); r.classic = !document.body.classList.contains('art-pixi') && document.getElementById('sceneArt').childElementCount > 0; click('setClassic');
  await new Promise(z => setTimeout(z, 400)); r.pixiBack = document.body.classList.contains('art-pixi');
  document.querySelector('input[name=theme][value=dark]').click(); r.themeDark = document.body.classList.contains('dark');
  document.querySelector('input[name=theme][value=light]').click(); r.themeLight = !document.body.classList.contains('dark');
  return r;
});
for (const [k, v] of Object.entries(setChecks)) ok(`setting works: ${k}`, v);
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
ok('Escape closes settings', await page.evaluate(() => document.getElementById('settings').hidden));
ok('menu sound button toggles mute', await page.evaluate(() => { const p = window.__arcade.prefs; window.__arcade.showMenu(); document.getElementById('menuSound').click(); const a = p.sfx; document.getElementById('menuSound').click(); return a === false && p.sfx === true; }));

/* ---------------- 4. full play-through with real pointer input ---------------- */
group('4. Play-through: elevator arriving at the lobby (mouse)');
async function jump(p, v) {
  await p.evaluate(v => { window.__arcade.showGame(); const j = document.getElementById('jump'); j.value = v; j.dispatchEvent(new Event('change')); }, v);
  await p.waitForFunction(id => document.getElementById('stage').dataset.scene === id, v.split('|')[1], { timeout: 10000 });
  await p.waitForTimeout(300);
}
const toScreen = (p, x, y) => p.evaluate(([x, y]) => { const s = document.getElementById('scene'), pt = s.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [x, y]);
async function drag(p, from, to, touch) {
  const [ax, ay] = await toScreen(p, ...from), [bx, by] = await toScreen(p, ...to);
  if (touch) {
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ax, y: ay }] });
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: ax + (bx - ax) * i / 6, y: ay + (by - ay) * i / 6 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else { await p.mouse.move(ax, ay); await p.mouse.down(); await p.mouse.move(bx, by, { steps: 6 }); await p.mouse.up(); }
  await p.waitForTimeout(150);
}
async function playElevator(p, touch, tag) {
  await jump(p, '1|elev-down-slow');
  // a wrong first try: only gravity
  await p.click(`#checklist [data-k="0|Fg|"]`); await p.click('#submit'); await p.waitForTimeout(200);
  ok(`${tag}: an incomplete answer gets a hint, not a pass`, await p.evaluate(() => document.getElementById('feedback').classList.contains('bad') && document.getElementById('feedback').textContent.length > 30 && step === 1));
  await p.click(`#checklist [data-k="0|FN|"]`); await p.click("#submit"); await p.waitForTimeout(250);
  ok(`${tag}: step 1 accepted (identify)`, await p.evaluate(() => step === 2));
  const U = 24, c = [320, 250];
  await drag(p, c, [c[0], c[1] - 3 * U], touch);
  await p.click('#picker [data-k="0|FN|"]');
  await drag(p, c, [c[0], c[1] + 3 * U], touch);
  await p.click('#picker [data-k="0|Fg|"]');
  ok(`${tag}: two arrows drawn and labelled on the diagram`, await p.evaluate(() => arrows.length === 2 && arrows.every(a => a.label)), await p.evaluate(() => JSON.stringify(arrows.map(a => [a.label, a.ang, a.len]))));
  await p.click('#submit'); await p.waitForTimeout(250);
  ok(`${tag}: step 2 accepted (directions)`, await p.evaluate(() => step === 3));
  await drag(p, [c[0], c[1] - 3 * U], [c[0], c[1] - 6 * U], touch);
  await drag(p, [c[0], c[1] + 3 * U], [c[0], c[1] + 5 * U], touch);
  await p.click('#submit'); await p.waitForTimeout(300);
  ok(`${tag}: step 3 accepted — scenario solved`, await p.evaluate(() => phase === 'correct'), await p.evaluate(() => document.getElementById('feedback').textContent.slice(0, 120)));
  ok(`${tag}: green check stamp shown`, await p.evaluate(() => document.getElementById('stamp').classList.contains('go')));
  ok(`${tag}: the retry means it does not count toward mastery`, await p.evaluate(() => state.correct[1] === 0));
}
await playElevator(page, false, 'mouse');
await page.waitForFunction(() => document.body.classList.contains('cinematic'), null, { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(500);
ok('outcome animation starts after the correct answer and hides the arrow overlay', await page.evaluate(() => document.body.classList.contains('cinematic') && getComputedStyle(document.getElementById('arrows')).opacity === '0'));
const legend = await page.evaluate(() => document.getElementById('cineLegend').textContent.replace(/\s+/g, ' '));
ok('elevator arriving at the lobby: velocity DOWN, acceleration UP', /Velocity\s*down/i.test(legend) && /Acceleration\s*up/i.test(legend), legend);
await page.waitForTimeout(1200);
await page.locator('#stage').screenshot({ path: `${SHOTS}/elev-down-slow-motion.png` });
await page.click('#cineSlow'); ok('slow-motion toggles', await page.evaluate(() => document.getElementById('cineSlow').getAttribute('aria-pressed') === 'true'));
await page.click('#cineReplay'); await page.waitForTimeout(300); ok('replay restarts the animation', await page.evaluate(() => document.body.classList.contains('cinematic')));
await page.click('#cineSkip'); await page.waitForTimeout(600);
ok('"Show diagram" ends the animation and restores the arrows', await page.evaluate(() => !document.body.classList.contains('cinematic') && arrows.length === 2 && getComputedStyle(document.getElementById('arrows')).opacity === '1'));
ok('"Watch motion" replay button is offered afterwards', await page.evaluate(() => !document.getElementById('replayFab').hidden));
await page.click('#replayFab'); await page.waitForTimeout(250);
ok('"Watch motion" replays', await page.evaluate(() => document.body.classList.contains('cinematic')));
await page.click('#cineSkip');
const id0 = await page.evaluate(() => sc.id);
await page.click('#submit'); await page.waitForTimeout(500);
ok('"Next situation" loads a new situation', await page.evaluate(id => sc.id !== id && phase === 'draw' && step === 1, id0));

group('5. Elevator trio — motion vs. acceleration');
for (const [id, v, a] of [['elev-up-speed', 'up', 'up'], ['elev-down-slow', 'down', 'up'], ['elev-down-speed', 'down', 'down']]) {
  await jump(page, `1|${id}`);
  await page.evaluate(() => { document.getElementById('showSol').click(); globalThis.submit(); });
  await page.waitForFunction(() => document.body.classList.contains('cinematic'), null, { timeout: 6000 }).catch(() => {});
  const lg = await page.evaluate(() => document.getElementById('cineLegend').textContent.replace(/\s+/g, ' '));
  ok(`${id}: velocity ${v}, acceleration ${a}`, new RegExp(`Velocity\\s*${v}`, 'i').test(lg) && new RegExp(`Acceleration\\s*${a}`, 'i').test(lg), lg);
  await page.waitForTimeout(1700);
  await page.locator('#stage').screenshot({ path: `${SHOTS}/${id}-motion.png` });
  // the scroll direction of the shaft wall tells the viewer which way the car moves
  const scroll = await page.evaluate(() => { const c = window.__arcade.scene.current; return c.tile ? c.tile.tilePosition.y - c.tileBase : null; });
  ok(`${id}: building scrolls ${v === 'up' ? 'down' : 'up'} past the car (car moving ${v})`, scroll !== null && scroll * (v === 'up' ? 1 : -1) > 40, scroll?.toFixed?.(0));
  await page.click('#cineSkip');
}

/* ---------------- touch + keyboard ---------------- */
group('6. Touch and keyboard input');
const touchPage = await open(gameUrl, { width: 390, height: 844 }, { touch: true });
await ready(touchPage);
await playElevator(touchPage, true, 'touch');
ok('touch: no page errors', touchPage.errors.length === 0, touchPage.errors.join(' | '));
await touchPage.close();
await jump(page, '2|ramp-rest');
await page.evaluate(() => { for (const k of solKeys(sc)) document.querySelector(`#checklist [data-k="${k}"]`).click(); });
await page.click('#submit'); await page.waitForTimeout(200);
await page.waitForFunction(() => step === 2);
await page.evaluate(() => document.getElementById('stage').focus()); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(250);
ok('keyboard: arrow key draws an arrow and opens the label picker', await page.evaluate(() => arrows.length === 1 && getComputedStyle(document.getElementById('picker')).display === 'block'), await page.evaluate(() => JSON.stringify({ step, phase, n: arrows.length, active: document.activeElement?.id, status: document.getElementById('status').textContent, cls: document.body.className })));
await page.keyboard.press('Enter'); await page.waitForTimeout(150);
ok('keyboard: Enter on a picker choice labels the arrow (without submitting)', await page.evaluate(() => !!arrows[0]?.label && step === 2), await page.evaluate(() => arrows[0]?.label));
await page.evaluate(() => document.getElementById('stage').focus()); const a0 = await page.evaluate(() => arrows[0]?.ang);
await page.keyboard.press('KeyQ'); await page.keyboard.press('Shift+KeyQ');
ok('keyboard: Q / Shift+Q rotate by 1° / 5°', await page.evaluate(a => arrows[0]?.ang === (a + 6) % 360, a0), await page.evaluate(() => arrows[0]?.ang));
await page.keyboard.press('Delete');
ok('keyboard: Delete removes the selected arrow', await page.evaluate(() => arrows.length === 0));

/* first-run tutorial */
const cp = await open(gameUrl, { width: 1366, height: 768 }, { coach: true });
await ready(cp); await cp.click('.level-tag[data-level="1"]'); await cp.waitForTimeout(900);
ok('tutorial appears on first entry to the game', await cp.evaluate(() => !!document.querySelector('.coach')));
await cp.screenshot({ path: `${SHOTS}/tutorial.png` });
for (let k = 0; k < 4; k++) { await cp.click('.coach-next'); await cp.waitForTimeout(250); }
ok('tutorial can be stepped through and closes', await cp.evaluate(() => !document.querySelector('.coach')));
await cp.click('#hudSettings'); await cp.click('#setTutorial'); await cp.waitForTimeout(600);
ok('tutorial can be replayed from Settings', await cp.evaluate(() => !!document.querySelector('.coach')));
await cp.click('.coach-skip');
ok('tutorial: no page errors', cp.errors.length === 0, cp.errors.join(' | '));
await cp.close();

/* audio assets decode (Kenney OGG samples) */
await page.evaluate(() => window.__arcade.showMenu()); await page.click('#menuSound'); await page.click('#menuSound');
const decoded = await page.evaluate(async () => { await window.__arcade.Sound.ready(); return window.__arcade.Sound.loaded(); });
ok('Kenney sound samples decode in the browser', decoded >= 40, `${decoded} samples decoded`);

/* ---------------- 7. visuals across viewports & themes ---------------- */
group('7. Viewports, themes, rendering');
const VIEWS = [['desktop', 1366, 768], ['laptop', 1280, 720], ['tablet', 768, 1024], ['phone', 390, 844]];
for (const dark of [false, true]) for (const [name, w, h] of VIEWS) {
  const p = await open(gameUrl, { width: w, height: h }, { dark });
  await ready(p); await p.waitForTimeout(900);
  const tag = `${name}-${dark ? 'dark' : 'light'}`;
  await p.screenshot({ path: `${SHOTS}/menu-${tag}.png`, fullPage: true });
  const hs = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  for (const v of ['1|elev-down-slow', '2|skier', '3|ramp-pulley']) {
    await jump(p, v);
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${SHOTS}/game-${v.split('|')[1]}-${tag}.png`, fullPage: true });
  }
  const pixel = await p.evaluate(() => { const c = document.querySelector('#pixiHost canvas'); return !!c && c.width > 100 && document.body.classList.contains('art-pixi'); });
  const noScroll = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const clipped = await p.evaluate(() => [...document.querySelectorAll('button, h1, h2, .lt-name, .tag')].filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible').map(e => e.id || e.className).slice(0, 5));
  ok(`${tag}: renders the illustrated scene, no horizontal scroll (menu + game)`, pixel && hs && noScroll, `menu ${hs}, game ${noScroll}`);
  ok(`${tag}: no clipped buttons or headings`, clipped.length === 0, clipped.join(', '));
  ok(`${tag}: no console errors or failed requests`, p.errors.length === 0 && p.failed.length === 0, [...p.errors, ...p.failed].join(' | '));
  await p.close();
}

/* every scene builds without errors and without falling back to old art */
const fallbacks = await page.evaluate(async () => {
  window.__arcade.showGame();
  const out = [];
  for (const o of [...document.querySelectorAll('#jump option')]) {
    const j = document.getElementById('jump'); j.value = o.value; j.dispatchEvent(new Event('change'));
    for (let i = 0; i < 80 && document.getElementById('stage').dataset.scene !== o.value.split('|')[1]; i++) await new Promise(r => setTimeout(r, 50));
    const cur = window.__arcade.scene.current;
    if (!cur || cur.fallback || cur.sc?.id !== o.value.split('|')[1]) out.push(o.value);
  }
  return out;
});
ok('all 152 scenes compose with the new art (no fallback to the old drawings)', fallbacks.length === 0, fallbacks.join(', '));
ok('main page: no console errors during the whole run', page.errors.length === 0, page.errors.join(' | '));

/* ---------------- 8. offline ---------------- */
group('8. Offline single-file build');
const off = await open(gameUrl, { width: 1366, height: 768 }, { offline: true });
await ready(off);
await off.click('.level-tag[data-level="2"]'); await off.waitForTimeout(800);
ok('opens from a plain local file with all network access blocked', await off.evaluate(() => state.level === 2 && document.body.classList.contains('art-pixi')) && off.failed.length === 0, off.failed.join(' | '));
ok('offline: fonts loaded from the bundle', await off.evaluate(() => document.fonts.check('16px Lexend') && document.fonts.check('800 20px Bricolage')));
ok('offline: no console errors', off.errors.length === 0, off.errors.join(' | '));

/* ---------------- 9. performance ---------------- */
group('9. Performance (headless software rendering — a lower bound for real GPUs)');
await jump(off, '1|elev-up-speed');
await off.evaluate(() => { document.getElementById('showSol').click(); globalThis.submit(); });
await off.waitForFunction(() => document.body.classList.contains('cinematic'), null, { timeout: 6000 }).catch(() => {});
const fps = await off.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); }));
ok('outcome animation frame rate measured', fps > 20, `${fps.toFixed(1)} fps (software GL)`);
const build = await off.evaluate(async () => { const t0 = performance.now(); const j = document.getElementById('jump'); j.value = '3|ramp-pulley'; j.dispatchEvent(new Event('change')); while (document.getElementById('stage').dataset.scene !== 'ramp-pulley') await new Promise(r => setTimeout(r, 10)); return performance.now() - t0; });
ok('scene switch time', build < 1500, `${build.toFixed(0)} ms`);
await off.close();

await browser.close();
const failed = results.filter(r => !r.pass);
writeFileSync('tests/results.json', JSON.stringify({ when: new Date().toISOString(), total: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
