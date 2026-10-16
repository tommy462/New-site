// "How it opens" — a CSS 3D explorer. Every sash and leaf is hinged where the
// real product is hinged, so customers can see exactly how each type operates.
// Viewed from outside the house: +z is towards the viewer (outward).

const DEG = Math.PI / 180;

const MODELS = {
  casement: () => ({
    W: 320, H: 360, frame: 'upvc',
    lights: [
      { x: 0, y: 0, w: 160, h: 110, k: 'top-out' },
      { x: 0, y: 110, w: 160, h: 250, k: 'fixed' },
      { x: 160, y: 0, w: 160, h: 360, k: 'side-r-out' },
    ],
  }),
  flush: () => ({
    W: 320, H: 360, frame: 'upvc', flush: true,
    lights: [
      { x: 0, y: 0, w: 160, h: 360, k: 'side-l-out' },
      { x: 160, y: 0, w: 160, h: 360, k: 'side-r-out' },
    ],
  }),
  tiltturn: () => ({ W: 230, H: 380, frame: 'upvc', lights: [{ x: 0, y: 0, w: 230, h: 380, k: 'tt' }] }),
  sash: () => ({
    W: 220, H: 400, frame: 'upvc', bars: true,
    lights: [
      { x: 0, y: 0, w: 220, h: 200, k: 'sash-top' },
      { x: 0, y: 200, w: 220, h: 200, k: 'sash-bottom' },
    ],
  }),
  bay: () => ({ bay: [-45, 0, 45], unitW: 170, H: 320, frame: 'upvc', lightK: 'top-out' }),
  bow: () => ({ bay: [-30, -15, 0, 15, 30], unitW: 110, H: 320, frame: 'upvc', lightK: 'top-out' }),
  alu: () => ({
    W: 330, H: 360, frame: 'alu', slim: true,
    lights: [
      { x: 0, y: 0, w: 165, h: 360, k: 'fixed' },
      { x: 165, y: 0, w: 165, h: 360, k: 'side-r-out' },
    ],
  }),
  composite: () => ({ W: 190, H: 420, frame: 'upvc', door: true, lights: [{ x: 0, y: 0, w: 190, h: 420, k: 'door-l-in', leaf: 'composite' }] }),
  residential: () => ({ W: 190, H: 420, frame: 'upvc', door: true, lights: [{ x: 0, y: 0, w: 190, h: 420, k: 'door-l-in', leaf: 'vista' }] }),
  french: () => ({
    W: 300, H: 420, frame: 'upvc', door: true,
    lights: [
      { x: 0, y: 0, w: 150, h: 420, k: 'door-l', leaf: 'glazed' },
      { x: 150, y: 0, w: 150, h: 420, k: 'door-r', leaf: 'glazed' },
    ],
  }),
  bifold: () => ({ W: 480, H: 420, frame: 'alu', door: true, bifold: 4 }),
  sliding: () => ({
    W: 420, H: 420, frame: 'upvc', door: true,
    lights: [
      { x: 0, y: 0, w: 210, h: 420, k: 'fixed', leaf: 'glazed' },
      { x: 210, y: 0, w: 210, h: 420, k: 'slide', leaf: 'glazed' },
    ],
  }),
  alupatio: () => ({
    W: 480, H: 420, frame: 'alu', door: true, slim: true,
    lights: [
      { x: 0, y: 0, w: 240, h: 420, k: 'fixed', leaf: 'glazed' },
      { x: 240, y: 0, w: 240, h: 420, k: 'slide', leaf: 'glazed' },
    ],
  }),
};

const el = (cls, parent, style = {}) => {
  const d = document.createElement('div');
  d.className = cls;
  Object.assign(d.style, style);
  parent?.appendChild(d);
  return d;
};

