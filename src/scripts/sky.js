// The Live Window — a real-time WebGL view of South Devon.
// Sky, sun and light follow the actual solar position in Newton Abbot.
// Weather (if reachable) comes from Open-Meteo. Rain runs down the glass.

import { sunPosition, sunTimes, fmtTime, daylight } from '../lib/sun.js';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uSun;      // screen-space sun (x 0..1 across view, y = altitude in deg)
uniform float uDay;     // 0 night .. 1 day
uniform float uCloud;   // 0..1 cover
uniform float uRain;    // 0..1
uniform float uFog;     // 0..1
uniform vec2 uMouse;    // -1..1
uniform float uZoom;    // scroll progress 0..1
uniform float uNight;   // 1 when deep night

float h11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v += a*vnoise(p); p = m*p; a *= .5; } return v; }
float fbm3(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<3;i++){ v += a*vnoise(p); p = m*p; a *= .5; } return v; }

const float H = .405; // sea horizon

vec3 skyCol(vec2 uv, float aspect, out vec3 sunTint){
  float alt = uSun.y;
  float g = clamp(1. - abs(alt - 2.)/14., 0., 1.);           // golden factor
  float dusk = clamp(1. - abs(alt + 4.)/6., 0., 1.);          // civil twilight
  vec3 zenDay = vec3(.42,.60,.78), horDay = vec3(.86,.89,.88);
  vec3 zenGold = vec3(.33,.40,.62), horGold = vec3(.98,.70,.46);
  vec3 zenDusk = vec3(.14,.17,.34), horDusk = vec3(.86,.47,.43);
  vec3 zenNight = vec3(.02,.035,.08), horNight = vec3(.07,.10,.17);
  vec3 zen = mix(zenNight, zenDay, uDay); vec3 hor = mix(horNight, horDay, uDay);
  zen = mix(zen, zenGold, g*.8); hor = mix(hor, horGold, g);
  zen = mix(zen, zenDusk, dusk*.7); hor = mix(hor, horDusk, dusk*.85);
  float t = clamp((uv.y - H)/(1.-H), 0., 1.);
  vec3 col = mix(hor, zen, pow(t, .55));
  // sun
  vec2 sp = vec2(uSun.x*aspect, H + uSun.y/72.);
  vec2 d = vec2(uv.x*aspect, uv.y) - sp;
  float r = length(d*vec2(1., 1.15));
  sunTint = mix(vec3(1.,.55,.32), vec3(1.,.93,.80), clamp(alt/25., 0., 1.));
  float vis = smoothstep(-3., 1., alt);
  col += sunTint * (exp(-r*5.5)*.55 + exp(-r*24.)*.6) * vis * (1. - uCloud*.65);
  col += sunTint * smoothstep(.022, .016, r) * vis * (1.-uCloud*.9) * 1.5;
  // stars
  if (uNight > .01) {
    vec2 sg = uv*vec2(aspect,1.)*180.; vec2 id = floor(sg); vec2 f = fract(sg)-.5;
    float s = h21(id); float star = smoothstep(.06, 0., length(f - (h22(id)-.5)*.6)) * step(.985, s);
    col += star * uNight * t * (.6 + .4*sin(uTime*2. + s*40.)) * (1.-uCloud);
    // moon
    vec2 mp = vec2(.78*aspect, .82); float mr = length(vec2(uv.x*aspect,uv.y)-mp);
    float moon = smoothstep(.03, .027, mr) * (1. - smoothstep(.03, .027, length(vec2(uv.x*aspect,uv.y)-mp-vec2(.012,.006))));
    col += vec3(.95,.93,.85) * moon * uNight * (1.-uCloud*.8) + vec3(.4,.45,.6)*exp(-mr*14.)*.25*uNight*(1.-uCloud);
  }
  // clouds
  vec2 cp = vec2(uv.x*aspect*1.25 + uTime*.006, uv.y*3.6 - uTime*.0015);
  float c = fbm(cp + fbm(cp*.6 + uTime*.004)*.8);
  float cover = mix(.08, 1.05, uCloud);
  float cm = smoothstep(1.-cover, 1.-cover+.32, c) * smoothstep(H-.01, H+.12, uv.y);
  float lit = clamp(.55 + (c - .5)*1.6, 0., 1.);
  vec3 cDark = mix(vec3(.05,.06,.09), mix(vec3(.46,.50,.55), vec3(.55,.42,.42), dusk), uDay);
  vec3 cLit = mix(vec3(.12,.14,.2), vec3(.97,.96,.94), uDay);
  cLit = mix(cLit, sunTint*1.05, g*.65 + dusk*.4);
  vec3 cc = mix(cDark, cLit, lit * (1. - uRain*.55));
  cc += sunTint * exp(-r*3.5) * .35 * vis;
  col = mix(col, cc, cm * (.85 + uCloud*.15));
  return col;
}

