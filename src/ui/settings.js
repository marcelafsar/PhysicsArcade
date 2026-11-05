/* Settings dialog — every control is live and persisted. */
import { prefs, setPref } from '../prefs.js';
import { Sound } from '../audio.js';

const $ = id => document.getElementById(id);
let lastFocus = null;

const BOOLS = { setSfx: 'sfx', setMusic: 'music', setCine: 'cinematics', setLabels: 'motionLabels', setClassic: 'classicArt', setContrast: 'contrast' };

export function installSettings({ onReset, isReduced }) {
  const modal = $('settings');
  const sync = () => {
    for (const [id, k] of Object.entries(BOOLS)) $(id).checked = !!prefs[k];
    $('setSfxVol').value = prefs.sfxVol; $('setMusicVol').value = prefs.musicVol;
    $('setReduce').checked = isReduced();
    modal.querySelectorAll('input[name=theme]').forEach(r => { r.checked = r.value === prefs.theme; });
    $('setSfxVol').disabled = !prefs.sfx; $('setMusicVol').disabled = !prefs.music;
  };
  for (const [id, k] of Object.entries(BOOLS)) $(id).addEventListener('change', e => { setPref(k, e.target.checked); Sound.play('toggle'); sync(); });
  $('setReduce').addEventListener('change', e => { setPref('reduceMotion', e.target.checked); Sound.play('toggle'); });
  $('setSfxVol').addEventListener('input', e => setPref('sfxVol', +e.target.value));
  $('setSfxVol').addEventListener('change', () => Sound.play('tap'));
  $('setMusicVol').addEventListener('input', e => setPref('musicVol', +e.target.value));
  modal.querySelectorAll('input[name=theme]').forEach(r => r.addEventListener('change', () => { setPref('theme', r.value); Sound.play('toggle'); }));
  $('setReset').addEventListener('click', () => {
    if (!confirm('Reset first-try progress for all three levels?')) return;
    onReset(); Sound.play('close');
  });
  const close = () => { modal.hidden = true; Sound.play('close'); lastFocus?.focus?.(); };
  $('settingsClose').onclick = close; $('settingsDone').onclick = close;
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {                                   // keep focus inside the dialog
      const f = [...modal.querySelectorAll('button, input:not([disabled])')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });
  return {
    open() { lastFocus = document.activeElement; sync(); modal.hidden = false; Sound.play('open'); $('settingsClose').focus(); },
    sync
  };
}
