// Процедурный веник из сорго: сборка по прокрутке (5 этапов).
// Схема-иллюстрация, не модель конкретного изделия.
import * as THREE from './vendor/three.module.min.js';

export function mountBroom({ canvas, section, onReady }) {
  const mobile = matchMedia('(max-width: 760px)').matches || navigator.hardwareConcurrency <= 4;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.35, 5.2);
  const target = new THREE.Vector3(0, 0.15, 0);

  scene.add(new THREE.HemisphereLight(0xffe9c2, 0x2a1d10, 0.75));
  const key = new THREE.DirectionalLight(0xffdca0, 2.6); key.position.set(2.2, 2.6, 3.2); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb653, 3.2); rim.position.set(-2.8, 1.8, -2.6); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffcf86, 1.4); rim2.position.set(3, 0.5, -2); scene.add(rim2);

  const broom = new THREE.Group(); scene.add(broom);

  // --- волокна: 2 сегмента на стебель (рукоять + метёлка)
  const N = mobile ? 420 : 900;
  const geo = new THREE.CylinderGeometry(1, 1, 1, 4, 1, true);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0, side: THREE.DoubleSide });
  const fibers = new THREE.InstancedMesh(geo, mat, N * 2);
  fibers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  broom.add(fibers);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const NECK_TOP = 1.28, NECK_BOT = 0.48, FAN_BOT = -0.9, NECK_R = 0.075, FAN_HALF = 0.56;
  const st = []; // per fiber: states [S0..S3] of points P0 (top), P1 (joint), P2 (bottom)
  const color = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const ang = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * NECK_R;
    const xn = Math.cos(ang) * r, zn = Math.sin(ang) * r;
    const u = xn / NECK_R;
    const xb = u * FAN_HALF + rnd(-0.015, 0.015), zb = zn * 0.3;
    const bot = FAN_BOT + rnd(-0.04, 0.02) - (1 - Math.abs(u)) * 0.03;
    // S0 — разбросанные стебли
    const c = new THREE.Vector3(rnd(-2.6, 2.6), rnd(-1.5, 1.9), rnd(-2.4, 0.4));
    const d = new THREE.Vector3(rnd(-1, 1), rnd(-0.35, 0.35), rnd(-0.4, 0.4)).normalize();
    const L = 2.15, a0 = c.clone().addScaledVector(d, -L / 2);
    const S0 = [a0, a0.clone().addScaledVector(d, 0.8), a0.clone().addScaledVector(d, L)];
    // S1 — собранный пучок (параллельно)
    const S1 = [new THREE.Vector3(xn * 2.6, NECK_TOP, zn * 2.4), new THREE.Vector3(xn * 2.6, NECK_BOT, zn * 2.4), new THREE.Vector3(xn * 2.9, bot, zn * 2.6)];
    // S2 — обвязанная рукоять
    const S2 = [new THREE.Vector3(xn, NECK_TOP, zn), new THREE.Vector3(xn, NECK_BOT, zn), new THREE.Vector3(xn * 2.2, bot, zn * 1.6)];
    // S3 — расплющенная метёлка
    const S3 = [new THREE.Vector3(xn, NECK_TOP, zn), new THREE.Vector3(xn * 1.05, NECK_BOT, zn * 0.9), new THREE.Vector3(xb, bot, zb)];
    st.push({ S: [S0, S1, S2, S3], delay: Math.random(), w: rnd(0.0045, 0.0075) });
    const h = rnd(0.105, 0.135), s = rnd(0.55, 0.75), l = rnd(0.52, 0.68);
    color.setHSL(h, s, l);
    fibers.setColorAt(i * 2, color);
    color.setHSL(h, s, l * rnd(0.9, 1.05));
    fibers.setColorAt(i * 2 + 1, color);
  }
  fibers.instanceColor.needsUpdate = true;

  // --- обвязка рукояти
  const threadMat = new THREE.MeshStandardMaterial({ color: 0x1a120b, roughness: 0.45, metalness: 0.2 });
  const wraps = [];
  for (let k = 0; k < 7; k++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(NECK_R + 0.006, 0.011, 6, 28), threadMat);
    t.rotation.x = Math.PI / 2;
    t.position.y = NECK_BOT + 0.1 + k * 0.1;
    t.scale.setScalar(0.001);
    broom.add(t); wraps.push(t);
  }
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 24), threadMat);
  loop.position.y = NECK_TOP + 0.05; loop.scale.setScalar(0.001); broom.add(loop);

  // --- ряды прошивки (стежки на обеих сторонах)
  const fanT = y => (NECK_BOT - y) / (NECK_BOT - FAN_BOT);
  const halfAt = y => 0.075 + fanT(y) * (FAN_HALF - 0.075);
  const thickAt = y => NECK_R * 0.9 + fanT(y) * (NECK_R * 0.3 - NECK_R * 0.9);
  const ROWS_Y = { 2: [0.02, -0.3], 3: [0.12, -0.12, -0.38] };
  const K = 30;
  const stitchGeo = new THREE.BoxGeometry(1, 1, 1);
  const stitchMat = new THREE.MeshStandardMaterial({ color: 0xb3321f, roughness: 0.5 });
  const stitches = new THREE.InstancedMesh(stitchGeo, stitchMat, 3 * K * 2);
  stitches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  broom.add(stitches);

  // --- мягкая тень
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const g = sc.getContext('2d'); const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,.6)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = FAN_BOT - 0.06; scene.add(shadow);

  // --- состояние
  const model = { rows: 2, scale: 1 };
  let progress = 0, shownScale = 1;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3(), sv = new THREE.Vector3();
  const ease = t => t * t * (3 - 2 * t);
  const clamp = t => Math.max(0, Math.min(1, t));
  const lerpState = (S, p, j, out) => { // p в [0,3]
    const s = Math.min(2, Math.floor(p)); const t = p - s;
    return out.copy(S[s][j]).lerp(S[s + 1][j], t);
  };
  const seg = (idx, a, b, w) => {
    dir.subVectors(b, a); const len = dir.length() || 1e-4;
    mid.addVectors(a, b).multiplyScalar(0.5);
    q.setFromUnitVectors(up, dir.multiplyScalar(1 / len));
    m4.compose(mid, q, sv.set(w, len, w));
    fibers.setMatrixAt(idx, m4);
  };
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();

  function layout() {
    // progress 0..1 → этапы: 0 стебли, 1 пучок, 2 обвязка, 3 прошивка, 4 готово
    const P = progress * 4; // 0..4
    for (let i = 0; i < N; i++) {
      const f = st[i];
      const pv = P < 1 ? ease(clamp((P - f.delay * 0.35) / 0.65))
        : P < 2 ? 1 + ease(clamp(P - 1 - f.delay * 0.15))
        : 2 + ease(clamp((P - 2) / 0.6));
      lerpState(f.S, Math.min(3, pv), 0, p0); lerpState(f.S, Math.min(3, pv), 1, p1); lerpState(f.S, Math.min(3, pv), 2, p2);
      seg(i * 2, p0, p1, f.w * 1.15); seg(i * 2 + 1, p1, p2, f.w);
    }
    fibers.instanceMatrix.needsUpdate = true;
    const wrapT = clamp((P - 1.1) / 0.8);
    wraps.forEach((w, k) => w.scale.setScalar(Math.max(0.001, ease(clamp(wrapT * 1.6 - k * 0.1)))));
    loop.scale.setScalar(Math.max(0.001, ease(clamp(wrapT * 1.4 - 0.4))));
    const rowT = clamp((P - 2.55) / 0.6);
    const ys = ROWS_Y[model.rows];
    let n = 0;
    for (let r = 0; r < 3; r++) {
      const y = ys[r];
      const show = y === undefined ? 0 : ease(clamp(rowT * ys.length - r));
      const half = y === undefined ? 0 : halfAt(y);
      for (let k = 0; k < K; k++) {
        for (let side = 0; side < 2; side++) {
          const x = -half + (k + side * 0.5 + 0.25) / K * half * 2;
          const visible = show > 0.001 && (k + 0.5) / K <= show + 0.02;
          const z = (y === undefined ? 0 : thickAt(y)) + 0.012;
          mid.set(x, y || 0, side ? -z : z);
          q.identity();
          m4.compose(mid, q, visible ? sv.set(half * 2 / K * 0.78, 0.024, 0.018) : sv.set(0, 0, 0));
          stitches.setMatrixAt(n++, m4);
        }
      }
    }
    stitches.instanceMatrix.needsUpdate = true;
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
    camera.position.z = narrow ? 4.6 : 5.2;
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
    const sway = P > 3.2 && !still ? Math.sin(now / 1000 * 0.7) * 0.42 : 0;
    broom.rotation.y = (1 - progress) * -0.9 + sway + px * 0.3;
    broom.rotation.x = py * 0.08;
    broom.position.y = (1 - shownScale) * -0.9;
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
  ready.then(() => { resize(); renderer.render(scene, camera); onReady && onReady(); kick(); });

  return {
    setModel(rows, scale) { model.rows = rows; model.scale = scale; dirty = true; kick(); },
  };
}
