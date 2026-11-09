/* Model 6: The Shards. On a bright, formal page, tens of thousands of charcoal shards form the logo in black and gold,
   then morph with the scroll into a lump, cubes, a flame, a bag, a container and a globe. All the motion runs on the GPU. */
import { THREE, Stage, fontsReady, lightStudioEnv, lumpShape, noiseVolume, SHARED, rng, sstep, clamp, lerp, hasGL, failSafe, setupPage, drawLogo, mergeGeometries } from '../../shared/core3d.js';

const Kit = window.Kit, C = Kit.C;
if (!hasGL()) failSafe(); else main();

async function main() {
  await fontsReady(["700 64px 'IBM Plex Sans'"]);
  const canvas = document.getElementById('gl');
  const stage = new Stage({ canvas, fov: 30, far: 80, background: null, bloom: false, tone: 1, vignette: 0, grain: 0 });
  const { scene, camera, renderer, tier } = stage;
  // a value above 1 survives the neutral tone curve as a clean near-white page
  scene.background = new THREE.Color(1.22, 1.215, 1.2);
  scene.environment = lightStudioEnv(renderer);
  Kit.loader.set(0.25);
  const COUNT = tier === 1 ? 16000 : tier === 2 ? 40000 : 70000, R = rng(909);

  /* ---------- shape samplers: each returns x,y,z and a gold flag ---------- */
  const fill = (fn) => { const a = new Float32Array(COUNT * 4); for (let i = 0; i < COUNT; i++) { const p = fn(i); a[i * 4] = p[0]; a[i * 4 + 1] = p[1]; a[i * 4 + 2] = p[2]; a[i * 4 + 3] = p[3] || 0; } return a; };

  // a mask drawn from the vector logo
  const maskOf = (W, H, draw) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); draw(x); const d = x.getImageData(0, 0, W, H).data, body = [], gold = []; for (let j = 0; j < H; j += 1) for (let i = 0; i < W; i += 1) { const r = d[(j * W + i) * 4], g = d[(j * W + i) * 4 + 1]; if (g > 150) gold.push(i, j); else if (r > 150) body.push(i, j); } return { W, H, body, gold }; };
  const LM = maskOf(720, 620, (x) => drawLogo(x, 360, 310, 580, { body: '#ff0000', letters: '#ffff00', snow: null }));
  const fromMask = (m, goldShare, depth) => () => {
    const useG = R() < goldShare, list = useG ? m.gold : m.body, k = Math.floor(R() * list.length / 2) * 2;
    return [(list[k] + R() - m.W / 2) / m.H * 3.1, -(list[k + 1] + R() - m.H / 2) / m.H * 3.1, (R() - 0.5) * depth, useG ? 1 : 0];
  };
  const T = [];
  T.push(fill(fromMask(LM, 0.22, 0.2)));              // 0 logo
  Kit.loader.set(0.4);
  const shape = lumpShape(5, { planes: 26 });
  T.push(fill(() => { // 1 charcoal lump: mostly on the surface
    const z = R() * 2 - 1, a = R() * 6.2832, r = Math.sqrt(1 - z * z), dx = r * Math.cos(a), dy = r * Math.sin(a), rr = shape.radius(dx, dy, z) * (0.82 + 0.18 * Math.pow(R(), 0.25));
    return [dx * rr * 1.3, dy * rr * 1.08, z * rr * 1.56, R() < 0.03 ? 1 : 0];
  }));
  // 2 pyramid of cubes
  const cubes = []; [[3, 0], [2, 1], [1, 2]].forEach(([n, y]) => { for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) cubes.push([(a - (n - 1) / 2) * 0.78, y * 0.78 - 0.78, (b - (n - 1) / 2) * 0.78]); });
  T.push(fill(() => {
    const c = cubes[Math.floor(R() * cubes.length)], s = 0.35, f = Math.floor(R() * 6), u = (R() - 0.5) * 2 * s, v = (R() - 0.5) * 2 * s; let p;
    if (f === 0) p = [s, u, v]; else if (f === 1) p = [-s, u, v]; else if (f === 2) p = [u, s, v]; else if (f === 3) p = [u, -s, v]; else if (f === 4) p = [u, v, s]; else p = [u, v, -s];
    const edge = Math.max(Math.abs(u), Math.abs(v)) > s * 0.93;
    return [c[0] + p[0], c[1] + p[1], c[2] + p[2], edge && R() < 0.3 ? 1 : 0];
  }));
  Kit.loader.set(0.5);
  // 3 flame
  T.push(fill(() => {
    const t = Math.pow(R(), 1.5), w = (1 - t) * (0.55 + 0.45 * Math.sin(t * 3.14)) * 1.1, a = R() * 6.2832, rr = w * Math.sqrt(R());
    return [Math.cos(a) * rr + Math.sin(t * 7) * 0.12 * t, t * 3.4 - 1.5, Math.sin(a) * rr * 0.72, R() < 0.3 + (1 - t) * 0.4 ? 1 : 0];
  }));
  // 4 the bag with the logo in gold on its face
  const LABEL_FONT = "'IBM Plex Sans',Arial,sans-serif";
  const BM = maskOf(400, 600, (x) => { drawLogo(x, 200, 205, 240, { body: '#ffff00', letters: '#ffff00' }); x.fillStyle = '#ffff00'; x.fillRect(120, 362, 160, 6); x.font = `700 58px ${LABEL_FONT}`; x.textAlign = 'center'; x.fillText('10 KG', 200, 450); });
  T.push(fill(() => {
    const onLabel = R() < 0.26;
    let u, v, z, gold = 0;
    if (onLabel) { const k = Math.floor(R() * BM.gold.length / 2) * 2; u = BM.gold[k] / 400 * 2 - 1; v = 1 - BM.gold[k + 1] / 600 * 2; gold = 1; z = 1; }
    else { u = R() * 2 - 1; v = R() * 2 - 1; z = R() < 0.62 ? 1 : -1; }
    const prof = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 3.2)), 0.55), vt = v > 0.78 ? sstep(1, 0.78, v) : 1, vb = v < -0.88 ? sstep(-1, -0.88, v) : 1;
    return [u * 1.08, v * 1.62, z * 0.52 * prof * Math.max(vt * vb, 0.04) + z * 0.012, gold];
  }));
  Kit.loader.set(0.6);
  // 5 container: ribbed walls with the logo on its side
  const CM = maskOf(1000, 400, (x) => { drawLogo(x, 180, 200, 300, { body: '#ffff00', letters: '#ffff00' }); x.fillStyle = '#ffff00'; x.font = `700 104px ${LABEL_FONT}`; x.textAlign = 'left'; x.fillText('M.H.C', 350, 205); x.font = `500 42px ${LABEL_FONT}`; x.fillText('COALLINE  /  EGYPT', 354, 272); });
  const cl = 2.5, ch = 1.05, cw = 1.0;
  T.push(fill(() => {
    if (R() < 0.2) { const k = Math.floor(R() * CM.gold.length / 2) * 2; return [(CM.gold[k] / 1000 - 0.5) * 2 * cl, (0.5 - CM.gold[k + 1] / 400) * 2 * ch, cw + 0.02, 1]; }
    const f = R(); const u = R() * 2 - 1, v = R() * 2 - 1;
    const rib = (q) => Math.round(q * 18) / 18;
    if (f < 0.34) return [rib(u) * cl, v * ch, (R() < 0.6 ? 1 : -1) * cw, 0];
    if (f < 0.6) return [u * cl, (R() < 0.5 ? 1 : -1) * ch, v * cw, 0];
    const front = R() < 0.5 ? 1 : -1;
    if (f < 0.8) return [front * cl, v * ch, Math.round(u * 8) / 8 * cw, Math.abs(u) > 0.94 ? 1 : 0];
    const e = Math.floor(R() * 4); const xx = u * cl; return [xx, (e < 2 ? 1 : -1) * ch, (e % 2 ? 1 : -1) * cw, 1];
  }));
  // 6 globe of land points
  const L = window.MHC_LAND, bin = atob(L.d), landAt = (lat, lon) => { const x = Math.min(L.w - 1, Math.floor(lon + 180)), y = Math.min(L.h - 1, Math.floor(90 - lat)), i = y * L.w + x; return (bin.charCodeAt(i >> 3) >> (i & 7)) & 1; };
  T.push(fill(() => {
    for (let tries = 0; tries < 30; tries++) {
      const z = R() * 2 - 1, a = R() * 6.2832, r = Math.sqrt(1 - z * z), x = r * Math.sin(a), y = z, w = r * Math.cos(a), lat = Math.asin(y) * 57.2958, lon = Math.atan2(x, w) * 57.2958;
      if (landAt(lat, lon)) return [x * 1.75, y * 1.75, w * 1.75, R() < 0.28 ? 1 : 0];
    }
    const z = R() * 2 - 1, a = R() * 6.2832, r = Math.sqrt(1 - z * z); return [r * Math.sin(a) * 1.7, z * 1.7, r * Math.cos(a) * 1.7, 0];
  }));
  Kit.loader.set(0.75);

  /* ---------- a shard: a small broken chip with flat faces ---------- */
  const chip = new THREE.TetrahedronGeometry(1, 0).toNonIndexed();
  { const p = chip.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 0.7 + (Math.abs(Math.sin(x * 13.1 + y * 7.7 + z * 3.3)) * 0.6); p.setXYZ(i, x * k, y * k * 0.7, z * k * 0.9); } chip.computeVertexNormals(); }
  const base = mergeGeometries([chip]);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', base.attributes.position); geo.setAttribute('normal', base.attributes.normal);
  geo.instanceCount = COUNT;
  T.forEach((a, i) => geo.setAttribute('aT' + i, new THREE.InstancedBufferAttribute(a, 4)));
  const rnd = new Float32Array(COUNT * 4); for (let i = 0; i < COUNT * 4; i++) rnd[i] = R();
  geo.setAttribute('aR', new THREE.InstancedBufferAttribute(rnd, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
  const U = {
    tN: { value: noiseVolume().tex }, uTime: SHARED.uTime, uMix: { value: 0 }, uWa: { value: [1, 0, 0, 0, 0, 0, 0] }, uWb: { value: [1, 0, 0, 0, 0, 0, 0] },
    uMouse: { value: new THREE.Vector3(99, 99, 0) }, uPush: { value: 0 }, uSize: { value: tier === 1 ? 0.03 : tier === 2 ? 0.021 : 0.017 }, uScatter: { value: 0 }
  };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.45, flatShading: true });
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader.replace('#include <common>', /* glsl */`#include <common>
      precision highp sampler3D; uniform sampler3D tN;
      attribute vec4 aT0,aT1,aT2,aT3,aT4,aT5,aT6,aR;
      uniform float uTime,uMix,uWa[7],uWb[7],uPush,uSize,uScatter; uniform vec3 uMouse;
      varying float vGold,vR;
      mat3 rotM(vec3 a,float r){ float s=sin(r),c=cos(r),o=1.-c; return mat3(o*a.x*a.x+c,o*a.x*a.y+a.z*s,o*a.z*a.x-a.y*s, o*a.x*a.y-a.z*s,o*a.y*a.y+c,o*a.y*a.z+a.x*s, o*a.z*a.x+a.y*s,o*a.y*a.z-a.x*s,o*a.z*a.z+c); }`)
      .replace('#include <beginnormal_vertex>', /* glsl */`
      vec4 Ta=aT0*uWa[0]+aT1*uWa[1]+aT2*uWa[2]+aT3*uWa[3]+aT4*uWa[4]+aT5*uWa[5]+aT6*uWa[6];
      vec4 Tb=aT0*uWb[0]+aT1*uWb[1]+aT2*uWb[2]+aT3*uWb[3]+aT4*uWb[4]+aT5*uWb[5]+aT6*uWb[6];
      float st=aR.x*.42, kk=clamp((uMix-st)/.58,0.,1.); kk=kk*kk*(3.-2.*kk);
      float fly=sin(kk*3.14159);
      vec3 ax=normalize(aR.xyz*2.-1.+.001);
      mat3 Rm=rotM(ax,aR.w*6.28+uTime*(.05+aR.y*.16)+fly*5.*aR.z);
      vec3 objectNormal=Rm*vec3(normal);`)
      .replace('#include <begin_vertex>', /* glsl */`
      vec3 cen=mix(Ta.xyz,Tb.xyz,kk);
      vec4 fN=texture(tN,cen*.12+vec3(0.,uTime*.012,uTime*.008));
      vec3 curl=(fN.rgb-.5)*2.;
      cen+=curl*(fly*1.15+.012+uScatter*1.5);
      vec3 dM=cen-uMouse; float dd=dot(dM.xy,dM.xy); float push=exp(-dd*4.)*uPush;
      cen+=vec3(dM.xy,.4*(aR.z-.5))*push*.55;
      vGold=mix(Ta.w,Tb.w,kk); vR=aR.y;
      float sz=uSize*(.55+aR.z*aR.z*1.5)*(1.+fly*.4+push*.25);
      vec3 transformed=Rm*(position*sz)+cen;`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGold,vR;')
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        float gk=smoothstep(.3,.7,vGold);
        diffuseColor.rgb=mix(mix(vec3(.012),vec3(.05,.05,.056),vR),vec3(.8,.56,.11),gk);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(.42,.3,gk);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor=mix(.2,1.,gk);');
  };
  mat.customProgramCacheKey = () => 'shards-light';
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh);

  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-4, 6, 6); scene.add(key);
  const side2 = new THREE.DirectionalLight(0xfff1dc, 0.7); side2.position.set(5, 1, 3); scene.add(side2);

  /* ---------- sections -> shapes ---------- */
  const SEQ = [
    { id: 'hero', s: 0, heat: 0.08, ry: 0 },
    { id: 'about', s: 1, heat: 0.18, ry: 0.5 },
    { id: 'products', s: 2, heat: 0.14, ry: 0.5 },
    { id: 'process', s: 3, heat: 1, ry: 0 },
    { id: 'label', s: 4, heat: 0.12, ry: -0.12 },
    { id: 'export', s: 5, heat: 0.12, ry: -0.3, then: 6 },
    { id: 'trust', s: 0, heat: 0.1, ry: 0 },
    { id: 'faq', s: 1, heat: 0.3, ry: 0.5 },
    { id: 'contact', s: 0, heat: 0.14, ry: 0 }
  ];
  const tr = Kit.sections(SEQ.map((q) => document.getElementById(q.id)));
  const setW = (arr, i) => { for (let k = 0; k < 7; k++) arr[k] = k === i ? 1 : 0; };
  let sT = 0, shown = -1, intro = 0, ptr = new THREE.Vector3(), pushNow = 0;
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), ndc = new THREE.Vector2(), inv = new THREE.Matrix4(), hit = new THREE.Vector3();
  stage.onFrame((dt, time) => {
    const t = tr.value(Kit.scroll.sy, 0.62);
    sT += (t - sT) * Math.min(1, dt * 5);
    const i = Math.min(SEQ.length - 1, Math.floor(sT)), f = sT - i;
    const a = SEQ[i], b = SEQ[Math.min(SEQ.length - 1, i + 1)];
    // the export section holds two shapes
    let fromS = a.s, toS = b.s, m = sstep(0.62, 1, f);
    if (a.then !== undefined) { if (f < 0.5) { toS = a.then; fromS = a.s; m = sstep(0.28, 0.5, f); } else { fromS = a.then; toS = b.s; m = sstep(0.72, 1, f); } }
    setW(U.uWa.value, fromS); setW(U.uWb.value, toS);
    // opening: the shards settle into place when the page loads
    intro = Math.min(1, intro + dt * 0.8);
    U.uMix.value = m;
    U.uScatter.value = (1 - sstep(0, 1, intro)) * 1.8;
    Kit.fx4d.setHeat(lerp(a.heat, b.heat, m));
    const nowShape = m < 0.5 ? fromS : toS;
    if (nowShape !== shown) { shown = nowShape; Kit.fx4d.thump(0.5); }

    // placement: opposite the text on wide screens, above it on phones
    const asp = camera.aspect, wide = asp > 1.1, side = Kit.isRTL() ? -1 : 1, W = wide ? Math.min(1.5, asp / 1.5) : 0;
    const cz = wide ? 11.4 : 15.5;
    mesh.position.set(side * 1.72 * W, wide ? 0 : 2.5, 0);
    const ry = lerp(a.ry, b.ry, m);
    const sway = (q) => q === 0 || q === 4 || q === 5 || q === 3, swayK = (sway(fromS) ? 1 - m : 0) + (sway(toS) ? m : 0);
    const idle = lerp(time * 0.1, Math.sin(time * 0.35) * 0.16, swayK);
    mesh.rotation.set(Kit.look.sy * 0.08 + (toS === 6 || fromS === 6 ? 0.3 : 0.06), ry + idle + Kit.look.sx * 0.18, 0);
    camera.position.set(Kit.look.sx * 0.1, -Kit.look.sy * 0.07, cz); camera.lookAt(0, 0, 0);

    // the cursor gently moves the shards aside
    const hovering = Kit.look.px > -1000;
    ndc.set((Kit.look.px / innerWidth) * 2 - 1, -(Kit.look.py / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) { mesh.updateMatrixWorld(); inv.copy(mesh.matrixWorld).invert(); ptr.copy(hit).applyMatrix4(inv); U.uMouse.value.lerp(ptr, Math.min(1, dt * 9)); }
    pushNow += ((hovering ? 1 : 0) - pushNow) * Math.min(1, dt * 3); U.uPush.value = pushNow * (Kit.coarse ? 0.5 : 1);
  });
  window.__t = () => sT;
  setupPage(stage);
}
