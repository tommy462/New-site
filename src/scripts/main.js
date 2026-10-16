import Lenis from 'lenis';
import { sunPosition, sunTimes, fmtTime, daylight } from '../lib/sun.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ── Smooth scroll ───────────────────────────────────────── */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.95 });
  window.__lenis = lenis;
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
export const scrollToEl = (el, offset = -80) => {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
};

/* ── Reveal system ───────────────────────────────────────── */
document.querySelectorAll('.draw').forEach((svg) => {
  svg.querySelectorAll('path, line, rect, polyline, circle, ellipse, polygon').forEach((s) => {
    if (s.hasAttribute('stroke-dasharray') || s.closest('[data-nodraw]')) return;
    try {
      const len = Math.ceil(s.getTotalLength());
      if (len > 0) { s.style.setProperty('--len', len); s.setAttribute('data-len', ''); }
    } catch (e) { /* non-rendered */ }
  });
});

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    if (e.target.hasAttribute('data-count')) countUp(e.target);
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('[data-reveal], [data-reveal-lines], .draw, [data-count], [data-inview]').forEach((el) => io.observe(el));

function countUp(el) {
  const to = +el.dataset.count;
  const dur = reduce ? 0 : 1600;
  const t0 = performance.now();
  const step = (t) => {
    const p = dur ? Math.min(1, (t - t0) / dur) : 1;
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))).toString();
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ── Header behaviour ────────────────────────────────────── */
const hdr = document.getElementById('hdr');
const darkZones = [...document.querySelectorAll('[data-header-dark]')];
let lastY = scrollY;
function onScroll() {
  const y = scrollY;
  hdr.classList.toggle('is-scrolled', y > 30);
  if (!root.classList.contains('menu-open')) hdr.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
  if (y < lastY - 2 || y < 400) hdr.classList.remove('is-hidden');
  root.classList.toggle('hdr-hidden', hdr.classList.contains('is-hidden'));
  lastY = y;
  const probe = 34;
  const dark = darkZones.some((z) => { if (z.dataset.headerDark === '0') return false; const r = z.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; });
  hdr.dataset.theme = dark ? 'dark' : 'light';
}
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
onScroll();

/* ── Live sun (header chip + site-wide light colour) ─────── */
function sunTone(alt) {
  // returns an rgb string for "the colour of daylight right now"
  const stops = [
    [-12, [120, 140, 190]], [-4, [214, 150, 150]], [2, [245, 168, 110]],
    [8, [246, 200, 140]], [20, [248, 224, 178]], [45, [252, 240, 214]],
  ];
  if (alt <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (alt <= stops[i][0]) {
      const [a0, c0] = stops[i - 1]; const [a1, c1] = stops[i];
      const t = (alt - a0) / (a1 - a0);
      return c0.map((v, k) => Math.round(v + (c1[k] - v) * t));
    }
  }
  return stops[stops.length - 1][1];
}
function updateSun() {
  const now = new Date();
  const pos = sunPosition(now);
  const times = sunTimes(now);
  const tone = sunTone(pos.altitudeDeg);
  root.style.setProperty('--sun', `rgb(${tone.join(',')})`);
  root.style.setProperty('--daylight', daylight(pos.altitudeDeg).toFixed(3));
  const t = document.getElementById('sunchip-time');
  const n = document.getElementById('sunchip-note');
  const dot = document.querySelector('.sunchip__dot');
  if (t) t.textContent = fmtTime(now);
  if (!n || !dot) return;
  const f = (now - times.sunrise) / (times.sunset - times.sunrise);
  if (f >= 0 && f <= 1) {
    const a = Math.PI * (1 - f);
    dot.setAttribute('cx', (22 + 20 * Math.cos(a)).toFixed(2));
    dot.setAttribute('cy', (21 - 20 * Math.sin(a)).toFixed(2));
    n.textContent = `Sunset ${fmtTime(times.sunset)}`;
  } else {
    const next = f < 0 ? times.sunrise : sunTimes(new Date(now.valueOf() + 864e5)).sunrise;
    dot.setAttribute('cx', f < 0 ? '3' : '41');
    dot.setAttribute('cy', '24');
    n.textContent = `Sunrise ${fmtTime(next)}`;
  }
}
updateSun();
setInterval(updateSun, 30000);

/* ── Menu (vertical sliding sash) ───────────────────────── */
const menu = document.getElementById('menu');
const menuBtn = document.getElementById('menu-btn');
function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  root.classList.toggle('menu-open', open);
  document.querySelectorAll('main, footer, .fcta, .skip-link, #concept-pill').forEach((el) => { el.inert = open; });
  const mt = document.getElementById('menu-txt'); if (mt) mt.textContent = open ? 'Close' : 'Menu';
  menuBtn.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Menu';
  if (open) {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    lenis?.stop();
    setTimeout(() => menu.querySelector('a')?.focus({ preventScroll: true }), 400);
  } else {
    menu.classList.remove('is-open');
    lenis?.start();
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 900);
  }
}
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
  const n = document.getElementById('concept-note');
  if (n && !n.hidden) { n.hidden = true; const p = document.getElementById('concept-pill'); p.setAttribute('aria-expanded', 'false'); p.focus(); }
});

