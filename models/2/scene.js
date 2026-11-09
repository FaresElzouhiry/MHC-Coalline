/* Model 2: The Coalline. A whole factory in 3D: scrolling rides the camera along the line, from the timber yard to the ship. */
import { THREE, Stage, fontsReady, studioEnv, gritMaterial, coalMaterial, lumpGeometry, coalHeap, embers, smoke, flame, noiseVolume, SHARED, sackGeometry, drawLabel, containerMesh, logoGroup, metal, rng, sstep, clamp, lerp, hasGL, failSafe, setupPage, mergeGeometries } from '../../shared/core3d.js';

const Kit = window.Kit, C = Kit.C;

// Collects static parts per material and merges them into one draw call each
class Parts {
  constructor(scene) { this.scene = scene; this.map = new Map(); this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.E = new THREE.Euler(); this.P = new THREE.Vector3(); this.S = new THREE.Vector3(); }
  add(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    this.E.set(rx, ry, rz); this.Q.setFromEuler(this.E); this.P.set(x, y, z); this.S.set(sx, sy, sz);
    this.M.compose(this.P, this.Q, this.S);
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(this.M);
    if (!this.map.has(mat)) this.map.set(mat, []);
    this.map.get(mat).push(g);
  }
  box(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) { this.add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz); }
  cyl(r1, r2, h, mat, x, y, z, rx = 0, ry = 0, rz = 0, seg = 14) { this.add(new THREE.CylinderGeometry(r1, r2, h, seg), mat, x, y, z, rx, ry, rz); }
  done() {
    this.map.forEach((list, mat) => {
      const keep = ['position', 'normal', 'uv'];
      list.forEach((g) => Object.keys(g.attributes).forEach((a) => { if (!keep.includes(a)) g.deleteAttribute(a); }));
      const m = new THREE.Mesh(mergeGeometries(list, false), mat);
      list.forEach((g) => g.dispose());
      this.scene.add(m);
    });
    this.map.clear();
  }
}

