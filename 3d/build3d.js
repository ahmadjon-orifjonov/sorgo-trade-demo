// Процедурный веник из сорго: сборка по прокрутке (5 этапов).
// Схема-иллюстрация по образцу студийных фото: колокол метёлки, проволочная обмотка рукояти,
// двойные ряды прошивки тёмной нитью с узелками. Не модель конкретного изделия.
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

export function mountBroom({ canvas, section, onReady }) {
  const mobile = matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const shadows = !mobile;
  if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.2;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.32, 5.2);
  const target = new THREE.Vector3(0, 0.3, 0);

  // свет: тёплый ключ, два золотых контровых, мягкая подсветка снизу
  scene.add(new THREE.HemisphereLight(0xffe2b4, 0x140c06, 0.28));
  const key = new THREE.DirectionalLight(0xffd59a, 2.0);
  key.position.set(2.2, 3.4, 3.6);
  if (shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.8, bottom: -1.3, near: 1, far: 10 });
    key.shadow.radius = 5; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.01;
  }
  scene.add(key);
  const rimL = new THREE.DirectionalLight(0xffa94a, 4.2); rimL.position.set(-3.2, 2.2, -2.6); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffc56e, 2.6); rimR.position.set(3.2, 1, -2.4); scene.add(rimR);
  const glow = new THREE.PointLight(0xffbd6a, 5, 6, 2); glow.position.set(0, -0.4, 2.2); scene.add(glow);

  const broom = new THREE.Group(); scene.add(broom);

  // --- форма: шея (рукоять), колокол метёлки
  const NT = 1.28, NB = 0.46, FB = -0.92, R = 0.088, FH = 0.6;
  const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const H = t => R + (FH - R) * Math.pow(Math.min(1, t), 0.6);                        // полуширина: плавный колокол
  const Z = t => R * (1 + 0.25 * sstep(0, 0.12, t) - 0.95 * sstep(0.05, 0.75, t));      // толщина: валик под шеей, дальше плоско
  const Y = t => NB - t * (NB - FB);
  const TS = [0.05, 0.15, 0.32, 0.58];                                  // контрольные точки по высоте метёлки

  const rnd = (a, b) => a + Math.random() * (b - a);
  const N = mobile ? 480 : 1000;
  const fMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 });
  const mk = (geo, n) => { const m = new THREE.InstancedMesh(geo, fMat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.castShadow = shadows; broom.add(m); return m; };
  const tuftM = mk(new THREE.CylinderGeometry(0.6, 1, 1, 5, 1, true), N);   // щёточка над обмоткой
  const neckM = mk(new THREE.CylinderGeometry(1, 1, 1, 5, 1, true), N);
  const fanM = mk(new THREE.CylinderGeometry(1, 1, 1, 5, 1, true), N * 4);
  const tipM = mk(new THREE.CylinderGeometry(0.22, 1, 1, 5, 1, true), N);   // верх геометрии = кончик

  const fib = [];
  const col = new THREE.Color();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  for (let i = 0; i < N; i++) {
    const ang = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random());
    const u = Math.cos(ang) * rr, w = Math.sin(ang) * rr;              // положение в сечении шеи (−1…1)
    const jx = rnd(-0.02, 0.02), stray = Math.random() < 0.06;
    const tipY = FB - 0.06 * (1 - u * u) + rnd(-0.05, 0.03);
    const bow = t => -0.05 * u * u * t;
    const fin = t => V(u * H(t) + jx * t, Y(t), w * Z(t) * Math.sqrt(Math.max(0.05, 1 - u * u * 0.3)) + bow(t));
    const tip = fin(1); tip.y = tipY;
    if (stray) { tip.x += Math.sign(u || 1) * rnd(0.02, 0.1); tip.z += rnd(-0.05, 0.05); tip.y += rnd(-0.02, 0.06); }
    const tuft = V(u * R * 1.5, NT + 0.05 + rnd(0, 0.05), w * R * 1.5);   // срез верхушки — щёточка над обмоткой
    const S3 = [tuft, V(u * R, NT - 0.04, w * R), V(u * R, NB, w * R), ...TS.map(fin), tip];
    // S2 — обвязанная шея, метёлка ещё узкая
    const nar = t => V(u * (R + (H(t) - R) * 0.26), Y(t), w * Z(t) * 1.25);
    const S2 = [S3[0].clone(), S3[1].clone(), S3[2].clone(), ...TS.map(nar), V(u * (R + (FH - R) * 0.3), tipY, w * R * 0.5)];
    // S1 — собранный пучок, параллельные стебли
    const bx = u * R * 2.7, bz = w * R * 2.5;
    const S1 = [V(bx, NT + 0.07, bz), V(bx, NT - 0.04, bz), V(bx, NB, bz), ...TS.map(t => V(bx * (1 + 0.08 * t), Y(t), bz)), V(bx * 1.08, tipY, bz)];
    // S0 — разбросанные стебли
    const c = V(rnd(-2.6, 2.6), rnd(-1.5, 1.9), rnd(-2.4, 0.4));
    const d = V(rnd(-1, 1), rnd(-0.35, 0.35), rnd(-0.4, 0.4)).normalize();
    const L = 2.3, a0 = c.clone().addScaledVector(d, -L / 2);
    const S0 = [0, 0.05, 0.35, 0.42, 0.5, 0.6, 0.75, 1].map(f => a0.clone().addScaledVector(d, L * f));
    fib.push({ S: [S0, S1, S2, S3], delay: Math.random(), w: rnd(0.0038, 0.0068) * (stray ? 0.8 : 1) });
    // цвет: золото соломы, тёмные волокна, «AO» — задние волокна темнее
    const h = rnd(0.088, 0.125), s = rnd(0.62, 0.86);
    let l = rnd(0.24, 0.54) * (Math.random() < 0.14 ? 0.55 : 1);
    l *= (0.66 + 0.34 * ((w + 1) / 2)) * (0.8 + 0.2 * (1 - u * u));   // AO: задние и крайние волокна темнее
    col.setHSL(h, s, l * 0.85); neckM.setColorAt(i, col); col.setHSL(h, s * 0.9, l * 1.05); tuftM.setColorAt(i, col);
    for (let k = 0; k < 4; k++) { col.setHSL(h, s, l * (0.92 + k * 0.04)); fanM.setColorAt(i * 4 + k, col); }
    col.setHSL(h, s * 0.85, Math.min(0.62, l * 1.12)); tipM.setColorAt(i, col);
  }
  [tuftM, neckM, fanM, tipM].forEach(m => { m.instanceColor.needsUpdate = true; });

  // --- проволочная обмотка рукояти (спираль + плотные пояса) и петля
  class Helix extends THREE.Curve {
    constructor(y0, y1, turns, r, ph = 0) { super(); Object.assign(this, { y0, y1, turns, r, ph }); }
    getPoint(t, out = new THREE.Vector3()) { const a = this.ph + t * this.turns * Math.PI * 2; return out.set(Math.cos(a) * this.r, this.y0 + (this.y1 - this.y0) * t, Math.sin(a) * this.r); }
  }
  class Loop extends THREE.Curve {
    getPoint(t, out = new THREE.Vector3()) { const a = -Math.PI / 2 + t * Math.PI * 2; return out.set(Math.cos(a) * 0.05, NT + 0.09 + Math.sin(a) * 0.05 + 0.05, Math.sin(t * Math.PI * 6) * 0.004); }
  }
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x2b1d11, roughness: 0.38, metalness: 0.55 });
  const wr = R + 0.0065, seg = mobile ? 14 : 24;
  const wires = [
    new Helix(NB - 0.01, NB + 0.07, 7, wr + 0.002),
    new Helix(NB + 0.07, NT - 0.16, 5.5, wr, 0.4),
    new Helix(0.86, 0.91, 4, wr + 0.002, 1.1),
    new Helix(NT - 0.16, NT - 0.05, 6, wr + 0.002, 2),
    new Loop(),
  ].map((c, k) => {
    const turns = c.turns || 2;
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, Math.ceil(turns * seg), k === 4 ? 0.0065 : 0.0058, 6, false), wireMat);
    m.castShadow = shadows; m.geometry.setDrawRange(0, 0); broom.add(m); return m;
  });

  // --- ряды прошивки: двойная тёмная нить спереди и сзади, узелки
  const twine = new THREE.MeshStandardMaterial({ color: 0x3a2717, roughness: 0.7 });
  const knotMat = new THREE.MeshStandardMaterial({ color: 0x2e1f12, roughness: 0.6 });
  const th = (x, t) => { const q = Math.min(1, Math.abs(x) / H(t)); return Z(t) * Math.sqrt(Math.max(0, 1 - q * q * 0.85)); };
  const bowF = (x, t) => { const q = Math.min(1, Math.abs(x) / H(t)); return -0.05 * q * q * t; };
  const PITCH = 0.08;
  const makeRows = ts => {
    const g = new THREE.Group(); const rows = [];
    for (const t0 of ts) {
      const tubes = [];
      for (const dt of [-0.0042, 0.0042]) {
        const t = t0 + dt / (NB - FB);
        for (const side of [1, -1]) {
          const pts = []; const h = H(t) * 0.985;
          for (let k = 0; k <= 96; k++) {
            const x = -h + (2 * h * k) / 96;
            const dip = 0;
            pts.push(V(x, Y(t) + 0.002 * Math.sin(x * 37 + t0 * 9), bowF(x, t) + side * (th(x, t) + 0.0105 + dip)));
          }
          const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), mobile ? 90 : 160, 0.0058, 5, false), twine);
          m.castShadow = shadows; m.geometry.setDrawRange(0, 0); g.add(m); tubes.push(m);
        }
      }
      // узелки на лицевой стороне, где нить уходит внутрь
      const h = H(t0); const nK = Math.floor((2 * h) / PITCH);
      const knots = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), knotMat, nK);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(0.0068, 0.0105, 0.0045);
      for (let k = 0; k < nK; k++) {
        const x = -h + PITCH / 2 + k * PITCH + (h * 2 - nK * PITCH) / 2;
        p.set(x, Y(t0), bowF(x, t0) + th(x, t0) + 0.0125);
        m4.compose(p, q, s); knots.setMatrixAt(k, m4);
      }
      knots.count = 0; knots.castShadow = shadows; g.add(knots);
      rows.push({ tubes, knots, nK });
    }
    broom.add(g); return { g, rows };
  };
  const ROWS = { 2: makeRows([0.3, 0.5]), 3: makeRows([0.26, 0.42, 0.58]) };

  // --- тень: мягкий контакт + карта теней на компьютере
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const g2 = sc.getContext('2d'); const grd = g2.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,.62)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g2.fillStyle = grd; g2.fillRect(0, 0, 128, 128);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = FB - 0.09; scene.add(contact);
  if (shadows) {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.42 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = FB - 0.085; ground.receiveShadow = true; scene.add(ground);
  }

  // --- состояние и раскладка
  const model = { rows: 2, scale: 1 };
  let progress = 0, shownScale = 1;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = V(0, 1, 0);
  const mid = V(0, 0, 0), dir = V(0, 0, 0), sv = V(0, 0, 0);
  const pts = Array.from({ length: 8 }, () => V(0, 0, 0));
  const ease = t => t * t * (3 - 2 * t);
  const clamp = t => Math.max(0, Math.min(1, t));
  const seg2 = (mesh, idx, a, b, w) => {
    dir.subVectors(b, a); const len = dir.length() || 1e-4;
    mid.addVectors(a, b).multiplyScalar(0.5);
    q.setFromUnitVectors(up, dir.multiplyScalar(1 / len));
    m4.compose(mid, q, sv.set(w, len, w));
    mesh.setMatrixAt(idx, m4);
  };
  const reveal = (mesh, k) => { const n = mesh.geometry.index.count; mesh.geometry.setDrawRange(0, Math.floor((n * clamp(k)) / 3) * 3); };

  function layout() {
    const P = progress * 4;
    for (let i = 0; i < N; i++) {
      const f = fib[i];
      const pv = P < 1 ? ease(clamp((P - f.delay * 0.35) / 0.65))
        : P < 2 ? 1 + ease(clamp(P - 1 - f.delay * 0.15))
        : 2 + ease(clamp((P - 2) / 0.6));
      const s = Math.min(2, Math.floor(pv)), t = pv - s;
      for (let j = 0; j < 8; j++) pts[j].copy(f.S[s][j]).lerp(f.S[s + 1][j], t);
      seg2(tuftM, i, pts[0], pts[1], f.w * 1.05);
      seg2(neckM, i, pts[1], pts[2], f.w * 1.1);
      for (let k = 0; k < 4; k++) seg2(fanM, i * 4 + k, pts[k + 2], pts[k + 3], f.w * (1 - k * 0.04));
      seg2(tipM, i, pts[6], pts[7], f.w * 0.85);
    }
    tuftM.instanceMatrix.needsUpdate = neckM.instanceMatrix.needsUpdate = fanM.instanceMatrix.needsUpdate = tipM.instanceMatrix.needsUpdate = true;
    // обмотка: пояс → спираль → средний пояс → верхний пояс → петля
    const wt = clamp((P - 1.1) / 0.85) * wires.length;
    wires.forEach((m, k) => reveal(m, wt - k));
    // прошивка
    const rowT = clamp((P - 2.55) / 0.6);
    for (const [n, R2] of Object.entries(ROWS)) {
      const on = +n === model.rows; R2.g.visible = on;
      if (!on) continue;
      R2.rows.forEach((r, k) => {
        const kk = ease(clamp(rowT * R2.rows.length - k));
        r.tubes.forEach(m => reveal(m, kk));
        r.knots.count = Math.floor(r.nK * clamp(kk * 1.02));
      });
    }
  }

  // --- размер и рендер
  let w = 0, h = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (r.width === w && r.height === h) return;
    w = r.width; h = r.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w / h < 0.9;
    camera.fov = narrow ? 34 : 30;
    camera.position.z = narrow ? 5.4 : 5.7;
    target.y = narrow ? 0.36 : 0.3;
    camera.updateProjectionMatrix();
  };
  let visible = true, raf = 0, last = performance.now(), dirty = true, px = 0, py = 0;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = now => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    resize();
    if (dirty) { layout(); dirty = false; }
    const P = progress * 4;
    shownScale += (model.scale - shownScale) * Math.min(1, dt * 6);
    broom.scale.setScalar(shownScale);
    const sway = P > 3.2 && !still ? Math.sin(now / 1000 * 0.6) * 0.38 : 0;
    broom.rotation.y = (1 - progress) * -0.9 + sway + px * 0.3;
    broom.rotation.x = py * 0.06;
    broom.position.y = (1 - shownScale) * -0.92;
    camera.lookAt(target);
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  const onScroll = () => {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = clamp(-r.top / (total || 1));
    if (Math.abs(p - progress) > 0.0005) { progress = p; dirty = true; }
    kick();
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { dirty = true; kick(); });
  if (!mobile && !still) canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5; kick(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(section);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  onScroll(); layout();
  const ready = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve();
  ready.then(() => { resize(); camera.lookAt(target); renderer.render(scene, camera); onReady && onReady(); kick(); });

  return {
    setModel(rows, scale) { model.rows = rows; model.scale = scale; dirty = true; kick(); },
  };
}