float headland(float x){ // left red-cliff headland profile
  float b = smoothstep(.43, .02, x);
  return H - .005 + b*.105 + (fbm3(vec2(x*9., 1.))-.5)*.018*b;
}
float hills(float x){ // right-hand rolling fields
  return .27 + .19*smoothstep(.32, 1.1, x) + .035*sin(x*5.3+.8) + (fbm3(vec2(x*5.,7.))-.5)*.05;
}
float near(float x){ return .085 + .06*fbm3(vec2(x*7.,3.)) + .03*sin(x*2.+1.); }

vec3 scene(vec2 uv, float aspect){
  vec3 sunTint;
  vec3 col = skyCol(uv, aspect, sunTint);
  float lightAmt = mix(.06, 1., uDay);
  vec3 sunLight = mix(vec3(.25,.3,.45), sunTint, uDay) * lightAmt;
  vec3 haze = mix(vec3(.07,.1,.16), vec3(.82,.85,.84), uDay);
  haze = mix(haze, vec3(.95,.7,.55), clamp(1.-abs(uSun.y-2.)/14.,0.,1.)*.6);

  // sea
  if (uv.y < H + 2./uRes.y) {
    float dy = max(H - uv.y, 0.);
    vec3 seaDeep = mix(vec3(.02,.04,.07), vec3(.20,.36,.42), uDay);
    vec3 sea = mix(haze*.92, seaDeep, smoothstep(0., .22, dy));
    float w = vnoise(vec2(uv.x*aspect*60., uv.y*420. + uTime*.6)) * vnoise(vec2(uv.x*aspect*24., uv.y*160. - uTime*.3));
    float sx = abs(uv.x - uSun.x) * aspect;
    float path = exp(-sx*sx*(30. + dy*400.)) * smoothstep(-4., 2., uSun.y);
    sea += sunTint * path * (pow(w, 3.)*3.5 + .12) * (1. - uCloud*.7);
    sea += vec3(1.) * pow(w, 6.) * .08 * uDay;
    col = mix(col, sea, smoothstep(H + 1.5/uRes.y, H - 1.5/uRes.y, uv.y));
    if (uNight > .01) { // moon path
      float mx = abs(uv.x - .78)*aspect; col += vec3(.6,.65,.75)*exp(-mx*mx*120.)*pow(w,3.)*1.6*uNight*(1.-uCloud);
    }
  }
  float aw = 1.6/uRes.y;
  // distant coast across the bay
  float farC = H + .012*smoothstep(.55,.62,uv.x) + .01*fbm3(vec2(uv.x*14.,2.))*smoothstep(.55,.7,uv.x);
  float aFar = smoothstep(farC + aw, farC - aw, uv.y) * smoothstep(H - .004, H - .001, uv.y) * smoothstep(.54, .58, uv.x);
  col = mix(col, haze*.8 + vec3(0.,.02,.05)*uDay, aFar*.85);

  // headland with red sandstone cliffs (left)
  float hl = headland(uv.x);
  float aHead = smoothstep(hl + aw, hl - aw, uv.y) * smoothstep(H - .016 - aw, H - .016 + aw, uv.y) * smoothstep(.47, .43, uv.x);
  if (aHead > 0.) {
    float top = hl - uv.y;
    vec3 grass = mix(vec3(.015,.025,.03), vec3(.30,.42,.24), uDay) * mix(1., .82, fbm3(uv*80.));
    vec3 rock = mix(vec3(.035,.025,.03), vec3(.64,.31,.20), uDay);
    rock *= .8 + .22*sin(uv.y*700. + fbm3(uv*vec2(30.,4.))*6.);
    float cap = .006 + .01*fbm3(vec2(uv.x*20., 3.));
    float face = smoothstep(cap, cap + .006, top) * smoothstep(.02, .3, uv.x);
    vec3 c = mix(grass, rock, face);
    c *= .55 + .55*sunLight;
    c = mix(c, haze, .36);
    vec2 lp = vec2(.395*aspect, headland(.395) + .005);
    float lb = exp(-length(vec2(uv.x*aspect, uv.y) - lp)*170.) * uNight * step(.55, fract(uTime*.22));
    c += vec3(1.,.85,.6)*lb*2.2;
    col = mix(col, c, aHead);
  }

  // patchwork fields (right)
  float hh = hills(uv.x);
  float aHill = smoothstep(hh + aw, hh - aw, uv.y);
  if (aHill > 0.) {
    float dist = max(hh - uv.y, 0.);
    float depth = clamp(dist/.26, 0., 1.);
    float v = 1./(dist + .03);
    vec2 fp = vec2((uv.x - .58)*aspect*v*.42, v*.62);
    vec2 q = fp + vec2(vnoise(fp*.55), vnoise(fp*.55 + 7.3))*.55;
    vec2 cell = floor(q); vec2 fr = fract(q);
    float tone = h21(cell);
    vec3 field = mix(vec3(.30,.44,.21), vec3(.47,.55,.27), tone);
    field = mix(field, vec3(.66,.60,.36), step(.84, tone));   // stubble / harvested
    field = mix(field, vec3(.50,.29,.19), step(.93, tone));   // ploughed red Devon soil
    float stripe = .5 + .5*sin(dot(q, vec2(cos(tone*6.), sin(tone*6.)))*46.);
    field *= 1. - stripe*.07*step(.55, tone)*smoothstep(26., 8., v);
    field *= .92 + .16*vnoise(q*3.);
    float far = smoothstep(9., 30., v);
    float e = min(min(fr.x, 1.-fr.x), min(fr.y, 1.-fr.y));
    float hw = .05*clamp(v/9., .32, 1.);
    float hedge = smoothstep(hw, hw*.25, e) * (1. - far*.9);
    vec3 hedgeCol = vec3(.09,.15,.07);
    field = mix(field, hedgeCol, hedge*.88);
    vec2 cn = fr - floor(fr + .5);
    float tr = step(.68, h21(cell + floor(fr + .5) + 2.));
    float tree = smoothstep(.17, .1, length(cn*vec2(1., 1.4))) * tr * smoothstep(16., 7., v);
    field = mix(field, hedgeCol*1.15 + vec3(.05,.06,.02)*smoothstep(-.1,.1,cn.y), tree);
    field = mix(field, vec3(.43,.53,.32), far*.55);
    field *= .55 + .55*sunLight;
    field = mix(vec3(.012,.02,.035) + field*vec3(.10,.12,.16), field, uDay);
    field = mix(field, haze, (1.-depth)*.42);
    vec2 hp = uv*vec2(aspect,1.)*vec2(70.,90.); vec2 hid = floor(hp);
    float hs = h21(hid + 3.);
    float win = step(.992, hs) * smoothstep(.35, .0, length(fract(hp)-.5)) * smoothstep(.01, .05, dist);
    field += vec3(1.,.72,.38) * win * uNight * 1.6 * (.85+.15*sin(uTime+hs*30.));
    col = mix(col, field, aHill);
  }
  // near garden hedge silhouette
  float nh = near(uv.x);
  float aNear = smoothstep(nh + aw*1.5, nh - aw*1.5, uv.y);
  if (aNear > 0.) {
    float leaf = fbm(uv*vec2(aspect*90., 90.));
    vec3 hedge = mix(vec3(.008,.012,.016), vec3(.10,.17,.09), uDay) * (.6 + leaf*.8);
    hedge += sunTint * smoothstep(-.02, 0., uv.y - nh) * .08 * uDay;
    col = mix(col, hedge, aNear);
  }
  // fog / weather haze
  col = mix(col, haze*.95, uFog*(.55 + .35*smoothstep(.0,.5,uv.y)));
  col = mix(col, mix(col, vec3(dot(col, vec3(.33))), .35), uRain*.6);
  return col;
}

