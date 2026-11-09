/* M.H.C shared page runtime for all the models: language, templating, scroll tracking, reveal effects, loader,
   the quote form, the model switcher bar and the 4D layer (sound, sparks, heat, vibration, tilt). */
window.Kit = (() => {
  'use strict';
  const C = window.MHC, LG = window.MHC_LOGO;
  const de = document.documentElement;
  const thisScript = document.currentScript;
  const qs = new URLSearchParams(location.search);
  const embed = qs.has('embed');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let lang = 'en';
  try { lang = qs.get('lang') || localStorage.getItem('mhc-lang-v2') || 'en'; } catch (_) { /* private mode */ }
  if (lang !== 'ar') lang = 'en';

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
  const isRTL = () => lang === 'ar';

  /* ---------- events ---------- */
  const bus = {};
  const on = (e, f) => { (bus[e] = bus[e] || []).push(f); };
  const emit = (e, ...a) => (bus[e] || []).forEach((f) => f(...a));

  /* ---------- derived content ---------- */
  C.nav.forEach((n) => { n.href = '#' + n.id; });
  C.company.whatsappHref = 'https://wa.me/' + C.company.whatsapp;
  C.company.mailHref = 'mailto:' + C.company.email;
  C.company.phones.forEach((p) => { p.href = 'tel:' + p.tel; });
  C.products.items.forEach((p) => {
    p.specRows = Object.keys(p.specs).map((k) => ({ k: C.products.specLabels[k], v: p.specs[k], key: k }));
  });
  C.export.routes.forEach((r) => { r.range = r.days[0] + '–' + r.days[1]; });
  C.models.forEach((m) => { m.href = 'models/' + m.id + '/index.html'; m.shot = 'assets/img/shots/m' + m.id + '.jpg'; m.no = String(m.id).padStart(2, '0'); });

  /* ---------- text ---------- */
  const T = (v) => (v && typeof v === 'object' && 'a' in v && 'e' in v ? (lang === 'en' ? v.e : v.a) : (v == null ? '' : v));
  const get = (path, ctx) => {
    if (path === '$') return ctx;
    let o = C, parts = path.split('.');
    if (parts[0] === '$') { o = ctx; parts = parts.slice(1); }
    for (const p of parts) { if (o == null) return ''; o = o[p]; }
    return o;
  };
  const t = (path) => T(get(path));

  /* ---------- logo ---------- */
  const logo = (kind = 'dark') => {
    const vw = Math.round(LG.a * 1000), p = 28, vb = `${-p} ${-p} ${vw + 2 * p} ${1000 + 2 * p}`;
    const d = LG.d;
    const open = `<svg class="mhc-logo" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="M.H.C">`;
    if (kind === 'light') return `${open}<path fill="#0D0D0D" fill-rule="evenodd" d="${d.body}"/><path fill="#B48B0B" d="${d.letters}"/></svg>`;
    if (kind === 'mono') return `${open}<path fill="currentColor" fill-rule="evenodd" d="${d.body}"/><path fill="currentColor" d="${d.letters}"/></svg>`;
    return `${open}<path fill="#fff" d="${d.snow}"/><path fill="#0D0D0D" stroke="#D9AE2E" stroke-width="9" stroke-linejoin="round" fill-rule="evenodd" d="${d.body}"/><path fill="#D9AE2E" d="${d.letters}"/></svg>`;
  };

  /* ---------- templating: data-t, data-h, data-each, data-href, data-ph, data-al, data-idx, data-logo ---------- */
  const tpls = new WeakMap();
  const bind = (el, ctx, i) => {
    const a = el.attributes;
    if (!a.length) return;
    let v;
    if ((v = el.getAttribute('data-t')) !== null) el.textContent = T(get(v, ctx));
    if ((v = el.getAttribute('data-h')) !== null) el.innerHTML = T(get(v, ctx));
    if ((v = el.getAttribute('data-href')) !== null) el.setAttribute('href', T(get(v, ctx)));
    if ((v = el.getAttribute('data-src')) !== null) el.setAttribute('src', T(get(v, ctx)));
    if ((v = el.getAttribute('data-ph')) !== null) el.setAttribute('placeholder', T(get(v, ctx)));
    if ((v = el.getAttribute('data-al')) !== null) el.setAttribute('aria-label', T(get(v, ctx)));
    if ((v = el.getAttribute('data-ti')) !== null) el.setAttribute('title', T(get(v, ctx)));
    if ((v = el.getAttribute('data-val')) !== null) el.setAttribute('value', T(get(v, ctx)));
    if ((v = el.getAttribute('data-css')) !== null) { // data-css="--w:$.pct.carbon"
      v.split(';').forEach((pair) => { const [k, path] = pair.split(':'); if (k && path) el.style.setProperty(k.trim(), T(get(path.trim(), ctx))); });
    }
    if (el.hasAttribute('data-idx')) el.textContent = String((i || 0) + 1).padStart(2, '0');
    if ((v = el.getAttribute('data-logo')) !== null) el.innerHTML = logo(v || 'dark');
    if (el.hasAttribute('data-split')) split(el);
  };
  const split = (el) => {
    let n = 0;
    (function walk(node) {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { f.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = p; i.style.setProperty('--i', n++);
            w.append(i); f.append(w);
          });
          c.replaceWith(f);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && !c.classList.contains('w')) walk(c);
      });
    })(el);
  };
  const render = (el, ctx, i) => {
    if (el.nodeType !== 1 || el.tagName === 'SVG' || el.tagName === 'CANVAS' || el.tagName === 'SCRIPT') return;
    const list = el.getAttribute('data-each');
    if (list !== null) {
      if (!tpls.has(el)) { const tpl = el.firstElementChild; tpls.set(el, tpl ? tpl.cloneNode(true) : null); }
      const tpl = tpls.get(el), arr = get(list, ctx) || [];
      el.textContent = '';
      if (tpl) arr.forEach((item, k) => { const n = tpl.cloneNode(true); n.dataset.i = k; render(n, item, k); el.append(n); });
      return;
    }
    bind(el, ctx, i);
    if (el.hasAttribute('data-t') || el.hasAttribute('data-h') || el.hasAttribute('data-logo')) return;
    [...el.children].forEach((c) => render(c, ctx, i));
  };
  const apply = (root = document.body) => { render(root, null, 0); revealScan(root); };

  /* ---------- reveal ---------- */
  const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
  let opened = false;
  const revealScan = (root) => {
    if (!opened) return;
    const list = root.querySelectorAll('[data-r],[data-split]');
    list.forEach((el) => { if (revealIO && !reduce) revealIO.observe(el); else el.classList.add('in'); });
  };
  const countUp = (el) => {
    const final = el.dataset.n || el.textContent;
    el.dataset.n = final;
    const m = final.match(/^(\D*)(\d+)(.*)$/);
    if (!m || reduce) { el.textContent = final; return; }
    const target = +m[2], from = target > 1900 ? target - 40 : 0, t0 = performance.now();
    const step = (now) => {
      const k = clamp((now - t0) / 1400), v = Math.round(lerp(from, target, 1 - Math.pow(2, -10 * k)));
      el.textContent = k >= 1 ? final : m[1] + v + m[3];
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countIO = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); countIO.unobserve(e.target); } });
  }, { threshold: 0.5 }) : null;

  /* ---------- language ---------- */
  const setLang = (l, silent) => {
    lang = l === 'en' ? 'en' : 'ar';
    try { localStorage.setItem('mhc-lang-v2', lang); } catch (_) { /* private mode */ }
    de.lang = lang; de.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (silent) return;
    const keep = readForm();
    apply();
    mountAll();
    writeForm(keep);
    emit('lang', lang);
    measureAll();
  };
  de.lang = lang; de.dir = lang === 'ar' ? 'rtl' : 'ltr';

  /* ---------- master frame loop ---------- */
  const frames = new Set();
  const raf = (f) => { frames.add(f); return () => frames.delete(f); };
  const scroll = { y: window.scrollY, sy: window.scrollY, vel: 0, p: 0 };
  const look = { x: 0, y: 0, sx: 0, sy: 0, px: -1e4, py: -1e4, tilt: false };
  let last = performance.now(), running = true;
  const tick = (now) => {
    if (!running) return;
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const y = window.scrollY, max = Math.max(1, de.scrollHeight - innerHeight);
    scroll.vel = damp(scroll.vel, (y - scroll.y) / Math.max(dt, 0.001), 8, dt);
    scroll.y = y; scroll.sy = damp(scroll.sy, y, 7, dt); scroll.p = clamp(scroll.sy / max);
    look.sx = damp(look.sx, look.x, 4, dt); look.sy = damp(look.sy, look.y, 4, dt);
    frames.forEach((f) => f(dt, now / 1000));
    fxTick(dt, now / 1000);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });
  requestAnimationFrame(tick);

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && look.tilt) return;
    look.x = (e.clientX / innerWidth) * 2 - 1; look.y = (e.clientY / innerHeight) * 2 - 1;
    look.px = e.clientX; look.py = e.clientY;
  }, { passive: true });
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || !coarse) return;
    look.tilt = true;
    look.x = clamp(e.gamma / 28, -1, 1);
    look.y = clamp(((e.beta || 45) - 45) / 28, -1, 1);
  }, { passive: true });

  /* ---------- section tracking: t = i + fraction, when section i's top reaches the anchor line ---------- */
  const trackers = new Set();
  const sections = (list) => {
    const els = (typeof list === 'string' ? [...document.querySelectorAll(list)] : list).filter(Boolean);
    const tr = {
      els, tops: [],
      measure() { tr.tops = els.map((e) => e.getBoundingClientRect().top + window.scrollY); },
      value(y = scroll.sy, anchor = 0.55) {
        const a = y + innerHeight * anchor, n = tr.tops.length;
        if (!n) return 0;
        if (a <= tr.tops[0]) return 0;
        for (let i = 0; i < n - 1; i++) if (a < tr.tops[i + 1]) return i + (a - tr.tops[i]) / Math.max(1, tr.tops[i + 1] - tr.tops[i]);
        const lastH = els[n - 1].offsetHeight;
        return n - 1 + clamp((a - tr.tops[n - 1]) / Math.max(1, lastH));
      }
    };
    tr.measure(); trackers.add(tr);
    return tr;
  };
  const measureAll = () => trackers.forEach((x) => x.measure());
  window.addEventListener('resize', measureAll, { passive: true });
  window.addEventListener('load', measureAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
  if ('ResizeObserver' in window) new ResizeObserver(measureAll).observe(document.body);

  /* ---------- loader ---------- */
  let loaderEl = null, loaderTimer = 0;
  const loader = {
    show() {
      if (loaderEl || document.body.dataset.loader === 'off') return;
      loaderEl = document.createElement('div');
      loaderEl.className = 'mhc-loader';
      loaderEl.innerHTML = `<div class="ml-mark">${logo('dark')}</div><div class="ml-bar"><i></i></div>`;
      document.body.prepend(loaderEl);
      loaderTimer = setTimeout(() => loader.done(), 10000);
    },
    set(p) { if (loaderEl) loaderEl.querySelector('.ml-bar i').style.transform = `scaleX(${clamp(p)})`; },
    done() {
      clearTimeout(loaderTimer);
      if (!loaderEl) { de.classList.add('ready'); opened = true; revealScan(document.body); emit('ready'); return; }
      loader.set(1);
      const el = loaderEl; loaderEl = null;
      setTimeout(() => {
        el.classList.add('done');
        de.classList.add('ready');
        opened = true;
        revealScan(document.body);
        emit('ready');
        measureAll();
        setTimeout(() => el.remove(), 900);
      }, 180);
    }
  };

  /* ---------- quote form ---------- */
  const F = () => C.contact.form;
  const formEls = [];
  const formHTML = () => {
    const f = F();
    const prods = C.products.items.map((p) => `<option value="${p.id}">${T(p.name)}</option>`).join('');
    const qtys = f.qtyOptions.map((o, i) => `<option value="${i}">${T(o)}</option>`).join('');
    const field = (name, label, req, type = 'text', auto = '') => `<label class="fld"><span>${T(label)}${req ? ' <b>*</b>' : ''}</span><input name="${name}" type="${type}" ${req ? 'required' : ''} ${auto ? `autocomplete="${auto}"` : ''}><small></small></label>`;
    const send = C.company.formEndpoint ? T(f.sendEmail) : T(f.send);
    return `<div class="fld-grid">
      ${field('name', f.name, true, 'text', 'name')}
      ${field('company', f.company, false, 'text', 'organization')}
      ${field('country', f.country, true, 'text', 'country-name')}
      ${field('phone', f.phone, true, 'tel', 'tel')}
      ${field('email', f.email, false, 'email', 'email')}
      <label class="fld"><span>${T(f.product)}</span><select name="product"><option value="">${T(f.choose)}</option>${prods}</select><small></small></label>
      <label class="fld"><span>${T(f.qty)}</span><select name="qty"><option value="">${T(f.choose)}</option>${qtys}</select><small></small></label>
      <label class="fld fld-wide"><span>${T(f.message)}</span><textarea name="message" rows="3"></textarea><small></small></label>
    </div>
    <div class="fld-end"><button class="btn-send" type="submit"><span>${send}</span></button><p class="fld-st" role="status"></p></div>`;
  };
  const readForm = () => {
    const form = formEls[0]; if (!form) return null;
    const o = {}; [...form.elements].forEach((e) => { if (e.name) o[e.name] = e.value; }); return o;
  };
  const writeForm = (o) => { if (!o) return; formEls.forEach((form) => [...form.elements].forEach((e) => { if (e.name && o[e.name] != null) e.value = o[e.name]; })); };
  const prefill = (o) => writeForm(o);
  const submit = async (form) => {
    const f = F(), st = form.querySelector('.fld-st');
    let ok = true;
    ['name', 'country', 'phone'].forEach((n) => {
      const el = form.elements[n], box = el.closest('.fld'), bad = !el.value.trim();
      const badPhone = n === 'phone' && !bad && !/^\+?[\d\s()-]{7,20}$/.test(el.value.trim());
      box.toggleAttribute('data-err', bad || badPhone);
      box.querySelector('small').textContent = bad ? T(f.required) : badPhone ? T(f.badPhone) : '';
      if (bad || badPhone) ok = false;
    });
    if (!ok) return;
    const prod = C.products.items.find((p) => p.id === form.elements.product.value);
    const qty = f.qtyOptions[form.elements.qty.value];
    const rows = [
      [f.name, form.elements.name.value], [f.company, form.elements.company.value], [f.country, form.elements.country.value],
      [f.phone, form.elements.phone.value], [f.email, form.elements.email.value], [f.product, prod ? T(prod.name) : ''],
      [f.qty, qty ? T(qty) : ''], [f.message, form.elements.message.value]
    ].filter((r) => (r[1] || '').trim());
    const text = rows.map((r) => `${T(r[0])}: ${r[1]}`).join('\n');
    const url = C.company.formEndpoint;
    if (url) {
      st.textContent = T(f.sending);
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ _subject: 'MHC website request' }, Object.fromEntries(rows.map((r) => [r[0].e, r[1]])))) });
        if (!res.ok) throw new Error('failed');
        form.reset(); st.textContent = T(f.sent);
      } catch (_) { st.textContent = T(f.failed); }
    } else {
      window.open(`${C.company.whatsappHref}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      st.textContent = T(f.opened);
    }
  };
  const mountAll = () => {
    formEls.length = 0;
    document.querySelectorAll('[data-quote-form]').forEach((host) => {
      host.innerHTML = `<form novalidate>${formHTML()}</form>`;
      const form = host.firstElementChild;
      form.addEventListener('submit', (e) => { e.preventDefault(); submit(form); });
      formEls.push(form);
    });
    document.querySelectorAll('[data-lang-toggle]').forEach((b) => { b.textContent = lang === 'ar' ? 'EN' : 'ع'; b.setAttribute('aria-label', lang === 'ar' ? 'English' : 'العربية'); b.lang = lang === 'ar' ? 'en' : 'ar'; });
    document.querySelectorAll('[data-n]').forEach((el) => { if (countIO && !reduce) countIO.observe(el); });
    document.querySelectorAll('[data-4d]').forEach((b) => { b.title = T(C.ui.fx4d); b.setAttribute('aria-label', T(C.ui.fx4d)); b.setAttribute('aria-pressed', fx.on ? 'true' : 'false'); });
    syncBar();
  };

  /* ---------- review bar: move between models, language, 4D ---------- */
  let modelId = 0;
  const syncTitle = () => { document.title = (modelId ? T(C.models[modelId - 1].name) + ' | ' : 'MHC Coalline | ') + T(C.company.name); };
  const syncBar = () => {
    syncTitle();
    const now = document.querySelector('.mhc-bar .b-now');
    if (!now || !modelId) return;
    const m = C.models[modelId - 1];
    now.textContent = `${modelId}/${C.models.length} · ${T(m.name)}`;
    const all = document.querySelector('.mhc-bar .b-all span'); if (all) all.textContent = T(C.ui.allModels);
  };
  const bar = (id) => {
    modelId = id;
    if (embed) return;
    const n = C.models.length, prev = id === 1 ? n : id - 1, next = id === n ? 1 : id + 1;
    const el = document.createElement('nav');
    el.className = 'mhc-bar';
    el.innerHTML = `<a class="b-all" href="../../index.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" fill="currentColor"/></svg><span></span></a>
      <a class="b-arrow" href="../${prev}/index.html" aria-label="${T(C.ui.prev)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <span class="b-now"></span>
      <a class="b-arrow" href="../${next}/index.html" aria-label="${T(C.ui.next)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      <button class="b-4d" type="button" data-4d><i></i>4D</button>
      <button class="b-lang" type="button" data-lang-toggle></button>`;
    document.body.append(el);
    wire();
    syncBar();
  };

  /* ---------- 4D layer ---------- */
  const fx = { on: false, heat: 0.35, target: 0.35, ctx: null, master: null, roar: null, wind: null, timer: 0, canvas: null, g: null, sparks: [], sprite: null, wx: 0 };
  const makeSprite = () => {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const x = c.getContext('2d'), g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(255,236,190,1)'); g.addColorStop(0.18, 'rgba(255,186,72,.95)'); g.addColorStop(0.45, 'rgba(240,96,16,.32)'); g.addColorStop(1, 'rgba(200,50,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 48, 48);
    return c;
  };
  const sparksStart = () => {
    if (fx.canvas) { fx.canvas.style.display = ''; return; }
    fx.canvas = document.createElement('canvas');
    fx.canvas.className = 'mhc-sparks';
    document.body.append(fx.canvas);
    fx.g = fx.canvas.getContext('2d');
    fx.sprite = makeSprite();
    const size = () => { fx.canvas.width = innerWidth; fx.canvas.height = innerHeight; };
    size(); window.addEventListener('resize', size, { passive: true });
  };
  const sparksTick = (dt) => {
    if (!fx.g) return;
    const W = fx.canvas.width, H = fx.canvas.height, g = fx.g;
    g.clearRect(0, 0, W, H);
    if (!fx.on && !fx.sparks.length) { fx.canvas.style.display = 'none'; return; }
    fx.wx = damp(fx.wx, look.sx * 90, 2, dt);
    const rate = fx.on ? 5 + fx.heat * 34 + Math.min(40, Math.abs(scroll.vel) * 0.012) : 0;
    let spawn = rate * dt; while (spawn > 0) { if (Math.random() < spawn && fx.sparks.length < 150) fx.sparks.push({ x: Math.random() * W, y: H + 12, vx: (Math.random() - 0.5) * 34, vy: -(70 + Math.random() * 190), s: 4 + Math.random() * 13, life: 0, max: 1.6 + Math.random() * 3.2, ph: Math.random() * 6.28 }); spawn -= 1; }
    g.globalCompositeOperation = 'lighter';
    for (let i = fx.sparks.length - 1; i >= 0; i--) {
      const p = fx.sparks[i]; p.life += dt;
      if (p.life > p.max || p.y < -30) { fx.sparks.splice(i, 1); continue; }
      const k = p.life / p.max;
      p.ph += dt * 3.2;
      p.x += (p.vx + fx.wx + Math.sin(p.ph) * 34) * dt;
      p.y += (p.vy - scroll.vel * 0.05) * dt;
      p.vy *= 1 - 0.14 * dt;
      g.globalAlpha = (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88) * 0.95;
      const s = p.s * (1 - k * 0.55);
      g.drawImage(fx.sprite, p.x - s / 2, p.y - s / 2, s, s);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  };
  const audioStart = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!fx.ctx) {
      const c = fx.ctx = new AC();
      const master = fx.master = c.createGain(); master.gain.value = 0; master.connect(c.destination);
      const len = c.sampleRate * 4, white = c.createBuffer(1, len, c.sampleRate), brown = c.createBuffer(1, len, c.sampleRate);
      const w = white.getChannelData(0), b = brown.getChannelData(0);
      let last2 = 0;
      for (let i = 0; i < len; i++) { const r = Math.random() * 2 - 1; w[i] = r; last2 = (last2 + 0.02 * r) / 1.02; b[i] = last2 * 3.5; }
      fx.white = white;
      const loop = (buf, freq, type, gain, q) => {
        const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
        const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
        const g = c.createGain(); g.gain.value = gain;
        s.connect(f); f.connect(g); g.connect(master); s.start();
        return { f, g };
      };
      fx.rumble = loop(brown, 120, 'lowpass', 0.55);
      fx.roar = loop(white, 420, 'bandpass', 0.05, 0.6);
      fx.wind = loop(white, 900, 'bandpass', 0, 0.8);
    }
    fx.ctx.resume();
    fx.master.gain.cancelScheduledValues(fx.ctx.currentTime);
    fx.master.gain.setTargetAtTime(0.85, fx.ctx.currentTime, 0.4);
    const crackle = () => {
      if (!fx.on) return;
      const c = fx.ctx, s = c.createBufferSource(); s.buffer = fx.white;
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1400 + Math.random() * 4200;
      const g = c.createGain(); const now = c.currentTime, peak = (0.05 + Math.random() * 0.28) * (0.35 + fx.heat);
      g.gain.setValueAtTime(peak, now); g.gain.exponentialRampToValueAtTime(0.0008, now + 0.012 + Math.random() * 0.05);
      s.connect(f); f.connect(g);
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.random() * 1.6 - 0.8; g.connect(p); p.connect(fx.master); } else g.connect(fx.master);
      s.start(now, Math.random() * 3.5, 0.09);
      fx.timer = setTimeout(crackle, (40 + Math.random() * 420) / (0.35 + fx.heat * 1.4));
    };
    clearTimeout(fx.timer); crackle();
  };
  const audioStop = () => { clearTimeout(fx.timer); if (fx.ctx) { fx.master.gain.setTargetAtTime(0, fx.ctx.currentTime, 0.25); } };
  const thump = (s = 1) => {
    if (!fx.on) return;
    if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) { try { navigator.vibrate(Math.round(18 + 34 * s)); } catch (_) { /* not allowed yet */ } }
    emit('thump', s);
    if (!fx.ctx) return;
    const c = fx.ctx, now = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(92, now); o.frequency.exponentialRampToValueAtTime(34, now + 0.34);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5 * s, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    o.connect(g); g.connect(fx.master); o.start(now); o.stop(now + 0.55);
  };
  const fxToggle = async () => {
    fx.on = !fx.on;
    de.classList.toggle('fx4d', fx.on);
    document.querySelectorAll('[data-4d]').forEach((b) => b.setAttribute('aria-pressed', fx.on ? 'true' : 'false'));
    if (fx.on) {
      sparksStart(); audioStart(); thump(1);
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') { try { await D.requestPermission(); } catch (_) { /* declined */ } }
    } else audioStop();
    emit('4d', fx.on);
  };
  const fxTick = (dt) => {
    fx.heat = damp(fx.heat, fx.target, 2, dt);
    if (fx.canvas) sparksTick(dt);
    if (fx.on && fx.ctx) {
      const t0 = fx.ctx.currentTime;
      fx.roar.g.gain.setTargetAtTime(0.03 + fx.heat * 0.22, t0, 0.2);
      fx.rumble.g.gain.setTargetAtTime(0.3 + fx.heat * 0.7, t0, 0.2);
      fx.wind.g.gain.setTargetAtTime(Math.min(0.2, Math.abs(scroll.vel) * 0.00016), t0, 0.08);
    }
  };
  const fx4d = {
    get on() { return fx.on; },
    get heat() { return fx.heat; },
    setHeat(v) { fx.target = clamp(v); },
    thump, toggle: fxToggle
  };

  /* ---------- page wiring ---------- */
  const wire = () => {
    document.querySelectorAll('[data-lang-toggle]:not([data-w])').forEach((b) => { b.dataset.w = 1; b.addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar')); });
    document.querySelectorAll('[data-4d]:not([data-w])').forEach((b) => { b.dataset.w = 1; b.addEventListener('click', fxToggle); });
    document.querySelectorAll('[data-menu-toggle]:not([data-w])').forEach((b) => { b.dataset.w = 1; b.addEventListener('click', () => de.classList.toggle('menu-open')); });
    mountAll();
  };
  const init = () => {
    apply();
    loader.show();
    wire();
    const mid = thisScript && +thisScript.dataset.model;
    if (mid) bar(mid);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (a) { de.classList.remove('menu-open'); }
    });
    window.addEventListener('scroll', () => de.classList.toggle('scrolled', window.scrollY > 40), { passive: true });
    if ('IntersectionObserver' in window) {
      const secIO = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const id = e.target.id;
          document.querySelectorAll('[data-nav] a').forEach((a) => a.toggleAttribute('data-active', a.getAttribute('href') === '#' + id));
          emit('section', id);
          thump(0.55);
        });
      }, { rootMargin: '-50% 0px -50% 0px' });
      document.querySelectorAll('main > section[id]').forEach((s) => secIO.observe(s));
    }
    measureAll();
  };
  init();

  return {
    C, T, t, get, on, emit, apply, setLang, isRTL, logo, loader, raf, scroll, look, sections, measureAll, bar, fx4d, prefill,
    clamp, lerp, smooth, damp, reduce, coarse, embed,
    get lang() { return lang; },
    get mobile() { return innerWidth < 820; }
  };
})();
