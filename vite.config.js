import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TEACHER = fileURLToPath(new URL('./src/teacher/fbd-original.js', import.meta.url));

// Inlines the teacher's original engine as a classic <script>, byte-for-byte, where
// index.html says <!--TEACHER_SCRIPT-->. It must stay a classic script: its top-level
// `function` and `let` bindings are the shared global state the arcade layer hooks into.
function teacherScript() {
  return {
    name: 'teacher-script',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const js = readFileSync(TEACHER, 'utf8');
        return html.replace('<!--TEACHER_SCRIPT-->', () => `<script id="teacher-engine">${js}</script>`);
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.replace(/\\/g, '/').endsWith('src/teacher/fbd-original.js')) server.ws.send({ type: 'full-reload' });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [teacherScript(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4000
  },
  server: { port: 5173, strictPort: true }
});