// Rain on glass — droplets & runnels. Returns (normal.xy, mask).
vec3 dropLayer(vec2 uv, float t, float scale){
  vec2 g = uv*scale; vec2 id = floor(g); vec2 f = fract(g) - .5;
  vec2 rnd = h22(id);
  float life = fract(t*.07 + rnd.x);
  vec2 c = (rnd - .5)*.6;
  float r = mix(.08, .22, h21(id+7.)) * smoothstep(0., .1, life) * smoothstep(1., .7, life);
  vec2 d = f - c;
  float m = smoothstep(r, r*.55, length(d));
  return vec3(d/max(r,.001), m * step(.35, h21(id+11.)));
}
vec3 runnels(vec2 uv, float t){
  vec2 g = uv*vec2(9., 1.4); vec2 id = floor(g); vec2 f = fract(g);
  float n = h11(id.x*3.17 + id.y*9.1);
  float speed = .25 + n*.35;
  float y = fract(-t*speed*.18 + n);
  y = y + sin(y*14. + n*10.)*.01;          // stick–slip wobble
  float x = .5 + (n-.5)*.6 + sin(f.y*18. + n*6.)*.025;
  vec2 d = (f - vec2(x, y)) * vec2(1., 6.5);
  float r = .09;
  float m = smoothstep(r, r*.5, length(d*vec2(1., .55)));
  // trail of tiny droplets behind
  float trail = smoothstep(.0, .02, f.y - y) * smoothstep(.55, .0, f.y - y);
  float tf = fract(f.y*28.); float tx = abs(f.x - x);
  float td = smoothstep(.05, .0, length(vec2(tx*1.4, (tf-.5)*.08))) * trail * step(.5, h11(floor(f.y*28.)+id.x));
  vec2 nrm = d/r;
  return vec3(nrm*m + vec2(f.x-x, 0.)*td*8., max(m, td*.6));
}