function buildLight(parent, L, m) {
  const f = m.slim ? 7 : 13;
  const s = el(`ox__sash ox__sash--${m.frame}${L.leaf ? ` ox__leaf--${L.leaf}` : ''}`, parent, {
    left: `${L.x}px`, top: `${L.y}px`, width: `${L.w}px`, height: `${L.h}px`, borderWidth: `${f}px`,
  });
  s.dataset.k = L.k;
  if (L.leaf === 'composite') {
    el('ox__panel', s, { left: '18%', top: '6%', width: '64%', height: '22%' }).classList.add('ox__glass');
    el('ox__panel', s, { left: '14%', top: '36%', width: '32%', height: '56%' });
    el('ox__panel', s, { left: '54%', top: '36%', width: '32%', height: '56%' });
  } else if (L.leaf === 'vista') {
    el('ox__panel ox__glass', s, { left: '14%', top: '6%', width: '72%', height: '44%' });
    el('ox__panel', s, { left: '14%', top: '56%', width: '72%', height: '36%' });
  } else {
    el('ox__glass ox__glass--fill', s);
  }
  if (m.bars && L.k.startsWith('sash')) {
    el('ox__bar', s, { left: '50%', top: 0, bottom: 0, width: '5px', marginLeft: '-2.5px' });
    el('ox__bar', s, { top: '50%', left: 0, right: 0, height: '5px', marginTop: '-2.5px' });
  }
  if (!['fixed', 'sash-top', 'sash-bottom'].includes(L.k)) {
    const h = el('ox__handle', s);
    const right = ['side-l-out', 'door-l-in', 'door-l', 'tt'].includes(L.k);
    if (L.k === 'slide') { h.style.left = '6px'; h.style.top = '46%'; h.classList.add('ox__handle--v'); }
    else if (L.k === 'top-out') { h.style.left = '46%'; h.style.bottom = '3px'; h.classList.add('ox__handle--h'); }
    else if (right) { h.style.right = '3px'; h.style.top = m.door ? '52%' : '46%'; }
    else { h.style.left = '3px'; h.style.top = m.door ? '52%' : '46%'; }
  }
  return s;
}

function buildUnit(parent, m, W, H) {
  const u = el('ox__unit', parent, { width: `${W}px`, height: `${H}px` });
  const ff = m.slim ? 10 : 18;
  el(`ox__frame ox__frame--${m.frame}`, u, { inset: `-${ff}px`, borderWidth: `${ff}px` });
  return u;
}

