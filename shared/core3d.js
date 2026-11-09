/* M.H.C 3D engine shared by all the models: stage (renderer, bloom, final grade, adaptive quality), procedural charcoal
   (geometry + material with glowing cracks), shatter, embers, smoke, flames, the real extruded logo, bags, boxes, containers. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE, mergeGeometries, mergeVertices, RoundedBoxGeometry };
const Kit = window.Kit;
export const GOLD = 0xD9AE2E, GOLD_DEEP = 0xB48B0B, INK = 0x0D0D0D;

/* ---------- small helpers ---------- */
export const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const hasGL = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (_) { return false; } };
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Interpolates keyframes {t, ...numbers/arrays}; a keyframe's t is on the same axis as x
export const keyed = (keys, x) => {
  if (x <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (x < b.t) {
      const k = sstep(a.t, b.t, x), o = {};
      for (const n in a) {
        if (n === 't') continue;
        o[n] = Array.isArray(a[n]) ? a[n].map((v, j) => lerp(v, b[n][j], k)) : lerp(a[n], b[n], k);
      }
      return o;
    }
  }
  return keys[keys.length - 1];
};

export function detectTier() {
  const q = new URLSearchParams(location.search).get('q');
  if (q) return +q;
  let r = '';
  try { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl && gl.getExtension('WEBGL_debug_renderer_info'); if (e) r = gl.getParameter(e.UNMASKED_RENDERER_WEBGL) || ''; } catch (_) { /* no info */ }
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);
  if (mobile) return /Adreno \(TM\) (7|8)\d\d|Mali-G7[1-9]|Mali-G[6-9]\d\d|Apple/i.test(r) ? 2 : 1;
  if (/SwiftShader|llvmpipe|Software/i.test(r)) return 1;
  if (/RTX|GTX|Radeon RX|Radeon Pro|Apple M|Arc\(TM\)|Arc A/i.test(r)) return 3;
  return 2;
}