/* ── Concept note ───────────────────────────────────────── */
const pill = document.getElementById('concept-pill');
const note = document.getElementById('concept-note');
pill?.addEventListener('click', () => {
  const open = pill.getAttribute('aria-expanded') !== 'true';
  pill.setAttribute('aria-expanded', String(open));
  note.hidden = !open;
});
document.addEventListener('click', (e) => {
  if (!note || note.hidden) return;
  if (!note.contains(e.target) && !pill.contains(e.target)) { note.hidden = true; pill.setAttribute('aria-expanded', 'false'); }
});

/* ── Bifold page transitions ─────────────────────────────── */
const fold = document.getElementById('fold');
const panels = fold ? [...fold.querySelectorAll('.fold__p')] : [];
const N = panels.length;
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function setFold(t) {
  const W = innerWidth;
  const w = W / N;
  const th = t * (Math.PI / 2) * 0.995;
  const c = Math.cos(th), s = Math.sin(th);
  panels.forEach((p, i) => {
    const dx = W - (N - i) * w * c - i * w;
    const z = i % 2 ? -w * s : 0;
    const rot = i % 2 ? -th : th;
    p.style.left = `${i * w}px`;
    p.style.transform = `translate3d(${dx}px,0,${z}px) rotateY(${rot}rad)`;
    p.style.setProperty('--shade', i % 2 ? `rgba(255,255,255,${(s * 0.06).toFixed(3)})` : `rgba(0,0,0,${(s * 0.45).toFixed(3)})`);
  });
}
function animateFold(from, to, dur) {
  return new Promise((res) => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      setFold(from + (to - from) * easeIO(p));
      if (p < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}

if (root.classList.contains('fold-in') && fold) {
  try { sessionStorage.removeItem('cw-fold'); } catch (e) {}
  setFold(0);
  const lbl = document.getElementById('fold-label');
  fold.classList.add('is-active');
  setTimeout(() => {
    animateFold(0, 1, 1050).then(() => {
      fold.classList.remove('is-active', 'show-label');
      root.classList.remove('fold-in');
    });
  }, 90);
  if (lbl) lbl.textContent = '';
}

addEventListener('pageshow', (e) => {
  if (e.persisted) { root.classList.remove('fold-in'); fold?.classList.remove('is-active', 'show-label'); }
});

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  if (a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (url.pathname === location.pathname && url.hash) {
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (el) { e.preventDefault(); if (root.classList.contains('menu-open')) setMenu(false); scrollToEl(el); history.replaceState(null, '', url.hash); if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    return;
  }
  if (url.pathname === location.pathname && !url.hash) { if (root.classList.contains('menu-open')) { e.preventDefault(); setMenu(false); } return; }
  if (reduce || !fold) return;
  e.preventDefault();
  const label = a.dataset.foldLabel || a.querySelector('.menu__lbl')?.textContent || a.textContent.trim().split('\n')[0].slice(0, 32);
  document.getElementById('fold-label').textContent = label;
  fold.classList.add('is-active');
  setFold(1);
  animateFold(1, 0, 760).then(() => {
    fold.classList.add('show-label');
    try { sessionStorage.setItem('cw-fold', '1'); } catch (err) {}
    setTimeout(() => { location.href = url.href; }, 160);
  });
});

/* ── Magnetic hover for primary buttons (pointer devices) ── */
if (matchMedia('(hover: hover)').matches && !reduce) {
  document.querySelectorAll('[data-magnet]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ── Keyboard model for tablists and radiogroups (arrow keys + roving tabindex) ── */
const ITEM = '[role=tab], [role=radio]';
const isOn = (el) => el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-checked') === 'true';
function rove(group) {
  const items = [...group.querySelectorAll(ITEM)].filter((i) => i.closest('[role=tablist], [role=radiogroup]') === group);
  if (!items.length) return;
  const on = items.find(isOn) || items[0];
  items.forEach((i) => i.setAttribute('tabindex', i === on ? '0' : '-1'));
}
document.querySelectorAll('[role=tablist], [role=radiogroup]').forEach(rove);
document.addEventListener('click', (e) => { const g = e.target.closest?.('[role=tablist], [role=radiogroup]'); if (g) requestAnimationFrame(() => rove(g)); });
document.addEventListener('focusin', (e) => { const g = e.target.closest?.('[role=tablist], [role=radiogroup]'); if (g && !g.querySelector('[tabindex="0"]')) rove(g); });
document.addEventListener('keydown', (e) => {
  const item = e.target.closest?.(ITEM); if (!item) return;
  const g = item.closest('[role=tablist], [role=radiogroup]'); if (!g) return;
  const items = [...g.querySelectorAll(ITEM)].filter((i) => i.closest('[role=tablist], [role=radiogroup]') === g);
  const i = items.indexOf(item);
  let n = -1;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % items.length;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + items.length) % items.length;
  else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = items.length - 1;
  if (n < 0) return;
  e.preventDefault();
  items[n].focus(); items[n].click();
});
// keep the auto-hiding header visible while it has keyboard focus
hdr?.addEventListener('focusin', () => { hdr.classList.remove('is-hidden'); root.classList.remove('hdr-hidden'); });