export function createExplorer(stage, { onChange } = {}) {
  const world = el('ox__world', stage);
  const model = el('ox__model', world);
  let type = null, o = 0, mode = 'a', ry = -24, rx = 6, anim = null;
  let sashes = [], bifold = null, unitW = 0, unitH = 0;

  function build(t) {
    type = t; model.innerHTML = ''; sashes = []; bifold = null;
    const m = MODELS[t]();
    const D = 46; // wall depth
    if (m.bay) {
      const n = m.bay.length, w = m.unitW, H = m.H;
      unitW = n * w * 0.9; unitH = H;
      model.style.width = `${unitW}px`; model.style.height = `${H}px`;
      el('ox__wallback', model, { left: '-900px', right: '-900px', top: '-700px', bottom: '-700px', transform: 'translateZ(-150px)' });
      // positions along a polyline / arc projecting from the house wall
      let x = 0, z = 0; const pts = [];
      const angles = m.bay.map((a) => a * DEG);
      angles.forEach((a) => { pts.push({ x, z, a }); x += w * Math.cos(a); z += -w * Math.sin(a); });
      const span = x, z0 = Math.min(...pts.map((p) => p.z), z);
      pts.forEach((p, i) => {
        const g = el('ox__unitwrap', model, { left: '0px', top: '0px', transform: `translate3d(${p.x - span / 2 + unitW / 2}px,0,${p.z - z0 - 150}px) rotateY(${m.bay[i]}deg)` });
        const u = buildUnit(g, m, w, H);
        sashes.push(buildLight(u, { x: 0, y: 0, w, h: 90, k: m.lightK }, m));
        sashes.push(buildLight(u, { x: 0, y: 90, w, h: H - 90, k: 'fixed' }, m));
      });
    } else {
      unitW = m.W; unitH = m.H;
      model.style.width = `${m.W}px`; model.style.height = `${m.H}px`;
      el('ox__room', model, { left: '-140px', right: '-140px', top: '-120px', bottom: '-40px', transform: 'translateZ(-240px)' });
      if (m.door) el('ox__floor', model, { left: '-140px', width: `${m.W + 280}px`, top: `${m.H}px`, height: '240px' });
      // reveal (tunnel through the wall) + wall face
      const ff = m.slim ? 10 : 18;
      const R = { l: -ff, t: -ff, w: m.W + ff * 2, h: m.H + ff * 2 };
      el('ox__rev ox__rev--l', model, { left: `${R.l}px`, top: `${R.t}px`, width: `${D}px`, height: `${R.h}px` });
      el('ox__rev ox__rev--r', model, { left: `${R.l + R.w}px`, top: `${R.t}px`, width: `${D}px`, height: `${R.h}px` });
      el('ox__rev ox__rev--t', model, { left: `${R.l}px`, top: `${R.t}px`, width: `${R.w}px`, height: `${D}px` });
      el(`ox__rev ox__rev--b${m.door ? ' ox__rev--step' : ''}`, model, { left: `${R.l}px`, top: `${R.t + R.h}px`, width: `${R.w}px`, height: `${D + (m.door ? 30 : 22)}px` });
      const M = 900;
      [['l', R.l - M, R.t - M, M, R.h + M * 2], ['r', R.l + R.w, R.t - M, M, R.h + M * 2], ['t', R.l, R.t - M, R.w, M], ['b', R.l, R.t + R.h, R.w, M]]
        .forEach(([k, x, y, w, h]) => el(`ox__wall ox__wall--${k}`, model, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, transform: `translateZ(${D}px)` }));
      const u = buildUnit(model, m, m.W, m.H);
      if (m.bifold) {
        const n = m.bifold, pw = m.W / n;
        bifold = { pw, n, els: [] };
        for (let i = 0; i < n; i++) bifold.els.push(buildLight(u, { x: i * pw, y: 0, w: pw, h: m.H, k: 'bifold', leaf: 'glazed' }, m));
        sashes.push(...bifold.els);
      } else {
        m.lights.forEach((L) => sashes.push(buildLight(u, L, m)));
      }
      if (m.flush) u.classList.add('is-flush');
    }
    fit(); apply();
  }

  function apply() {
    const th = o;
    sashes.forEach((s, idx) => {
      const k = s.dataset.k; let t = '', origin = '50% 50%';
      const w = parseFloat(s.style.width), h = parseFloat(s.style.height);
      switch (k) {
        case 'side-r-out': origin = '100% 50%'; t = `rotateY(${th * 62}deg)`; break;
        case 'side-l-out': origin = '0% 50%'; t = `rotateY(${-th * 62}deg)`; break;
        case 'top-out': origin = '50% 0%'; t = `rotateX(${th * 36}deg)`; break;
        case 'tt':
          if (mode === 'a') { origin = '50% 100%'; t = `rotateX(${th * 13}deg)`; }
          else { origin = '0% 50%'; t = `rotateY(${th * 78}deg)`; }
          break;
        case 'sash-top': t = 'translateZ(5px)'; break;
        case 'sash-bottom':
          if (mode === 'a') t = `translateZ(-5px) translateY(${-th * h * 0.9}px)`;
          else { origin = '50% 100%'; t = `translateZ(-5px) rotateX(${th * 28}deg)`; }
          break;
        case 'door-l-in': origin = '0% 50%'; t = `rotateY(${th * 78}deg)`; break;
        case 'door-l': origin = '0% 50%'; t = `rotateY(${(mode === 'a' ? -1 : 1) * th * 80}deg)`; break;
        case 'door-r': origin = '100% 50%'; t = `rotateY(${(mode === 'a' ? 1 : -1) * th * 80}deg)`; break;
        case 'slide': t = `translateZ(-9px) translateX(${-th * w * 0.94}px)`; break;
        case 'bifold': {
          const i = bifold.els.indexOf(s), pw = bifold.pw, a = th * 84 * DEG;
          const dx = i * pw * Math.cos(a) - i * pw;
          const z = i % 2 ? pw * Math.sin(a) : 0;
          origin = '0% 50%';
          t = `translate3d(${dx}px,0,${z}px) rotateY(${(i % 2 ? 1 : -1) * a / DEG}deg)`;
          break;
        }
        default: t = '';
      }
      s.style.transformOrigin = origin;
      s.style.transform = t;
    });
    model.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    onChange?.({ type, o, mode });
  }

  function fit() {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const sc = Math.min(sw / (unitW + 260), sh / (unitH + 200), 1.4);
    world.style.transform = `translate(-50%, -50%) scale(${sc})`;
  }
  addEventListener('resize', fit);

  // orbit
  let drag = null;
  stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, ry, rx }; stage.setPointerCapture(e.pointerId); stage.classList.add('is-drag'); });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    ry = Math.max(-62, Math.min(62, drag.ry + (e.clientX - drag.x) * 0.3));
    rx = Math.max(-8, Math.min(26, drag.rx - (e.clientY - drag.y) * 0.2));
    model.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  const end = () => { drag = null; stage.classList.remove('is-drag'); };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);

  function animateTo(target, dur = 1300) {
    cancelAnimationFrame(anim);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { o = target; apply(); return; }
    const from = o, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      o = from + (target - from) * e; apply();
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  return {
    build, animateTo,
    set: (v) => { cancelAnimationFrame(anim); o = v; apply(); },
    setMode: (m) => { mode = m; apply(); },
    get open() { return o; },
    view: (y, x) => { ry = y; rx = x; apply(); },
  };
}