/* ---------- final image: heat haze, slight lens fringe, filmic tone curve, vignette, grain ---------- */
const FinalShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uHaze: { value: 0 }, uGrain: { value: 0.035 }, uVig: { value: 0.5 }, uCA: { value: 0.0 }, uExp: { value: 1 }, uTone: { value: 0 }, uFade: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uBg: { value: new THREE.Color(0, 0, 0) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime,uHaze,uGrain,uVig,uCA,uExp,uTone,uFade; uniform vec2 uRes; uniform vec3 uBg; varying vec2 vUv;
    vec3 aces(vec3 x){ x*=.6; return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
    vec3 neutral(vec3 c){ float x=min(c.r,min(c.g,c.b)); float o=x<.08?x-6.25*x*x:.04; c-=o; float p=max(c.r,max(c.g,c.b)); if(p<.8) return c; float d=.2; float np=1.-d*d/(p+d-.8); c*=np/p; float g=1.-1./(.15*(p-np)+1.); return mix(c,vec3(np),g); }
    float hash(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
    void main(){
      vec2 uv=vUv;
      if(uHaze>.001){ float h=uHaze*(1.15-uv.y*.9); uv.x+=(sin(uv.y*62.+uTime*4.6)*.0018+sin(uv.y*131.-uTime*7.3+uv.x*24.)*.0011)*h; uv.y+=sin(uv.x*48.+uTime*3.7)*.0012*h; }
      vec2 d=uv-.5; float r2=dot(d,d); vec3 c;
      if(uCA>.0001){ c.r=texture2D(tDiffuse,uv+d*r2*uCA).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-d*r2*uCA).b; } else c=texture2D(tDiffuse,uv).rgb;
      c=min(max(c,vec3(0.)),vec3(40.));
      if(!(c.r==c.r&&c.g==c.g&&c.b==c.b)) c=vec3(0.);
      c*=uExp;
      c=uTone<.5?aces(c):neutral(c);
      c*=1.-uVig*smoothstep(.12,.72,r2*1.55);
      c=mix(c*12.92,1.055*pow(max(c,vec3(.0031308)),vec3(1./2.4))-.055,step(.0031308,c));
      c=mix(c,uBg,uFade);
      c+=(hash(gl_FragCoord.xy+fract(uTime*7.)*311.)-.5)*uGrain;
      gl_FragColor=vec4(c,1.);
    }`
};

/* ---------- stage ---------- */
export class Stage {
  constructor(o = {}) {
    const { canvas, fov = 30, near = 0.1, far = 300, background = 0x050505, bloom = { strength: 0.5, radius: 0.65, threshold: 0.95 }, exposure = 1, tone = 0, vignette = 0.5, grain = 0.03, ca = 0, dprMax = 2, msaa = true, bloomScale = 1 } = o;
    this.canvas = canvas; this.tier = detectTier(); this.level = 0; this.active = true; this.time = 0; this.fps = 60;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.background = background === null ? null : new THREE.Color(background);
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);
    this.dprMax = Math.min(window.devicePixelRatio || 1, dprMax, this.tier === 1 ? 1.75 : dprMax);
    this.dpr = this.dprMax;
    this.samples = msaa ? (this.tier >= 3 ? 4 : this.tier === 2 ? 2 : 0) : 0;
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: this.samples });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = null;
    if (bloom) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), bloom.strength, bloom.radius, bloom.threshold);
      { const hp = this.bloom.materialHighPassFilter; hp.fragmentShader = hp.fragmentShader.replace('vec4 texel = texture2D( tDiffuse, vUv );', 'vec4 texel = texture2D( tDiffuse, vUv ); texel.rgb = min( texel.rgb, vec3( 5.0 ) );'); hp.needsUpdate = true; }
      if (bloomScale !== 1) { const orig = this.bloom.setSize.bind(this.bloom); this.bloom.setSize = (w, h) => orig(Math.max(8, w * bloomScale), Math.max(8, h * bloomScale)); }
      this.composer.addPass(this.bloom);
    }
    this.final = new ShaderPass(FinalShader);
    this.final.material.depthWrite = false;
    const u = this.final.uniforms;
    u.uExp.value = exposure; u.uTone.value = tone; u.uVig.value = vignette; u.uGrain.value = grain; u.uCA.value = ca;
    this.composer.addPass(this.final);
    this.cbs = []; this._acc = 0; this._n = 0; this._low = 0; this._warm = 2; this._w = 0; this._h = 0; this.haze = 0; this.hazeGoal = 0;
    this.shake = 0;
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(canvas);
    this.resize();
    if ('IntersectionObserver' in window) { this._io = new IntersectionObserver((es) => { this.visible = es[es.length - 1].isIntersecting; }, { rootMargin: '10% 0px' }); this.visible = true; this._io.observe(canvas); } else this.visible = true;
    Kit.on('4d', (v) => { this.hazeGoal = v ? 1 : 0; });
    Kit.on('thump', (s) => { this.shake = Math.max(this.shake, 0.012 * s); });
    Kit.raf((dt, t) => this._frame(dt, t));
    window.__stage = this;
  }
  onFrame(f) { this.cbs.push(f); }
  resize() {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    if (w === this._w && h === this._h) return;
    this._w = w; this._h = h;
    this.renderer.setPixelRatio(this.dpr); this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.dpr); this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.final.uniforms.uRes.value.set(w * this.dpr, h * this.dpr);
    this.onResize && this.onResize(w, h);
  }
  setDpr(v) {
    this.dpr = v; const w = this._w, h = this._h;
    this.renderer.setPixelRatio(v); this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(v); this.composer.setSize(w, h);
    this.final.uniforms.uRes.value.set(w * v, h * v);
  }
  degrade() {
    this.level++;
    if (this.samples > 0) {
      this.samples = 0;
      [this.composer.renderTarget1, this.composer.renderTarget2].forEach((r) => { r.samples = 0; r.dispose(); });
      return;
    }
    if (this.dpr > 1.01) { this.setDpr(Math.max(1, this.dpr - 0.25)); return; }
    if (this.dpr > 0.76) { this.setDpr(this.dpr - 0.125); return; }
    if (this.bloom && this.bloom.enabled) { this.bloom.enabled = false; return; }
  }
  _frame(dt) {
    if (!this.active || !this.visible || document.hidden) return;
    this.time += dt;
    this._acc += dt; this._n++;
    if (this._acc >= 1.5) {
      this.fps = this._n / this._acc; window.__fps = this.fps; this._acc = 0; this._n = 0;
      if (this._warm > 0) this._warm--;
      else if (this.fps < 40) { if (++this._low >= 2) { this._low = 0; this.degrade(); } } else this._low = 0;
    }
    for (let i = 0; i < this.cbs.length; i++) this.cbs[i](dt, this.time);
    SHARED.uTime.value = this.time;
    const u = this.final.uniforms;
    u.uTime.value = this.time;
    this.haze += (this.hazeGoal * (0.35 + Kit.fx4d.heat * 0.9) - this.haze) * Math.min(1, dt * 2);
    u.uHaze.value = this.haze;
    if (this.shake > 0.0002) {
      const s = this.shake; this.shake *= Math.pow(0.02, dt);
      this.camera.position.x += (Math.random() - 0.5) * s; this.camera.position.y += (Math.random() - 0.5) * s;
    }
    this.composer.render(dt);
  }
  // World position -> CSS pixels
  toScreen(v, out = {}) {
    TMP.copy(v).project(this.camera);
    out.x = (TMP.x * 0.5 + 0.5) * this._w; out.y = (-TMP.y * 0.5 + 0.5) * this._h; out.behind = TMP.z > 1;
    return out;
  }
  renderOnce() { SHARED.uTime.value = this.time; this.composer.render(0.016); }
}
const TMP = new THREE.Vector3();
export const SHARED = { uTime: { value: 0 } };

/* ---------- reflections: a dark photo studio made of a few lit panels ---------- */
export function studioEnv(renderer, o = {}) {
  const { base = 0x020202, top = [1, 1, 1, 3.6], back = [1, 0.62, 0.28, 5], left = [0.75, 0.82, 1, 2.2], right = [1, 0.74, 0.4, 3], floor = [1, 0.45, 0.12, 0.6] } = o;
  const s = new THREE.Scene();
  s.background = new THREE.Color(base);
  const panel = (w, h, c, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0] * c[3], c[1] * c[3], c[2] * c[3]), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(9, 9, top, [0, 10, 2]);
  panel(16, 3, back, [0, 1.5, -10]);
  panel(2.2, 14, left, [-10, 2, 3]);
  panel(1.4, 14, right, [10, 0, 1]);
  panel(14, 14, floor, [0, -10, 0]);
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(s, 0.03).texture;
  pm.dispose();
  return t;
}
export const lightStudioEnv = (renderer) => {
  const s = new THREE.Scene(); s.background = new THREE.Color(0.86, 0.84, 0.8);
  const panel = (w, h, v, pos, c = [1, 1, 1]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0] * v, c[1] * v, c[2] * v), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m); };
  panel(12, 12, 3.2, [0, 10, 3]); panel(5, 12, 2.4, [-9, 3, 5]); panel(3, 12, 1.6, [9, 2, 4], [1, 0.95, 0.86]); panel(14, 6, 0.12, [0, -1, -11]); panel(16, 16, 0.5, [0, -8, 0], [0.95, 0.9, 0.8]);
  const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(s, 0.04).texture; pm.dispose(); return t;
};

/* ---------- baked noise volume (fast in shaders and on the CPU): R smooth, G veins, B cell edges, A fine ---------- */
let NOISE = null;
export function noiseVolume() {
  if (NOISE) return NOISE;
  const S = detectTier() === 1 ? 48 : 64;
  const data = new Uint8Array(S * S * S * 4);
  const R = rng(7741), perm = new Uint8Array(256), grad = new Float32Array(768);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 256; i++) { const z = R() * 2 - 1, a = R() * 6.2832, r = Math.sqrt(1 - z * z); grad[i * 3] = r * Math.cos(a); grad[i * 3 + 1] = r * Math.sin(a); grad[i * 3 + 2] = z; }
  const pn = (x, y, z, P) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10), w = zf * zf * zf * (zf * (zf * 6 - 15) + 10);
    const c = (a, b, d) => {
      const h = perm[(perm[(perm[(xi + a) % P] + (yi + b) % P) & 255] + (zi + d) % P) & 255] * 3;
      return grad[h] * (xf - a) + grad[h + 1] * (yf - b) + grad[h + 2] * (zf - d);
    };
    const x00 = c(0, 0, 0) + u * (c(1, 0, 0) - c(0, 0, 0)), x10 = c(0, 1, 0) + u * (c(1, 1, 0) - c(0, 1, 0));
    const x01 = c(0, 0, 1) + u * (c(1, 0, 1) - c(0, 0, 1)), x11 = c(0, 1, 1) + u * (c(1, 1, 1) - c(0, 1, 1));
    const y0 = x00 + v * (x10 - x00), y1 = x01 + v * (x11 - x01);
    return y0 + w * (y1 - y0);
  };
  // jittered cell points for the crackle network
  const W = 9, pts = new Float32Array(W * W * W * 3);
  for (let i = 0; i < pts.length; i++) pts[i] = R();
  const toB = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  let o = 0;
  for (let z = 0; z < S; z++) for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const fx = x / S, fy = y / S, fz = z / S;
    const n1 = pn(fx * 4, fy * 4, fz * 4, 4) + 0.5 * pn(fx * 8, fy * 8, fz * 8, 8) + 0.25 * pn(fx * 16, fy * 16, fz * 16, 16);
    const n2 = 1 - Math.abs(pn(fx * 5, fy * 5, fz * 5, 5)) * 2.4, n2b = 1 - Math.abs(pn(fx * 11, fy * 11, fz * 11, 11)) * 2.4;
    const n4 = pn(fx * 20, fy * 20, fz * 20, 20) + 0.6 * pn(fx * 31, fy * 31, fz * 31, 31);
    const cx = fx * W, cy = fy * W, cz = fz * W, ix = Math.floor(cx), iy = Math.floor(cy), iz = Math.floor(cz);
    let f1 = 9, f2 = 9;
    for (let c = -1; c <= 1; c++) for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      const qx = (ix + a + W) % W, qy = (iy + b + W) % W, qz = (iz + c + W) % W, q = (qz * W * W + qy * W + qx) * 3;
      const dx = ix + a + pts[q] - cx, dy = iy + b + pts[q + 1] - cy, dz = iz + c + pts[q + 2] - cz, d = dx * dx + dy * dy + dz * dz;
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    data[o++] = toB(n1 * 0.62 + 0.5);
    data[o++] = toB(n2 * 0.72 + n2b * 0.28);
    data[o++] = toB((Math.sqrt(f2) - Math.sqrt(f1)) * 1.25);
    data[o++] = toB(n4 * 0.8 + 0.5);
  }
  const tex = new THREE.Data3DTexture(data, S, S, S);
  tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping; tex.unpackAlignment = 1; tex.needsUpdate = true;
  const sample = (x, y, z, c) => {
    x = (x - Math.floor(x)) * S; y = (y - Math.floor(y)) * S; z = (z - Math.floor(z)) * S;
    const x0 = x | 0, y0 = y | 0, z0 = z | 0, x1 = (x0 + 1) % S, y1 = (y0 + 1) % S, z1 = (z0 + 1) % S, tx = x - x0, ty = y - y0, tz = z - z0;
    const g = (a, b, d) => data[((d * S + b) * S + a) * 4 + c];
    const c00 = g(x0, y0, z0) + tx * (g(x1, y0, z0) - g(x0, y0, z0)), c10 = g(x0, y1, z0) + tx * (g(x1, y1, z0) - g(x0, y1, z0));
    const c01 = g(x0, y0, z1) + tx * (g(x1, y0, z1) - g(x0, y0, z1)), c11 = g(x0, y1, z1) + tx * (g(x1, y1, z1) - g(x0, y1, z1));
    const a0 = c00 + ty * (c10 - c00), a1 = c01 + ty * (c11 - c01);
    return (a0 + tz * (a1 - a0)) / 255;
  };
  NOISE = { tex, sample, S };
  return NOISE;
}

/* ---------- charcoal shape ---------- */
export function lumpShape(seed = 1, o = {}) {
  const R = rng(seed * 991 + 13), N = noiseVolume();
  const { planes = 22, lumps = 0.25, chip = 0.016, fibre = 0.035, crack = 0.05, split = 0.05, rough = 0.07, min = 0.6, max = 1.04 } = o;
  const P = new Float32Array(planes * 4);
  for (let i = 0; i < planes; i++) {
    const z = R() * 2 - 1, a = R() * 6.2832, r = Math.sqrt(1 - z * z);
    P[i * 4] = r * Math.cos(a); P[i * 4 + 1] = r * Math.sin(a); P[i * 4 + 2] = z; P[i * 4 + 3] = lerp(min, max, R());
  }
  const ox = R() * 7, oy = R() * 7, oz = R() * 7;
  const radius = (dx, dy, dz) => {
    let r = 1.25;
    for (let i = 0; i < planes; i++) { const c = dx * P[i * 4] + dy * P[i * 4 + 1] + dz * P[i * 4 + 2]; if (c > 0.0005) { const v = P[i * 4 + 3] / c; if (v < r) r = v; } }
    const big = N.sample(dx * 0.2 + ox, dy * 0.2 + oy, dz * 0.2 + oz, 0);
    r *= 1 + (big - 0.5) * lumps;
    if (rough > 0) { const b = Math.abs(N.sample(dx * 0.36 + oy, dy * 0.36 + ox, dz * 0.2 + oz, 0) - 0.5) * 2, b2 = Math.abs(N.sample(dx * 0.8 + oz, dy * 0.8 + oy, dz * 0.45 + ox, 0) - 0.5) * 2; r += (b - 0.28) * rough + (b2 - 0.28) * rough * 0.4; }
    if (chip > 0) { const e = N.sample(dx * 0.34 + oy, dy * 0.34 + oz, dz * 0.34 + ox, 2); r -= (1 - sstep(0, 0.16, e)) * chip; }
    if (fibre > 0) r += (N.sample(dx * 0.2 + oz, dy * 0.2 + ox, dz * 0.022 + oy, 3) - 0.5) * fibre;
    if (crack > 0) { const g = N.sample(dx * 0.17 + ox, dy * 0.17 + oz, dz * 0.07 + oy, 1); r -= sstep(0.93, 0.992, g) * crack; }
    if (split > 0) { // long radial splits, deeper away from the core
      const ang = Math.atan2(dy + 0.12, dx - 0.2), w = N.sample(dx * 0.12 + ox, dy * 0.12 + oy, dz * 0.1 + oz, 0);
      const q = Math.abs(((ang * 1.273 + w * 1.3) % 1 + 1) % 1 - 0.5), gate = sstep(0.42, 0.6, N.sample(dx * 0.08 + oy, dy * 0.08 + ox, dz * 0.17 + oz, 0));
      r -= (1 - sstep(0, 0.03, q)) * split * gate;
    }
    return Math.max(0.25, r);
  };
  return { radius, seed };
}
const icosa = (detail) => { let g = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4); return g; };
export function lumpGeometry(seed = 1, o = {}) {
  const { detail = 40, stretch = [0.92, 0.78, 1.22] } = o, shape = lumpShape(seed, o), g = icosa(detail), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = Math.hypot(x, y, z), dx = x / l, dy = y / l, dz = z / l, r = shape.radius(dx, dy, dz);
    p.setXYZ(i, dx * r * stretch[0], dy * r * stretch[1], dz * r * stretch[2]);
  }
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
const bakedShape = (shape) => {
  const W = detectTier() === 1 ? 480 : 720, H = W >> 1, T = new Float32Array((W + 1) * (H + 1));
  for (let j = 0; j <= H; j++) {
    const th = j / H * Math.PI, st = Math.sin(th), ct = Math.cos(th);
    for (let i = 0; i <= W; i++) { const ph = i / W * 6.283185307; T[j * (W + 1) + i] = shape.radius(st * Math.cos(ph), ct, st * Math.sin(ph)); }
  }
  const radius = (dx, dy, dz) => {
    const v = Math.acos(Math.max(-1, Math.min(1, dy))) / Math.PI * H, u = ((Math.atan2(dz, dx) / 6.283185307 + 1) % 1) * W;
    const i0 = u | 0, j0 = Math.min(H - 1, v | 0), tu = u - i0, tv = v - j0, a = j0 * (W + 1) + i0, b = a + W + 1;
    return (T[a] * (1 - tu) + T[a + 1] * tu) * (1 - tv) + (T[b] * (1 - tu) + T[b + 1] * tu) * tv;
  };
  return { radius };
};
// A lump cut into shards that fit together exactly. Each vertex knows its shard's centre, so the shader can blow them apart.
export function shatterGeometry(seed = 3, o = {}) {
  const { shards = 18, detail = 12, stretch = [0.92, 0.78, 1.22], gap = 0.992 } = o, shape = bakedShape(lumpShape(seed, o)), R = rng(seed * 77 + 5);
  const seeds = [];
  let tries = 0;
  while (seeds.length < shards && tries++ < 4000) {
    const z = R() * 2 - 1, a = R() * 6.2832, r = Math.sqrt(1 - z * z), d = 0.1 + 0.46 * Math.cbrt(R()), s = [r * Math.cos(a) * d, r * Math.sin(a) * d, z * d];
    if (seeds.every((q) => Math.hypot(q[0] - s[0], q[1] - s[1], q[2] - s[2]) > 0.27)) seeds.push(s);
  }
  const base = icosa(detail), bp = base.attributes.position, idx = base.index, parts = [];
  const f = (sx, sy, sz, dx, dy, dz, t) => { const px = sx + dx * t, py = sy + dy * t, pz = sz + dz * t, l = Math.hypot(px, py, pz) || 1e-5; return l - shape.radius(px / l, py / l, pz / l); };
  seeds.forEach((s, k) => {
    const n = bp.count, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cen = new Float32Array(n * 3), rnd = new Float32Array(n * 4), inn = new Float32Array(n);
    const rx = R(), ry = R(), rz = R(), rw = R();
    for (let i = 0; i < n; i++) {
      const dx = bp.getX(i), dy = bp.getY(i), dz = bp.getZ(i);
      let tB = 2.6, nx = dx, ny = dy, nz = dz;
      seeds.forEach((q, j) => {
        if (j === k) return;
        const ax = q[0] - s[0], ay = q[1] - s[1], az = q[2] - s[2], nd = ax * dx + ay * dy + az * dz;
        if (nd > 1e-4) { const t = (ax * ax + ay * ay + az * az) * 0.5 / nd; if (t < tB) { tB = t; nx = ax; ny = ay; nz = az; } }
      });
      let T = tB, inner = 1;
      if (f(s[0], s[1], s[2], dx, dy, dz, tB) > 0) {
        inner = 0;
        let a = 0, b = tB;
        for (let c = 1; c <= 6; c++) { const ti = tB * c / 6; if (f(s[0], s[1], s[2], dx, dy, dz, ti) > 0) { a = ti - tB / 6; b = ti; break; } }
        for (let c = 0; c < 8; c++) { const m = (a + b) / 2; if (f(s[0], s[1], s[2], dx, dy, dz, m) > 0) b = m; else a = m; }
        T = (a + b) / 2;
        // surface normal measured from the shape itself, so shading ignores how the triangles fall
        const px = s[0] + dx * T, py = s[1] + dy * T, pz = s[2] + dz * T, l = Math.hypot(px, py, pz) || 1e-5, ux = px / l, uy = py / l, uz = pz / l;
        let ax = uy * 0.3 - uz * 0.9, ay = uz * 0.2 - ux * 0.3, az = ux * 0.9 - uy * 0.2; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
        const bx = uy * az - uz * ay, by = uz * ax - ux * az, bz = ux * ay - uy * ax, e = 0.014;
        const sample = (ox, oy, oz) => { const qx = ux + ox, qy = uy + oy, qz = uz + oz, ql = Math.hypot(qx, qy, qz), rr = shape.radius(qx / ql, qy / ql, qz / ql); return [qx / ql * rr, qy / ql * rr, qz / ql * rr]; };
        const p0 = sample(0, 0, 0), pa = sample(ax * e, ay * e, az * e), pb = sample(bx * e, by * e, bz * e);
        const ex = pa[0] - p0[0], ey = pa[1] - p0[1], ez = pa[2] - p0[2], fx = pb[0] - p0[0], fy = pb[1] - p0[1], fz = pb[2] - p0[2];
        nx = ey * fz - ez * fy; ny = ez * fx - ex * fz; nz = ex * fy - ey * fx;
        if (nx * ux + ny * uy + nz * uz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      }
      T *= gap;
      { const qx = nx / stretch[0], qy = ny / stretch[1], qz = nz / stretch[2], ql = Math.hypot(qx, qy, qz) || 1; nor[i * 3] = qx / ql; nor[i * 3 + 1] = qy / ql; nor[i * 3 + 2] = qz / ql; }
      pos[i * 3] = (s[0] + dx * T) * stretch[0]; pos[i * 3 + 1] = (s[1] + dy * T) * stretch[1]; pos[i * 3 + 2] = (s[2] + dz * T) * stretch[2];
      cen[i * 3] = s[0] * stretch[0]; cen[i * 3 + 1] = s[1] * stretch[1]; cen[i * 3 + 2] = s[2] * stretch[2];
      rnd[i * 4] = rx; rnd[i * 4 + 1] = ry; rnd[i * 4 + 2] = rz; rnd[i * 4 + 3] = rw;
      inn[i] = inner;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aCenter', new THREE.BufferAttribute(cen, 3));
    g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
    g.setAttribute('aInner', new THREE.BufferAttribute(inn, 1));
    g.setIndex(idx.clone());
    parts.push(g);
  });
  const out = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  out.computeBoundingSphere();
  out.userData.seeds = seeds.map((s) => [s[0] * stretch[0], s[1] * stretch[1], s[2] * stretch[2]]);
  return out;
}

/* ---------- charcoal material ---------- */
const COAL_PARS = /* glsl */`
  precision highp sampler3D;
  uniform sampler3D tN; uniform float uHeat,uTime,uBump,uFlat,uGlow,uCore,uDissolve,uAsh,uTexScale,uWood; varying vec3 vOP; varying float vLH,vIn;
  vec3 emberRamp(float x){ vec3 c=mix(vec3(.5,.025,.0),vec3(2.3,.4,.03),smoothstep(.0,.42,x)); c=mix(c,vec3(5.,2.25,.4),smoothstep(.42,.82,x)); return mix(c,vec3(6.5,3.9,1.2),smoothstep(.82,1.1,x)); }
  // charcoal keeps the wood's structure: long splits along the grain (z), radial checks and growth rings
  float woodCracks(vec3 p,float warp,float gate){
    vec2 q=p.xy+vec2(.17,-.09); float rad=length(q),ang=atan(q.y,q.x);
    float r1=abs(fract(ang*1.273+warp*.62)-.5);
    float radial=(1.-smoothstep(.0,.012+rad*.012,r1))*smoothstep(.1,.42,rad);
    float r2=abs(fract(rad*3.6+warp*1.5)-.5);
    float ring=(1.-smoothstep(0.,.022,r2))*.62;
    return max(radial,ring)*gate*uWood;
  }
  float coalH(vec3 p){
    vec4 f=texture(tN,vec3(p.xy*.5,p.z*.052)); vec4 f2=texture(tN,vec3(p.xy*1.15,p.z*.11)); vec4 m=texture(tN,p*.21); vec4 d=texture(tN,p*1.1);
    float gate=smoothstep(.36,.6,texture(tN,vec3(p.xy*.1,p.z*.13)+.31).r);
    float crk=woodCracks(p,m.r,gate);
    return f.a*1.1+f2.a*.5+f.r*.3+d.a*.12+m.r*.08-crk*1.15;
  }`;
export function coalMaterial(o = {}) {
  const { heat = 0, bump = 0.03, flat = 0.28, glow = 1, ash = 0.8, texScale = 1, instanced = false, shard = false, dissolve = false, core = 0, env = 1, tint = 1, wood = 1 } = o;
  const N = noiseVolume();
  const u = { tN: { value: N.tex }, uHeat: { value: heat }, uTime: SHARED.uTime, uBump: { value: bump }, uFlat: { value: flat }, uGlow: { value: glow }, uCore: { value: core }, uDissolve: { value: dissolve ? 0 : -1 }, uAsh: { value: ash }, uTexScale: { value: texScale }, uWood: { value: wood }, uExplode: { value: 0 }, uSpin: { value: 1.6 }, uOffset: { value: new THREE.Vector3() }, uTint: { value: tint } };
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.4, envMapIntensity: env });
  m.defines = Object.assign(m.defines || {}, instanced ? { COAL_INST: 1 } : {}, shard ? { COAL_SHARD: 1 } : {});
  m.userData.u = u;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', /* glsl */`#include <common>
        uniform float uExplode,uSpin,uTexScale; uniform vec3 uOffset; varying vec3 vOP; varying float vLH,vIn;
        #ifdef COAL_INST
        attribute float aHeat;
        #endif
        #ifdef COAL_SHARD
        attribute vec3 aCenter; attribute vec4 aRnd; attribute float aInner;
        mat3 rotAxis(vec3 a,float r){ float s=sin(r),c=cos(r),o=1.-c; return mat3(o*a.x*a.x+c,o*a.x*a.y+a.z*s,o*a.z*a.x-a.y*s, o*a.x*a.y-a.z*s,o*a.y*a.y+c,o*a.y*a.z+a.x*s, o*a.z*a.x+a.y*s,o*a.y*a.z-a.x*s,o*a.z*a.z+c); }
        #endif`)
      .replace('#include <beginnormal_vertex>', /* glsl */`vec3 objectNormal=vec3(normal);
        #ifdef COAL_SHARD
        float ex=uExplode*(.55+aRnd.w*.95);
        mat3 Rs=rotAxis(normalize(aRnd.xyz*2.-1.+1e-3),ex*uSpin*(aRnd.w*2.-1.));
        objectNormal=Rs*objectNormal;
        #endif`)
      .replace('#include <begin_vertex>', /* glsl */`vec3 transformed=vec3(position);
        vOP=position*uTexScale+uOffset; vLH=1.; vIn=0.;
        #ifdef COAL_INST
        vLH=aHeat; vOP+=vec3(aHeat*17.,gl_InstanceID==0?0.:float(gl_InstanceID)*3.7,0.);
        #endif
        #ifdef COAL_SHARD
        vIn=aInner;
        vec3 sd=normalize(aCenter+(aRnd.xyz-.5)*.35+1e-4);
        transformed=Rs*(transformed-aCenter)+aCenter+sd*ex;
        #endif`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\n${COAL_PARS}\nuniform float uTint;`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        vec3 oP=vOP;
        vec4 nM=texture(tN,oP*.21), nF=texture(tN,vec3(oP.xy*.62,oP.z*.075)), nD=texture(tN,oP*.9);
        float hC=clamp(uHeat*vLH,0.,1.);
        #ifdef COAL_SHARD
        float inner=smoothstep(.45,.75,vIn);
        #else
        float inner=0.;
        #endif
        float dissolveEdge=0.;
        if(uDissolve>=0.){ float dv=nM.r*.72+nD.a*.28; if(dv<uDissolve) discard; dissolveEdge=1.-smoothstep(uDissolve,uDissolve+.09,dv); dissolveEdge*=step(.001,uDissolve); }
        float tone=nF.a*.55+nF.r*.2+nD.a*.25;
        float crkC=woodCracks(oP,nM.r,smoothstep(.36,.6,texture(tN,vec3(oP.xy*.1,oP.z*.13)+.31).r));
        vec3 coalCol=mix(vec3(.016,.016,.018),vec3(.15,.148,.158),smoothstep(.3,.78,tone))*uTint*(1.-crkC*.86);
        float ashMask=smoothstep(.56,.74,nM.r+.16*nD.a)*smoothstep(.45,.95,hC)*uAsh;
        coalCol=mix(coalCol,vec3(.42,.39,.37),ashMask);
        diffuseColor.rgb=mix(coalCol,vec3(.015),inner*.8);`)
      .replace('#include <roughnessmap_fragment>', /* glsl */`#include <roughnessmap_fragment>
        roughnessFactor=mix(.46,.86,smoothstep(.3,.72,nD.a*.5+nF.a*.5)); roughnessFactor=mix(roughnessFactor,.96,max(ashMask,inner*.6));`)
      .replace('#include <metalnessmap_fragment>', /* glsl */`#include <metalnessmap_fragment>
        metalnessFactor=mix(.52,.2,nM.r)*(1.-ashMask);`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        {
          vec3 dpx=dFdx(oP), dpy=dFdy(oP);
          float h0=coalH(oP), hx=coalH(oP+dpx), hy=coalH(oP+dpy);
          vec3 sx=dFdx(-vViewPosition), sy=dFdy(-vViewPosition);
          vec3 r1=cross(sy,normal), r2=cross(normal,sx);
          float det=dot(sx,r1)*faceDirection;
          vec3 g=sign(det)*((hx-h0)*r1+(hy-h0)*r2)*uBump;
          normal=normalize(abs(det)*normal-g);
          vec3 fn=normalize(cross(sx,sy));
          normal=normalize(mix(normal,fn,uFlat));
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          float cell=texture(tN,oP*.33).b;
          float w=.006+.075*hC*hC;
          float web=1.-smoothstep(0.,w,cell);
          float vein=smoothstep(.972-.16*hC,.999,nM.g);
          vein=max(vein,crkC*smoothstep(.04,.34,hC));
          float breathe=.72+.28*sin(uTime*1.25+nM.r*22.+nF.r*9.);
          float gate=smoothstep(.42,.66,nM.r+hC*.46);
          float along=smoothstep(.34,.66,texture(tN,vec3(oP.xy*.16,oP.z*.1)+.57).r+hC*.5);
          float fire=max(web*gate,vein*along)*smoothstep(.015,.3,hC)*breathe;
          float bed=smoothstep(.72,1.,hC)*smoothstep(.44,.2,nD.a*.5+nM.r*.5)*.2*(1.-ashMask);
          float emX=clamp(fire*(.34+hC*.5)+bed,0.,1.);
          vec3 em=emberRamp(emX)*smoothstep(.0,.2,emX);
          #ifdef COAL_SHARD
          float mag=texture(tN,oP*.5+vec3(0.,uTime*.04,0.)).r;
          em=mix(em,emberRamp(.26+mag*.44)*uCore,inner*step(.001,uCore));
          #endif
          em+=emberRamp(.95)*dissolveEdge*1.5;
          totalEmissiveRadiance+=em*uGlow;
        }`);
  };
  m.customProgramCacheKey = () => `coal${instanced ? 'I' : ''}${shard ? 'S' : ''}`;
  return m;
}

/* ---------- gritty surfaces: colour, roughness and small bumps from the noise volume, in world space ---------- */
export function gritMaterial(o = {}) {
  const { color = 0x888888, roughness = 0.7, metalness = 0.1, amount = 0.35, scale = 0.3, bump = 0.01, map = null, env = 1, side = THREE.FrontSide, emissive = 0x000000, emissiveIntensity = 1 } = o;
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, map, envMapIntensity: env, side, emissive, emissiveIntensity });
  const tex = noiseVolume().tex;
  m.onBeforeCompile = (s) => {
    s.uniforms.tN = { value: tex };
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGP;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec4 gp=vec4(transformed,1.);
        #ifdef USE_INSTANCING
        gp=instanceMatrix*gp;
        #endif
        vGP=(modelMatrix*gp).xyz; }`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
precision highp sampler3D; uniform sampler3D tN; varying vec3 vGP; float gritH(vec3 p){ vec4 t=texture(tN,p*${(scale * 1.6).toFixed(3)}); return t.a*.7+t.r*.6; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
vec4 gN=texture(tN,vGP*${scale.toFixed(3)}); diffuseColor.rgb*=1.-${amount.toFixed(3)}+${(amount * 2).toFixed(3)}*gN.r;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*(.72+.56*gN.a),.04,1.);')
      .replace('#include <normal_fragment_maps>', bump <= 0 ? '#include <normal_fragment_maps>' : `#include <normal_fragment_maps>
        { vec3 dpx=dFdx(vGP),dpy=dFdy(vGP); float h0=gritH(vGP),hx=gritH(vGP+dpx),hy=gritH(vGP+dpy); vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition); vec3 r1=cross(sy,normal),r2=cross(normal,sx); float det=dot(sx,r1)*faceDirection; normal=normalize(abs(det)*normal-sign(det)*((hx-h0)*r1+(hy-h0)*r2)*${bump.toFixed(4)}); }`);
  };
  m.customProgramCacheKey = () => `grit${amount}|${scale}|${bump}`;
  return m;
}

/* ---------- a heap of charcoal ---------- */
export function coalHeap(o = {}) {
  const { count = 240, radius = 3, height = 1.1, scale = [0.16, 0.4], variants = 4, detail = 5, heat = 0, seed = 11, flat = true } = o;
  const R = rng(seed), g = new THREE.Group(), n = Math.ceil(count / variants), mats = [];
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
  for (let v = 0; v < variants; v++) {
    const geo = lumpGeometry(seed + v * 7 + 1, { detail, fibre: 0, chip: 0.03, crack: 0, planes: 15 });
    const hAttr = new Float32Array(n);
    geo.setAttribute('aHeat', new THREE.InstancedBufferAttribute(hAttr, 1));
    const mat = coalMaterial({ heat, instanced: true, bump: 0.015, flat: 0.5, ash: 0.6 });
    mats.push(mat);
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    for (let i = 0; i < n; i++) {
      const a = R() * 6.2832, d = Math.sqrt(R()) * radius, k = 1 - d / radius;
      const s = lerp(scale[0], scale[1], R() * R() + 0.08);
      P.set(Math.cos(a) * d, flat ? k * k * height * (0.55 + 0.45 * R()) : R() * height, Math.sin(a) * d);
      E.set(R() * 6.28, R() * 6.28, R() * 6.28); Q.setFromEuler(E); S.setScalar(s);
      M.compose(P, Q, S); mesh.setMatrixAt(i, M);
      hAttr[i] = sstep(0.25, 1, R() * (0.45 + k));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    g.add(mesh);
  }
  g.userData.setHeat = (h) => mats.forEach((m) => { m.userData.u.uHeat.value = h; });
  return g;
}

/* ---------- embers rising (GPU points) ---------- */
export function embers(o = {}) {
  const { count = 500, box = [8, 7, 6], size = 22, speed = 0.55, y0 = -2.5, color = [5.2, 2.0, 0.42], opacity = 1 } = o;
  const g = new THREE.BufferGeometry(), R = rng(99), a = new Float32Array(count * 4), pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { a[i * 4] = R(); a[i * 4 + 1] = R(); a[i * 4 + 2] = R(); a[i * 4 + 3] = R(); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(a, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: SHARED.uTime, uBox: { value: new THREE.Vector3(...box) }, uSize: { value: size * (window.devicePixelRatio || 1) }, uSpeed: { value: speed }, uY0: { value: y0 }, uCol: { value: new THREE.Vector3(...color) }, uAmt: { value: 1 }, uOp: { value: opacity } },
    vertexShader: /* glsl */`
      attribute vec4 aS; uniform float uTime,uSize,uSpeed,uY0,uAmt; uniform vec3 uBox; varying float vK,vTw;
      void main(){
        float sp=uSpeed*(.5+aS.w*1.1); float life=fract(aS.y+uTime*sp/uBox.y);
        vec3 p=vec3((aS.x-.5)*uBox.x,uY0+life*uBox.y,(aS.z-.5)*uBox.z);
        float tt=uTime*(.6+aS.w)+aS.x*40.;
        p.x+=sin(tt)*.22+sin(tt*2.3+aS.z*9.)*.09; p.z+=cos(tt*.8)*.22;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        vK=smoothstep(0.,.08,life)*(1.-smoothstep(.55,1.,life))*step(aS.w,uAmt); vTw=.6+.4*sin(uTime*(5.+aS.x*9.)+aS.z*30.);
        gl_PointSize=uSize*(.32+aS.z*aS.z*1.3)*(1.-life*.45)/max(.4,-mv.z);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform float uOp; varying float vK,vTw;
      void main(){ vec2 d=gl_PointCoord-.5; float r=dot(d,d)*4.; if(r>1.) discard; float a=pow(1.-r,2.4)*vK*vTw*uOp; if(a<.004) discard; gl_FragColor=vec4(uCol*a,a); }`
  });
  const p = new THREE.Points(g, mat);
  p.frustumCulled = false;
  return p;
}

/* ---------- soft smoke puffs (camera facing quads) ---------- */
export function smoke(o = {}) {
  const { count = 26, origin = [0, 0, 0], spread = 0.6, rise = 5, size = 3, speed = 0.1, color = [0.32, 0.3, 0.3], opacity = 0.16, seed = 3 } = o;
  const base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
  const R = rng(seed), a = new Float32Array(count * 4), org = new Float32Array(count * 3), list = Array.isArray(origin[0]) ? origin : [origin];
  for (let i = 0; i < count; i++) { a[i * 4] = R(); a[i * 4 + 1] = R(); a[i * 4 + 2] = R(); a[i * 4 + 3] = R(); const q = list[i % list.length]; org[i * 3] = q[0]; org[i * 3 + 1] = q[1]; org[i * 3 + 2] = q[2]; }
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(a, 4));
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(org, 3));
  g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { tN: { value: noiseVolume().tex }, uTime: SHARED.uTime, uSpread: { value: spread }, uRise: { value: rise }, uSize: { value: size }, uSpeed: { value: speed }, uCol: { value: new THREE.Vector3(...color) }, uOp: { value: opacity } },
    vertexShader: /* glsl */`
      attribute vec4 aS; attribute vec3 aO; uniform float uTime,uSpread,uRise,uSize,uSpeed; varying vec2 vUv; varying float vA; varying vec3 vP;
      void main(){
        float l=fract(aS.y+uTime*uSpeed*(.7+aS.w*.6));
        vec3 p=aO+vec3((aS.x-.5)*uSpread*(1.+l*2.5)+sin(l*5.+aS.z*6.)*.25*l*uRise*.3,l*uRise,(aS.z-.5)*uSpread*(1.+l*2.));
        vec4 mv=modelViewMatrix*vec4(p,1.);
        float s=uSize*(.32+l*1.05)*(.75+aS.w*.5);
        float a=aS.x*6.28+uTime*.06*(aS.z-.5); float c=cos(a),n=sin(a);
        mv.xy+=mat2(c,-n,n,c)*position.xy*s;
        vUv=uv; vA=smoothstep(0.,.14,l)*(1.-smoothstep(.45,1.,l)); vP=vec3(uv*.42+aS.xy*9.,l*.5+uTime*.012);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      precision highp sampler3D; uniform sampler3D tN; uniform vec3 uCol; uniform float uOp; varying vec2 vUv; varying float vA; varying vec3 vP;
      void main(){ vec2 d=vUv-.5; float r=1.-smoothstep(.12,.5,length(d)); float n=texture(tN,vP).r; float a=r*smoothstep(.34,.68,n+r*.2)*vA*uOp; if(a<.002) discard; gl_FragColor=vec4(uCol,a); }`
  });
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  return m;
}

