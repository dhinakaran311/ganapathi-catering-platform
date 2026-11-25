// components/site/tiffin/scene.ts — Three.js scene: a stainless-steel tiffin
// carrier standing on a banana leaf. Framework-agnostic; loaded lazily by
// TiffinShowcase so three.js never blocks the first paint.
//
// Everything is procedural (lathe geometry + canvas textures): no model or
// texture downloads.
//
// Interaction
//   • drag (mouse / touch / pen) turns the tiffin; inertia on release
//   • pointer hover adds a gentle tilt (fine pointers only)
//   • setOpen(true) lifts the tiers apart to reveal the food inside
// Performance
//   • device-pixel-ratio capped; renders only while visible and the tab is
//     active; reduced-motion → no idle spin, instant open/close
//   • everything disposed on teardown

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface TiffinController {
  setOpen: (open: boolean) => void;
  dispose: () => void;
}

interface Options {
  reducedMotion: boolean;
  onReady?: () => void;
}

// ── Dimensions ───────────────────────────────────────────────────────────────
const R = 1;         // tier radius
const H = 0.56;      // tier height
const STEP = H - 0.03; // stacking step (tiers nest slightly)
const TIERS = 3;
const OPEN_GAP = 0.46;

// ── Small deterministic RNG so textures look the same every load ─────────────
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ── Food textures (top → bottom tier) ────────────────────────────────────────
function idlyTexture() {
  return canvasTexture(512, (ctx, s) => {
    const r = rng(7);
    ctx.fillStyle = '#E9D9B4';
    ctx.fillRect(0, 0, s, s);
    // coconut chutney + sambar pools
    ctx.fillStyle = '#C9D7A0';
    ctx.beginPath(); ctx.ellipse(s * 0.28, s * 0.72, s * 0.16, s * 0.11, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#C0682A';
    ctx.beginPath(); ctx.ellipse(s * 0.74, s * 0.7, s * 0.15, s * 0.12, -0.3, 0, Math.PI * 2); ctx.fill();
    // idlies: soft white domes
    const spots = [[0.32, 0.32], [0.62, 0.3], [0.5, 0.52], [0.24, 0.52], [0.76, 0.48]];
    for (const [x, y] of spots) {
      const g = ctx.createRadialGradient(s * x - 12, s * y - 14, 6, s * x, s * y, s * 0.12);
      g.addColorStop(0, '#FFFFFB');
      g.addColorStop(0.75, '#F2EBDA');
      g.addColorStop(1, '#D9CBA8');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s * x, s * y, s * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(120,90,40,${0.05 + r() * 0.08})`;
      ctx.fillRect(r() * s, r() * s, 2, 2);
    }
  });
}

function mealsTexture() {
  return canvasTexture(512, (ctx, s) => {
    const r = rng(11);
    ctx.fillStyle = '#B85F23'; // sambar
    ctx.fillRect(0, 0, s, s);
    // rice mound
    ctx.fillStyle = '#F7F3E8';
    ctx.beginPath(); ctx.ellipse(s * 0.38, s * 0.42, s * 0.3, s * 0.26, 0.2, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 900; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * s * 0.27;
      ctx.fillStyle = r() > 0.5 ? '#FFFFFF' : '#E7DFCB';
      ctx.save();
      ctx.translate(s * 0.38 + Math.cos(a) * d, s * 0.42 + Math.sin(a) * d * 0.88);
      ctx.rotate(r() * Math.PI);
      ctx.fillRect(-3, -1, 6, 2);
      ctx.restore();
    }
    // poriyal (beans + coconut) and vegetable bits in the sambar
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = r() > 0.4 ? '#5E8F2E' : '#E8DDB5';
      ctx.fillRect(s * (0.62 + r() * 0.3), s * (0.12 + r() * 0.3), 5, 4);
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = r() > 0.5 ? '#E2A23B' : '#7B3A12';
      ctx.beginPath(); ctx.arc(r() * s, s * (0.6 + r() * 0.4), 3 + r() * 5, 0, Math.PI * 2); ctx.fill();
    }
  });
}

function curryTexture() {
  return canvasTexture(512, (ctx, s) => {
    const r = rng(23);
    ctx.fillStyle = '#6E2410'; // country chicken curry
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 26; i++) {
      const x = r() * s, y = r() * s, rad = 14 + r() * 26;
      const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 2, x, y, rad);
      g.addColorStop(0, '#B4532A');
      g.addColorStop(1, '#5A1D0B');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, rad, rad * 0.75, r() * 3, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 120; i++) { // oil + curry leaves
      ctx.fillStyle = r() > 0.75 ? '#2F5A1E' : `rgba(240,170,60,${0.25 + r() * 0.35})`;
      ctx.beginPath(); ctx.arc(r() * s, r() * s, 2 + r() * 4, 0, Math.PI * 2); ctx.fill();
    }
  });
}

// ── Banana leaf + soft contact shadow ────────────────────────────────────────
function leafTexture() {
  const w = 1024, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const r = rng(3);

  ctx.beginPath();
  ctx.moveTo(30, h * 0.52);
  ctx.bezierCurveTo(w * 0.22, h * 0.02, w * 0.78, h * 0.0, w - 12, h * 0.42);
  ctx.bezierCurveTo(w * 0.8, h * 0.98, w * 0.2, h * 1.0, 30, h * 0.52);
  ctx.closePath();
  ctx.fillStyle = '#3F7A26';
  ctx.fill();
  ctx.save();
  ctx.clip();
  // lighter half + parallel veins
  ctx.fillStyle = 'rgba(160,200,90,0.25)';
  ctx.fillRect(0, 0, w, h * 0.5);
  ctx.strokeStyle = 'rgba(20,50,10,0.22)';
  ctx.lineWidth = 2;
  for (let x = -h; x < w; x += 16 + r() * 6) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h * 0.55, h * 0.5); ctx.lineTo(x, h); ctx.stroke();
  }
  // a few natural tears at the edge
  ctx.strokeStyle = 'rgba(251,247,240,0.9)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const x = w * (0.2 + r() * 0.6);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, h * 0.18); ctx.stroke();
  }
  ctx.restore();
  // midrib
  ctx.strokeStyle = '#B5CC7A';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(26, h * 0.52); ctx.quadraticCurveTo(w * 0.5, h * 0.47, w - 14, h * 0.43); ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function shadowTexture() {
  return canvasTexture(256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(10,25,8,0.55)');
    g.addColorStop(0.55, 'rgba(10,25,8,0.2)');
    g.addColorStop(1, 'rgba(10,25,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

// ── Geometry ─────────────────────────────────────────────────────────────────
function tierGeometry() {
  const p = [
    [0, 0], [R - 0.08, 0], [R - 0.02, 0.015], [R, 0.06],
    [R, 0.19], [R - 0.014, 0.205], [R, 0.22],           // decorative groove
    [R, H - 0.07], [R + 0.035, H - 0.045], [R + 0.035, H - 0.02], // rolled rim
    [R - 0.005, H], [R - 0.04, H], [R - 0.045, H - 0.03],
    [R - 0.045, 0.06], [0, 0.05],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(p, 96);
}

function lidGeometry() {
  const p = [
    [0, 0.31], [0.08, 0.31], [0.1, 0.285], [0.065, 0.24], [0.12, 0.215],
    [0.5, 0.18], [R - 0.06, 0.09], [R + 0.03, 0.035], [R + 0.03, 0],
    [R - 0.035, 0], [R - 0.035, -0.05],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(p, 96);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createTiffinScene(canvas: HTMLCanvasElement, opts: Options): TiffinController {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  scene.add(new THREE.HemisphereLight(0xfff6e5, 0x2b3a1e, 0.55));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.4);
  key.position.set(3, 6, 4);
  scene.add(key);

  // Materials
  const steel = new THREE.MeshStandardMaterial({ color: 0xe4e7ea, metalness: 1, roughness: 0.2 });
  const steelSoft = new THREE.MeshStandardMaterial({ color: 0xd5d9dc, metalness: 1, roughness: 0.32, side: THREE.DoubleSide });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 1, roughness: 0.28, transparent: true });

  const foodTextures = [idlyTexture(), mealsTexture(), curryTexture()]; // top → bottom
  const foodMats = foodTextures.map((map) => new THREE.MeshStandardMaterial({ map, roughness: 0.85, metalness: 0 }));

  const tierGeo = tierGeometry();
  const foodGeo = new THREE.CircleGeometry(R - 0.05, 64);
  const lidGeo = lidGeometry();

  const root = new THREE.Group();
  scene.add(root);

  // Tiers: index 0 = bottom (special non-veg) … 2 = top (morning tiffin)
  const tiers: THREE.Group[] = [];
  for (let i = 0; i < TIERS; i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(tierGeo, steel));
    const food = new THREE.Mesh(foodGeo, foodMats[TIERS - 1 - i]);
    food.rotation.x = -Math.PI / 2;
    food.position.y = H - 0.13;
    g.add(food);
    g.position.y = i * STEP;
    root.add(g);
    tiers.push(g);
  }

  const lid = new THREE.Mesh(lidGeo, steelSoft);
  root.add(lid);

  // Clamp frame: two side straps + an arched carry handle
  const frame = new THREE.Group();
  const strapH = TIERS * STEP + 0.42;
  const strapGeo = new THREE.BoxGeometry(0.075, strapH, 0.035);
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(strapGeo, frameMat);
    strap.position.set(side * (R + 0.075), strapH / 2 + 0.04, 0);
    frame.add(strap);
  }
  const handleGeo = new THREE.TorusGeometry(R + 0.075, 0.032, 12, 64, Math.PI);
  const handle = new THREE.Mesh(handleGeo, frameMat);
  handle.scale.set(1, 0.42, 1);
  handle.position.y = strapH + 0.04;
  frame.add(handle);
  root.add(frame);

  // Banana leaf + contact shadow
  const leafTex = leafTexture();
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, transparent: true, roughness: 0.6, metalness: 0, alphaTest: 0.02 });
  const leafGeo = new THREE.PlaneGeometry(5.6, 2.8);
  const leaf = new THREE.Mesh(leafGeo, leafMat);
  leaf.rotation.set(-Math.PI / 2, 0, 0.38);
  leaf.position.y = -0.005;
  scene.add(leaf);

  const shadowTex = shadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const shadowGeo = new THREE.PlaneGeometry(3.1, 3.1);
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  scene.add(shadow);

  // ── State ──────────────────────────────────────────────────────────────────
  let openTarget = 0;
  let openT = 0;          // 0 closed … 1 open (linear progress)
  let yaw = -0.5;
  let yawVel = opts.reducedMotion ? 0 : 0.12;
  let tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
  let dragging = false;
  let lastX = 0;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let readyFired = false;

  function layout(t: number) {
    const e = easeInOut(t);
    tiers.forEach((g, i) => {
      g.position.y = i * STEP + i * OPEN_GAP * e;
      g.rotation.y = i * 0.32 * e;
    });
    lid.position.y = TIERS * STEP + TIERS * OPEN_GAP * e + 0.4 * e;
    lid.position.z = -0.25 * e;
    lid.rotation.x = -0.42 * e;
    frameMat.opacity = 1 - Math.min(1, e * 1.6);
    frame.visible = frameMat.opacity > 0.01;

    const centerY = 0.95 + 0.62 * e;
    camera.position.set(0, 2.4 + 0.55 * e, 8.4 + 1.4 * e);
    camera.lookAt(0, centerY, 0);
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole stack in frame on narrow/tall canvases.
    camera.fov = camera.aspect < 0.8 ? 36 : 30;
    camera.updateProjectionMatrix();
  }

  function frameTick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // open/close progress
    if (opts.reducedMotion) openT = openTarget;
    else openT += Math.sign(openTarget - openT) * Math.min(Math.abs(openTarget - openT), dt * 1.4);

    // rotation: idle spin + drag inertia
    if (!dragging) {
      const idle = opts.reducedMotion ? 0 : 0.12;
      yawVel += (idle - yawVel) * Math.min(1, dt * 1.5);
      yaw += yawVel * dt;
    }
    tiltX += (tiltTX - tiltX) * Math.min(1, dt * 4);
    tiltY += (tiltTY - tiltY) * Math.min(1, dt * 4);

    root.rotation.set(tiltX, yaw + tiltY, 0);
    layout(openT);
    renderer.render(scene, camera);

    if (!readyFired) {
      readyFired = true;
      opts.onReady?.();
    }
  }

  function loop(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    frameTick(now);
    const settled = opts.reducedMotion && !dragging && openT === openTarget &&
      Math.abs(tiltX - tiltTX) < 1e-3 && Math.abs(tiltY - tiltTY) < 1e-3;
    if (!settled) raf = requestAnimationFrame(loop);
  }

  function kick() {
    if (!raf && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  // ── Input ────────────────────────────────────────────────────────────────
  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    yawVel = 0;
    canvas.setPointerCapture?.(e.pointerId);
    kick();
  };
  const onPointerMove = (e: PointerEvent) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      const d = dx * 0.008;
      yaw += d;
      yawVel = d * 60;
      kick();
    } else if (e.pointerType === 'mouse') {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      tiltTY = nx * 0.35;
      tiltTX = ny * 0.12;
      kick();
    }
  };
  const endDrag = () => { dragging = false; kick(); };
  const onPointerLeave = () => { tiltTX = 0; tiltTY = 0; kick(); };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', onPointerLeave);

  const ro = new ResizeObserver(() => { resize(); kick(); });
  ro.observe(canvas);

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    kick();
  });
  io.observe(canvas);

  const onVisibility = () => kick();
  document.addEventListener('visibilitychange', onVisibility);

  resize();
  layout(0);
  kick();

  return {
    setOpen(open: boolean) {
      openTarget = open ? 1 : 0;
      kick();
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      [tierGeo, foodGeo, lidGeo, strapGeo, handleGeo, leafGeo, shadowGeo].forEach((g) => g.dispose());
      [steel, steelSoft, frameMat, leafMat, shadowMat, ...foodMats].forEach((m) => m.dispose());
      [leafTex, shadowTex, ...foodTextures].forEach((t) => t.dispose());
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
