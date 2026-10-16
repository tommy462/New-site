// The Light Lab — an architectural-model conservatory lit by the real sun over Newton Abbot.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sunPosition, sunTimes, londonDate, fmtTime } from '../lib/sun.js';

const W = 4, D = 3.2, EAVE = 2.35, RIDGE = 3.35, DWARF = 0.6, HIPZ = D - W / 2;

export function createLightLab(canvas, ui) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9e4ea);
  scene.fog = new THREE.Fog(0xd9e4ea, 30, 90);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(-7.8, 5.4, 11.6);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.1, 1.4);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 32;
  controls.maxPolarAngle = Math.PI * 0.49;

  // ── materials (architectural model palette)
  const M = {
    clay: new THREE.MeshStandardMaterial({ color: 0xf0ebe2, roughness: 0.92 }),
    ground: new THREE.MeshStandardMaterial({ color: 0xe6dfd2, roughness: 1 }),
    lawn: new THREE.MeshStandardMaterial({ color: 0xc9d1b8, roughness: 1 }),
    brick: new THREE.MeshStandardMaterial({ color: 0xb3634a, roughness: 0.9 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xfafaf7, roughness: 0.45 }),
    floor: new THREE.MeshStandardMaterial({ color: 0xcfa77c, roughness: 0.75 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xc6dce2, roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    poly: new THREE.MeshStandardMaterial({ color: 0xf2f6f6, roughness: 0.6, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
    tile: new THREE.MeshStandardMaterial({ color: 0x4a4f52, roughness: 0.85, side: THREE.DoubleSide }),
    tree: new THREE.MeshStandardMaterial({ color: 0xb9c2a6, roughness: 1 }),
    sun: new THREE.MeshBasicMaterial({ color: 0xffe1a8 }),
  };

  const occluders = []; // things that block direct sun (for the floor-sun measurement)
  const roofOcc = []; // roof panes: occlude only when roof is opaque
  const add = (mesh, { cast = true, receive = true, occ = true, parent = scene } = {}) => {
    mesh.castShadow = cast; mesh.receiveShadow = receive; parent.add(mesh);
    if (occ) occluders.push(mesh);
    return mesh;
  };
  const box = (w, h, d, mat, x, y, z, opts) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return add(m, opts); };
  const tmpV = new THREE.Vector3();
  function bar(a, b, t = 0.05, mat = M.frame, opts) {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(t, t, len), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.lookAt(tmpV.copy(b));
    return add(m, opts);
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ── ground + garden
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64), M.ground);
  ground.rotation.x = -Math.PI / 2; add(ground, { cast: false, occ: false });
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(16, 11), M.lawn);
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.005, 5.4); add(lawn, { cast: false, occ: false });

  // ── house (behind the conservatory)
  box(10, 5.4, 7.5, M.clay, 0, 2.7, -3.75);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-5.3, 0); roofShape.lineTo(5.3, 0); roofShape.lineTo(0, 2.6); roofShape.closePath();
  const houseRoof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 8.1, bevelEnabled: false }), M.clay);
  houseRoof.position.set(0, 5.4, -7.8); add(houseRoof);
  [[-3.6, 3.9], [3.6, 3.9], [3.6, 1.5]].forEach(([x, y]) => box(1.1, 1.2, 0.06, M.tile, x, y, 0.01, { occ: false }));
  box(1.6, 2.1, 0.04, M.tile, 0, 1.05, 0.02, { occ: false, cast: false }); // door into the conservatory

  // ── trees
  [[-7.6, -1.5, 1.5], [7.4, 7.8, 1.1]].forEach(([x, z, r]) => {
    box(0.18, 2.2, 0.18, M.tree, x, 1.1, z);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.2, 1), M.tree); c.position.set(x, 2.2 + r, z); add(c);
  });

  // ── conservatory: dwarf walls, floor, frames, glass
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, D - 0.1), M.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.02, D / 2); add(floor, { cast: false, occ: false });
  box(W, DWARF, 0.2, M.brick, 0, DWARF / 2, D - 0.1);
  box(0.2, DWARF, D, M.brick, -W / 2 + 0.1, DWARF / 2, D / 2);
  box(0.2, DWARF, D, M.brick, W / 2 - 0.1, DWARF / 2, D / 2);
  // cill + eaves beams
  box(W + 0.1, 0.06, 0.28, M.frame, 0, DWARF + 0.03, D - 0.1);
  box(0.28, 0.06, D, M.frame, -W / 2 + 0.1, DWARF + 0.03, D / 2);
  box(0.28, 0.06, D, M.frame, W / 2 - 0.1, DWARF + 0.03, D / 2);
  bar(V(-W / 2, EAVE, D), V(W / 2, EAVE, D), 0.12); bar(V(-W / 2, EAVE, 0), V(-W / 2, EAVE, D), 0.12); bar(V(W / 2, EAVE, 0), V(W / 2, EAVE, D), 0.12);
  // front frames
  const fx = [-2, -1.33, -0.66, 0, 0.66, 1.33, 2];
  fx.forEach((x) => bar(V(x, DWARF, D - 0.1), V(x, EAVE, D - 0.1), 0.07));
  bar(V(-2, 1.95, D - 0.1), V(2, 1.95, D - 0.1), 0.05);
  const sz = [0, 0.8, 1.6, 2.4, 3.2];
  [-1, 1].forEach((s) => {
    sz.forEach((z) => bar(V(s * (W / 2 - 0.1), DWARF, z), V(s * (W / 2 - 0.1), EAVE, z), 0.07));
    bar(V(s * (W / 2 - 0.1), 1.95, 0), V(s * (W / 2 - 0.1), 1.95, D), 0.05);
  });
  const glassMesh = (geo, pos, rotY = 0) => { const m = new THREE.Mesh(geo, M.glass); m.position.copy(pos); m.rotation.y = rotY; m.renderOrder = 2; return add(m, { cast: false, receive: false, occ: false }); };
  glassMesh(new THREE.PlaneGeometry(W, EAVE - DWARF), V(0, (EAVE + DWARF) / 2, D - 0.1));
  glassMesh(new THREE.PlaneGeometry(D, EAVE - DWARF), V(-W / 2 + 0.1, (EAVE + DWARF) / 2, D / 2), Math.PI / 2);
  glassMesh(new THREE.PlaneGeometry(D, EAVE - DWARF), V(W / 2 - 0.1, (EAVE + DWARF) / 2, D / 2), Math.PI / 2);

  // furniture (for scale)
  box(1.1, 0.04, 0.7, M.clay, 0.5, 0.74, 1.9, { occ: false });
  [[0.05, 1.65], [0.95, 1.65], [0.05, 2.15], [0.95, 2.15]].forEach(([x, z]) => box(0.04, 0.72, 0.04, M.clay, x, 0.36, z, { occ: false }));
  box(0.75, 0.42, 0.75, M.clay, -1.15, 0.21, 1.0, { occ: false });
  box(0.75, 0.4, 0.14, M.clay, -1.15, 0.62, 0.68, { occ: false });

  // ── Edwardian hipped roof
  const roofGroup = new THREE.Group(); scene.add(roofGroup);
  const R0 = V(0, RIDGE, 0), R1 = V(0, RIDGE, HIPZ);
  const quad = (a, b, c, d) => { const g = new THREE.BufferGeometry().setFromPoints([a, b, c, a, c, d]); g.computeVertexNormals(); return g; };
  const tri = (a, b, c) => { const g = new THREE.BufferGeometry().setFromPoints([a, b, c]); g.computeVertexNormals(); return g; };
  const roofGeos = [
    quad(V(-W / 2, EAVE, 0), V(-W / 2, EAVE, D), R1.clone(), R0.clone()),
    quad(V(W / 2, EAVE, D), V(W / 2, EAVE, 0), R0.clone(), R1.clone()),
    tri(V(-W / 2, EAVE, D), V(W / 2, EAVE, D), R1.clone()),
  ];
  const roofPanes = roofGeos.map((g) => { const m = new THREE.Mesh(g, M.glass); m.renderOrder = 3; roofGroup.add(m); m.receiveShadow = true; roofOcc.push(m); return m; });
  const roofBars = new THREE.Group(); roofGroup.add(roofBars);
  const addRoofBar = (a, b, t = 0.05) => bar(a, b, t, M.frame, { parent: roofBars, occ: false });
  addRoofBar(R0, R1, 0.1); addRoofBar(V(-W / 2, EAVE, D), R1, 0.09); addRoofBar(V(W / 2, EAVE, D), R1, 0.09);
  for (let z = 0.4; z < D; z += 0.55) [-1, 1].forEach((s) => {
    const t = Math.min(1, (D - z) / (D - HIPZ));
    addRoofBar(V(s * W / 2, EAVE, z), V(s * (W / 2 - (W / 2) * t), EAVE + (RIDGE - EAVE) * t, z), 0.045);
  });
  for (let x = -1.45; x <= 1.45; x += 0.58) {
    const t = (W / 2 - Math.abs(x)) / (W / 2);
    addRoofBar(V(x, EAVE, D), V(x, EAVE + (RIDGE - EAVE) * t, D - (D - HIPZ) * t), 0.045);
  }

  // ── sun, sky, compass, sun path
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunLight.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 70 });
  sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 0.025;
  sunLight.target.position.set(0, 0.5, 1.5);
  scene.add(sunLight, sunLight.target);
  const hemi = new THREE.HemisphereLight(0xdfe9f2, 0xb8a58a, 0.6); scene.add(hemi);
  const glow = new THREE.PointLight(0xfff3dc, 0, 6, 1.2); glow.position.set(0, 2.2, 1.6); scene.add(glow);
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), M.sun); scene.add(sunMesh);

  const world = new THREE.Group(); scene.add(world); // rotates with orientation (compass + sun path)
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
  const cx = cv.getContext('2d');
  cx.translate(512, 512); cx.strokeStyle = 'rgba(12,22,24,.55)'; cx.fillStyle = 'rgba(12,22,24,.75)';
  cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, 490, 0, Math.PI * 2); cx.stroke();
  cx.lineWidth = 1; cx.beginPath(); cx.arc(0, 0, 455, 0, Math.PI * 2); cx.stroke();
  for (let a = 0; a < 360; a += 5) { const r0 = a % 45 === 0 ? 425 : 470; cx.save(); cx.rotate((a * Math.PI) / 180); cx.beginPath(); cx.moveTo(0, -r0); cx.lineTo(0, -490); cx.stroke(); cx.restore(); }
  cx.font = '600 44px Geist Mono Variable, ui-monospace, monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([l, a]) => { const r = 395; const t = (a * Math.PI) / 180; cx.fillText(l, Math.sin(t) * r, -Math.cos(t) * r); });
  const ringTex = new THREE.CanvasTexture(cv); ringTex.colorSpace = THREE.SRGBColorSpace; ringTex.anisotropy = 4;
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; world.add(ring);
  const pathMat = new THREE.LineDashedMaterial({ color: 0xb0502c, dashSize: 0.35, gapSize: 0.25, transparent: true, opacity: 0.85 });
  let pathLine = null; const hourDots = new THREE.Group(); world.add(hourDots);

  // ── state
  const st = { face: 180, day: 172, minutes: 13 * 60, roof: 'glass', year: new Date().getFullYear() };
  let dirty = true;
  const req = () => { dirty = true; };
  controls.addEventListener('change', req);

  const dateFor = (minutes = st.minutes) => {
    const d0 = new Date(Date.UTC(st.year, 0, 1));
    const dd = new Date(d0.valueOf() + (st.day - 1) * 864e5);
    return londonDate(dd.getUTCFullYear(), dd.getUTCMonth(), dd.getUTCDate(), Math.floor(minutes / 60), Math.round(minutes % 60));
  };
  const theta = () => Math.PI - (st.face * Math.PI) / 180; // building rotation in world
  const sunDirLocal = (date) => {
    const p = sunPosition(date);
    const b = (p.bearing * Math.PI) / 180, a = p.altitude;
    const v = V(Math.sin(b) * Math.cos(a), Math.sin(a), -Math.cos(b) * Math.cos(a));
    v.applyAxisAngle(V(0, 1, 0), -theta());
    return { v, alt: p.altitudeDeg, bearing: p.bearing };
  };

  function applyRoof() {
    const r = st.roof;
    roofPanes.forEach((m) => {
      m.material = r === 'glass' ? M.glass : r === 'poly' ? M.poly : M.tile;
      m.castShadow = r !== 'glass';
      m.renderOrder = r === 'glass' ? 3 : 0;
    });
    roofBars.visible = r !== 'tile';
    req();
  }

  function buildPath() {
    if (pathLine) { world.remove(pathLine); pathLine.geometry.dispose(); }
    hourDots.clear();
    const pts = [];
    for (let m = 0; m <= 1440; m += 10) {
      const p = sunPosition(dateFor(m));
      if (p.altitudeDeg < -1) continue;
      const b = (p.bearing * Math.PI) / 180, a = p.altitude;
      const v = V(Math.sin(b) * Math.cos(a), Math.sin(a), -Math.cos(b) * Math.cos(a)).multiplyScalar(15);
      pts.push(v);
      if (m % 60 === 0) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M.sun); d.position.copy(v); hourDots.add(d); }
    }
    if (pts.length > 1) {
      pathLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), pathMat);
      pathLine.computeLineDistances(); world.add(pathLine);
    }
  }

  const skyDay = new THREE.Color(0xd9e4ea), skyGold = new THREE.Color(0xf1d2b0), skyNight = new THREE.Color(0x101a2a), tmpC = new THREE.Color();
  function updateSun() {
    const date = dateFor();
    const { v, alt, bearing } = sunDirLocal(date);
    world.rotation.y = -theta();
    const up = Math.max(0, Math.sin((alt * Math.PI) / 180));
    const vis = THREE.MathUtils.smoothstep(alt, -2, 3);
    sunLight.position.copy(v).multiplyScalar(30).add(sunLight.target.position);
    sunLight.intensity = 2.9 * vis * (0.35 + 0.65 * Math.min(1, up * 2.2));
    sunLight.color.setHSL(0.09, 0.85, THREE.MathUtils.lerp(0.62, 0.97, Math.min(1, alt / 25)));
    sunMesh.position.copy(v).multiplyScalar(15).applyAxisAngle(V(0, 1, 0), 0);
    sunMesh.visible = alt > -1;
    const day = THREE.MathUtils.smoothstep(alt, -8, 6);
    hemi.intensity = 0.12 + 0.62 * day;
    tmpC.copy(skyNight).lerp(skyDay, day).lerp(skyGold, (1 - Math.min(1, Math.abs(alt - 3) / 9)) * day * 0.75);
    scene.background.copy(tmpC);
    scene.fog.color.copy(tmpC);
    hemi.color.copy(tmpC);
    glow.intensity = st.roof === 'poly' ? 5.5 * vis * up : 0;
    // world-space sun path is in "world" group (rotated). Sun mesh is in local frame already.
    req();
    ui.onSun?.({ date, alt, bearing, times: sunTimes(dateFor(720)) });
  }

  // ── direct-sun measurement on the floor (geometry only)
  const ray = new THREE.Raycaster();
  const samples = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 9; j++) samples.push(V(-W / 2 + 0.3 + (i + 0.5) * ((W - 0.6) / 12), 0.03, 0.15 + (j + 0.5) * ((D - 0.4) / 9)));
  function litFraction(dir, roof, list = samples) {
    if (dir.y <= 0.01) return 0;
    const occ = roof === 'glass' ? occluders.concat(roofBars.children) : occluders.concat(roofOcc, roof === 'poly' ? roofBars.children : []);
    let lit = 0;
    ray.far = 40;
    for (const p of list) {
      ray.set(p, dir);
      if (ray.intersectObjects(occ, false).length === 0) lit++;
    }
    return lit / list.length;
  }
  const coarse = samples.filter((_, i) => i % 3 === 0);
  function dailyHours(roof) {
    let h = 0;
    for (let m = 0; m < 1440; m += 20) {
      const { v, alt } = sunDirLocal(dateFor(m));
      if (alt <= 0.5) continue;
      h += litFraction(v, roof, coarse) * (20 / 60);
    }
    return h;
  }
  let measureT = 0, pendingFull = false;
  function measure(full = true) {
    pendingFull = pendingFull || full;
    clearTimeout(measureT);
    measureT = setTimeout(() => {
      const doFull = pendingFull; pendingFull = false;
      const { v } = sunDirLocal(dateFor());
      const now = litFraction(v, st.roof);
      const out = { now };
      if (doFull) out.daily = { glass: dailyHours('glass'), poly: dailyHours('poly'), tile: dailyHours('tile') };
      ui.onMeasure?.(out, doFull);
    }, pendingFull ? 140 : 40);
  }

  // ── resize + loop
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); req();
  }
  new ResizeObserver(resize).observe(canvas);
  let playing = false, lastT = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    if (playing) {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      st.minutes += dt * 60; // one hour per second
      const tm = sunTimes(dateFor(720));
      const endM = (tm.sunset - dateFor(0)) / 60000 + 40;
      if (st.minutes > endM) st.minutes = Math.max(0, (tm.sunrise - dateFor(0)) / 60000 - 30);
      updateSun(); ui.onTime?.(st.minutes); measure(false);
    }
    lastT = t;
    if (controls.update() || dirty) { renderer.render(scene, camera); dirty = false; }
  }

  applyRoof(); buildPath(); updateSun(); resize(); measure(true);
  requestAnimationFrame(loop);

  const views = {
    garden: [V(-7.8, 5.4, 11.6), V(0, 1.1, 1.4)],
    inside: [V(-1.2, 1.55, 0.5), V(1.4, 1.0, 3.2)],
    above: [V(0.01, 17, 1.6), V(0, 0, 1.6)],
  };
  return {
    set(k, v) {
      st[k] = v;
      if (k === 'roof') { applyRoof(); updateSun(); measure(true); }
      if (k === 'day' || k === 'year') { buildPath(); updateSun(); measure(true); }
      if (k === 'face') { updateSun(); measure(true); }
      if (k === 'minutes') { updateSun(); measure(false); }
    },
    get: (k) => st[k],
    play(on) { playing = on; },
    view(name) {
      const [p, t] = views[name];
      const from = camera.position.clone(), ft = controls.target.clone(); const t0 = performance.now();
      controls.minDistance = name === 'inside' ? 0.5 : 4;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1100), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        camera.position.lerpVectors(from, p, e); controls.target.lerpVectors(ft, t, e); controls.update(); req();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
  };
}