/* ---------- a flame sheet that faces the camera ---------- */
export function flame(o = {}) {
  const { w = 1, h = 1.6, strength = 1, seed = 0 } = o;
  const geo = new THREE.PlaneGeometry(w, h, 1, 1); geo.translate(0, h / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { tN: { value: noiseVolume().tex }, uTime: SHARED.uTime, uAmt: { value: strength }, uSeed: { value: seed } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; vec4 c=modelViewMatrix*vec4(0.,position.y,0.,1.); c.x+=position.x*length(modelMatrix[0].xyz); gl_Position=projectionMatrix*c; }',
    fragmentShader: /* glsl */`
      precision highp sampler3D; uniform sampler3D tN; uniform float uTime,uAmt,uSeed; varying vec2 vUv;
      void main(){
        vec2 p=vUv; p.x=(p.x-.5)*2.;
        float n=texture(tN,vec3(p.x*.34+uSeed,p.y*.42-uTime*.46,uTime*.09+uSeed)).r, n2=texture(tN,vec3(p.x*.9+uSeed,p.y*1.-uTime*.9,uTime*.13)).r;
        p.x+=(n-.5)*.72*p.y;
        float w=(1.-p.y)*(1.-p.y*.3); float body=1.-smoothstep(w*.5,w*.95,abs(p.x));
        float f=body*smoothstep(1.,.08,p.y+(n2-.5)*.75+(.5-n)*.45);
        f=clamp(f*1.75,0.,1.)*uAmt;
        vec3 c=mix(vec3(1.1,.08,.0),vec3(4.,1.25,.1),smoothstep(.1,.55,f)); c=mix(c,vec3(9.,6.,2.2),smoothstep(.62,1.,f));
        float a=smoothstep(.02,.28,f);
        gl_FragColor=vec4(c*a,a);
      }`
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.userData.u = mat.uniforms;
  return m;
}

/* ---------- full screen background painted before the scene: slow smoke, warm floor glow ---------- */
export function backdrop(o = {}) {
  const { base = [0.006, 0.006, 0.007], glow = [0.5, 0.14, 0.02], smoke: sm = 0.05, smokeCol = [0.3, 0.27, 0.25] } = o;
  const mat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { tN: { value: noiseVolume().tex }, uTime: SHARED.uTime, uBase: { value: new THREE.Vector3(...base) }, uGlow: { value: new THREE.Vector3(...glow) }, uAmt: { value: 0.2 }, uSm: { value: sm }, uSC: { value: new THREE.Vector3(...smokeCol) }, uAsp: { value: 1 }, uCX: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,1.,1.); }',
    fragmentShader: /* glsl */`
      precision highp sampler3D; uniform sampler3D tN; uniform float uTime,uAmt,uSm,uAsp,uCX; uniform vec3 uBase,uGlow,uSC; varying vec2 vUv;
      void main(){
        vec2 p=vUv; vec2 c=vec2(uCX,-.1);
        float n=texture(tN,vec3(p.x*uAsp*.11,p.y*.11-uTime*.012,uTime*.006)).r, n2=texture(tN,vec3(p.x*uAsp*.27+.3,p.y*.27-uTime*.02,uTime*.011)).r;
        float s=smoothstep(.42,.86,n*.7+n2*.45)*uSm;
        float d=length((p-.5-c)*vec2(uAsp*.72,1.));
        vec3 col=uBase+uGlow*uAmt*pow(max(0.,1.-d*1.05),2.6)*(.72+.5*n2)+uSC*s*(.35+uAmt);
        gl_FragColor=vec4(col,1.);
      }`
  });
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  tri.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const m = new THREE.Mesh(tri, mat); m.frustumCulled = false; m.renderOrder = -1000; m.userData.u = mat.uniforms;
  return m;
}

