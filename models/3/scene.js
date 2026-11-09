/* Model 3: The Route. A dotted globe you can spin, ships sailing from Alexandria, and a 3D container you load with charcoal. */
import { THREE, Stage, studioEnv, SHARED, sackGeometry, drawLabel, containerMesh, logoGroup, rng, sstep, clamp, lerp, keyed, hasGL, failSafe, setupPage, mergeGeometries, gritMaterial, drawLogo } from '../../shared/core3d.js';

const Kit = window.Kit, C = Kit.C;
if (!hasGL()) failSafe(); else main();

function main() {
  const canvas = document.getElementById('gl');
  const stage = new Stage({ canvas, fov: 30, far: 400, background: 0x050912, bloom: { strength: 0.42, radius: 0.5, threshold: 1 }, bloomScale: 0.75, vignette: 0.42, grain: 0.018 });
  const { scene, camera, renderer, tier } = stage;
  scene.environment = studioEnv(renderer, { top: [1, 1, 1, 3], back: [1, 0.76, 0.4, 2.4], left: [0.7, 0.8, 1, 1.6], right: [1, 0.8, 0.5, 1.6], floor: [0.9, 0.7, 0.4, 0.3] });
  Kit.loader.set(0.2);

  const toV = (lat, lon, r = 1) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180, c = Math.cos(a); return new THREE.Vector3(c * Math.sin(b) * r, Math.sin(a) * r, c * Math.cos(b) * r); };
  const earth = new THREE.Group(); scene.add(earth);
  const sunDir = { value: new THREE.Vector3(0.6, 0.25, 0.75).normalize() };

  /* ---------- sphere with a faint graticule and sea glint ---------- */
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 72, 54), new THREE.ShaderMaterial({
    uniforms: { uSun: sunDir, uTime: SHARED.uTime },
    vertexShader: 'varying vec3 vN,vV,vO; void main(){ vO=normalize(position); vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: /* glsl */`
      uniform vec3 uSun; varying vec3 vN,vV,vO;
      void main(){
        float lat=asin(clamp(vO.y,-1.,1.)), lon=atan(vO.x,vO.z);
        float gx=abs(fract(lon/.5236)-.5), gy=abs(fract(lat/.5236)-.5);
        float aa=fwidth(lat)/.5236*1.3;
        float grid=(1.-smoothstep(0.,aa,gy))+(1.-smoothstep(0.,fwidth(lon)/.5236*1.3,gx))*step(abs(vO.y),.96);
        float day=smoothstep(-.25,.6,dot(vN,uSun));
        vec3 sea=mix(vec3(.006,.012,.026),vec3(.012,.03,.066),day);
        vec3 h=normalize(uSun+vV); float sp=pow(max(dot(vN,h),0.),70.)*.32*day;
        float rim=pow(1.-max(dot(vN,vV),0.),3.4);
        vec3 c=sea+vec3(.55,.42,.16)*min(grid,1.)*.05*(.4+day)+vec3(1.,.82,.5)*sp+vec3(.15,.3,.62)*rim*.34;
        gl_FragColor=vec4(c,1.);
      }`
  })));

  /* ---------- land as gold dots on a Fibonacci spiral ---------- */
  const mask = (() => { const L = window.MHC_LAND, bin = atob(L.d), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return { W: L.w, H: L.h, has(lat, lon) { const x = Math.min(L.w - 1, Math.floor((lon + 180))), y = Math.min(L.h - 1, Math.floor(90 - lat)), i = y * L.w + x; return (a[i >> 3] >> (i & 7)) & 1; } }; })();
  const total = tier === 1 ? 30000 : 52000, list = [], G = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < total; i++) {
    const y = 1 - (i + 0.5) / total * 2, r = Math.sqrt(1 - y * y), a = i * G;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(x, z) * 180 / Math.PI;
    if (mask.has(lat, lon)) list.push(x, y, z);
  }
  const dotN = list.length / 3, disc = new THREE.CircleGeometry(1, 6), dotG = new THREE.InstancedBufferGeometry();
  dotG.index = disc.index; dotG.setAttribute('position', disc.attributes.position);
  dotG.setAttribute('aN', new THREE.InstancedBufferAttribute(new Float32Array(list), 3)); dotG.instanceCount = dotN;
  const dotU = { uSun: sunDir, uTime: SHARED.uTime, uPort: { value: new THREE.Vector3(0, 1, 0) }, uHome: { value: toV(C.export.origin.lat, C.export.origin.lon) }, uSize: { value: tier === 1 ? 0.0052 : 0.0042 } };
  const dots = new THREE.Mesh(dotG, new THREE.ShaderMaterial({
    uniforms: dotU,
    vertexShader: /* glsl */`
      attribute vec3 aN; uniform float uSize,uTime; uniform vec3 uSun,uPort,uHome; varying vec3 vC;
      void main(){
        vec3 n=aN; vec3 t=normalize(cross(abs(n.y)>.98?vec3(1.,0.,0.):vec3(0.,1.,0.),n)); vec3 b=cross(n,t);
        vec3 wN=normalize(mat3(modelMatrix)*n);
        float day=smoothstep(-.3,.45,dot(wN,uSun));
        float tw=.82+.18*sin(uTime*1.3+n.x*40.+n.z*31.);
        float home=smoothstep(.1,.015,distance(n,uHome)), port=smoothstep(.1,.015,distance(n,uPort));
        vC=mix(vec3(.2,.13,.035),vec3(.92,.66,.2),day)*tw;
        vC=mix(vC,vec3(3.4,2.3,.7),max(home,port));
        vec3 p=n*1.001+(t*position.x+b*position.y)*uSize*(1.+max(home,port)*.45);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader: 'varying vec3 vC; void main(){ gl_FragColor=vec4(vC,1.); }'
  }));
  dots.frustumCulled = false; earth.add(dots);

  /* ---------- atmosphere ---------- */
  const atm = new THREE.Mesh(new THREE.SphereGeometry(1.16, 48, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uAmt: { value: 1 } },
    vertexShader: 'varying vec3 vN,vV; void main(){ vN=normalize(normalMatrix*normal); vec4 m=modelViewMatrix*vec4(position,1.); vV=normalize(-m.xyz); gl_Position=projectionMatrix*m; }',
    fragmentShader: 'uniform float uAmt; varying vec3 vN,vV; void main(){ float f=pow(clamp(dot(vN,vV)+.62,0.,1.),5.2); gl_FragColor=vec4(vec3(.2,.42,.95)*f*.5*uAmt+vec3(.8,.5,.15)*f*f*.3*uAmt,1.); }'
  }));
  scene.add(atm);

  /* ---------- stars ---------- */
  {
    const R = rng(5), n = 1400, p = new Float32Array(n * 3), s = new Float32Array(n);
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize().multiplyScalar(70 + R() * 60); p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z; s[i] = R(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
    scene.add(new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: SHARED.uTime, uPx: { value: window.devicePixelRatio || 1 } },
      vertexShader: 'attribute float aS; uniform float uTime,uPx; varying float vA; void main(){ vA=(.25+aS*.75)*(.65+.35*sin(uTime*(.4+aS)+aS*60.)); gl_PointSize=(1.+aS*1.8)*uPx; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying float vA; void main(){ vec2 d=gl_PointCoord-.5; if(dot(d,d)>.25) discard; gl_FragColor=vec4(vec3(.85,.88,1.)*vA,1.); }'
    })));
  }

  /* ---------- routes ---------- */
  const O = toV(C.export.origin.lat, C.export.origin.lon);
  const routes = C.export.routes.map((r) => {
    const E = toV(r.lat, r.lon), ang = O.angleTo(E), H = 0.035 + ang * 0.13, pts = [];
    for (let i = 0; i <= 64; i++) { const t = i / 64, q = new THREE.Vector3().copy(O).lerp(E, t).normalize(), s = Math.sin(t * Math.PI); pts.push(q.multiplyScalar(1 + s * H)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uHead: { value: 0 }, uSel: { value: 0 }, uTime: SHARED.uTime },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: /* glsl */`
        uniform float uHead,uSel,uTime; varying vec2 vUv;
        void main(){
          float x=vUv.x, dash=smoothstep(.3,.5,abs(fract(x*26.-uTime*.5)-.5)*2.);
          float base=mix(.14,.3,dash);
          float trail=smoothstep(uHead-.42,uHead,x)*step(x,uHead);
          float head=smoothstep(.022,.0,abs(x-uHead));
          vec3 c=vec3(.9,.66,.22)*base*(1.-uSel*.25)+uSel*(vec3(2.4,1.6,.45)*trail*.7+vec3(9.,6.,2.)*head+vec3(1.4,.95,.3)*step(x,uHead)*.42);
          gl_FragColor=vec4(c,1.);
        }`
    });
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.0026, 5, false), mat); earth.add(m);
    return { r, E, curve, mat, m, ang };
  });

  // port markers
  const ringG = new THREE.RingGeometry(0.009, 0.013, 24);
  const makeMark = (v, big) => {
    const g = new THREE.Group(); g.position.copy(v.clone().multiplyScalar(1.004)); g.lookAt(v.clone().multiplyScalar(3)); earth.add(g);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(big ? 0.012 : 0.0065, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.4, 1) })); g.add(dot);
    const ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.7, 0.8), transparent: true, depthWrite: false, side: THREE.DoubleSide })); g.add(ring);
    return { g, ring };
  };
  const home = makeMark(O, true), marks = routes.map((r) => makeMark(r.E, false));
  // ship: a tiny real vessel with black and gold boxes
  const shipG = (() => {
    const parts = [new THREE.BoxGeometry(0.052, 0.009, 0.014), new THREE.BoxGeometry(0.008, 0.016, 0.012).translate(-0.02, 0.012, 0)];
    for (let i = 0; i < 5; i++) parts.push(new THREE.BoxGeometry(0.0062, 0.008, 0.011).translate(-0.01 + i * 0.0072, 0.008, 0));
    return mergeGeometries(parts.map((g) => g.toNonIndexed()));
  })();
  const ship = new THREE.Mesh(shipG, new THREE.MeshStandardMaterial({ color: 0xE7C24F, metalness: 0.6, roughness: 0.3, emissive: 0x6a4a08, emissiveIntensity: 1.2 })); earth.add(ship);
  const shipGlow = new THREE.PointLight(0xffc25a, 0, 0.4, 2); ship.add(shipGlow);
  Kit.loader.set(0.5);

  /* ---------- container yard (the calculator) ---------- */
  const YARD = new THREE.Vector3(60, -2, 0);
  const yard = new THREE.Group(); yard.position.copy(YARD); scene.add(yard);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec2 vP; void main(){ vec2 g=abs(fract(vP)-.5); float w=fwidth(vP.x)*1.2; float l=1.-smoothstep(0.,w,min(g.x,g.y)); float f=smoothstep(26.,4.,length(vP)); gl_FragColor=vec4(vec3(.9,.68,.25)*l*f*.42+vec3(.012,.016,.03)*f,f*(.6+l*.4)); }'
  })); floor.rotation.x = -Math.PI / 2; yard.add(floor);
  const cG = new THREE.Group(); yard.add(cG);
  const wallM = gritMaterial({ color: 0x24272e, roughness: 0.48, metalness: 0.78, amount: 0.15, scale: 0.8, bump: 0 });
  const edgeM = gritMaterial({ color: 0xC69A24, roughness: 0.35, metalness: 0.9, amount: 0.1, scale: 1, bump: 0 });
  const makeBox = (l, w, h) => {
    const g = new THREE.Group(), add = (sx, sy, sz, x, y, z, m = wallM) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); g.add(b); return b; };
    add(l, 0.08, w, 0, 0.04, 0);                  // floor
    add(l, h, 0.05, 0, h / 2, -w / 2);             // back wall
    add(0.05, h, w, -l / 2, h / 2, 0);             // closed end
    // gold frame shows the outline of the cut-away parts
    [[l, 0.07, 0.07, 0, h, w / 2], [l, 0.07, 0.07, 0, h, -w / 2], [l, 0.07, 0.07, 0, 0.04, w / 2], [0.07, h, 0.07, l / 2, h / 2, w / 2], [0.07, h, 0.07, -l / 2, h / 2, w / 2], [0.07, h, 0.07, l / 2, h / 2, -w / 2], [0.07, 0.07, w, l / 2, h, 0], [0.07, 0.07, w, -l / 2, h, 0]].forEach((a) => add(a[0], a[1], a[2], a[3], a[4], a[5], edgeM));
    for (let i = 1; i < l / 1.2; i++) add(0.05, 0.05, w, -l / 2 + i * 1.2, h, 0, edgeM);
    // the logo on the wall behind the bags
    const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / l);
    const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); drawLogo(x, c.width * 0.5, c.height * 0.5, c.height * 0.7, { body: '#E7C24F', letters: '#E7C24F' });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const logoP = new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.85 })); logoP.position.set(0, h / 2, -w / 2 + 0.03); g.add(logoP);
    return g;
  };
  const boxes = C.export.containers.map((c) => { const g = makeBox(c.l, c.w, c.h); g.visible = false; cG.add(g); return g; });
  // bags
  const maxBags = tier === 1 ? 520 : 820;
  const lc = document.createElement('canvas'); lc.width = 256; lc.height = 384;
  drawLabel(lc, { color: '#141416', ink: '#E7C24F', product: 'CHARCOAL', weight: '10 KG', origin: '', font: "'Manrope',Arial,sans-serif" });
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace;
  const bagG = mergeGeometries([sackGeometry(1, 1.5, 0.45, 1, 2, 4, 6).toNonIndexed(), sackGeometry(1, 1.5, 0.45, -1, 2, 4, 6).toNonIndexed()]);
  const orderA = new THREE.InstancedBufferAttribute(new Float32Array(maxBags), 1); bagG.setAttribute('aOrder', orderA);
  const fillU = { value: 0 };
  const bagM = new THREE.MeshStandardMaterial({ map: lt, roughness: 0.8, side: THREE.DoubleSide });
  bagM.onBeforeCompile = (s) => {
    s.uniforms.uFill = fillU;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float aOrder; uniform float uFill;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { float k=clamp((uFill-aOrder)/.035,0.,1.); k=k*k*(3.-2.*k); transformed*=step(.001,k); transformed.z+=(1.-k)*5.; }`);
  };
  bagM.customProgramCacheKey = () => 'bagfill';
  const bags = new THREE.InstancedMesh(bagG, bagM, maxBags); bags.frustumCulled = false; yard.add(bags);
  const yardLight = new THREE.PointLight(0xffd9a0, 0, 40, 1.6); yard.add(yardLight);
  const yardLight2 = new THREE.PointLight(0xb9ccff, 0, 40, 1.6); yard.add(yardLight2);

  let curProd = 0, curBox = 0, fillGoal = 0, fillStart = 0, tonsNow = 0, bagsNow = 0, tonsTo = 0, bagsTo = 0, boxDim = C.export.containers[0];
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2)), P = new THREE.Vector3(), S = new THREE.Vector3();
  const loadBags = () => {
    const prod = C.products.items[curProd], box = C.export.containers[curBox]; boxDim = box;
    boxes.forEach((b, i) => { b.visible = i === curBox; });
    tonsTo = prod.load[box.id]; bagsTo = Math.round(tonsTo * 1000 / 10);
    const want = Math.min(bagsTo, maxBags), V = box.l * box.w * box.h * 0.94, s = Math.cbrt(V / want);
    // a bag is about 1.7 long, 1 wide and 0.6 thick relative to s
    const nx = Math.max(1, Math.round(box.l / (s * 1.7))), nz = Math.max(1, Math.round((box.w - 0.1) / (s * 1.0))), ny = Math.max(1, Math.round((box.h - 0.2) / (s * 0.6)));
    const dx = box.l / nx, dz = (box.w - 0.1) / nz, dy = (box.h - 0.2) / ny; let n = 0;
    for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++) {
      if (n >= maxBags) break;
      P.set(-box.l / 2 + (x + 0.5) * dx, 0.1 + (y + 0.5) * dy, -box.w / 2 + 0.05 + (z + 0.5) * dz);
      S.set(dz * 0.98, dx * 0.66, dy * 2.1);
      M.compose(P, Q, S); bags.setMatrixAt(n, M); orderA.setX(n, n / (nx * ny * nz)); n++;
    }
    bags.count = n; bags.instanceMatrix.needsUpdate = true; orderA.needsUpdate = true;
    fillGoal = 1; fillU.value = 0; fillStart = stage.time; Kit.fx4d.thump(0.7);
  };

  /* ---------- the logo floats beside the credentials ---------- */
  const logo = logoGroup({ depth: 0.09 }); logo.visible = false; scene.add(logo);
  Kit.loader.set(0.72);

  /* ---------- labels ---------- */
  const tagsEl = document.getElementById('tags');
  const tag = (cls) => { const d = document.createElement('div'); d.className = 'tag ' + cls; d.style.opacity = 0; tagsEl.append(d); return d; };
  const tagHome = tag('o'), tagPort = tag('');
  const PINS = [{ lat: 31.2, lon: 29.92, n: C.company.addresses[1].k }, { lat: 30.85, lon: 29.55, n: C.company.addresses[0].k }, { lat: 30.03, lon: 31.2, n: C.company.addresses[2].k }].map((p) => ({ v: toV(p.lat, p.lon, 1.006), n: p.n, el: tag('o') }));
  const pinMarks = PINS.map((p) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4, 1.2) })); m.position.copy(p.v); m.lookAt(p.v.clone().multiplyScalar(3)); earth.add(m); return m; });

  /* ---------- voyage ---------- */
  const vPort = document.getElementById('vPort'), vLand = document.getElementById('vLand'), vDay = document.getElementById('vDay'), vMax = document.getElementById('vMax'), vBar = document.getElementById('vBar');
  let sel = 0, head = 0, holdT = 0, autoNext = true, chips = [], prodChips = [], boxChips = [];
  const setRoute = (i, user) => {
    sel = i; head = 0; holdT = 0; if (user) autoNext = false;
    const r = routes[i];
    dotU.uPort.value.copy(r.E);
    vPort.textContent = Kit.T(r.r.port); vLand.textContent = Kit.T(r.r.land); vMax.textContent = r.r.days[1];
    tagPort.textContent = Kit.T(r.r.port);
    chips.forEach((c, j) => c.classList.toggle('on', j === i));
    const wrap = document.querySelector('.ports-wrap'), el = chips[i];
    if (el && wrap) { const rEl = el.getBoundingClientRect(), rW = wrap.getBoundingClientRect(); wrap.scrollBy({ left: rEl.left + rEl.width / 2 - (rW.left + rW.width / 2), behavior: 'smooth' }); }
  };
  const collect = () => {
    chips = [...document.querySelectorAll('#ports li')];
    chips.forEach((c, i) => { c.querySelector('button').onclick = () => setRoute(i, true); });
    prodChips = [...document.querySelectorAll('#cProd button')]; boxChips = [...document.querySelectorAll('#cBox button')];
    prodChips.forEach((b, i) => { b.onclick = () => { curProd = i; syncChips(); loadBags(); }; });
    boxChips.forEach((b, i) => { b.onclick = () => { curBox = i; syncChips(); loadBags(); }; });
    syncChips();
    tagHome.textContent = Kit.T(C.export.origin.name);
    PINS.forEach((p) => { p.el.textContent = Kit.T(p.n); });
    setRoute(sel);
  };
  const syncChips = () => { prodChips.forEach((b, i) => b.classList.toggle('on', i === curProd)); boxChips.forEach((b, i) => b.classList.toggle('on', i === curBox)); };
  collect(); Kit.on('lang', collect);

  /* ---------- drag to spin ---------- */
  let yaw = -30 * Math.PI / 180, pitch = 0.42, yawV = 0, dragging = false, lastX = 0, lastY = 0, userYaw = 0, userPitch = 0, lastTouch = -10;
  const tiltMax = 1.1;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; lastTouch = stage.time; try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* fine */ } });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    userYaw += dx * 0.005; yawV = dx * 0.005;
    if (e.pointerType !== 'touch') userPitch = clamp(userPitch + dy * 0.004, -tiltMax, tiltMax);
    lastTouch = stage.time;
  }, { passive: true });
  const stopDrag = () => { dragging = false; };
  window.addEventListener('pointerup', stopDrag); window.addEventListener('pointercancel', stopDrag);
  // click a port on the globe
  canvas.addEventListener('click', (e) => {
    earth.updateMatrixWorld();
    let best = -1, bd = 34;
    routes.forEach((r, i) => {
      W.copy(r.E).applyMatrix4(earth.matrixWorld); if (W.clone().sub(earth.position).normalize().dot(tmpV.copy(camera.position).sub(W).normalize()) < 0.1) return;
      stage.toScreen(W, scr); const d = Math.hypot(scr.x - e.clientX, scr.y - e.clientY); if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) setRoute(best, true);
  });

  /* ---------- choreography ---------- */
  const ids = ['hero', 'about', 'products', 'export', 'terms', 'process', 'label', 'trust', 'faq', 'contact'];
  const tr = Kit.sections(ids.map((i) => document.getElementById(i)));
  const KEYS = [
    { t: 0, x: 1.1, y: 0.16, s: 1.2, dim: 1, yard: 0 },
    { t: 0.55, x: 1.2, y: 0.05, s: 1.32, dim: 1, yard: 0 },
    { t: 1, x: 1.42, y: 0, s: 1.28, dim: 0.92, yard: 0 },
    { t: 2, x: 0, y: -1.5, s: 1.9, dim: 0.42, yard: 0 },
    { t: 2.6, x: 0, y: -1.5, s: 1.9, dim: 0.42, yard: 0 },
    { t: 3, x: 0, y: -1.5, s: 1.9, dim: 0.3, yard: 1 },
    { t: 3.92, x: 0, y: -1.5, s: 1.9, dim: 0.3, yard: 1 },
    { t: 4.3, x: 1.4, y: 0, s: 1.2, dim: 0.9, yard: 0 },
    { t: 5, x: 0.2, y: 1.7, s: 1.5, dim: 0.5, yard: 0 },
    { t: 6, x: 1.4, y: 0, s: 1.25, dim: 0.9, yard: 0 },
    { t: 7, x: 0, y: -1.9, s: 1.6, dim: 0.4, yard: 0 },
    { t: 8, x: 1.4, y: 0.1, s: 1.25, dim: 0.9, yard: 0 },
    { t: 8.85, x: 1.32, y: 0.25, s: 2.2, dim: 1, yard: 0, egypt: 1 },
    { t: 10, x: 1.32, y: 0.25, s: 2.2, dim: 1, yard: 0, egypt: 1 }
  ].map((k) => Object.assign({ egypt: 0 }, k));
  const W = new THREE.Vector3(), tmpV = new THREE.Vector3(), scr = {}, tmpQ = new THREE.Quaternion(), look = new THREE.Vector3(), camP = new THREE.Vector3(), up = new THREE.Vector3();
  let sT = 0, loaded = false, egyptK = 0;
  const showTag = (el, v, on, dx = 10, dy = -12) => {
    W.copy(v).applyMatrix4(earth.matrixWorld);
    const facing = W.clone().sub(earth.position).normalize().dot(tmpV.copy(camera.position).sub(W).normalize());
    stage.toScreen(W, scr);
    const vis = on && facing > 0.12;
    el.style.opacity = vis ? 1 : 0;
    if (vis) el.style.transform = `translate(${scr.x + dx}px, ${scr.y + dy}px)`;
  };
  stage.onFrame((dt, time) => {
    const t = tr.value(Kit.scroll.sy, 0.6);
    sT += (t - sT) * Math.min(1, dt * 4.5);
    const k = keyed(KEYS, sT), asp = camera.aspect, wide = asp > 1.15, side = Kit.isRTL() ? -1 : 1, yardK = sstep(0.05, 0.95, k.yard);

    // day and night sweep the globe: the time dimension
    const sa = time * 0.04; sunDir.value.set(Math.cos(sa) * 0.7, 0.3, Math.sin(sa) * 0.7 + 0.25).normalize();

    // globe placement
    const xs = wide ? Math.min(1.5, asp / 1.6) : 0, mobY = wide ? 0 : 0.92 + (sT < 1 ? 0 : -0.3);
    const gs = k.s * (wide ? 1 : Math.min(1, asp * 1.35));
    earth.position.set(k.x * side * xs * 1.0, k.y + mobY, 0); earth.scale.setScalar(gs);
    atm.position.copy(earth.position); atm.scale.setScalar(gs); atm.material.uniforms.uAmt.value = k.dim;
    dots.material.uniforms.uSize.value = (tier === 1 ? 0.0052 : 0.0042) * (0.9 + 0.1 * k.dim);

    // voyage
    const r = routes[sel];
    if (holdT > 0) { holdT -= dt; if (holdT <= 0) { if (autoNext) setRoute((sel + 1) % routes.length); else { head = 0; } } }
    else {
      head = Math.min(1, head + dt / (2.6 + r.r.days[1] * 0.16));
      if (head >= 1) { holdT = 1.6; Kit.fx4d.thump(0.6); }
    }
    routes.forEach((q, i) => {
      const on = i === sel ? 1 : 0;
      q.mat.uniforms.uSel.value += (on - q.mat.uniforms.uSel.value) * Math.min(1, dt * 5);
      if (i === sel) q.mat.uniforms.uHead.value = head;
    });
    const dayNow = head * r.r.days[1];
    vDay.textContent = Math.round(dayNow); vBar.style.transform = `scaleX(${head})`;
    r.curve.getPointAt(Math.min(0.999, head), W); ship.position.copy(W);
    r.curve.getTangentAt(Math.min(0.999, head), tmpV);
    up.copy(W).normalize(); const fwd = tmpV.normalize(), right = new THREE.Vector3().crossVectors(up, fwd).normalize(), upF = new THREE.Vector3().crossVectors(fwd, right);
    ship.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd, upF, new THREE.Vector3().crossVectors(fwd, upF)));
    ship.scale.setScalar(sT < 1.2 ? 1.1 : 0.0001); shipGlow.intensity = sT < 1.2 ? 0.14 : 0;
    home.ring.scale.setScalar(1 + ((time * 0.6) % 1) * 2.6); home.ring.material.opacity = 1 - ((time * 0.6) % 1);
    marks.forEach((m, i) => {
      const on = i === sel, ph = (time * 0.7 + i * 0.13) % 1;
      m.ring.scale.setScalar(1 + ph * (on ? 2.6 : 1.1)); m.ring.material.opacity = (1 - ph) * (on ? 1 : 0.35);
    });

    // spin: follow the route when idle, the hand when dragging
    egyptK += (k.egypt - egyptK) * Math.min(1, dt * 2.4);
    const idle = time - lastTouch > 3.5;
    let goalYaw, goalPitch;
    const mid = O.clone().lerp(r.E, 0.5).normalize(), midLat = Math.asin(mid.y), midLon = Math.atan2(mid.x, mid.z);
    goalYaw = -midLon; goalPitch = midLat * 0.9;
    if (egyptK > 0.01) { goalYaw = lerp(goalYaw, -30.3 * Math.PI / 180, egyptK); goalPitch = lerp(goalPitch, 30.7 * Math.PI / 180, egyptK); }
    if (dragging) { yawV *= 0.85; }
    else { userYaw += yawV; yawV *= Math.pow(0.05, dt); if (idle) { userYaw += (0 - shortest(userYaw)) * Math.min(1, dt * 1.2); userPitch += (0 - userPitch) * Math.min(1, dt * 1.2); } }
    yaw += (shortAngle(goalYaw - yaw)) * Math.min(1, dt * 1.6);
    pitch += (goalPitch - pitch) * Math.min(1, dt * 1.6);
    earth.rotation.set(pitch + userPitch + Kit.look.sy * 0.04, yaw + userYaw + Kit.look.sx * 0.06, 0);

    // labels
    earth.updateMatrixWorld();
    const hv = sT < 1.1;
    showTag(tagHome, O, hv); showTag(tagPort, r.E, hv && head > 0.02);
    const off = [[-58, -44], [-136, 16], [18, 6]];
    PINS.forEach((p, i) => { showTag(p.el, p.v, egyptK > 0.7, off[i][0], off[i][1]); pinMarks[i].visible = egyptK > 0.2; });

    // the yard
    yard.visible = yardK > 0.01; bags.visible = yard.visible;
    if (yard.visible && !loaded) { loaded = true; loadBags(); }
    if (fillGoal && sT > 2.5) { fillU.value = clamp((time - fillStart) / 3.2); }
    earth.visible = yardK < 0.97; atm.visible = earth.visible;
    tonsNow += (tonsTo * Math.min(1, fillU.value * 1.04) - tonsNow) * Math.min(1, dt * 7); bagsNow += (bagsTo * Math.min(1, fillU.value * 1.04) - bagsNow) * Math.min(1, dt * 7);
    if (yard.visible) {
      document.getElementById('rTons').textContent = Math.round(tonsNow); document.getElementById('rBags').textContent = Math.round(bagsNow).toLocaleString('en-US');
      const L = boxDim.l, dist = Math.max(L * 1.0, 8) * (wide ? 1.05 : 2.2);
      yardLight.position.set(L * 0.3, 7, 7); yardLight.intensity = 240 * yardK; yardLight2.position.set(-L * 0.5, 3, 5); yardLight2.intensity = 20 * yardK;
    }

    // camera flies between the globe and the yard
    const L = boxDim.l, effAsp = wide ? asp * 0.5 : asp, dist = Math.max(6.5, (L * 1.34 / 2) / (Math.tan(camera.fov * Math.PI / 360) * effAsp));
    camP.set(0, 0, 7.6).lerp(tmpV.set(YARD.x + L * 0.08, YARD.y + 2.2 + dist * 0.26, dist + 1), yardK);
    camP.x += Kit.look.sx * (0.14 + yardK * 0.5); camP.y -= Kit.look.sy * (0.08 + yardK * 0.3);
    camera.position.copy(camP);
    look.set(0, 0, 0).lerp(tmpV.set(YARD.x + (wide ? side * dist * Math.tan(camera.fov * Math.PI / 360) * asp * 0.46 : 0), YARD.y + (wide ? 1.3 : 1.3 - dist * 0.17), 0), yardK);
    camera.lookAt(look);

    // logo
    const lV = sstep(6.45, 6.95, sT) * (1 - sstep(7.35, 7.8, sT));
    logo.visible = lV > 0.01;
    if (logo.visible) { logo.position.set(side * 1.65 * (wide ? xs : 0), wide ? 1 : 1.2, 1); logo.scale.setScalar(0.9 * lV); logo.rotation.y = (1 - lV) * 1.2 + Kit.look.sx * 0.3; }
  });
  const shortAngle = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
  const shortest = shortAngle;
  window.__t = () => sT;
  setupPage(stage);
}
