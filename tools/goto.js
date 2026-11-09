/* Dev helpers for checking pages from the console.
   goto('products', 0.5): jump to a section; goP('process', 0.3): jump along a pinned section. */
window.goto = (id, f = 0) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY + (r.height - innerHeight * (r.height > innerHeight * 1.5 ? 1 : 0)) * f, behavior: 'instant' }); return Math.round(scrollY); };
window.goP = (id, p) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY + (r.height - innerHeight) * p, behavior: 'instant' }); return p; };
/* settle(): runs the scene forward by hand, for checking pages while the preview pane is in the background */
window.settle = (n = 120) => { const st = window.__stage, K = window.Kit; for (let i = 0; i < n; i++) { K.scroll.y = K.scroll.sy = window.scrollY; st.time += 0.05; st.cbs.forEach((f) => f(0.05, st.time)); } st.renderOnce(); return true; };
/* show(id, f): jump, settle the scene and finish reveal effects, for a stable look at a section */
window.show = async (id, f = 0) => { window.goto(id, f); await new Promise((r) => setTimeout(r, 300)); window.settle(50); document.querySelectorAll('[data-split],[data-r]').forEach((e) => e.classList.add('in')); await new Promise((r) => setTimeout(r, 120)); document.getAnimations().forEach((a) => { try { a.finish(); } catch (_) { /* running */ } }); return true; };
