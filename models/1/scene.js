/* Model 1: The Ember. One hero piece of charcoal that heats up, bursts open and becomes each product as the page scrolls. */
import { THREE, Stage, studioEnv, shatterGeometry, coalMaterial, lumpGeometry, coalHeap, embers, smoke, backdrop, logoGroup, keyed, sstep, clamp, lerp, hasGL, failSafe, setupPage, RoundedBoxGeometry, GOLD } from '../../shared/core3d.js';

const Kit = window.Kit, C = Kit.C;
if (!hasGL()) failSafe(); else main();

function main() {
  const canvas = document.getElementById('gl');
  const stage = new Stage({ canvas, fov: 28, background: 0x040404, bloom: { strength: 0.5, radius: 0.7, threshold: 1.0 }, vignette: 0.62, grain: 0.024, ca: 0.005 });
  const { scene, camera, renderer, tier } = stage;
  scene.environment = studioEnv(renderer);
  Kit.loader.set(0.2);

  const bg = backdrop({ glow: [0.34, 0.08, 0.009], smoke: 0.045 }); scene.add(bg);

  // Lights: a hard key from above, a warm rim from behind, the ember's own glow
  const key = new THREE.DirectionalLight(0xfff2de, 1.25); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffa34a, 3.2); rim.position.set(4, 1.2, -5); scene.add(rim);
  const fire = new THREE.PointLight(0xff7a22, 0, 14, 1.7); scene.add(fire);

  // The hero: a lump cut into shards that fit together perfectly
  const hero = new THREE.Group(); scene.add(hero);
  const shatterG = shatterGeometry(5, { shards: tier === 1 ? 14 : 20, detail: tier === 1 ? 11 : 17, stretch: [1, 0.82, 1.22], planes: 26 });
  const coal = coalMaterial({ shard: true, dissolve: true, bump: 0.045, flat: 0, core: 1 });
  const lump = new THREE.Mesh(shatterG, coal); hero.add(lump);
  const cu = coal.userData.u;
  Kit.loader.set(0.5);

  // Molten core shown when the lump opens
  const coreMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uAmt: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform float uAmt,uTime; varying vec3 vN,vV; void main(){ float f=pow(max(dot(vN,vV),0.),2.6); vec3 c=mix(vec3(1.5,.3,.02),vec3(5.,2.8,.8),f); gl_FragColor=vec4(c*f*uAmt,f*uAmt); }'
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 24), coreMat); hero.add(core);

    // The other three product forms
  const prodMats = [];
  const prodMat = (o) => { const m = coalMaterial(Object.assign({ dissolve: true }, o)); prodMats.push(m); return m; };
  const cubes = new THREE.Group();
  {
    const geo = new RoundedBoxGeometry(0.5, 0.5, 0.5, 3, 0.045), mat = prodMat({ instanced: true, bump: 0.014, flat: 0, ash: 0, heat: 0.12, tint: 1.25, wood: 0 });
    const layers = [[3, 3, 0], [2, 2, 0.51], [1, 1, 1.02]], list = [];
    layers.forEach(([nx, nz, y]) => { for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) list.push([(a - (nx - 1) / 2) * 0.53, y - 0.55, (b - (nz - 1) / 2) * 0.53]); });
    const inst = new THREE.InstancedMesh(geo, mat, list.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
    list.forEach((p, i) => { E.set(0, (i * 7 % 5 - 2) * 0.02, 0); Q.setFromEuler(E); P.set(...p); M.compose(P, Q, S); inst.setMatrixAt(i, M); });
    const heat = new Float32Array(list.length); list.forEach((_, i) => { heat[i] = i === list.length - 1 ? 3 : 0.4; });
    geo.setAttribute('aHeat', new THREE.InstancedBufferAttribute(heat, 1));
    cubes.add(inst);
  }
  const hexes = new THREE.Group();
  {
    const sh = new THREE.Shape(), R = 0.27; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832 + 0.5236; if (i === 0) sh.moveTo(Math.cos(a) * R, Math.sin(a) * R); else sh.lineTo(Math.cos(a) * R, Math.sin(a) * R); } sh.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, 0.075, 0, 6.2832, true); sh.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.5, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1, curveSegments: 12 }); geo.translate(0, 0, -0.75);
    const mat = prodMat({ bump: 0.02, flat: 0.1, ash: 0, heat: 0.08, wood: 0 });
    [[0, 0], [0.5, 0], [-0.5, 0], [0.25, 0.44], [-0.25, 0.44], [0.25, -0.44], [-0.25, -0.44]].forEach(([x, y], i) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, (i * 37 % 5 - 2) * 0.09); hexes.add(m); });
    hexes.rotation.set(0.1, 0.65, 0);
  }
  const cluster = new THREE.Group();
  {
    const mat = prodMat({ bump: 0.03, flat: 0.34, heat: 0.34, tint: 1.1 }), g1 = lumpGeometry(21, { detail: tier === 1 ? 14 : 22, stretch: [0.9, 0.78, 1.1] }), g2 = lumpGeometry(34, { detail: tier === 1 ? 14 : 22, stretch: [1, 0.74, 0.95] });
    [[-0.48, -0.42, 0.1, 0.56], [0.42, -0.5, 0.25, 0.5], [0.05, -0.38, -0.5, 0.58], [-0.1, 0.22, 0.05, 0.56], [0.58, 0.08, -0.25, 0.4], [-0.62, 0.15, -0.3, 0.37], [0.2, -0.56, 0.68, 0.34], [-0.28, -0.58, 0.66, 0.3]].forEach((p, i) => {
      const m = new THREE.Mesh(i % 2 ? g2 : g1, mat); m.position.set(p[0], p[1], p[2]); m.scale.setScalar(p[3]); m.rotation.set(i * 1.3, i * 2.1, i * 0.7); cluster.add(m);
    });
  }
  [cubes, hexes, cluster].forEach((g) => { g.visible = false; scene.add(g); });
  Kit.loader.set(0.7);

  // Bed of embers for the production section
  const heap = coalHeap({ count: tier === 1 ? 120 : tier === 2 ? 240 : 380, radius: 5.2, height: 0.9, heat: 0.9, detail: 4 }); heap.position.set(0, -2.2, -0.6); heap.visible = false; scene.add(heap);
  const ember = embers({ count: tier === 1 ? 220 : 520, box: [10, 7, 6], y0: -2.6, size: 26, speed: 0.5 }); scene.add(ember);
  const smk = smoke({ count: tier === 1 ? 10 : 18, origin: [0, -1.8, -2.2], spread: 5, rise: 6, size: 5.5, speed: 0.035, opacity: 0.09, color: [0.5, 0.42, 0.36] }); smk.visible = false; scene.add(smk);

  // The real logo, shown with the credentials
  const logo = logoGroup({ depth: 0.09 }); logo.visible = false; scene.add(logo);

  /* ---------- page wiring ---------- */
  const ids = ['hero', 'about', 'inside', 'products', 'process', 'export', 'label', 'trust', 'faq', 'contact'];
  const tr = Kit.sections(ids.map((i) => document.getElementById(i)));
  const trustCol = document.querySelector('#trust .col'), productsEl = document.getElementById('products'), processEl = document.getElementById('process');
  let spots = [], panels = [], dots = [], stepsEls = [];
  const collect = () => {
    spots = [...document.querySelectorAll('.spot')];
    panels = [...document.querySelectorAll('.p-panel')];
    dots = [...document.querySelectorAll('#pdots button')];
    stepsEls = [...document.querySelectorAll('#steps li')];
    dots.forEach((b, i) => { b.onclick = () => { const r = productsEl.getBoundingClientRect(); const span = r.height - innerHeight; window.scrollTo({ top: r.top + scrollY + span * ((i + 0.5) / 4) }); }; });
    panels.forEach((p, i) => p.classList.toggle('on', i === curProd));
    dots.forEach((p, i) => p.classList.toggle('on', i === curProd));
  };
  let curProd = 0;
  collect(); Kit.on('lang', collect);

  // temperature graph
  const steps = C.process.steps, gLine = document.getElementById('gLine'), gDot = document.getElementById('gDot'), gDay = document.getElementById('gDay'), gTemp = document.getElementById('gTemp');
  const gx = (i) => i / (steps.length - 1) * 300, gy = (v) => 140 - v / 560 * 130;
  { let d = ''; steps.forEach((s, i) => { d += (i ? 'L' : 'M') + gx(i).toFixed(1) + ' ' + gy(s.temp).toFixed(1); }); gLine.setAttribute('d', d); }

  /* ---------- choreography: t runs over the sections ---------- */
  const KEYS = [
    { t: 0, x: 1.18, y: 0.0, z: 0, s: 1.06, heat: 0.1, ex: 0, core: 0, cz: 8.2, cy: 0.1, glow: 0.14, ry: 0, sm: 0 },
    { t: 0.55, x: 1.3, y: 0, z: 0, s: 1.3, heat: 0.2, ex: 0, core: 0, cz: 7.6, cy: 0, glow: 0.2, ry: 0.5, sm: 0 },
    { t: 1, x: 1.42, y: -0.05, z: 0, s: 1.8, heat: 0.38, ex: 0, core: 0, cz: 7.2, cy: 0, glow: 0.3, ry: 1.2, sm: 0 },
    { t: 1.85, x: 1.5, y: 0.05, z: 0, s: 1.75, heat: 0.55, ex: 0, core: 0, cz: 7.2, cy: 0, glow: 0.42, ry: 1.9, sm: 0 },
    { t: 2.08, x: 0.95, y: 0, z: 0, s: 0.92, heat: 0.78, ex: 0.02, core: 0.4, cz: 8.6, cy: 0, glow: 0.6, ry: 2.4, sm: 0 },
    { t: 2.42, x: 0.98, y: 0, z: 0, s: 0.92, heat: 0.72, ex: 1, core: 1, cz: 8.6, cy: 0, glow: 1, ry: 2.8, sm: 0 },
    { t: 2.82, x: 0.98, y: 0, z: 0, s: 0.92, heat: 0.72, ex: 1, core: 1, cz: 8.6, cy: 0, glow: 1, ry: 3.1, sm: 0 },
    { t: 3, x: 1.1, y: 0, z: 0, s: 1.12, heat: 0.34, ex: 0, core: 0, cz: 8.2, cy: 0, glow: 0.3, ry: 3.5, sm: 0 },
    { t: 3.98, x: 1.1, y: 0, z: 0, s: 1.12, heat: 0.34, ex: 0, core: 0, cz: 8.2, cy: 0, glow: 0.3, ry: 4.4, sm: 0 },
    { t: 4.25, x: 1.75, y: 1.0, z: -1, s: 0.86, heat: 0.92, ex: 0, core: 0, cz: 8.6, cy: 0.3, glow: 1, ry: 5.2, sm: 1 },
    { t: 4.9, x: 1.8, y: 1.05, z: -1, s: 0.82, heat: 0.9, ex: 0, core: 0, cz: 8.6, cy: 0.4, glow: 1, ry: 6.2, sm: 1 },
    { t: 5.2, x: 1.65, y: 0.2, z: 0, s: 1.05, heat: 0.45, ex: 0, core: 0, cz: 9, cy: 0, glow: 0.42, ry: 6.8, sm: 0 },
    { t: 6, x: 1.75, y: -0.1, z: 0, s: 1.3, heat: 0.3, ex: 0, core: 0, cz: 8.6, cy: 0, glow: 0.3, ry: 7.6, sm: 0 },
    { t: 7, x: 3.5, y: 1.9, z: -2, s: 0.4, heat: 0.2, ex: 0, core: 0, cz: 8.6, cy: 0, glow: 0.2, ry: 8.3, sm: 0 },
    { t: 8, x: 1.9, y: 0.2, z: 0, s: 0.95, heat: 0.3, ex: 0, core: 0, cz: 8.6, cy: 0, glow: 0.25, ry: 9, sm: 0 },
    { t: 9, x: 1.75, y: 0.9, z: 0, s: 0.88, heat: 0.62, ex: 0, core: 0, cz: 8.6, cy: 0, glow: 0.6, ry: 9.7, sm: 0 },
    { t: 10, x: 1.75, y: 0.9, z: 0, s: 0.88, heat: 0.7, ex: 0, core: 0, cz: 8.6, cy: 0, glow: 0.7, ry: 10.2, sm: 0 }
  ];
  const look = new THREE.Vector3(), W = new THREE.Vector3(), scr = {};
  const RING = [-68, -14, 40, 92, 150], RINGM = [-140, -38, 16, 164, 90];
  let sT = 0, spin = 0;
  const prodObjs = [null, cubes, hexes, cluster];
  stage.onFrame((dt, time) => {
    const t = tr.value(Kit.scroll.sy, 0.62);
    sT += (t - sT) * Math.min(1, dt * 5);
    const k = keyed(KEYS, sT);
    const asp = camera.aspect, wide = asp > 1.2, side = Kit.isRTL() ? -1 : 1;
    const xScale = wide ? Math.min(1.5, asp / 1.55) : 0;
    const openK = sstep(2.02, 2.2, sT) * (1 - sstep(2.86, 3, sT));
    const mobY = wide ? 0 : lerp(0.95 + (asp < 0.62 ? 0.25 : 0), -0.75, openK);
    const mobS = wide ? 1 : 0.72;

    // products pin: which form is showing
    let prodMix = 0, prodIdx = 0, prodV = [1, 0, 0, 0];
    if (sT > 2.9 && sT < 4.2) {
      const r = productsEl.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight), p = clamp(-r.top / span);
      const f = p * 4; prodIdx = Math.min(3, Math.floor(f));
      prodV = [0, 1, 2, 3].map((j) => {
        const c = j + 0.5, d = Math.abs(f - c);
        const hold = j === 0 ? (f < 0.5 ? 1 : 1 - sstep(0.34, 0.5, d)) : j === 3 ? (f > 3.5 ? 1 : 1 - sstep(0.34, 0.5, d)) : 1 - sstep(0.34, 0.5, d);
        return hold;
      });
      prodMix = 1;
      if (prodIdx !== curProd) { curProd = prodIdx; panels.forEach((el, i) => el.classList.toggle('on', i === curProd)); dots.forEach((el, i) => el.classList.toggle('on', i === curProd)); Kit.fx4d.thump(0.5); }
    }

    // hero lump
    spin += dt * (0.1 + (Kit.reduce ? 0 : 0.08));
    const px = k.x * side * xScale, py = k.y + mobY, ps = k.s * mobS;
    hero.position.set(px, py, k.z);
    hero.scale.setScalar(ps);
    hero.rotation.set(0.32 + Kit.look.sy * 0.14 + Math.sin(time * 0.3) * 0.03, k.ry + spin + Kit.look.sx * 0.26, 0.18);
    cu.uHeat.value = k.heat; cu.uExplode.value = k.ex * 1.25; cu.uCore.value = k.core * 0.6;
    const heroV = prodMix ? prodV[0] : 1;
    cu.uDissolve.value = heroV >= 0.999 ? 0 : (1 - heroV) * 1.02;
    lump.visible = heroV > 0.002;
    coreMat.uniforms.uAmt.value = sstep(0.04, 0.7, k.ex) * 0.75 * (lump.visible ? 1 : 0);
    core.visible = coreMat.uniforms.uAmt.value > 0.01;
    core.scale.setScalar(0.7 + k.ex * 0.5 + Math.sin(time * 2.2) * 0.02);

    // other products sit where the lump is
    [1, 2, 3].forEach((j) => {
      const g = prodObjs[j], v = prodV[j];
      g.visible = prodMix > 0 && v > 0.002;
      if (!g.visible) return;
      g.position.set(px, py, 0); g.scale.setScalar(ps * (j === 1 ? 1.22 : j === 2 ? 1.05 : 1.2));
      g.rotation.y = (j === 2 ? 0.65 : 0) + time * 0.22 + Kit.look.sx * 0.3;
      g.rotation.x = (j === 2 ? 0.1 : 0.22) + Kit.look.sy * 0.1;
      prodMats[j - 1].userData.u.uDissolve.value = v >= 0.999 ? 0 : (1 - v) * 1.02;
    });

    // the fire
    const hot = k.heat;
    fire.position.set(px, py, 0.4); fire.intensity = Math.pow(hot, 2) * 14;
    rim.intensity = 2 + hot * 2;
    bg.userData.u.uAmt.value = k.glow; bg.userData.u.uAsp.value = asp; bg.userData.u.uCX.value = wide ? (px / 6) * 0.9 : 0;
    Kit.fx4d.setHeat(hot);
    ember.material.uniforms.uAmt.value = 0.25 + hot * 0.75;

    // embers bed
    const bedV = sstep(3.98, 4.25, sT) * (1 - sstep(4.92, 5.2, sT));
    heap.visible = bedV > 0.01; smk.visible = heap.visible;
    if (heap.visible) { heap.position.y = -3.6 + bedV * 1.5; heap.userData.setHeat(bedV); smk.material.uniforms.uOp.value = 0.09 * bedV; }

    // logo with the credentials
    const lV = sstep(6.4, 6.95, sT) * (1 - sstep(7.55, 7.95, sT));
    logo.visible = lV > 0.005;
    if (logo.visible) {
      const w = wide ? Math.min(1.3, asp / 1.5) : 0;
      const rc = trustCol.getBoundingClientRect(), halfH = Math.tan(camera.fov * Math.PI / 360) * camera.position.z;
      const ny = 1 - 2 * (wide ? rc.top + rc.height / 2 : rc.top + innerWidth * 0.24) / innerHeight;
      logo.position.set(side * 1.72 * w, ny * halfH, 0);
      logo.scale.setScalar((wide ? 1.42 : 1.5) * (0.82 + lV * 0.18));
      logo.rotation.set(Kit.look.sy * 0.14, (1 - lV) * 1.4 + Kit.look.sx * 0.3 + Math.sin(time * 0.5) * 0.08, 0);
    }

    // camera
    camera.position.set(Kit.look.sx * 0.22, k.cy - Kit.look.sy * 0.14, k.cz + (wide ? 0 : 2.1));
    look.set(0, k.cy * 0.5, 0);
    camera.lookAt(look);

    // spec labels follow their shards
    if (sT > 2.02 && sT < 3.02 && spots.length) {
      const reveal = sstep(2.3, 2.52, sT) * (1 - sstep(2.84, 2.98, sT));
      hero.updateMatrixWorld(); hero.getWorldPosition(W); stage.toScreen(W, scr);
      const R = wide ? Math.min(innerHeight * 0.36, innerWidth * 0.2) : Math.min(innerWidth * 0.36, innerHeight * 0.2);
      spots.forEach((el, i) => {
        const a = RING[i]; if (!a) return;
        const ang = (wide ? a : RINGM[i]) * Math.PI / 180 + Kit.look.sx * 0.03, bw = el.offsetWidth || 120, bh = el.offsetHeight || 60;
        // the ring opens toward the free side of the page
        const dx = Math.cos(ang) * R * (wide ? 1.3 : 1.12) * (wide ? -side : 1), dy = Math.sin(ang) * R;
        let x = scr.x + dx - bw / 2, y = scr.y + dy - bh / 2;
        if (wide) x = side < 0 ? clamp(x, 16, innerWidth * 0.6 - bw) : clamp(x, innerWidth * 0.4, innerWidth - bw - 16); else x = clamp(x, 8, innerWidth - bw - 8);
        y = clamp(y, wide ? 84 : innerHeight * 0.4, innerHeight - bh - 70);
        const stagger = clamp(reveal * 1.8 - i * 0.14);
        el.style.opacity = stagger; el.style.transform = `translate(${x}px, ${y + (1 - stagger) * 16}px)`;
      });
    } else if (spots.length && spots[0].style.opacity !== '0') spots.forEach((el) => { el.style.opacity = 0; });

    // live day/temperature readout
    if (sT > 3.9 && sT < 5.3) {
      const r = processEl.getBoundingClientRect(), p = clamp((innerHeight * 0.5 - r.top) / Math.max(1, r.height - innerHeight * 0.35));
      const f = p * (steps.length - 1), i = Math.min(steps.length - 2, Math.floor(f)), l = f - i;
      const temp = lerp(steps[i].temp, steps[i + 1].temp, l), day = lerp(steps[i].day, steps[i + 1].day, l);
      gTemp.textContent = Math.round(temp); gDay.textContent = Math.max(1, Math.round(day));
      gDot.setAttribute('cx', gx(f)); gDot.setAttribute('cy', gy(temp));
      const active = Math.round(f);
      stepsEls.forEach((el, j) => el.classList.toggle('on', j <= active));
      Kit.fx4d.setHeat(clamp(temp / 520));
    }
  });
  window.__t = () => sT;
  setupPage(stage);
}
