// Copies the teacher's original <script> block, byte-for-byte, into src/teacher/fbd-original.js.
// The game runs this exact text unmodified; tests/content.test.mjs re-verifies the bytes.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const TEACHER_HTML = fileURLToPath(new URL('../Free+Body+Diagram+Practice.html', import.meta.url));
export const TEACHER_JS = fileURLToPath(new URL('../src/teacher/fbd-original.js', import.meta.url));

export function teacherScript(html) {
  const open = '<script>';
  const start = html.indexOf(open) + open.length;
  const end = html.lastIndexOf('</script>');
  if (start < open.length || end < start) throw new Error('teacher <script> block not found');
  return html.slice(start, end);
}

export const sha256 = s => createHash('sha256').update(s).digest('hex');

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const js = teacherScript(readFileSync(TEACHER_HTML, 'utf8'));
  writeFileSync(TEACHER_JS, js);
  console.log(`teacher script: ${js.length} chars, sha256 ${sha256(js).slice(0, 16)}`);
}
