// Procedural composite-door renderer (SVG). Shared by the home teaser and Door Studio.
// Colour names are those listed in Coastal's current colour range; on-screen
// swatches are approximations — real samples are in the showroom.

export const COLOURS = [
  { k: 'simply-white', n: 'Simply White', hex: '#f1f0ea', g: 'Timeless' },
  { k: 'clotted-cream', n: 'Clotted Cream', hex: '#ebe0c3', g: 'Timeless' },
  { k: 'pearl-grey', n: 'Pearl Grey', hex: '#c6c6bd', g: 'Timeless' },
  { k: 'chartwell-green', n: 'Chartwell Green', hex: '#a6bfa7', g: 'Timeless' },
  { k: 'elephant-grey', n: 'Elephant Grey', hex: '#8b8880', g: 'Contemporary' },
  { k: 'basalt-grey', n: 'Basalt Grey II', hex: '#4e5759', g: 'Contemporary' },
  { k: 'slate-grey', n: 'Slate Grey', hex: '#3d4549', g: 'Contemporary' },
  { k: 'black-brown', n: 'Black Brown', hex: '#2c2421', g: 'Contemporary' },
  { k: 'midnight-black', n: 'Midnight Black Matt', hex: '#1d1e20', g: 'Contemporary' },
  { k: 'irish-oak', n: 'Irish Oak', hex: '#9b6335', g: 'Traditional', grain: true },
  { k: 'golden-oak', n: 'Golden Oak', hex: '#ad6d2f', g: 'Traditional', grain: true },
  { k: 'walnut', n: 'Walnut', hex: '#6d462a', g: 'Traditional', grain: true },
  { k: 'dark-oak', n: 'Dark Oak', hex: '#4e3423', g: 'Traditional', grain: true },
  { k: 'rosewood', n: 'Rosewood', hex: '#5c2a22', g: 'Traditional', grain: true },
  { k: 'mahogany', n: 'Mahogany', hex: '#4b2219', g: 'Traditional', grain: true },
  { k: 'ruby-red', n: 'Ruby Red', hex: '#7a1d22', g: 'Statement' },
  { k: 'racing-green', n: 'Racing Green', hex: '#1f3b2d', g: 'Statement' },
  { k: 'steel-blue', n: 'Steel Blue', hex: '#3c5368', g: 'Statement' },
];

export const STYLES = [
  { k: 'cottage', n: 'Cottage', d: 'Glazed top lights over twin raised panels.' },
  { k: 'georgian', n: 'Georgian', d: 'Six raised panels — the classic period door.' },
  { k: 'arch', n: 'Arch-top', d: 'An arched glazed head above tall panels.' },
  { k: 'half', n: 'Half-glazed', d: 'A generous glazed upper half for a brighter hall.' },
  { k: 'linear', n: 'Linear', d: 'Flush and grooved, with a slim glazed slot.' },
  { k: 'trio', n: 'Trio', d: 'Three stepped square lights on a grooved slab.' },
];

export const GLASS = [
  { k: 'clear', n: 'Clear' }, { k: 'obscure', n: 'Obscure' }, { k: 'satin', n: 'Satin' },
  { k: 'leaded', n: 'Leaded' }, { k: 'bullseye', n: 'Bullseye' },
];
export const HARDWARE = [
  { k: 'chrome', n: 'Chrome', a: '#f4f6f7', b: '#8d969a', c: '#c9cfd2' },
  { k: 'gold', n: 'Gold', a: '#fff1b8', b: '#a7782c', c: '#d8b45f' },
  { k: 'black', n: 'Black', a: '#5d6164', b: '#0d0e0f', c: '#2a2c2e' },
  { k: 'graphite', n: 'Graphite', a: '#b2b6b8', b: '#3f4447', c: '#6f7578' },
];

export const DEFAULT = { style: 'cottage', colour: 'chartwell-green', frame: 'white', glass: 'obscure', hardware: 'chrome', knocker: true, letterplate: true, number: '12', sides: 'none', toplight: false, dusk: false, wall: 'brick' };

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