void main(){
  vec2 frag = gl_FragCoord.xy / uRes;
  float aspect = uRes.x/uRes.y;
  // parallax & scroll dolly
  vec2 uv = frag;
  float z = 1. - uZoom*.12;
  uv = (uv - .5)*z + .5;
  uv.x += uMouse.x*.008; uv.y += uMouse.y*.004;
  vec3 n = vec3(0.);
  float rain = uRain * (1. - uZoom);
  if (rain > .01) {
    vec2 ruv = frag*vec2(aspect, 1.);
    vec3 a = dropLayer(ruv, uTime, 22.);
    vec3 b = dropLayer(ruv + 4.1, uTime*1.3, 38.);
    vec3 r = runnels(ruv, uTime);
    n.xy = a.xy*a.z + b.xy*b.z*.7 + r.xy*r.z;
    n.z = max(max(a.z, b.z), r.z) * rain;
    n.xy *= rain;
  }
  vec3 col = scene(uv - n.xy*.028, aspect);
  // glass: water blur haze + highlights
  col = mix(col, col*.86 + vec3(.05,.06,.07), rain*.45*(1.-n.z));
  col += n.z * vec3(1.) * pow(clamp(dot(normalize(vec3(n.xy, .8)), normalize(vec3(-.4,.6,.7))), 0., 1.), 24.) * .55;
  col -= n.z * .06;
  // vignette & grain
  vec2 q = frag - .5;
  col *= 1. - dot(q, q)*.35;
  col += (h21(gl_FragCoord.xy + fract(uTime)*91.) - .5)*.022;
  gl_FragColor = vec4(pow(max(col, 0.), vec3(.95)), 1.);
}`;

const MOODS = {
  dawn:   { alt: 1.5, x: 0.62, day: 0.55, cloud: 0.35, rain: 0, fog: 0.18, night: 0 },
  day:    { alt: 34, x: 0.6, day: 1, cloud: 0.3, rain: 0, fog: 0, night: 0 },
  golden: { alt: 3.5, x: 0.18, day: 0.78, cloud: 0.32, rain: 0, fog: 0.05, night: 0 },
  rain:   { alt: 18, x: 0.55, day: 0.72, cloud: 0.96, rain: 1, fog: 0.22, night: 0 },
  night:  { alt: -24, x: 0.5, day: 0, cloud: 0.18, rain: 0, fog: 0, night: 1 },
};

const VIEW_BEARING = 120; // looking east-south-east, toward the coast
const VIEW_FOV = 110;

function liveSun(now = new Date()) {
  const p = sunPosition(now);
  let x = 0.5 + ((((p.bearing - VIEW_BEARING) + 540) % 360) - 180) / VIEW_FOV;
  const day = daylight(p.altitudeDeg);
  return { alt: p.altitudeDeg, x, day, night: Math.max(0, Math.min(1, (-p.altitudeDeg - 6) / 8)) };
}

function weatherFromCode(code) {
  if (code == null) return null;
  if (code === 0) return { cloud: 0.06, rain: 0, fog: 0, label: 'Clear' };
  if (code === 1) return { cloud: 0.22, rain: 0, fog: 0, label: 'Mainly clear' };
  if (code === 2) return { cloud: 0.5, rain: 0, fog: 0, label: 'Partly cloudy' };
  if (code === 3) return { cloud: 0.92, rain: 0, fog: 0.08, label: 'Overcast' };
  if (code === 45 || code === 48) return { cloud: 0.8, rain: 0, fog: 0.75, label: 'Fog' };
  if (code >= 51 && code <= 57) return { cloud: 0.9, rain: 0.45, fog: 0.2, label: 'Drizzle' };
  if (code >= 61 && code <= 67) return { cloud: 0.96, rain: code >= 65 ? 1 : 0.75, fog: 0.2, label: code >= 65 ? 'Heavy rain' : 'Rain' };
  if (code >= 71 && code <= 77) return { cloud: 0.95, rain: 0.2, fog: 0.4, label: 'Snow' };
  if (code >= 80 && code <= 82) return { cloud: 0.85, rain: 0.85, fog: 0.1, label: 'Showers' };
  if (code >= 95) return { cloud: 1, rain: 1, fog: 0.15, label: 'Thunderstorm' };
  return { cloud: 0.5, rain: 0, fog: 0, label: '' };
}

export function initSky(canvas, { onLive } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  if (!gl) { canvas.classList.add('no-gl'); return null; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.classList.add('no-gl'); return null; }
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uRes', 'uTime', 'uSun', 'uDay', 'uCloud', 'uRain', 'uFog', 'uMouse', 'uZoom', 'uNight'].forEach((k) => (U[k] = gl.getUniformLocation(prog, k)));

  const state = { alt: 20, x: 0.5, day: 1, cloud: 0.3, rain: 0, fog: 0, night: 0 };
  let target = { ...state };
  let live = { weather: null, temp: null };
  let mood = 'live';
  let zoom = 0; const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function liveTarget() {
    const s = liveSun();
    const w = live.weather || { cloud: 0.35, rain: 0, fog: 0.04 };
    return { alt: s.alt, x: s.x, day: s.day, night: s.night, cloud: w.cloud, rain: w.rain, fog: w.fog };
  }
  function setMood(m) {
    mood = m;
    target = m === 'live' ? liveTarget() : { ...MOODS[m] };
  }
  setMood('live');
  Object.assign(state, target);

  // Live weather — best effort, fails quietly (e.g. offline showroom demo)
  fetch('https://api.open-meteo.com/v1/forecast?latitude=50.5281&longitude=-3.6101&current=temperature_2m,weather_code,cloud_cover&timezone=Europe%2FLondon', { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined })
    .then((r) => r.json())
    .then((d) => {
      const c = d.current; if (!c) return;
      const w = weatherFromCode(c.weather_code);
      if (w && typeof c.cloud_cover === 'number') w.cloud = Math.max(w.cloud * 0.6, c.cloud_cover / 100);
      live = { weather: w, temp: Math.round(c.temperature_2m) };
      if (mood === 'live') setMood('live');
      onLive?.(describe());
    })
    .catch(() => onLive?.(describe()));

  function describe() {
    const now = new Date();
    const t = sunTimes(now);
    const s = sunPosition(now);
    return { time: fmtTime(now), temp: live.temp, label: live.weather?.label, rain: live.weather?.rain || 0, alt: s.altitudeDeg, sunset: fmtTime(t.sunset), sunrise: fmtTime(s.altitudeDeg < 0 && now > t.sunset ? sunTimes(new Date(now.valueOf() + 864e5)).sunrise : t.sunrise) };
  }

  let scale = Math.min(1.25, devicePixelRatio || 1) * (innerWidth < 760 ? 0.7 : 0.82);
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(2, Math.round(w * scale)); canvas.height = Math.max(2, Math.round(h * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize(); addEventListener('resize', resize);

  addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / innerWidth) * 2 - 1; mouse.ty = -((e.clientY / innerHeight) * 2 - 1); }, { passive: true });

  let visible = true, raf = 0, t0 = performance.now(), last = t0, slowFrames = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop(performance.now()); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) loop(performance.now()); });

  let liveTick = 0;
  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    // adaptive resolution for weaker devices
    if (dt > 0.034) { if (++slowFrames > 30 && scale > 0.4) { scale *= 0.85; resize(); slowFrames = 0; } } else slowFrames = Math.max(0, slowFrames - 1);
    if (mood === 'live' && (liveTick += dt) > 20) { liveTick = 0; target = liveTarget(); }
    const k = 1 - Math.pow(0.04, dt);
    for (const key in target) state[key] += (target[key] - state[key]) * k;
    mouse.x += (mouse.tx - mouse.x) * k * 0.6; mouse.y += (mouse.ty - mouse.y) * k * 0.6;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, (now - t0) / 1000);
    gl.uniform2f(U.uSun, state.x, state.alt);
    gl.uniform1f(U.uDay, state.day);
    gl.uniform1f(U.uCloud, state.cloud);
    gl.uniform1f(U.uRain, state.rain);
    gl.uniform1f(U.uFog, state.fog);
    gl.uniform1f(U.uNight, state.night);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform1f(U.uZoom, zoom);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    setMood: (m) => { setMood(m); if (reduce) { Object.assign(state, target); loop(performance.now()); } },
    setZoom: (z) => { zoom = z; },
    describe,
    get mood() { return mood; },
  };
}
