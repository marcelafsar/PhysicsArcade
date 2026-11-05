// After `vite build`: verify the single-file bundle carries the teacher engine byte-for-byte,
// has no external runtime URLs, and copy it to dist/Physics_Arcade.html.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { TEACHER_HTML, teacherScript } from './extract-teacher.mjs';

const html = readFileSync('dist/index.html', 'utf8');
const original = teacherScript(readFileSync(TEACHER_HTML, 'utf8'));
const open = '<script id="teacher-engine">';
const i = html.indexOf(open), j = html.indexOf('</script>', i);
if (i < 0 || html.slice(i + open.length, j) !== original) { console.error('✗ teacher engine in dist differs from the original'); process.exit(1); }
const external = [...html.matchAll(/(?:src|href)=["'](https?:)?\/\/[^"']+/g)].map(m => m[0]);
if (external.length) { console.error('✗ external references:', external); process.exit(1); }
writeFileSync('dist/Physics_Arcade.html', html);
console.log(`✓ dist/Physics_Arcade.html  ${(statSync('dist/Physics_Arcade.html').size / 1024 / 1024).toFixed(2)} MB — teacher engine byte-identical, no external URLs`);