/* ---------- the real logo, extruded (height 1, centred, facing +z) ---------- */
const LG = window.MHC_LOGO;
const lv = (a) => { const o = []; for (let i = 0; i < a.length; i += 2) o.push(new THREE.Vector2((a[i] - LG.a * 500) / 1000, (500 - a[i + 1]) / 1000)); return o; };
export function logoShapes() {
  const body = new THREE.Shape(lv(LG.body));
  body.holes.push(new THREE.Path(lv(LG.gap)));
  LG.snow.forEach((s) => body.holes.push(new THREE.Path(lv(s))));
  return { body, snow: LG.snow.map((s) => new THREE.Shape(lv(s))), letters: LG.letters.map((s) => new THREE.Shape(lv(s))) };
}
export function metal(kind = 'gold') {
  if (kind === 'gold') return new THREE.MeshStandardMaterial({ color: 0xD8A72A, metalness: 1, roughness: 0.27 });
  if (kind === 'goldRough') return new THREE.MeshStandardMaterial({ color: 0xC69A24, metalness: 1, roughness: 0.42 });
  if (kind === 'graphite') return new THREE.MeshStandardMaterial({ color: 0x17171a, metalness: 0.85, roughness: 0.38 });
  if (kind === 'platinum') return new THREE.MeshStandardMaterial({ color: 0xe9e6df, metalness: 0.9, roughness: 0.3 });
  return new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8, roughness: 0.5 });
}
export function logoGroup(o = {}) {
  const { depth = 0.085, bevel = 0.009, seg = 2, body: mBody = metal('graphite'), edge: mEdge = metal('gold'), snow: mSnow = metal('platinum'), letters: mLet = metal('gold') } = o;
  const S = logoShapes(), g = new THREE.Group();
  const ex = (shape, d, b) => { const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b * 0.2, bevelSegments: seg, curveSegments: 2, steps: 1 }); geo.translate(0, 0, -d / 2); return geo; };
  const body = new THREE.Mesh(ex(S.body, depth, bevel), [mBody, mEdge]);
  const snow = new THREE.Mesh(mergeGeometries(S.snow.map((s) => ex(s, depth * 0.55, bevel * 0.6))), mSnow);
  const let3 = new THREE.Mesh(mergeGeometries(S.letters.map((s) => ex(s, depth * 1.25, bevel))), mLet);
  g.add(body, snow, let3);
  g.userData = { body, snow, letters: let3 };
  return g;
}
// Paint the vector logo into any 2D canvas
export function drawLogo(x, cx, cy, h, { body = '#0D0D0D', letters = '#B48B0B', snow = null } = {}) {
  const s = h / 1000, ox = cx - LG.a * 1000 * s / 2, oy = cy - h / 2;
  const path = (a, ctx) => { for (let i = 0; i < a.length; i += 2) { const X = a[i] * s + ox, Y = a[i + 1] * s + oy; if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); } ctx.closePath(); };
  x.save();
  if (snow) { x.fillStyle = snow; x.beginPath(); LG.snow.forEach((a) => path(a, x)); x.fill(); }
  x.fillStyle = body; x.beginPath(); path(LG.body, x); path(LG.gap, x); LG.snow.forEach((a) => path(a, x)); x.fill('evenodd');
  x.fillStyle = letters; x.beginPath(); LG.letters.forEach((a) => path(a, x)); x.fill();
  x.restore();
}

