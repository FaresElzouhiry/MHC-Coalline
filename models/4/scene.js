/* Model 4: The Showroom. A photo-studio view of the pack: calm in the opening, and the live private label studio further down.
   Typing a brand, uploading a logo, or picking a colour and weight redraws the 3D pack. */
import { THREE, Stage, fontsReady, lightStudioEnv, sack, drawLabel, coalMaterial, lumpGeometry, RoundedBoxGeometry, hasGL, failSafe, setupPage, rng } from '../../shared/core3d.js';

const Kit = window.Kit, C = Kit.C, D = C.label.designer;
if (!hasGL()) failSafe(); else main();

async function main() {
  await fontsReady(["800 80px 'Montserrat'", "700 40px 'Montserrat'", "800 80px 'Cairo'", "700 40px 'Cairo'"]);
  const canvas = document.getElementById('gl'), v1 = document.getElementById('v1'), v2 = document.getElementById('v2');
  // neutral tone mapping keeps the ivory and the pack colours true
  const stage = new Stage({ canvas, fov: 26, far: 80, background: null, bloom: false, tone: 1, exposure: 1.02, vignette: 0, grain: 0 });
  const { scene, camera, renderer, tier } = stage;
  renderer.setClearColor(0xE9E3D7, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.environment = lightStudioEnv(renderer);
  Kit.loader.set(0.3);

  // studio floor curving up into the wall
  const cycG = new THREE.PlaneGeometry(60, 40, 1, 40), p = cycG.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const d = (p.getY(i) + 20), r = 6, a = Math.min(1, (d - 22) / (r * 1.5708)) * 1.5708;
    const z = d < 22 ? 12 - d : -10 - Math.sin(a) * r, y = d < 22 ? 0 : (1 - Math.cos(a)) * r + Math.max(0, d - 22 - r * 1.5708);
    p.setXYZ(i, p.getX(i), y, z);
  }
  cycG.computeVertexNormals();
  const cyc = new THREE.Mesh(cycG, new THREE.ShaderMaterial({
    uniforms: { uA: { value: new THREE.Color(0xF6F2EA) }, uB: { value: new THREE.Color(0xD6CDBB) } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'uniform vec3 uA,uB; varying vec3 vW; void main(){ float d=length(vW.xz)/11.; gl_FragColor=vec4(mix(uA,uB,smoothstep(.1,1.,d))*1.12,1.); }'
  }));
  scene.add(cyc);
  const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.3, color: 0x3b2e1c })); shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = 0.002; shadowFloor.receiveShadow = true; scene.add(shadowFloor);

  const key = new THREE.DirectionalLight(0xfff5e6, 2.1); key.position.set(-3.2, 6.2, 4.4); key.castShadow = true;
  key.shadow.mapSize.set(tier === 1 ? 1024 : 2048, tier === 1 ? 1024 : 2048); key.shadow.radius = 9; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -2, near: 1, far: 16 }); scene.add(key);
  const fill = new THREE.DirectionalLight(0xe3e9ff, 0.45); fill.position.set(4, 2.4, 3); scene.add(fill);

  /* ---------- the pack ---------- */
  const labelC = document.createElement('canvas'); labelC.width = tier === 1 ? 768 : 1200; labelC.height = Math.round(labelC.width * 1.5);
  const labelT = new THREE.CanvasTexture(labelC); labelT.colorSpace = THREE.SRGBColorSpace; labelT.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const backC = document.createElement('canvas'); backC.width = backC.height = 8;
  const backT = new THREE.CanvasTexture(backC); backT.colorSpace = THREE.SRGBColorSpace;
  const bag = sack({ w: 1.6, h: 2.3, d: 1.08, map: labelT, backMap: backT, seed: 4, seam: 0x1a1612 });
  bag.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  bag.position.y = 1.16;
  const stitch = bag.children[2]; stitch.scale.x = 0.97; // stays inside the pack edge
  const pack = new THREE.Group(); pack.add(bag); scene.add(pack);

  // retail box shown with the shisha line
  const boxC = document.createElement('canvas'); boxC.width = boxC.height = 640;
  const boxT = new THREE.CanvasTexture(boxC); boxT.colorSpace = THREE.SRGBColorSpace; boxT.anisotropy = 8;
  const boxMat = new THREE.MeshStandardMaterial({ map: boxT, roughness: 0.42, metalness: 0.05 }), boxPlain = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.45 });
  const retail = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.5), [boxPlain, boxPlain, boxPlain, boxPlain, boxMat, boxPlain]);
  retail.castShadow = true; retail.position.set(1.28, 0.36, 0.42); retail.rotation.y = -0.42; pack.add(retail);

  // charcoal in front of the pack
  const coalM = coalMaterial({ heat: 0, ash: 0, bump: 0.03, flat: 0.1, env: 0.8, tint: 0.62 });
  const R = rng(14), g1 = lumpGeometry(3, { detail: tier === 1 ? 10 : 18, stretch: [1, 0.78, 1.25] }), g2 = lumpGeometry(11, { detail: tier === 1 ? 10 : 18, stretch: [0.9, 0.74, 1.1] });
  const lumps = new THREE.Group(); pack.add(lumps);
  [[-1.28, 0.2, 0.82, 0.3], [-0.86, 0.15, 1.12, 0.22], [-1.62, 0.13, 1.08, 0.18], [-0.5, 0.11, 1.34, 0.16], [-1.08, 0.1, 1.42, 0.14], [0.2, 0.09, 1.28, 0.12], [0.56, 0.07, 1.42, 0.09]].forEach((q, i) => {
    const m = new THREE.Mesh(i % 2 ? g2 : g1, coalM); m.position.set(q[0], q[1], q[2]); m.scale.setScalar(q[3]); m.rotation.set(R() * 6, R() * 6, R() * 6); m.castShadow = true; lumps.add(m);
  });
  // pressed products in front of the pack
  const cubeG = new RoundedBoxGeometry(0.2, 0.2, 0.2, 2, 0.02), cubeM = coalMaterial({ heat: 0, ash: 0, bump: 0.01, flat: 0, wood: 0, env: 0.8, tint: 0.68 });
  const cubes = new THREE.Group(); pack.add(cubes);
  [[-1.2, 0.1, 0.9, 0.1], [-0.96, 0.1, 0.95, 0.3], [-1.08, 0.3, 0.92, 0.5], [-1.44, 0.1, 1.08, 0.9], [-0.68, 0.1, 1.22, 0.2], [-1.1, 0.1, 1.28, 0.6]].forEach((q) => { const m = new THREE.Mesh(cubeG, cubeM); m.position.set(q[0], q[1], q[2]); m.rotation.y = q[3]; m.castShadow = true; cubes.add(m); });
  Kit.loader.set(0.7);

  /* ---------- the studio ---------- */
  const state = { brand: '', prod: 0, color: 0, weight: 2, image: null, imgURL: null };
  const brandIn = document.getElementById('brandIn'), weightOf = (prod) => prod.weights[Math.min(state.weight, prod.weights.length - 1)];
  const redraw = () => {
    const c = D.colors[state.color], prod = C.products.items[state.prod], w = weightOf(prod), brand = (state.brand || '').trim();
    drawLabel(labelC, { color: c.c, ink: c.ink, brand, product: Kit.T(prod.name), weight: w + ' ' + (Kit.lang === 'ar' ? 'كجم' : 'KG'), image: state.image, origin: Kit.lang === 'ar' ? 'صُنع في مصر' : 'PRODUCT OF EGYPT' });
    labelT.needsUpdate = true;
    const bx = backC.getContext('2d'); bx.fillStyle = c.c; bx.fillRect(0, 0, 8, 8); backT.needsUpdate = true;
    // seal and carton sides follow the chosen colour
    stitch.material.color.set(c.c).multiplyScalar(0.7); boxPlain.color.set(c.c).multiplyScalar(0.92);
    // retail box in the same design
    const b = boxC.getContext('2d'), name = brand || 'M.H.C'; b.fillStyle = c.c; b.fillRect(0, 0, 640, 640); b.strokeStyle = c.ink; b.lineWidth = 5; b.strokeRect(26, 26, 588, 588); b.fillStyle = c.ink; b.textAlign = 'center'; b.textBaseline = 'middle';
    const stack = "'Montserrat','Cairo',Arial,sans-serif"; let s = 96; b.font = `800 ${s}px ${stack}`; while (b.measureText(name).width > 520 && s > 20) { s -= 4; b.font = `800 ${s}px ${stack}`; }
    b.direction = /[؀-ۿ]/.test(name) ? 'rtl' : 'ltr'; b.fillText(name, 320, 280);
    b.font = `600 34px ${stack}`; b.direction = 'ltr'; b.fillText('1 KG', 320, 400); boxT.needsUpdate = true;
    // what stands in front of the pack
    const pressed = prod.form === 'cube' || prod.form === 'hex';
    cubes.visible = pressed; lumps.visible = !pressed; retail.visible = prod.form === 'cube';
  };
  const buildWeights = () => {
    const host = document.getElementById('oWeight'), prod = C.products.items[state.prod], cur = Math.min(state.weight, prod.weights.length - 1);
    host.innerHTML = prod.weights.map((w, i) => `<button type="button" class="${i === cur ? 'on' : ''}"><span class="ltr">${w}</span> ${Kit.T(D.kg)}</button>`).join('');
    [...host.children].forEach((b, i) => { b.onclick = () => { state.weight = i; buildWeights(); redraw(); }; });
  };
  const syncOpts = () => {
    [...document.querySelectorAll('#oProd button')].forEach((b, i) => { b.classList.toggle('on', i === state.prod); b.onclick = () => { state.prod = i; state.weight = 1; buildWeights(); syncOpts(); redraw(); }; });
    [...document.querySelectorAll('#oColor button')].forEach((b, i) => { b.classList.toggle('on', i === state.color); b.onclick = () => { state.color = i; syncOpts(); redraw(); }; });
  };
  brandIn.addEventListener('input', () => { state.brand = brandIn.value; redraw(); });
  document.getElementById('logoIn').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (state.imgURL) URL.revokeObjectURL(state.imgURL);
    state.imgURL = URL.createObjectURL(f);
    const im = new Image(); im.onload = () => { state.image = im; redraw(); }; im.src = state.imgURL;
  });
  document.getElementById('reqBtn').addEventListener('click', () => {
    const c = D.colors[state.color], prod = C.products.items[state.prod], w = weightOf(prod);
    const msg = `${Kit.T(C.label.kicker)}: ${(state.brand || '').trim() || '-'} · ${Kit.T(c.n)} · ${w} ${Kit.T(D.kg)}`;
    Kit.prefill({ product: prod.id, message: msg });
    const n = document.getElementById('reqNote'); n.textContent = msg; n.classList.add('on');
  });
  const rebuild = () => { buildWeights(); syncOpts(); redraw(); };
  Kit.on('lang', rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  rebuild();

  // one canvas serves both views: it moves to whichever view is on screen
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting && canvas.parentElement !== e.target) e.target.prepend(canvas); }); }, { threshold: 0.2 });
    io.observe(v1); io.observe(v2);
  }

  /* ---------- turntable ---------- */
  let rot = -0.28, vel = 0, drag = false, lastX = 0, lastTouch = -9;
  canvas.addEventListener('pointerdown', (e) => { drag = true; lastX = e.clientX; lastTouch = stage.time; try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* fine */ } });
  window.addEventListener('pointermove', (e) => { if (!drag) return; const d = e.clientX - lastX; lastX = e.clientX; rot += d * 0.008; vel = d * 0.008; lastTouch = stage.time; }, { passive: true });
  const end = () => { drag = false; };
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);

  stage.onFrame((dt, time) => {
    const asp = camera.aspect;
    if (!drag) { rot += vel; vel *= Math.pow(0.04, dt); }
    // when left alone the pack turns back to face the viewer and sways very slightly
    if (time - lastTouch > 3 && !drag) { const goal = -0.26 + Math.sin(time * 0.3) * 0.14, wrap = Math.atan2(Math.sin(goal - rot), Math.cos(goal - rot)); rot += wrap * Math.min(1, dt * 0.9); }
    pack.rotation.y = rot;
    const dist = asp < 0.9 ? 9.6 : asp < 1.2 ? 8.4 : 7.7;
    camera.position.set(Kit.look.sx * 0.2, 1.9 - Kit.look.sy * 0.12, dist);
    camera.lookAt(0, 1.08, 0);
  });
  window.__state = state;
  setupPage(stage);
}
