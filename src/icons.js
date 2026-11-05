/* Kenney "Game Icons" (CC0) — white PNG glyphs used as CSS masks so they inherit
   the theme's text colour. Each icon becomes a .ic-<name> class. */
const files = import.meta.glob('../assets/vendor/kenney/game-icons/*.png', { eager: true, query: '?url', import: 'default' });

export function installIcons() {
  const rules = Object.entries(files).map(([path, url]) => {
    const name = path.split('/').pop().replace('.png', '');
    return `.ic-${name}{--ic:url("${url}")}`;
  });
  const style = document.createElement('style');
  style.id = 'kenney-icons';
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}

export const icon = name => `<i class="ic ic-${name}" aria-hidden="true"></i>`;