/* ---------- pack label (live canvas) ---------- */
export function drawLabel(cv, o = {}) {
  const { color = '#111113', ink = '#E7C24F', brand = '', product = '', weight = '10 KG', origin = 'PRODUCT OF EGYPT', image = null, font = "'Montserrat','Cairo','Arial',sans-serif" } = o;
  const W = cv.width, H = cv.height, x = cv.getContext('2d');
  const dirOf = (s) => (/[؀-ۿ]/.test(s) ? 'rtl' : 'ltr');
  const line = (text, wg, start, maxW, y) => {
    if (!text) return;
    let s = start; x.font = `${wg} ${s}px ${font}`;
    while (x.measureText(text).width > maxW && s > 12) { s *= 0.95; x.font = `${wg} ${s}px ${font}`; }
    x.direction = dirOf(text); x.fillText(text, W / 2, y); x.direction = 'ltr';
  };
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = color; x.fillRect(0, 0, W, H);
  // paper tone
  const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,.06)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.12)'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  const m = W * 0.07;
  x.strokeStyle = ink; x.lineWidth = W * 0.006; x.strokeRect(m, m * 1.5, W - 2 * m, H - m * 2.6);
  x.lineWidth = W * 0.002; x.strokeRect(m + W * 0.014, m * 1.5 + W * 0.014, W - 2 * m - W * 0.028, H - m * 2.6 - W * 0.028);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = ink;
  const cx = W / 2;
  // top of the pack: the buyer's logo and/or name, or the M.H.C mark when nothing was entered
  if (image) {
    const iw = image.width || image.naturalWidth, ih = image.height || image.naturalHeight, bw = W * 0.56, bh = H * (brand ? 0.2 : 0.28), k = Math.min(bw / iw, bh / ih), iy = brand ? H * 0.26 : H * 0.31;
    x.drawImage(image, cx - iw * k / 2, iy - ih * k / 2, iw * k, ih * k);
    line(brand, 800, W * 0.085, W * 0.74, H * 0.445);
  } else if (brand) {
    line(brand, 800, W * 0.13, W * 0.74, H * 0.33);
  } else {
    drawLogo(x, cx, H * 0.31, H * 0.3, { body: ink, letters: ink, snow: null });
  }
  x.fillRect(cx - W * 0.09, H * 0.525, W * 0.18, H * 0.003);
  line(product, 700, W * 0.05, W * 0.76, H * 0.59);
  line(weight, 800, W * 0.105, W * 0.7, H * 0.695);
  line(origin, 600, W * 0.024, W * 0.72, H * 0.84);
}

