/* Model 5: The Summit. The logo becomes a world: black peaks with gold contour lines, the giant shovel and pickaxe,
   and a flight straight through the logo's own arch into a seam of glowing charcoal. */
import { THREE, Stage, studioEnv, noiseVolume, SHARED, logoShapes, metal, coalMaterial, lumpGeometry, embers, sstep, clamp, lerp, rng, hasGL, failSafe, setupPage, mergeGeometries } from '../../shared/core3d.js';

const Kit = window.Kit, C = Kit.C;
if (!hasGL()) failSafe(); else main();

function main() {
  const canvas = document.getElementById('gl');
  const stage = new Stage({ canvas, fov: 42, far: 900, background: 0x060605, bloom: { strength: 0.42, radius: 0.5, threshold: 1.1 }, bloomScale: 0.6, msaa: false, vignette: 0.5, grain: 0.022 });
  const { scene, camera, renderer, tier } = stage;
  scene.environment = studioEnv(renderer, { top: [1, 0.96, 0.9, 2.2], back: [1, 0.66, 0.3, 4], left: [0.8, 0.8, 1, 1.4], right: [1, 0.7, 0.34, 2.6], floor: [1, 0.5, 0.2, 0.3] });
  scene.fog = new THREE.FogExp2(0x070605, 0.0065);
  Kit.loader.set(0.2);
  const low = tier === 1;

  /* ---------- terrain: a heightfield shaped like the logo's range, drawn with contour lines ---------- */
  const N = noiseVolume();
  // the range's silhouette: five peaks in the logo's rhythm
  const PEAKS = [[-132, 24, 44], [-78, 34, 58], [-18, 46, 74], [44, 30, 50], [104, 40, 62], [168, 26, 54], [-190, 22, 60], [236, 30, 70]];
  const ridge = (x, z) => {
    let h = 0;
    for (let i = 0; i < PEAKS.length; i++) { const p = PEAKS[i], dx = x - p[0], dz = z + 40 + i * 6, d = Math.sqrt(dx * dx + dz * dz * 0.42) / p[2]; h = Math.max(h, p[1] * Math.exp(-d * d * 1.3) * (1 - 0.06 * d)); }
    return h;
  };
  const height = (x, z) => {
    const n1 = N.sample(x * 0.0042 + 0.2, z * 0.0042, 0.31, 0) - 0.5, n2 = N.sample(x * 0.012, z * 0.012, 0.77, 0) - 0.5, b = 1 - Math.abs(N.sample(x * 0.0065 + 0.5, z * 0.0065 + 0.1, 0.13, 0) - 0.5) * 2;
    const ridged = b * b * 26, base = ridge(x, z);
    const valley = sstep(8, 44, Math.abs(z + 20 + Math.sin(x * 0.012) * 6)) * 0.5 + 0.5;
    return (base * (1 + n1 * 0.9) + (ridged * 0.45 + n1 * 18 + n2 * 7) * valley) * sstep(150, 40, z) - 3;
  };
  const SEG = low ? 170 : 300, SIZE = 720, terG = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); terG.rotateX(-Math.PI / 2);
  { const p = terG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i) - 150; p.setXYZ(i, x, height(x, z), z); } terG.computeVertexNormals(); terG.computeBoundingSphere(); }
  const terU = { tN: { value: N.tex }, uTime: SHARED.uTime, uGlow: { value: 0 }, uRise: { value: 0 } };
  const terM = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.82, metalness: 0.28 });
  terM.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, terU);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTP; varying vec3 vTN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvTP=position; vTN=normal;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', /* glsl */`#include <common>
      precision highp sampler3D; uniform sampler3D tN; uniform float uTime,uGlow,uRise; varying vec3 vTP,vTN;`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        vec4 tR=texture(tN,vTP*.018); vec4 tF=texture(tN,vTP*.09);
        float slope=1.-clamp(vTN.y,0.,1.);
        float snow=smoothstep(52.,60.,vTP.y+tR.r*12.)*smoothstep(.62,.2,slope);
        vec3 rock=mix(vec3(.018,.018,.02),vec3(.07,.066,.066),tF.a*.6+tR.r*.4);
        diffuseColor.rgb=mix(rock,vec3(.52,.5,.46),snow);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(.5,.95,tF.a);')
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          float sp=3.2, h=vTP.y/sp, fw=fwidth(h);
          float line=1.-smoothstep(0.,fw*1.25,abs(fract(h-.5)-.5));
          float major=1.-smoothstep(0.,fw*1.25,abs(fract(h/5.-.5)-.5)*5.);
          float fade=smoothstep(.75,.1,fw);
          float distF=exp(-length(vViewPosition)*.0062);
          float sweep=smoothstep(.06,0.,abs(fract(vTP.y*.008-uTime*.05)-.5)-.0);
          vec3 gold=vec3(1.5,1.02,.26);
          totalEmissiveRadiance+=gold*(line*.62+major*1.5)*fade*(.45+distF)*(1.+sweep*1.4);
        }`);
  };
  terM.customProgramCacheKey = () => 'terrain';
  const terrain = new THREE.Mesh(terG, terM); scene.add(terrain);
  const sunL = new THREE.DirectionalLight(0xffd8a8, 0.9); sunL.position.set(-120, 90, 80); scene.add(sunL);
  const backL = new THREE.DirectionalLight(0xff9a4a, 1.4); backL.position.set(100, 40, -160); scene.add(backL);
  const hemi = new THREE.HemisphereLight(0x8fa0bc, 0x120a05, 0.22); scene.add(hemi);
  const frontL = new THREE.DirectionalLight(0xffdfae, 1.5); frontL.position.set(10, 30, 120); scene.add(frontL);
  Kit.loader.set(0.45);

  /* ---------- sky ---------- */
  const skyU = { uSun: { value: new THREE.Vector3(0.34, 0.1, -1).normalize() }, uTime: SHARED.uTime, uDim: { value: 1 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: /* glsl */`
      uniform vec3 uSun; uniform float uTime,uDim; varying vec3 vD;
      float h(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      void main(){ vec3 d=normalize(vD); float y=max(d.y,0.), s=max(dot(d,uSun),0.);
        vec3 c=mix(vec3(.085,.034,.012),vec3(.004,.004,.009),pow(y,.3));
        c+=vec3(1.5,.74,.22)*(pow(s,10.)*.13+pow(s,110.)*.32)+vec3(3.4,2.3,1.)*pow(s,2200.)*1.6;
        vec3 g=floor(d*260.); c+=vec3(1.,.95,.85)*step(.9974,h(g))*smoothstep(.04,.3,y)*(.5+.5*sin(uTime+h(g*2.)*30.));
        gl_FragColor=vec4(c*uDim,1.); }`
  }));
  scene.add(sky);

  /* ---------- monument: the logo's arch, shovel and pickaxe at giant scale ---------- */
  const S = logoShapes(), mono = new THREE.Group(); scene.add(mono);
  const graphite = metal('graphite'), gold = metal('gold');
  const ex = (shape, d, b = 0.012) => { const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b * 0.2, bevelSegments: 2, curveSegments: 2, steps: 1 }); g.translate(0, 0, -d / 2); return g; };
  const body = new THREE.Mesh(ex(S.body, 0.09), [graphite, gold]);
  const lets = new THREE.Mesh(mergeGeometries(S.letters.map((x) => ex(x, 0.12))), gold);
  const snowM = new THREE.Mesh(mergeGeometries(S.snow.map((x) => ex(x, 0.05, 0.006))), metal('platinum'));
  mono.add(body, lets, snowM);
  const MONO_POS = new THREE.Vector3(0, 0, -30), MONO_S = 42;
  mono.position.copy(MONO_POS); mono.scale.setScalar(MONO_S); mono.position.y = height(0, -30) + MONO_S * 0.5 + 6;
  const monoLight = new THREE.PointLight(0xffc068, 0, 180, 1.6); monoLight.position.set(0, mono.position.y + 6, mono.position.z + 26); scene.add(monoLight);

  /* ---------- the seam behind the arch: a tunnel of strata lit by embers ---------- */
  const seam = new THREE.Group(); const SEAM_Z0 = mono.position.z - 8, TY = mono.position.y - 6; seam.position.y = TY - 4; scene.add(seam);
  const tunG = new THREE.CylinderGeometry(9, 12, 220, 56, 80, true); tunG.rotateX(Math.PI / 2); tunG.translate(0, 0, SEAM_Z0 - 110);
  { const p = tunG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) , z = p.getZ(i), n = N.sample(x * 0.06, y * 0.06, z * 0.03, 0) - 0.5; const k = 1 + n * 0.62; p.setXY(i, x * k, y * k * 0.72 + 4); } tunG.computeVertexNormals(); }
  const tunM = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.62, metalness: 0.5, side: THREE.BackSide });
  tunM.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, terU);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSP=position;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nprecision highp sampler3D; uniform sampler3D tN; uniform float uTime; varying vec3 vSP;')
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        { vec4 a=texture(tN,vSP*.06), b=texture(tN,vSP*.21);
          float seams=smoothstep(.9,.995,texture(tN,vec3(vSP.x*.03,vSP.y*.16,vSP.z*.012)).g);
          float pulse=.6+.4*sin(uTime*1.3+vSP.z*.14+a.r*8.);
          float cell=1.-smoothstep(0.,.03,b.b);
          totalEmissiveRadiance+=vec3(3.,1.4,.2)*seams*pulse*1.1+vec3(1.4,.42,.05)*cell*smoothstep(.56,.72,a.r)*pulse; }`);
  };
  tunM.customProgramCacheKey = () => 'seam';
  seam.add(new THREE.Mesh(tunG, tunM));
  // charcoal hanging in the seam
  const coalM = coalMaterial({ heat: 0.5, bump: 0.03, flat: 0.1 }), R = rng(77);
  const shard = lumpGeometry(55, { detail: low ? 6 : 10, fibre: 0.02, split: 0.03, crack: 0.02 });
  const floaters = new THREE.InstancedMesh(shard, coalM, low ? 50 : 110), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), SV = new THREE.Vector3();
  const fl = []; for (let i = 0; i < floaters.count; i++) { const a = R() * 6.28, r = 3 + R() * 6.5; fl.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.66 + TY, z: SEAM_Z0 - 10 - R() * 190, s: 0.35 + R() * R() * 1.5, a: R() * 6, b: R() * 6, sp: 0.1 + R() * 0.3 }); }
  scene.add(floaters); floaters.frustumCulled = false;
  const seamLight = new THREE.PointLight(0xff8a30, 0, 70, 1.5); scene.add(seamLight);
  const emb = embers({ count: low ? 200 : 480, box: [26, 18, 170], y0: -6, size: 62, speed: 1.2 }); emb.position.set(0, TY - 6, SEAM_Z0 - 90); scene.add(emb);
  const snowFx = embers({ count: low ? 160 : 340, box: [240, 60, 240], y0: 0, size: 40, speed: 1.5, color: [2.4, 1.7, 0.7] }); snowFx.position.set(0, 12, 30); scene.add(snowFx);
  Kit.loader.set(0.72);

  /* ---------- flight path ---------- */
  const my = mono.position.y;
  const KEY = [
    [0, [0, my - 6, 165], [0, my - 36, -30]], /* the look target sits low so the monument clears the headline */
    [0.12, [-44, my - 8, 118], [0, my - 8, -30]],
    [0.24, [60, my - 12, 78], [0, my - 4, -30]],
    [0.32, [0, my - 1.2, 36], [0, my - 1.2, -32]],
    [0.38, [0, my - 1.2, -22], [0, my - 1.6, -60]],
    [0.46, [0, TY + 1, SEAM_Z0 - 20], [1, TY, SEAM_Z0 - 54]],
    [0.56, [3, TY + 1, SEAM_Z0 - 66], [-2, TY, SEAM_Z0 - 100]],
    [0.64, [-2, TY + 2, SEAM_Z0 - 110], [2, TY - 1, SEAM_Z0 - 150]],
    [0.7, [1, TY + 1, SEAM_Z0 - 150], [0, TY + 2, SEAM_Z0 - 196]],
    [0.72, [90, 66, 40], [0, 18, -90]],
    [0.82, [-110, 44, 18], [10, 14, -110]],
    [0.92, [24, 18, 64], [-30, 26, -120]],
    [1, [0, 60, 150], [0, 22, -80]]
  ];
  const curveP = new THREE.CatmullRomCurve3(KEY.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal');
  const curveT = new THREE.CatmullRomCurve3(KEY.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal');
  const tAt = (p) => { for (let i = 0; i < KEY.length - 1; i++) if (p <= KEY[i + 1][0]) return (i + (p - KEY[i][0]) / (KEY[i + 1][0] - KEY[i][0])) / (KEY.length - 1); return 1; };

  /* ---------- page wiring ---------- */
  const sections = ['hero', 'about', 'gate', 'products', 'process', 'export', 'label', 'trust', 'faq', 'contact'].map((i) => document.getElementById(i));
  const tr = Kit.sections(sections);
  // scroll position -> place along the flight, section by section
  const MAP = [[0.5, 0], [1, 0.26], [2, 0.3], [3, 0.46], [4, 0.66], [5, 0.74], [6, 0.82], [7, 0.88], [8, 0.94], [9, 1]];
  const pOf = (t) => { for (let i = 0; i < MAP.length - 1; i++) if (t <= MAP[i + 1][0]) return lerp(MAP[i][1], MAP[i + 1][1], (t - MAP[i][0]) / (MAP[i + 1][0] - MAP[i][0])); return 1; };
  const elevN = document.getElementById('elevN'), elevI = document.querySelector('.elev i');
  const whites = new THREE.Color(), pos = new THREE.Vector3(), tar = new THREE.Vector3();
  let sP = 0, flash = 0, wasIn = false;
  stage.onFrame((dt, time) => {
    const t = tr.value(Kit.scroll.sy, 0.5), goal = pOf(t);
    sP += (goal - sP) * Math.min(1, dt * 3.4);
    const p = clamp(sP);
    const u = tAt(p);
    curveP.getPoint(u, pos); curveT.getPoint(u, tar);
    const portrait = camera.aspect < 0.9, inSeam = p > 0.44 && p < 0.715;
    // cut back outside: the seam ends and the range opens again
    camera.position.copy(pos); camera.position.x += Kit.look.sx * (inSeam ? 0.9 : 3.5); camera.position.y += -Kit.look.sy * (inSeam ? 0.6 : 2);
    camera.lookAt(tar);
    const fovGoal = (portrait ? 58 : 42) + sstep(0.33, 0.39, p) * (1 - sstep(0.41, 0.48, p)) * 26;
    if (Math.abs(camera.fov - fovGoal) > 0.05) { camera.fov = fovGoal; camera.updateProjectionMatrix(); }

    // heat rises inside the seam
    const heat = sstep(0.42, 0.52, p) * (1 - sstep(0.68, 0.715, p));
    Kit.fx4d.setHeat(0.15 + heat * 0.85);
    seamLight.position.copy(camera.position); seamLight.position.z -= 8; seamLight.intensity = heat * 70;
    monoLight.intensity = 90 * (1 - sstep(0.4, 0.5, p));
    scene.fog.density = lerp(0.0058, 0.012, heat);
    scene.fog.color.setRGB(lerp(0.028, 0.08, heat), lerp(0.024, 0.026, heat), lerp(0.02, 0.008, heat));
    skyU.uDim.value = 1 - heat;
    const nearMono = p < 0.72;
    mono.visible = nearMono && !(p > 0.5);
    seam.visible = floaters.visible = emb.visible = p > 0.3 && p < 0.72;
    terrain.visible = !(p > 0.42 && p < 0.715);
    snowFx.visible = terrain.visible;
    if (floaters.visible) {
      for (let i = 0; i < fl.length; i++) {
        const q = fl[i]; P.set(q.x, q.y + Math.sin(time * q.sp + q.a) * 0.5, q.z); E.set(q.a + time * q.sp, q.b + time * q.sp * 0.7, 0); Q.setFromEuler(E); SV.setScalar(q.s);
        M.compose(P, Q, SV); floaters.setMatrixAt(i, M);
      }
      floaters.instanceMatrix.needsUpdate = true;
    }
    // flash and rumble when passing through the arch
    const inNow = p > 0.372;
    if (inNow !== wasIn) { wasIn = inNow; flash = 1; Kit.fx4d.thump(1); }
    flash *= Math.pow(0.01, dt);
    stage.final.uniforms.uExp.value = 1 + flash * 1.6;
    sky.position.copy(camera.position);
    // altitude readout
    const alt = Math.max(0, Math.round(camera.position.y * 34));
    elevN.textContent = alt + ' m'; if (elevI) elevI.style.setProperty('--p', clamp(alt / 2200) * 100 + '%');
  });
  window.__p = () => sP;
  setupPage(stage);
}