let uid = 0;
export function renderDoor(cfg = DEFAULT, opts = {}) {
  const c = { ...DEFAULT, ...cfg };
  const id = `d${++uid}`;
  const col = COLOURS.find((x) => x.k === c.colour) || COLOURS[0];
  const hw = HARDWARE.find((x) => x.k === c.hardware) || HARDWARE[0];
  const frameHex = c.frame === 'match' ? col.hex : '#f3f2ee';
  const frameGrain = c.frame === 'match' && col.grain;
  const L = lum(col.hex);

  // geometry
  const LW = 400, LH = 900, FR = 44;
  const SW = c.sides === 'none' ? 0 : 150;
  const nSides = c.sides === 'both' ? 2 : c.sides === 'one' ? 1 : 0;
  const TH = c.toplight ? 150 : 0;
  const totalW = LW + FR * 2 + nSides * (SW + FR);
  const totalH = LH + FR * 2 + (TH ? TH + FR : 0);
  const pad = opts.tight ? 70 : 220;
  const VW = totalW + pad * 2, VH = totalH + (opts.tight ? 120 : 260);
  const ox = pad, oy = (opts.tight ? 60 : 140);
  const leafX = ox + FR + (nSides >= 1 && c.sides === 'both' ? SW + FR : 0);
  const leafY = oy + FR + (TH ? TH + FR : 0);

  const parts = [];
  const defs = [];

  defs.push(`
  <linearGradient id="${id}-light" x1="0" y1="0" x2="1" y2="0.25"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
  <linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1">
    ${c.dusk
      ? '<stop offset="0" stop-color="#ffe2a8"/><stop offset=".5" stop-color="#f3b866"/><stop offset="1" stop-color="#c98a45"/>'
      : '<stop offset="0" stop-color="#e7eef0"/><stop offset=".45" stop-color="#9fb2b9"/><stop offset=".46" stop-color="#b6c6cb"/><stop offset="1" stop-color="#5f7480"/>'}
  </linearGradient>
  <linearGradient id="${id}-hw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hw.a}"/><stop offset=".5" stop-color="${hw.c}"/><stop offset="1" stop-color="${hw.b}"/></linearGradient>
  <pattern id="${id}-stip" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#fff" opacity=".28"/><circle cx="6.5" cy="6.5" r="1.6" fill="#000" opacity=".08"/></pattern>
  <pattern id="${id}-lead" width="46" height="70" patternUnits="userSpaceOnUse"><path d="M0 35 L23 0 L46 35 L23 70 Z" fill="none" stroke="#3b3f41" stroke-width="2.4"/></pattern>
  <filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0035 0.11" numOctaves="3" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25"/><feComposite operator="in" in2="SourceGraphic"/></filter>
  <filter id="${id}-blur"><feGaussianBlur stdDeviation="18"/></filter>
  <radialGradient id="${id}-lamp"><stop offset="0" stop-color="#ffd58f" stop-opacity=".75"/><stop offset="1" stop-color="#ffd58f" stop-opacity="0"/></radialGradient>
  `);

  // wall
  const wallBase = c.wall === 'render' ? '#e8e0cf' : c.wall === 'white' ? '#f3f1ec' : '#a5583f';
  if (c.wall === 'brick') {
    const tones = ['#a5583f', '#9a4f39', '#b0634a', '#934a36', '#a95c43', '#8f4532'];
    let bricks = '';
    for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) {
      const x = i * 66 + (r % 2 ? 33 : 0), y = r * 24;
      bricks += `<rect x="${x}" y="${y}" width="62" height="20" fill="${tones[(r * 3 + i * 5) % 6]}"/>`;
      if (r % 2) bricks += `<rect x="${x - 198}" y="${y}" width="62" height="20" fill="${tones[(r * 3 + i * 5 + 2) % 6]}"/>`;
    }
    defs.push(`<pattern id="${id}-brick" width="198" height="96" patternUnits="userSpaceOnUse"><rect width="198" height="96" fill="#cfc4b4"/>${bricks}</pattern>`);
  }
  parts.push(`<rect width="${VW}" height="${VH}" fill="${c.wall === 'brick' ? `url(#${id}-brick)` : wallBase}"/>`);
  if (c.wall !== 'brick') parts.push(`<rect width="${VW}" height="${VH}" fill="url(#${id}-light)" opacity=".6"/>`);
  // reveal shadow around the opening
  parts.push(`<rect x="${ox - 14}" y="${oy - 14}" width="${totalW + 28}" height="${totalH + 14}" fill="#000" opacity=".22" filter="url(#${id}-blur)"/>`);
  // step
  const stepY = oy + totalH;
  parts.push(`<rect x="${ox - 40}" y="${stepY}" width="${totalW + 80}" height="34" fill="#cfcac1"/><rect x="${ox - 40}" y="${stepY + 34}" width="${totalW + 80}" height="10" fill="#9f9a91"/><rect x="0" y="${stepY + 44}" width="${VW}" height="${VH - stepY - 44}" fill="#8c877e"/>`);

  // ── helpers
  const grainOver = (x, y, w, h, on) => (on ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000" filter="url(#${id}-grain)" opacity="${L > 0.4 ? 0.35 : 0.5}"/>` : '');
  const glassRect = (x, y, w, h, kind = c.glass, path = null) => {
    const shape = path ? `<path d="${path}"` : `<rect x="${x}" y="${y}" width="${w}" height="${h}"`;
    let s = `${shape} fill="url(#${id}-glass)"/>`;
    if (kind === 'obscure' || kind === 'bullseye') s += `${shape} fill="url(#${id}-stip)"/>`;
    if (kind === 'satin') s += `${shape} fill="${c.dusk ? '#ffe3b5' : '#e6ecec'}" opacity=".78"/>`;
    if (kind === 'leaded') s += `${shape} fill="url(#${id}-stip)" opacity=".6"/>${shape} fill="url(#${id}-lead)"/>`;
    if (kind === 'bullseye') {
      const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.32;
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${r * 0.25}" fill="#fff" opacity=".3"/>`;
    }
    if (!c.dusk) s += `${shape} fill="url(#${id}-light)" opacity=".7"/>`;
    // bead
    s += path ? `<path d="${path}" fill="none" stroke="${shade(col.hex, -0.35)}" stroke-width="5"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${shade(col.hex, -0.35)}" stroke-width="5"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>`;
    return s;
  };
  const raised = (x, y, w, h) => {
    const b = Math.min(18, w * 0.16, h * 0.16);
    const hi = shade(col.hex, L < 0.25 ? 0.18 : 0.12), lo = shade(col.hex, -0.28), mid = shade(col.hex, -0.08);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mid}"/>
      <path d="M${x} ${y} h${w} l${-b} ${b} h${-(w - 2 * b)} Z" fill="${hi}"/>
      <path d="M${x} ${y} l${b} ${b} v${h - 2 * b} l${-b} ${b} Z" fill="${hi}" opacity=".7"/>
      <path d="M${x} ${y + h} h${w} l${-b} ${-b} h${-(w - 2 * b)} Z" fill="${lo}"/>
      <path d="M${x + w} ${y} l${-b} ${b} v${h - 2 * b} l${b} ${b} Z" fill="${lo}" opacity=".8"/>
      <rect x="${x + b}" y="${y + b}" width="${w - 2 * b}" height="${h - 2 * b}" fill="${col.hex}"/>
      <rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="none" stroke="${shade(col.hex, -0.32)}" stroke-width="3"/>`;
  };
  const groove = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${shade(col.hex, -0.35)}" stroke-width="4"/><line x1="${x1}" y1="${y1 + 3}" x2="${x2}" y2="${y2 + 3}" stroke="${shade(col.hex, 0.15)}" stroke-width="1.5"/>`;

  // ── frame (outer) + sidelights + toplight
  parts.push(`<rect x="${ox}" y="${oy}" width="${totalW}" height="${totalH}" fill="${frameHex}"/>`);
  parts.push(grainOver(ox, oy, totalW, totalH, frameGrain));
  parts.push(`<rect x="${ox}" y="${oy}" width="${totalW}" height="${totalH}" fill="url(#${id}-light)"/>`);
  const sideXs = [];
  if (c.sides === 'both') sideXs.push(ox + FR, leafX + LW + FR);
  if (c.sides === 'one') sideXs.push(leafX + LW + FR);
  for (const sx of sideXs) {
    const kick = 260;
    parts.push(`<rect x="${sx}" y="${leafY}" width="${SW}" height="${LH}" fill="${col.hex}"/>`);
    parts.push(glassRect(sx + 18, leafY + 18, SW - 36, LH - kick - 36));
    parts.push(raised(sx + 22, leafY + LH - kick + 8, SW - 44, kick - 40));
    parts.push(grainOver(sx, leafY, SW, LH, col.grain));
  }
  if (TH) {
    const tx = ox + FR, ty = oy + FR, tw = totalW - FR * 2;
    parts.push(glassRect(tx, ty, tw, TH, c.glass === 'leaded' ? 'leaded' : 'clear'));
    const tfs = Math.min(96, (tw * 0.86) / Math.max(1, String(c.number).length * 0.56));
    if (c.number) parts.push(`<text x="${tx + tw / 2}" y="${ty + TH / 2 + tfs * 0.32}" text-anchor="middle" font-family="Newsreader Variable, Georgia, serif" font-size="${tfs.toFixed(0)}" fill="${c.dusk ? '#3a2a14' : '#f7f4ec'}" opacity=".92" letter-spacing="4">${escapeXml(c.number)}</text>`);
  }
  // frame rebate lines
  parts.push(`<rect x="${leafX - 6}" y="${leafY - 6}" width="${LW + 12}" height="${LH + 6}" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="3"/>`);

  // ── leaf
  parts.push(`<rect x="${leafX}" y="${leafY}" width="${LW}" height="${LH}" fill="${col.hex}"/>`);
  const X = leafX, Y = leafY, W = LW, H = LH;
  const st = c.style;
  const traditional = ['cottage', 'georgian', 'arch', 'half'].includes(st);
  if (st === 'cottage') {
    const gH = 250, bw = 8;
    parts.push(glassRect(X + 56, Y + 60, W - 112, gH));
    const gw = (W - 112) / 4;
    for (let i = 1; i < 4; i++) parts.push(`<rect x="${X + 56 + gw * i - bw / 2}" y="${Y + 60}" width="${bw}" height="${gH}" fill="${col.hex}"/><rect x="${X + 56 + gw * i - bw / 2}" y="${Y + 60}" width="2" height="${gH}" fill="#fff" opacity=".2"/>`);
    parts.push(raised(X + 56, Y + 380, (W - 112 - 30) / 2, 450), raised(X + 56 + (W - 112 + 30) / 2, Y + 380, (W - 112 - 30) / 2, 450));
  } else if (st === 'georgian') {
    const pw = (W - 112 - 34) / 2, x2 = X + 56 + pw + 34;
    parts.push(raised(X + 56, Y + 56, pw, 170), raised(x2, Y + 56, pw, 170));
    parts.push(raised(X + 56, Y + 270, pw, 300), raised(x2, Y + 270, pw, 300));
    parts.push(raised(X + 56, Y + 640, pw, 200), raised(x2, Y + 640, pw, 200));
  } else if (st === 'arch') {
    const gx = X + 60, gw = W - 120, gy = Y + 70, gh = 330, r = gw / 2;
    const d = `M${gx} ${gy + gh} V${gy + r} A${r} ${r * 0.7} 0 0 1 ${gx + gw} ${gy + r} V${gy + gh} Z`;
    parts.push(glassRect(gx, gy + r * 0.3, gw, gh - r * 0.3, c.glass, d));
    parts.push(raised(X + 60, Y + 470, (W - 120 - 30) / 2, 370), raised(X + 60 + (W - 120 + 30) / 2, Y + 470, (W - 120 - 30) / 2, 370));
  } else if (st === 'half') {
    parts.push(glassRect(X + 64, Y + 64, W - 128, 380));
    parts.push(raised(X + 64, Y + 540, W - 128, 300));
  } else if (st === 'linear') {
    for (const gy of [Y + 150, Y + 330, Y + 510, Y + 690]) parts.push(groove(X + 40, gy, X + W - 150, gy));
    parts.push(glassRect(X + W - 118, Y + 70, 56, 760));
  } else if (st === 'trio') {
    for (const gy of [Y + 120, Y + 780]) parts.push(groove(X + 40, gy, X + W - 40, gy));
    parts.push(glassRect(X + 150, Y + 200, 100, 100), glassRect(X + 150, Y + 360, 100, 100), glassRect(X + 150, Y + 520, 100, 100));
  }
  parts.push(grainOver(X, Y, W, H, col.grain));
  parts.push(`<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="url(#${id}-light)"/>`);
  parts.push(`<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`);

  // ── hardware
  const hx = X + W - 50;
  if (traditional) {
    const hy = Y + 470;
    parts.push(`<rect x="${hx - 16}" y="${hy - 95}" width="32" height="210" rx="16" fill="url(#${id}-hw)" stroke="${hw.b}" stroke-width="1.5"/>`);
    parts.push(`<path d="M${hx} ${hy - 6} h-78 a10 10 0 0 0 0 20 h78 Z" fill="url(#${id}-hw)" stroke="${hw.b}" stroke-width="1.5"/>`);
    parts.push(`<circle cx="${hx}" cy="${hy + 64}" r="9" fill="${hw.b}"/><rect x="${hx - 3}" y="${hy + 62}" width="6" height="16" fill="${hw.b}"/>`);
  } else {
    parts.push(`<rect x="${hx - 9}" y="${Y + 230}" width="18" height="460" rx="9" fill="url(#${id}-hw)" stroke="${hw.b}" stroke-width="1.5"/>`);
    parts.push(`<rect x="${hx - 14}" y="${Y + 225}" width="28" height="18" rx="4" fill="${hw.c}"/><rect x="${hx - 14}" y="${Y + 677}" width="28" height="18" rx="4" fill="${hw.c}"/>`);
    parts.push(`<circle cx="${hx - 2}" cy="${Y + 520}" r="10" fill="url(#${id}-hw)" stroke="${hw.b}"/>`);
  }
  if (c.letterplate) {
    const ly = st === 'cottage' ? Y + 342 : st === 'georgian' ? Y + 600 : st === 'half' ? Y + 487 : st === 'arch' ? Y + 432 : Y + 700;
    const lx = st === 'linear' || st === 'trio' ? X + 70 : X + W / 2 - 110;
    const lw = st === 'linear' || st === 'trio' ? 180 : 220;
    parts.push(`<rect x="${lx}" y="${ly - 22}" width="${lw}" height="44" rx="5" fill="url(#${id}-hw)" stroke="${hw.b}" stroke-width="1.5"/><rect x="${lx + 18}" y="${ly - 8}" width="${lw - 36}" height="16" rx="3" fill="${hw.b}" opacity=".55"/>`);
  }
  if (c.knocker && traditional) {
    const ky = st === 'half' ? Y + 520 : st === 'cottage' ? Y + 410 : st === 'arch' ? Y + 520 : Y + 245;
    const kx = X + W / 2;
    parts.push(`<circle cx="${kx}" cy="${ky}" r="13" fill="url(#${id}-hw)" stroke="${hw.b}"/><path d="M${kx - 40} ${ky + 8} a40 40 0 0 0 80 0" fill="none" stroke="url(#${id}-hw)" stroke-width="11" stroke-linecap="round"/><path d="M${kx - 40} ${ky + 8} a40 40 0 0 0 80 0" fill="none" stroke="${hw.b}" stroke-width="1.2" opacity=".6"/>`);
  }
  const nlen = String(c.number || '').length;
  const fit = (base, width) => Math.min(base, width / Math.max(1, nlen * 0.56));
  if (c.number && !TH) {
    const ny = st === 'georgian' ? Y + 248 : st === 'half' ? Y + 512 : st === 'trio' ? Y + 270 : st === 'linear' ? Y + 110 : Y + 44;
    const nx = st === 'trio' ? X + 300 : st === 'linear' ? X + 130 : X + W / 2;
    const fill = `url(#${id}-hw)`;
    if (st === 'cottage' || st === 'arch') parts.push(`<text x="${nx}" y="${Y + 46}" text-anchor="middle" font-family="Newsreader Variable, Georgia, serif" font-size="${fit(40, 280).toFixed(0)}" fill="${fill}" stroke="${hw.b}" stroke-width=".6" letter-spacing="2">${escapeXml(c.number)}</text>`);
    else parts.push(`<text x="${nx}" y="${ny + 20}" text-anchor="middle" font-family="Newsreader Variable, Georgia, serif" font-size="${(st === 'linear' ? fit(64, 200) : st === 'trio' ? fit(64, 150) : fit(46, 280)).toFixed(0)}" fill="${fill}" stroke="${hw.b}" stroke-width=".6" letter-spacing="2">${escapeXml(c.number)}</text>`);
  }

  // ── dusk: darken the world, keep the glass glowing, spill light
  if (c.dusk) {
    parts.push(`<rect width="${VW}" height="${VH}" fill="#0d1830" opacity=".58" style="mix-blend-mode:multiply"/>`);
    parts.push(`<circle cx="${ox - 70}" cy="${leafY + 160}" r="150" fill="url(#${id}-lamp)"/><rect x="${ox - 84}" y="${leafY + 120}" width="28" height="56" rx="6" fill="#2a2a2a"/><rect x="${ox - 79}" y="${leafY + 128}" width="18" height="38" rx="4" fill="#ffe0a0"/>`);
    parts.push(`<ellipse cx="${leafX + LW / 2}" cy="${stepY + 20}" rx="${LW * 0.8}" ry="40" fill="url(#${id}-lamp)" opacity=".5"/>`);
  }
  return `<svg viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(describe(c))}" preserveAspectRatio="xMidYMid meet"><defs>${defs.join('')}</defs>${parts.join('')}</svg>`;
}

export function describe(c) {
  const col = COLOURS.find((x) => x.k === c.colour)?.n;
  const st = STYLES.find((x) => x.k === c.style)?.n;
  const gl = GLASS.find((x) => x.k === c.glass)?.n;
  const hw = HARDWARE.find((x) => x.k === c.hardware)?.n;
  return `${st} door in ${col}, ${gl?.toLowerCase()} glass, ${hw?.toLowerCase()} hardware${c.sides !== 'none' ? `, ${c.sides === 'both' ? 'two sidelights' : 'one sidelight'}` : ''}${c.toplight ? ', toplight' : ''}`;
}
function escapeXml(s) { return String(s).replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[ch]); }