// Waits until the fonts a canvas needs are ready, but never holds the page for long
export const fontsReady = (list, ms = 1800) => {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.race([Promise.all(list.map((f) => document.fonts.load(f).catch(() => null))), new Promise((r) => setTimeout(r, ms))]);
};

/* ---------- filled sack ---------- */
const paperPatch = (m, strength = 0.012) => {
  const N = noiseVolume();
  m.onBeforeCompile = (s) => {
    s.uniforms.tN = { value: N.tex };
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOPp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOPp=position;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nprecision highp sampler3D; uniform sampler3D tN; varying vec3 vOPp;\nfloat paperH(vec3 p){ return texture(tN,p*1.6).a*.55+texture(tN,p*.45).r*.55; }`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
      { vec3 dpx=dFdx(vOPp),dpy=dFdy(vOPp); float h0=paperH(vOPp),hx=paperH(vOPp+dpx),hy=paperH(vOPp+dpy); vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition); vec3 r1=cross(sy,normal),r2=cross(normal,sx); float det=dot(sx,r1)*faceDirection; normal=normalize(abs(det)*normal-sign(det)*((hx-h0)*r1+(hy-h0)*r2)*${strength.toFixed(4)}); }`);
  };
  m.customProgramCacheKey = () => 'paper' + strength;
  return m;
};
export function sackGeometry(w = 1, h = 1.5, d = 0.5, sign = 1, seed = 1, sx = 48, sy = 72) {
  const g = new THREE.PlaneGeometry(w, h, sx, sy), p = g.attributes.position, N = noiseVolume(), ox = seed * 0.37;
  for (let i = 0; i < p.count; i++) {
    const x0 = p.getX(i), y0 = p.getY(i), u = x0 / (w / 2), v = y0 / (h / 2);
    const prof = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 3.2)), 0.55);
    const vt = v > 0.78 ? sstep(1.0, 0.78, v) : 1, vb = v < -0.88 ? Math.pow(sstep(-1.0, -0.88, v), 0.5) : 1;
    const belly = 0.86 + 0.14 * Math.cos(v * 1.4 + 0.25);
    const n = N.sample(x0 * 0.22 + ox, y0 * 0.22, sign * 0.2, 0) - 0.5, n2 = N.sample(x0 * 0.1 + ox, y0 * 0.34, sign * 0.4, 0) - 0.5;
    let z = sign * d * 0.5 * prof * Math.max(vt * vb, 0.03) * belly;
    z += sign * (n * 0.09 + n2 * 0.06) * prof * vt;
    const squeeze = 1 - 0.04 * (1 - v * v) * vt;
    const wob = (N.sample(y0 * 0.2 + ox, 0.3, 0.1, 0) - 0.5) * 0.05 * Math.abs(u);
    p.setXYZ(i, x0 * squeeze + wob, y0 + (N.sample(x0 * 0.3 + ox, 0.9, 0.7, 0) - 0.5) * 0.02 * Math.max(0, v), z);
  }
  g.computeVertexNormals();
  return g;
}
export function sack(o = {}) {
  const { w = 1, h = 1.5, d = 0.5, map = null, color = 0xffffff, backMap = null, seam = 0x33261a, roughness = 0.82, seed = 1, shared = null } = o;
  const g = new THREE.Group();
  const mat = shared || paperPatch(new THREE.MeshStandardMaterial({ map, color, roughness, metalness: 0, side: THREE.DoubleSide }));
  const front = new THREE.Mesh(sackGeometry(w, h, d, 1, seed), mat);
  // back shows the same paper colour without the text mirrored
  const back = new THREE.Mesh(sackGeometry(w, h, d, -1, seed), backMap ? paperPatch(new THREE.MeshStandardMaterial({ map: backMap, roughness, side: THREE.DoubleSide })) : mat);
  const stitch = new THREE.Mesh(new THREE.BoxGeometry(w * 1.0, h * 0.012, Math.max(0.012, d * 0.05)), new THREE.MeshStandardMaterial({ color: seam, roughness: 0.9 }));
  stitch.position.set(0, h * 0.455, 0);
  g.add(front, back, stitch);
  g.userData = { front, back, mat };
  return g;
}