async function main() {
  await fontsReady(["700 150px 'Barlow Condensed'", "500 30px 'Barlow'"]);
  const canvas = document.getElementById('gl');
  const stage = new Stage({ canvas, fov: 40, far: 900, background: null, bloom: { strength: 0.42, radius: 0.55, threshold: 1.25 }, bloomScale: 0.5, msaa: false, dprMax: 1.5, exposure: 1.02, vignette: 0.42, grain: 0.02 });
  const { scene, camera, renderer, tier } = stage;
  scene.environment = studioEnv(renderer, { top: [1, 0.96, 0.9, 1.4], back: [1, 0.62, 0.32, 1.6], left: [0.6, 0.72, 1, 0.9], right: [1, 0.72, 0.42, 1.1], floor: [1, 0.5, 0.2, 0.18] });
  scene.fog = new THREE.FogExp2(0x0a0c11, 0.0105);
  Kit.loader.set(0.15);
  const low = tier === 1, R = rng(2024);

  /* ---------- sky with a fast day cycle: dusk, night, then sunrise over the port ---------- */
  const skyU = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSunC: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0.6, 0.2, -0.77).normalize() }, uStar: { value: 1 }, uTime: SHARED.uTime };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: /* glsl */`
      uniform vec3 uTop,uHor,uSunC,uSun; uniform float uStar,uTime; varying vec3 vD;
      float h(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      void main(){
        vec3 d=normalize(vD); float y=max(d.y,0.);
        vec3 c=mix(uHor,uTop,pow(y,.55));
        float s=max(dot(d,uSun),0.);
        c+=uSunC*(pow(s,520.)*3.4+pow(s,24.)*.26+pow(s,3.)*.1);
        vec3 g=floor(d*220.); float st=step(.9972,h(g))*smoothstep(0.,.25,y);
        c+=vec3(1.,.96,.88)*st*uStar*(.5+.5*sin(uTime*1.7+h(g*1.7)*40.));
        gl_FragColor=vec4(c,1.);
      }`
  }));
  scene.add(sky);
  const hemi = new THREE.HemisphereLight(0x8fa6c8, 0x1a1208, 0.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd6a0, 0.4); sun.position.set(240, 120, -300); scene.add(sun);
  const portFill = new THREE.DirectionalLight(0xffe2bd, 0); portFill.position.set(-60, 70, 160); scene.add(portFill);

  /* ---------- materials ---------- */
    const steel = gritMaterial({ color: 0x2a2c31, roughness: 0.48, metalness: 0.8, amount: 0.2, scale: 0.4, bump: 0 });
  const dark = gritMaterial({ color: 0x111215, roughness: 0.55, metalness: 0.7, amount: 0.2, scale: 0.5, bump: 0 });
  const paint = gritMaterial({ color: 0xC9940F, roughness: 0.5, metalness: 0.35, amount: 0.12, scale: 0.6, bump: 0 });
  const blueLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.3, 2.6), fog: false });
  const warmLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 3.1, 1.8) });
  const goldLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 1.8, 0.45) });
  const white = gritMaterial({ color: 0xc9c6bd, roughness: 0.6, metalness: 0.2, amount: 0.15, scale: 0.4, bump: 0 });
  const parts = new Parts(scene);

  /* ---------- ground with painted lanes ---------- */
  {
    const g = new THREE.PlaneGeometry(760, 240, 1, 1); g.rotateX(-Math.PI / 2);
    const m = gritMaterial({ color: 0x17181b, roughness: 0.55, metalness: 0.25, amount: 0.42, scale: 0.05, bump: 0.05 });
    const base = m.onBeforeCompile;
    m.onBeforeCompile = (s, r) => {
      base(s, r);
      s.fragmentShader = s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        { float l=step(abs(abs(vGP.z)-3.4),.07)*step(vGP.x,190.);
          float dash=step(.5,fract(vGP.x*.25));
          float tile=max(smoothstep(.025,.0,abs(fract(vGP.x*.125)-.5)),smoothstep(.025,.0,abs(fract(vGP.z*.125)-.5)));
          diffuseColor.rgb*=1.-tile*.28;
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.8,.56,.1),l*dash*.8); }`);
    };
    m.customProgramCacheKey = () => 'ground';
    const ground = new THREE.Mesh(g, m); ground.position.set(170, 0, 0); scene.add(ground);
  }

  /* ---------- factory hall ---------- */
  const HALL_END = 192;
  for (let x = -6; x <= HALL_END; x += 14) {
    [-1, 1].forEach((s) => { parts.box(0.55, 16, 0.55, steel, x, 8, s * 19); parts.box(0.7, 0.5, 11, steel, x, 15.8, s * 14.2); parts.box(0.5, 0.5, 13, steel, x, 18.3, s * 6.7, s * 0.27, 0, 0); });
    parts.box(0.4, 3, 0.4, steel, x, 17.5, 0);
  }
  parts.box(HALL_END + 6, 0.4, 0.4, steel, HALL_END / 2 - 3, 15.8, 19); parts.box(HALL_END + 6, 0.4, 0.4, steel, HALL_END / 2 - 3, 15.8, -19);
  parts.box(HALL_END + 6, 3, 0.25, dark, HALL_END / 2 - 3, 1.5, 19.3); parts.box(HALL_END + 6, 3, 0.25, dark, HALL_END / 2 - 3, 1.5, -19.3);
  // high bay lamps with soft light cones
  const coneMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying float vY; varying vec3 vN,vV; void main(){ vY=uv.y; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying float vY; varying vec3 vN,vV; void main(){ float f=pow(abs(dot(vN,vV)),2.5); gl_FragColor=vec4(vec3(1.,.8,.55)*.1*f*vY*vY,1.); }'
  });
  const coneG = new THREE.CylinderGeometry(0.3, 4.2, 12, 16, 1, true);
  const lampParts = [];
  for (let x = 1; x < HALL_END; x += 14) [-7.5, 7.5].forEach((z) => {
    parts.cyl(0.55, 0.75, 0.3, dark, x, 13.6, z);
    parts.cyl(0.62, 0.62, 0.05, warmLed, x, 13.42, z, 0, 0, 0, 18);
    const c = coneG.clone(); c.translate(x, 7.4, z); lampParts.push(c);
  });
  scene.add(new THREE.Mesh(mergeGeometries(lampParts), coneMat));

  /* ---------- conveyor ---------- */
  const beltU = { uTime: SHARED.uTime };
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.8 });
  beltMat.onBeforeCompile = (s) => {
    s.uniforms.uTime = SHARED.uTime;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBP=position;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBP; uniform float uTime;').replace('#include <color_fragment>', '#include <color_fragment>\n{ float k=fract((vBP.x-uTime*1.6+abs(vBP.z)*.6)*1.3); diffuseColor.rgb*=.8+step(.86,k)*1.6; }');
  };
  const beltRun = (a, b, y = 1.2, w = 1.5) => {
    const L = b - a, mid = (a + b) / 2;
    const top = new THREE.BoxGeometry(L, 0.06, w);
    const belt = new THREE.Mesh(top, beltMat); belt.position.set(mid, y, 0); scene.add(belt);
    [-1, 1].forEach((s) => { parts.box(L, 0.28, 0.1, paint, mid, y - 0.02, s * (w / 2 + 0.08)); parts.box(L, 0.06, 0.03, goldLed, mid, y + 0.14, s * (w / 2 + 0.14)); });
    for (let x = a + 1; x < b; x += 5) [-1, 1].forEach((s) => parts.box(0.14, y - 0.1, 0.14, steel, x, (y - 0.1) / 2, s * (w / 2 + 0.06)));
    for (let x = a + 0.6; x < b; x += 1.2) parts.cyl(0.09, 0.09, w + 0.1, steel, x, y - 0.1, 0, Math.PI / 2, 0, 0, 8);
  };
  beltRun(6, 25); beltRun(46, 94); beltRun(106, 152); beltRun(165, 190);

  /* ---------- 1 timber yard ---------- */
  const barkMat = gritMaterial({ color: 0x4a3524, roughness: 0.95, metalness: 0, amount: 0.55, scale: 1.1, bump: 0.04 });
  const logG = new THREE.CylinderGeometry(0.26, 0.3, 3.4, 12, 1); logG.rotateX(Math.PI / 2);
  const logCount = low ? 150 : 300, logs = new THREE.InstancedMesh(logG, barkMat, logCount), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
  let li = 0;
  const pile = (cx, cz, rows, rot, offset = 0) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < rows - r; c++) {
      if (li >= logCount) return;
      const k = 0.92 + R() * 0.2;
      const ox = (c - (rows - r - 1) / 2) * 0.56, oy = 0.28 + r * 0.48;
      P.set(cx + Math.cos(rot) * ox, oy, cz - Math.sin(rot) * ox); E.set(0, rot + (R() - 0.5) * 0.05, 0); Q.setFromEuler(E); S.set(k, k, 1 + R() * 0.2);
      M.compose(P, Q, S); logs.setMatrixAt(li++, M);
    }
  };
  [[-2, -11, 9], [8, -11, 8], [18, -11, 9], [-2, 11, 8], [8, 11, 10], [18, 11, 8]].forEach((a) => pile(a[0], a[1], a[2], Math.PI / 2 + (R() - 0.5) * 0.1));
  logs.count = li; logs.instanceMatrix.needsUpdate = true; scene.add(logs);
  const logBelt = new THREE.InstancedMesh(logG, barkMat, 10); logBelt.scale.set(1, 1, 1); logBelt.frustumCulled = false; scene.add(logBelt);

  /* ---------- 2 brick kilns ---------- */
  const brick = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
  const brickU = { tN: { value: noiseVolume().tex }, uTime: SHARED.uTime };
  brick.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, brickU);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vKP; varying vec3 vKO;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvKP=(modelMatrix*vec4(position,1.)).xyz; vKO=position;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', /* glsl */`#include <common>
      precision highp sampler3D; uniform sampler3D tN; uniform float uTime; varying vec3 vKP,vKO;
      vec4 brickAt(vec3 q){ float a=atan(q.z,q.x), row=q.y/.34, r=floor(row); float c=(a*3.2/.62)+mod(r,2.)*.5; float cf=floor(c); vec2 f=vec2(fract(c),fract(row)); float m=smoothstep(.0,.05,f.x)*smoothstep(1.,.95,f.x)*smoothstep(.0,.08,f.y)*smoothstep(1.,.92,f.y); float id=fract(sin(cf*12.9+r*78.2)*43758.5); return vec4(m,id,0.,0.); }`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        vec4 bk=brickAt(vKO); vec4 kN=texture(tN,vKP*.5);
        vec3 bc=mix(vec3(.11,.045,.028),vec3(.21,.095,.05),bk.y)*(.6+kN.r*.8);
        bc=mix(vec3(.03),bc,bk.x);
        float soot=smoothstep(.45,.95,vKO.y/6.)*smoothstep(.2,.7,kN.r+.3);
        diffuseColor.rgb=mix(bc,vec3(.015),soot*.85);`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        { float seam=(1.-bk.x)*smoothstep(.72,.52,vKO.y/6.); float pul=.65+.35*sin(uTime*1.8+vKP.x*.6); totalEmissiveRadiance+=vec3(.9,.18,.02)*seam*pul*smoothstep(.5,.7,kN.r); }`);
  };
  brick.customProgramCacheKey = () => 'brick';
  const prof = []; for (let i = 0; i <= 18; i++) { const t = i / 18; prof.push(new THREE.Vector2(Math.max(0.001, 5.2 * Math.pow(Math.cos(t * Math.PI / 2), 0.72)), 6.3 * Math.sin(t * Math.PI / 2))); }
  const domeG = new THREE.LatheGeometry(prof, 48);
  const kilnSpots = [[30, -9.5], [40, -9.5], [30, 9.5], [40, 9.5], [50, -11], [50, 11]];
  const fireMat = new THREE.ShaderMaterial({
    uniforms: { tN: { value: noiseVolume().tex }, uTime: SHARED.uTime },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'precision highp sampler3D; uniform sampler3D tN; uniform float uTime; varying vec2 vUv; void main(){ float n=texture(tN,vec3(vUv.x*.6,vUv.y*.45-uTime*.3,uTime*.08)).r; float f=smoothstep(.15,.75,n+(1.-vUv.y)*.5); vec3 c=mix(vec3(.9,.09,.0),vec3(3.2,1.3,.18),f); c=mix(c,vec3(4.6,2.8,.9),smoothstep(.75,1.,f)); gl_FragColor=vec4(c,1.); }'
  });
  const doorShape = new THREE.Shape(); doorShape.moveTo(-1.25, 0); doorShape.lineTo(1.25, 0); doorShape.lineTo(1.25, 1.9); doorShape.absarc(0, 1.9, 1.25, 0, Math.PI, false); doorShape.lineTo(-1.25, 0);
  const doorG = new THREE.ShapeGeometry(doorShape, 14);
  const frameShape = new THREE.Shape(); frameShape.moveTo(-1.65, 0); frameShape.lineTo(1.65, 0); frameShape.lineTo(1.65, 1.9); frameShape.absarc(0, 1.9, 1.65, 0, Math.PI, false); frameShape.lineTo(-1.65, 0); frameShape.holes.push(new THREE.Path(doorShape.getPoints(14)));
  const frameG = new THREE.ExtrudeGeometry(frameShape, { depth: 0.5, bevelEnabled: false, curveSegments: 14 });
  const smokeOrigins = [], flames = [], fireSpots = [];
  kilnSpots.forEach(([x, z], i) => {
    const s = Math.sign(z), rot = s > 0 ? Math.PI : 0, front = z - s * 5;
    const kiln = new THREE.Mesh(domeG, brick); kiln.position.set(x, 0, z); scene.add(kiln);
    parts.add(frameG, steel, x, 0, front - s * 0.05, 0, rot, 0);
    const door = new THREE.Mesh(doorG, fireMat); door.position.set(x, 0, front + s * 0.1); door.rotation.y = rot; scene.add(door);
    const f = flame({ w: 2.6, h: 3.1, seed: i * 0.37 }); f.position.set(x, 0.05, front - s * 0.6); scene.add(f); flames.push(f);
    fireSpots.push([x, 1.7, front - s * 1.8]);
    parts.cyl(0.42, 0.5, 4.5, steel, x, 7.6, z);
    [2, 3.9].forEach((h) => { const r = 5.2 * Math.pow(Math.cos(Math.asin(Math.min(1, h / 6.3))), 0.72); parts.add(new THREE.TorusGeometry(r + 0.03, 0.05, 6, 48), dark, x, h, z, Math.PI / 2); });
    smokeOrigins.push([x, 10, z]);
  });
  const smk = smoke({ count: low ? 12 : 20, origin: smokeOrigins, spread: 1.2, rise: 26, size: 11, speed: 0.045, opacity: 0.16, color: [0.26, 0.24, 0.24] }); scene.add(smk);
  const emb = embers({ count: low ? 200 : 460, box: [46, 13, 26], y0: 0, size: 44, speed: 1.5 }); emb.position.x = 40; scene.add(emb);

  /* ---------- 3 cooling tunnel ---------- */
  const tunX0 = 60, tunX1 = 88;
  const tunnelG = new THREE.CylinderGeometry(3.3, 3.3, tunX1 - tunX0, 32, 1, true, 0, Math.PI); tunnelG.rotateZ(Math.PI / 2);
  const tunnelMat = gritMaterial({ color: 0x31343a, roughness: 0.5, metalness: 0.75, amount: 0.15, scale: 0.8, bump: 0, side: THREE.DoubleSide });
  { const t = new THREE.Mesh(tunnelG, tunnelMat); t.position.set((tunX0 + tunX1) / 2, 0.2, 0); scene.add(t); }
  for (let x = tunX0; x <= tunX1; x += 3.5) {
    parts.add(new THREE.TorusGeometry(3.38, 0.09, 6, 40, Math.PI), steel, x, 0.2, 0, 0, Math.PI / 2);
    parts.add(new THREE.TorusGeometry(3.14, 0.035, 6, 40, Math.PI), blueLed, x + 1.7, 0.2, 0, 0, Math.PI / 2);
  }
  // cooled bins beside the tunnel
  const binHeap = coalHeap({ count: low ? 80 : 150, radius: 3.6, height: 1, heat: 0, detail: 3, scale: [0.12, 0.28], seed: 21 }); binHeap.position.set(100, 0.04, -11); scene.add(binHeap);
  const binHeap2 = coalHeap({ count: low ? 80 : 150, radius: 3.6, height: 1.2, heat: 0, detail: 3, scale: [0.16, 0.36], seed: 37 }); binHeap2.position.set(100, 0.04, 11); scene.add(binHeap2);
  Kit.loader.set(0.45);

  /* ---------- 4 sorting drum ---------- */
  const drumMat = new THREE.MeshStandardMaterial({ color: 0x3a3c42, metalness: 0.9, roughness: 0.38, side: THREE.DoubleSide });
  drumMat.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n{ vec2 h=fract(vUvH*vec2(26.,10.))-.5; if(length(h)<.32) discard; }').replace('#include <common>', '#include <common>\nvarying vec2 vUvH;');
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvH;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvUvH=uv;');
  };
  drumMat.customProgramCacheKey = () => 'drum';
  const drumG = new THREE.CylinderGeometry(2.3, 2.3, 11, 40, 1, true); drumG.rotateZ(Math.PI / 2);
  const drum = new THREE.Mesh(drumG, drumMat); drum.position.set(100, 3.4, 0); drum.rotation.z = 0.05; scene.add(drum);
  [-5.5, 0, 5.5].forEach((o) => parts.add(new THREE.TorusGeometry(2.42, 0.16, 8, 44), paint, 100 + o, 3.4 - o * 0.05, 0, 0, Math.PI / 2));
  [-4, 4].forEach((o) => { [-1, 1].forEach((s) => { parts.box(0.34, 2.2, 0.34, steel, 100 + o, 1.05, s * 2.1); }); parts.box(0.3, 0.3, 4.6, steel, 100 + o, 2.15, 0); });
  { const inner = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 9.4, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.72, 0.18), side: THREE.DoubleSide })); inner.rotation.z = Math.PI / 2 + 0.05; inner.position.copy(drum.position); scene.add(inner); }
  [-1, 1].forEach((s) => { parts.box(9, 0.12, 2.6, paint, 100, 1.1, s * 4.4, s * -0.28, 0, 0); });
  [-1, 1].forEach((s) => { parts.box(9, 1.2, 0.14, steel, 100, 0.6, s * 7.2); parts.box(0.14, 1.2, 5, steel, 95.5, 0.6, s * 9.5); parts.box(0.14, 1.2, 5, steel, 104.5, 0.6, s * 9.5); });

  /* ---------- 5 quality gate ---------- */
  const ringG = new THREE.TorusGeometry(2.05, 0.05, 8, 64);
  const scanRing = new THREE.Mesh(ringG, goldLed); scanRing.rotation.y = Math.PI / 2; scanRing.position.set(130, 2, 0); scene.add(scanRing);
  const gateX = 130;
  [-3.5, 3.5].forEach((o) => { [-1, 1].forEach((s) => parts.box(0.26, 5, 0.26, paint, gateX + o, 2.5, s * 2.6)); parts.box(0.26, 0.26, 5.4, paint, gateX + o, 5, 0); });
  [-1, 1].forEach((s) => parts.box(7.2, 0.26, 0.26, paint, gateX, 5, s * 2.6));
  const scanLight = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.06, 40, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.3, 0.3), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })); scanLight.rotation.z = Math.PI / 2; scene.add(scanLight);
  // lab panels with the measured values
  const specs = C.products.items[0].pct;
  const panelTex = (title, value, bar, unit) => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 400; const x = c.getContext('2d');
    x.fillStyle = 'rgba(8,10,14,.92)'; x.fillRect(0, 0, 640, 400);
    x.strokeStyle = 'rgba(240,193,60,.9)'; x.lineWidth = 3; x.strokeRect(10, 10, 620, 380);
    x.fillStyle = '#F0C13C'; x.font = "600 30px 'Barlow',Arial,sans-serif"; x.fillText(title, 36, 66);
    x.font = "700 170px 'Barlow Condensed','Arial Narrow',sans-serif"; x.fillText(value, 36, 230);
    x.font = "600 54px 'Barlow Condensed','Arial Narrow',sans-serif"; const vw = (() => { x.font = "700 170px 'Barlow Condensed','Arial Narrow',sans-serif"; const w = x.measureText(value).width; x.font = "600 54px 'Barlow Condensed','Arial Narrow',sans-serif"; return w; })(); x.fillText(unit, 36 + vw + 10, 230);
    x.fillStyle = 'rgba(240,193,60,.2)'; x.fillRect(36, 290, 568, 26); x.fillStyle = '#F0C13C'; x.fillRect(36, 290, 568 * bar, 26);
    x.fillStyle = 'rgba(255,255,255,.6)'; x.font = "500 22px 'Barlow',Arial,sans-serif"; x.fillText('M.H.C QC LAB  ·  BATCH CHECK', 36, 356);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  };
  const panels = [];
  [['FIXED CARBON', '≥' + specs.carbon, specs.carbon / 100, '%', 124.5, -4.6, 0.32], ['ASH', '≤' + specs.ash, specs.ash / 20, '%', 130, -5.3, 0], ['MOISTURE', '≤' + specs.moisture, specs.moisture / 20, '%', 135.5, -4.6, -0.32]].forEach((p) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.62), new THREE.MeshBasicMaterial({ map: panelTex(p[0], p[1], p[2], p[3]), transparent: true, opacity: 0.94, toneMapped: false, side: THREE.DoubleSide }));
    m.position.set(p[4], 3.9, p[5]); m.rotation.y = p[6]; scene.add(m); panels.push(m); parts.box(0.1, 2.6, 0.1, steel, p[4], 1.3, p[5]);
  });
  // specimen on a lit stand
  const specimenMat = coalMaterial({ bump: 0.04, flat: 0, heat: 0.18 });
  const specimen = new THREE.Mesh(lumpGeometry(8, { detail: low ? 14 : 28, stretch: [1, 0.8, 1.2] }), specimenMat); specimen.position.set(128, 2.5, 3.7); specimen.scale.setScalar(0.5); scene.add(specimen);
  parts.cyl(0.42, 0.5, 1.7, dark, 128, 0.85, 3.7); parts.add(new THREE.TorusGeometry(0.62, 0.025, 8, 40), goldLed, 128, 1.9, 3.7, Math.PI / 2);

  /* ---------- 6 packing ---------- */
  const labelC = document.createElement('canvas'); labelC.width = 640; labelC.height = 960;
  drawLabel(labelC, { color: '#121214', ink: '#E7C24F', product: 'HARDWOOD CHARCOAL', weight: '10 KG', font: "'Barlow Condensed','Arial Narrow',sans-serif" });
  const labelT = new THREE.CanvasTexture(labelC); labelT.colorSpace = THREE.SRGBColorSpace; labelT.anisotropy = 6;
  const sackMat = new THREE.MeshStandardMaterial({ map: labelT, roughness: 0.82, side: THREE.DoubleSide });
  const sackF = sackGeometry(1, 1.5, 0.44, 1, 3, 10, 14), sackB = sackGeometry(1, 1.5, 0.44, -1, 3, 10, 14);
  const sackG = mergeGeometries([sackF.toNonIndexed(), sackB.toNonIndexed()]);
  const sackRow = new THREE.InstancedMesh(sackG, sackMat, 9); sackRow.frustumCulled = false; scene.add(sackRow);
  const stack = new THREE.InstancedMesh(sackG, sackMat, low ? 180 : 320);
  { let n = 0; const place = (ox, oz) => { parts.box(2.5, 0.16, 3, gritMaterial({ color: 0x6d4f30, roughness: 0.9, amount: 0.4, scale: 1 }), ox, 0.1, oz); for (let l = 0; l < 7; l++) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { if (n >= stack.count) return; P.set(ox + (a - 0.5) * 1.12, 0.45 + l * 0.46, oz + (b - 0.5) * 1.5); E.set(-Math.PI / 2, 0, (R() - 0.5) * 0.06 + (l % 2) * 0); Q.setFromEuler(E); S.setScalar(1); M.compose(P, Q, S); stack.setMatrixAt(n++, M); } };
    for (let i = 0; i < (low ? 6 : 11); i++) { place(150 + i * 3.4, -9); if (i < 5) place(171 + i * 3.4, 9.5); }
    stack.count = n; stack.instanceMatrix.needsUpdate = true; scene.add(stack); }
  // filling hopper
  parts.add(new THREE.CylinderGeometry(1.9, 0.5, 2.6, 6), paint, 158, 6.1, 0); parts.box(3.2, 1, 3.2, paint, 158, 7.9, 0);
  [-1, 1].forEach((a) => [-1, 1].forEach((b) => parts.box(0.2, 8, 0.2, steel, 158 + a * 1.5, 4, b * 1.5)));
  parts.cyl(0.42, 0.42, 1.8, steel, 158, 4, 0); parts.box(5, 0.2, 2.2, steel, 158, 1.1, 0);
  const hopperLump = new THREE.InstancedMesh(lumpGeometry(40, { detail: 2 }), new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.6 }), 8); hopperLump.frustumCulled = false; scene.add(hopperLump);
  // robot arm that moves sacks onto the pallets
  const arm = new THREE.Group(); arm.position.set(177, 0, -5);
  const a0 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 1, 16), paint); a0.position.y = 0.5; arm.add(a0);
  const a1 = new THREE.Group(); a1.position.y = 1; arm.add(a1);
  const up1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 0.5), paint); up1.position.y = 1.7; a1.add(up1);
  const a2 = new THREE.Group(); a2.position.y = 3.4; a1.add(a2);
  const up2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.36, 0.36), paint); up2.position.x = 1.6; a2.add(up2);
  const a3 = new THREE.Group(); a3.position.x = 3.2; a2.add(a3);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 1.1), dark); grip.position.y = -0.55; a3.add(grip);
  const held = new THREE.Mesh(sackG, sackMat); held.scale.setScalar(0.92); held.rotation.x = -Math.PI / 2; held.position.y = -0.82; a3.add(held);
  scene.add(arm);

  /* ---------- 7 container and port ---------- */
  const truckC = containerMesh({ l: 6.06, w: 2.44, h: 2.6 }); truckC.position.set(198, 1, 0); scene.add(truckC);
  parts.box(7, 0.3, 2.5, dark, 198, 0.85, 0); for (let i = 0; i < 3; i++) [-1, 1].forEach((s) => parts.cyl(0.46, 0.46, 0.3, dark, 195.8 + i * 2, 0.46, s * 1.1, Math.PI / 2));
  const sling = containerMesh({ l: 12.2, w: 2.44, h: 2.9 }); scene.add(sling);
  // quay crane
  const craneX = 226, craneZ = -7;
  [-1, 1].forEach((a) => [-1, 1].forEach((b) => parts.box(1, 34, 1, paint, craneX + a * 10, 17, craneZ + b * 8)));
  [-1, 1].forEach((a) => parts.box(1, 1, 18, paint, craneX + a * 10, 34, craneZ));
  [-1, 1].forEach((b) => parts.box(58, 1.4, 1.4, paint, craneX + 4, 34.6, craneZ + b * 2.4, 0, 0, 0));
  parts.box(2.4, 8, 0.6, paint, craneX, 40, craneZ);
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 6), dark); scene.add(trolley);
  const cableG = new THREE.CylinderGeometry(0.05, 0.05, 1, 6); const cables = new THREE.InstancedMesh(cableG, dark, 4); cables.frustumCulled = false; scene.add(cables);
  for (let x = craneX - 30; x < craneX + 60; x += 12) parts.cyl(0.14, 0.14, 12, dark, x, 6, 12);
  for (let x = craneX - 30; x < craneX + 60; x += 12) parts.box(0.8, 0.14, 0.8, warmLed, x, 12, 12);
  // quay edge and water
  parts.box(240, 0.8, 1, gritMaterial({ color: 0x2a2a2e, roughness: 0.8, amount: 0.3, scale: 0.3 }), 300, 0.2, -14.5);
  const waterU = { tN: { value: noiseVolume().tex }, uTime: SHARED.uTime };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(700, 260).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x06121a, metalness: 0.9, roughness: 0.24 }));
  water.material.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, waterU);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nprecision highp sampler3D; uniform sampler3D tN; uniform float uTime; varying vec3 vWP;').replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      { vec3 a=texture(tN,vec3(vWP.xz*.018+uTime*.006,uTime*.01)).rgb, b=texture(tN,vec3(vWP.xz*.05-uTime*.01,uTime*.016)).rgb; vec2 w=(a.rg+b.rg-1.)*.34; normal=normalize(normal+(viewMatrix*vec4(w.x,0.,w.y,0.)).xyz); }`);
  };
  water.material.customProgramCacheKey = () => 'water';
  water.position.set(320, -0.3, -146); scene.add(water);
  // the ship
  const ship = new THREE.Group(); ship.position.set(248, 0, -29); scene.add(ship);
  const hullS = new THREE.Shape(); hullS.moveTo(-54, 0); hullS.lineTo(46, 0); hullS.quadraticCurveTo(58, 3, 62, 11); hullS.lineTo(-56, 11); hullS.lineTo(-54, 0);
  const hullG = new THREE.ExtrudeGeometry(hullS, { depth: 22, bevelEnabled: false, curveSegments: 6 }); hullG.translate(0, -1.2, -11);
  const hullM = gritMaterial({ color: 0x0d1319, roughness: 0.6, metalness: 0.5, amount: 0.3, scale: 0.15, bump: 0 });
  ship.add(new THREE.Mesh(hullG, hullM));
  const redBand = new THREE.Mesh(new THREE.BoxGeometry(118, 1.4, 22.2), gritMaterial({ color: 0x5c1a12, roughness: 0.7, amount: 0.3, scale: 0.2 })); redBand.position.set(2, 0.2, 0); ship.add(redBand);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(11, 15, 20), white); bridge.position.set(-46, 17, 0); ship.add(bridge);
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.5, 20.2), warmLed); w.position.set(-46, 13 + i * 3.1, 0); ship.add(w); }
  const boxG = new THREE.BoxGeometry(6, 2.5, 2.35), palette = [0x141416, 0x141416, 0x7c2316, 0x1b4a63, 0x20573c, 0xb48b0b, 0x3b3e45];
  const stackN = 900, boxes = new THREE.InstancedMesh(boxG, gritMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.4, amount: 0.15, scale: 0.8, bump: 0 }), stackN), col = new THREE.Color();
  { let n = 0; for (let x = -36; x < 46; x += 6.4) for (let z = -4; z <= 4; z++) { const h = 3 + Math.floor(R() * 4); for (let y = 0; y < h && n < stackN; y++) { P.set(x, 11.1 + y * 2.55, z * 2.42); Q.identity(); S.setScalar(1); M.compose(P, Q, S); boxes.setMatrixAt(n, M); col.setHex(palette[Math.floor(R() * palette.length)]); boxes.setColorAt(n, col); n++; } } boxes.count = n; boxes.instanceMatrix.needsUpdate = true; }
  ship.add(boxes);
  parts.done();
  Kit.loader.set(0.7);

  /* ---------- moving charcoal ---------- */
  const lumpMats = coalMaterial({ bump: 0.012, flat: 0.45, heat: 0, ash: 0, instanced: true });
  const flowG = lumpGeometry(61, { detail: low ? 2 : 3, fibre: 0, split: 0, crack: 0, rough: 0.03 }), flowN = low ? 120 : 240;
  flowG.setAttribute('aHeat', new THREE.InstancedBufferAttribute(new Float32Array(flowN).fill(0.1), 1));
  const flow = new THREE.InstancedMesh(flowG, lumpMats, flowN); flow.frustumCulled = false; scene.add(flow);
  const seeds = new Float32Array(flowN * 4); for (let i = 0; i < flowN * 4; i++) seeds[i] = R();

  /* ---------- lights that follow the camera to the nearest things ---------- */
  const pool = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xff8833, 0, 38, 1.8); scene.add(l); return l; });
  const emitters = [
    ...fireSpots.map((p) => ({ p, c: 0xff7722, i: 46, f: 1 })),
    { p: [74, 2.5, 0], c: 0x6fb8ff, i: 12, f: 0 }, { p: [82, 2.5, 0], c: 0x6fb8ff, i: 12, f: 0 }, { p: [65, 2.5, 0], c: 0x6fb8ff, i: 12, f: 0 },
    { p: [100, 3.4, 4], c: 0xffb35c, i: 18, f: 0 }, { p: [100, 3.4, -4], c: 0xffb35c, i: 18, f: 0 },
    { p: [130, 4, 0], c: 0xffc14d, i: 30, f: 0 }, { p: [128, 3.4, 5], c: 0xffd9a0, i: 16, f: 0 },
    { p: [158, 8, 4], c: 0xffe0b8, i: 54, f: 0 }, { p: [176, 8, 3], c: 0xffe0b8, i: 54, f: 0 }, { p: [10, 9, 2], c: 0xffd9a8, i: 60, f: 0 }, { p: [-2, 9, 8], c: 0xffd9a8, i: 40, f: 0 },
    { p: [198, 9, 6], c: 0xffe0b8, i: 70, f: 0 }, { p: [224, 16, 4], c: 0xffe6c8, i: 240, f: 0 }
  ];

  /* ---------- camera path ---------- */
  const KEY = [
    [0, [-34, 22, 40], [34, 2, -2]],
    [0.075, [-4, 5.2, 13], [10, 1.4, -2]],
    [0.15, [13, 2.9, 4.6], [25, 2.2, -0.6]],
    [0.23, [24, 3.4, 2.5], [37, 3.2, -7]],
    [0.3, [35, 3.0, 2.4], [38, 2.6, -8]],
    [0.37, [45, 3.6, -1.2], [54, 1.6, 0]],
    [0.45, [55, 2.7, 0.8], [68, 2.2, 0]],
    [0.52, [74, 2.1, 0], [92, 2.2, 0]],
    [0.585, [90, 5.2, 8.5], [100, 3.1, 0]],
    [0.65, [106, 3.8, 7.2], [117, 1.8, -2]],
    [0.72, [123, 2.8, 4.6], [130.5, 2.6, -2]],
    [0.79, [149, 4.2, 7.5], [159, 2.6, 0]],
    [0.855, [170, 3.2, 6.4], [181, 2, -2]],
    [0.915, [188, 4.2, 9], [214, 6, -12]],
    [1, [207, 13, 52], [246, 15, -24]]
  ];
  const curveP = new THREE.CatmullRomCurve3(KEY.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal');
  const curveT = new THREE.CatmullRomCurve3(KEY.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal');
  const tAt = (p) => { for (let i = 0; i < KEY.length - 1; i++) if (p <= KEY[i + 1][0]) return (i + (p - KEY[i][0]) / (KEY[i + 1][0] - KEY[i][0])) / (KEY.length - 1); return 1; };

  // stations along the scroll: which step is active and its time/temperature
  const STEPS = C.process.steps, stationP = [0.075, 0.28, 0.5, 0.6, 0.72, 0.82, 0.95];
  const SKY = [
    { t: 0, top: [0.05, 0.05, 0.12], hor: [0.52, 0.22, 0.14], sun: [1, 0.42, 0.15], star: 0.2, hemi: 0.42, fog: [0.12, 0.08, 0.09] },
    { t: 0.22, top: [0.012, 0.016, 0.04], hor: [0.05, 0.05, 0.08], sun: [0, 0, 0], star: 1, hemi: 0.2, fog: [0.035, 0.035, 0.05] },
    { t: 0.62, top: [0.012, 0.016, 0.042], hor: [0.05, 0.06, 0.1], sun: [0, 0, 0], star: 1, hemi: 0.22, fog: [0.03, 0.035, 0.055] },
    { t: 0.85, top: [0.04, 0.08, 0.2], hor: [0.5, 0.3, 0.26], sun: [1, 0.52, 0.22], star: 0.2, hemi: 0.34, fog: [0.14, 0.11, 0.13] },
    { t: 1, top: [0.2, 0.38, 0.64], hor: [1.1, 0.7, 0.42], sun: [1.7, 1.05, 0.56], star: 0, hemi: 0.95, fog: [0.66, 0.5, 0.42] }
  ];
  const skyAt = (p) => { for (let i = 0; i < SKY.length - 1; i++) { const a = SKY[i], b = SKY[i + 1]; if (p <= b.t) { const k = sstep(a.t, b.t, p); return { top: a.top.map((v, j) => lerp(v, b.top[j], k)), hor: a.hor.map((v, j) => lerp(v, b.hor[j], k)), sun: a.sun.map((v, j) => lerp(v, b.sun[j], k)), star: lerp(a.star, b.star, k), hemi: lerp(a.hemi, b.hemi, k), fog: a.fog.map((v, j) => lerp(v, b.fog[j], k)) }; } } return SKY[SKY.length - 1]; };

  /* ---------- page wiring ---------- */
  const ride = document.getElementById('process'), intro = document.getElementById('intro');
  const hDay = document.getElementById('hDay'), hTemp = document.getElementById('hTemp'), hBar = document.getElementById('hBar');
  let cards = [], rail = [], cur = -1;
  const collect = () => {
    cards = [...document.querySelectorAll('#cards .card')]; rail = [...document.querySelectorAll('#rail li')];
    rail.forEach((li, i) => { li.querySelector('button').onclick = () => { const r = ride.getBoundingClientRect(), span = r.height - innerHeight; window.scrollTo({ top: r.top + scrollY + span * stationP[i] }); }; });
    cur = -1;
  };
  collect(); Kit.on('lang', collect);

  let sp = 0;
  const pos = new THREE.Vector3(), tar = new THREE.Vector3();
  const skyC = { fog: new THREE.Color() };
  stage.onFrame((dt, time) => {
    const r = ride.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight), raw = clamp(-r.top / span);
    sp += (raw - sp) * Math.min(1, dt * 3.2);
    stage.active = r.bottom > -40;
    const p = sp;

    // day and temperature
    let f = 0;
    for (let i = 0; i < stationP.length - 1; i++) if (p >= stationP[i]) f = i + clamp((p - stationP[i]) / (stationP[i + 1] - stationP[i]));
    const si = Math.min(STEPS.length - 2, Math.floor(f)), sl = f - si;
    const ramp = sstep(0.28, 0.72, sl), temp = lerp(STEPS[si].temp, STEPS[si + 1].temp, si === 0 ? sstep(0.2, 0.9, sl) : ramp), day = lerp(STEPS[si].day, STEPS[si + 1].day, sl);
    const active = p < 0.03 ? -1 : Math.min(STEPS.length - 1, Math.round(f));
    hDay.textContent = String(Math.max(1, Math.round(day))).padStart(2, '0'); hTemp.textContent = Math.round(temp);
    hBar.style.transform = `scaleX(${clamp(temp / 560, 0.03, 1)})`;
    Kit.fx4d.setHeat(clamp(temp / 520));
    if (active !== cur) {
      cur = active;
      cards.forEach((c, i) => c.classList.toggle('on', i === cur));
      rail.forEach((li, i) => { li.classList.toggle('on', i === cur); li.classList.toggle('done', i < cur); });
      if (cur >= 0) Kit.fx4d.thump(0.7);
    }
    const iv = 1 - sstep(0.012, 0.05, p);
    intro.style.opacity = iv; intro.style.transform = `translateY(${(1 - iv) * -40}px)`; intro.style.visibility = iv < 0.01 ? 'hidden' : 'visible';

    // camera
    const u = tAt(p);
    curveP.getPoint(u, pos); curveT.getPoint(u, tar);
    const wiggle = Kit.reduce ? 0 : 1;
    camera.position.copy(pos); camera.position.x += Kit.look.sx * 0.6 * wiggle; camera.position.y += -Kit.look.sy * 0.35 * wiggle + Math.sin(time * 0.6) * 0.03 * wiggle;
    tar.x += Kit.look.sx * 1.2; tar.y -= Kit.look.sy * 0.6;
    camera.lookAt(tar);
    const portrait = camera.aspect < 0.9;
    camera.fov = portrait ? 56 : 40; camera.updateProjectionMatrix();

    // sky
    const s = skyAt(p);
    skyU.uTop.value.setRGB(...s.top); skyU.uHor.value.setRGB(...s.hor); skyU.uSunC.value.setRGB(...s.sun); skyU.uStar.value = s.star;
    sky.position.copy(camera.position);
    scene.fog.color.setRGB(...s.fog);
    hemi.intensity = s.hemi; sun.intensity = s.sun[0] * 1.5; portFill.intensity = sstep(0.88, 1, p) * 2.4;
    scene.fog.density = lerp(0.0105, 0.0026, sstep(0.85, 1, p));

    // light pool: the four emitters nearest to the camera
    const cx = camera.position.x, cz = camera.position.z;
    const near = emitters.map((e) => ({ e, d: (e.p[0] - cx) ** 2 + (e.p[2] - cz) ** 2 })).sort((a, b) => a.d - b.d).slice(0, pool.length);
    near.forEach((n, i) => {
      const l = pool[i], flick = n.e.f ? 0.78 + 0.22 * Math.sin(time * 9 + i * 2) * Math.sin(time * 3.7 + i) : 1;
      l.position.set(n.e.p[0], n.e.p[1], n.e.p[2]); l.color.setHex(n.e.c);
      l.intensity = n.e.i * flick;
    });

    // conveyor flows (only near the camera)
    const belts = [[46, 60], [60, 88], [88, 94], [106, 152]];
    const span2 = 106; let vis = 0;
    for (let i = 0; i < flowN; i++) {
      let x = 46 + ((seeds[i * 4] * span2 + time * 1.6) % span2);
      if (x > 94 && x < 106) { P.set(0, -50, 0); S.setScalar(0.001); } else {
        P.set(x, 1.32 + seeds[i * 4 + 1] * 0.14, (seeds[i * 4 + 2] - 0.5) * 1.1);
        S.setScalar(0.13 + seeds[i * 4 + 3] * 0.14);
      }
      E.set(seeds[i * 4] * 6, seeds[i * 4 + 1] * 6, seeds[i * 4 + 2] * 6); Q.setFromEuler(E);
      M.compose(P, Q, S); flow.setMatrixAt(i, M); vis++;
    }
    flow.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 10; i++) {
      const x = 6 + ((i * 2.2 + time * 1.2) % 19);
      P.set(x, 1.54, 0); E.set(0, 0, 0); Q.identity(); S.set(1, 1, 0.42); M.compose(P, Q, S); logBelt.setMatrixAt(i, M);
    }
    logBelt.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < sackRow.count; i++) {
      const x = 165 + ((i * 2.9 + time * 1.2) % 25);
      P.set(x, 1.5, 0); E.set(-Math.PI / 2, 0, 0.04 * Math.sin(i * 5)); Q.setFromEuler(E); S.setScalar(1); M.compose(P, Q, S); sackRow.setMatrixAt(i, M);
    }
    sackRow.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < hopperLump.count; i++) {
      const k = ((time * 1.1 + i / 8) % 1); P.set(158 + Math.sin(i * 9) * 0.2, 3 - k * 1.5, Math.cos(i * 7) * 0.2); S.setScalar(0.12 + (i % 3) * 0.03); E.set(k * 5, i, 0); Q.setFromEuler(E); M.compose(P, Q, S); hopperLump.setMatrixAt(i, M);
    }
    hopperLump.instanceMatrix.needsUpdate = true;

    // only draw what can be seen from here
    stack.visible = sackRow.visible = hopperLump.visible = p > 0.6;
    boxes.visible = p > 0.74;
    logs.visible = logBelt.visible = p < 0.42;
    flow.visible = p > 0.26 && p < 0.86;
    binHeap.visible = binHeap2.visible = p > 0.34 && p < 0.8;
    emb.visible = smk.visible = p < 0.5;
    flames.forEach((fl) => { fl.visible = p < 0.48; });
    // machines
    drum.rotation.x = time * 0.8;
    const sw = Math.sin(time * 1.1);
    scanRing.position.x = gateX + sw * 2.9; scanLight.position.copy(scanRing.position);
    specimen.rotation.y = time * 0.5; specimen.rotation.x = 0.3;
    panels.forEach((m, i) => { m.position.y = 3.9 + Math.sin(time * 0.8 + i) * 0.06; });
    a0.rotation.y = 0; arm.rotation.y = Math.PI / 2 + Math.sin(time * 0.7) * 1.1;
    a1.rotation.z = Math.sin(time * 0.7 + 1) * 0.2 - 0.05;
    a2.rotation.z = Math.sin(time * 0.7 + 2) * 0.22 - 0.4;
    a3.rotation.z = -a1.rotation.z - a2.rotation.z;
    held.visible = Math.sin(time * 0.7) > -0.4;
    flames.forEach((fl, i) => { fl.userData.u.uAmt.value = 0.56 + 0.12 * Math.sin(time * 2 + i); });

    // the crane lifts a container onto the ship during the last stretch
    const lift = sstep(0.9, 1, p);
    const cz2 = lerp(-1, -28.5, sstep(0.45, 1, lift)), cy = lerp(0.1, 18.5, sstep(0, 0.5, lift) * (1 - 0) + 0);
    sling.position.set(craneX + 4, cy, cz2); trolley.position.set(craneX + 4, 33.4, cz2);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b], i) => {
      const top = 33, bot = cy + 2.9, len = top - bot;
      P.set(craneX + 4 + a * 2.4, (top + bot) / 2, cz2 + b * 1); Q.identity(); S.set(1, len, 1); M.compose(P, Q, S); cables.setMatrixAt(i, M);
    });
    cables.instanceMatrix.needsUpdate = true;
    ship.position.y = Math.sin(time * 0.35) * 0.12;
  });
  window.__p = () => sp;
  setupPage(stage);
}

if (!hasGL()) failSafe(); else main();
