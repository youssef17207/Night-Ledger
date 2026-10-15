import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadSavedTheme } from './utils/ledger';

loadSavedTheme();

try {
  if (localStorage.getItem('night-ledger-inverted') === '1') document.documentElement.setAttribute('data-inverted', '');
} catch {
  /* storage blocked */
}

createRoot(document.getElementById('root')!).render(<App />);

// Give boxed buttons an inverted hover. Filled buttons flip via CSS filter (data-boxed); outlined
// ones have no fill to flip, so they swap to text-colour background / backdrop-colour text instead.
// Text-only buttons get the same swap, with a box-shadow halo so it reads as a pill without moving layout.
const clear = (c: string) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
document.addEventListener('mouseover', (e) => {
  const btn = (e.target as Element).closest?.('button') as HTMLButtonElement | null;
  if (!btn || btn.hasAttribute('data-boxed') || btn.hasAttribute('data-outlined') || btn.hasAttribute('data-text')) return;
  const cs = getComputedStyle(btn);
  if (!clear(cs.backgroundColor)) return void btn.setAttribute('data-boxed', '');
  const outlined = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && !clear(cs.borderTopColor);
  let el: HTMLElement | null = btn.parentElement;
  let backdrop = '#15121a';
  while (el) {
    const bg = getComputedStyle(el).backgroundColor;
    if (!clear(bg)) { backdrop = bg; break; }
    el = el.parentElement;
  }
  btn.style.setProperty('--hv-bg', cs.color);
  btn.style.setProperty('--hv-fg', backdrop);
  btn.setAttribute(outlined ? 'data-outlined' : 'data-text', '');
});