/* ---------- shipping container (corrugated by shader, black with the gold logo) ---------- */
export function containerMesh(o = {}) {
  const { l = 6, w = 2.44, h = 2.6, color = 0x101012, logoSide = true, doors = true } = o;
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = Math.round(2048 * h / l);
  const x = cv.getContext('2d'); x.fillStyle = '#' + new THREE.Color(color).getHexString(); x.fillRect(0, 0, cv.width, cv.height);
  if (logoSide) {
    drawLogo(x, cv.width * 0.2, cv.height * 0.5, cv.height * 0.62, { body: '#E7C24F', letters: '#E7C24F' });
    x.fillStyle = '#E7C24F'; x.textBaseline = 'middle'; x.textAlign = 'left';
    x.font = `700 ${cv.height * 0.2}px 'Barlow Condensed','Montserrat','Arial Narrow',sans-serif`; x.fillText('M.H.C COALLINE', cv.width * 0.34, cv.height * 0.42);
    x.font = `500 ${cv.height * 0.07}px 'Barlow','Montserrat','Arial',sans-serif`; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText('MANUFACTURING & EXPORT  ·  ALEXANDRIA, EGYPT', cv.width * 0.345, cv.height * 0.62);
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const corr = (map, freq, axis) => {
    const m = new THREE.MeshStandardMaterial({ map, color: map ? 0xffffff : color, metalness: 0.55, roughness: 0.46 });
    m.onBeforeCompile = (s) => {
      const av = axis === 'x' ? 'vec3(1.,0.,0.)' : axis === 'z' ? 'vec3(0.,0.,1.)' : 'vec3(0.,1.,0.)';
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCP; varying vec3 vCA;').replace('#include <begin_vertex>', `#include <begin_vertex>\nvCP=position; vCA=normalize(normalMatrix*${av});`);
      s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCP; varying vec3 vCA;').replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { float k=sin(vCP.${axis}*${freq.toFixed(2)}); normal=normalize(normal+vCA*k*.42*(1.-abs(dot(normal,vCA)))); }`);
    };
    m.customProgramCacheKey = () => 'corr' + axis + freq + (map ? 'm' : '');
    return m;
  };
  const side = corr(tex, 16, 'x'), plain = corr(null, 16, 'z'), top = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.55 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(l, h, w), [plain, plain, top, top, side, side]);
  box.position.y = h / 2;
  g.add(box);
  // corner posts + door rods
  const frame = new THREE.MeshStandardMaterial({ color: 0x24242a, metalness: 0.7, roughness: 0.4 }), goldM = metal('goldRough');
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.11, h + 0.02, 0.11), frame); c.position.set(a * (l / 2 - 0.04), h / 2, b * (w / 2 - 0.04)); g.add(c); });
  [0.05, h - 0.05].forEach((y) => { [-1, 1].forEach((b) => { const r = new THREE.Mesh(new THREE.BoxGeometry(l, 0.1, 0.1), frame); r.position.set(0, y, b * (w / 2 - 0.03)); g.add(r); }); });
  if (doors) for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h - 0.2, 6), goldM); r.position.set(l / 2 + 0.03, h / 2, (i - 1.5) * w / 4.4); g.add(r); }
  return g;
}

/* Convenience: fades the fixed canvas behind solid sections */
// Prepares every shader in the background (hidden objects too, so nothing stutters later), then opens the page
export async function setupPage(stage) {
  window.__tBuilt = performance.now();
  Kit.loader.set(0.88);
  const hidden = [];
  stage.scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  try { if (stage.renderer.compileAsync) await stage.renderer.compileAsync(stage.scene, stage.camera); } catch (_) { /* the first frame will compile instead */ }
  hidden.forEach((o) => { o.visible = false; });
  Kit.loader.set(0.97);
  stage.renderOnce();
  window.__tReady = performance.now();
  Kit.loader.done();
}
export function failSafe() { document.documentElement.classList.add('no-gl'); Kit.loader.done(); }
