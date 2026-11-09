/* Dev helper: audit() lists what spills past the viewport edge, and headings or text that a small screen would cut. */
window.audit = () => {
  const W = document.documentElement.clientWidth, out = [];
  const skip = (e) => { for (let p = e; p && p !== document.body; p = p.parentElement) { const c = getComputedStyle(p); if ((c.overflowX === 'auto' || c.overflowX === 'scroll' || c.overflowX === 'hidden' || c.overflowX === 'clip') && p !== e) return true; if (c.position === 'fixed' && (c.visibility === 'hidden' || c.opacity === '0')) return true; } return false; };
  document.querySelectorAll('body *').forEach((e) => {
    if (e.closest('.mhc-bar, canvas, script, style')) return;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if ((r.right > W + 1 || r.left < -1) && !skip(e)) out.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 24)} [${Math.round(r.left)}..${Math.round(r.right)}] ${(e.textContent || '').trim().slice(0, 24)}`);
  });
  const cut = [];
  document.querySelectorAll('h1, h2, h3, p, li, a, b, span, td, th, button, label').forEach((e) => {
    if (e.children.length || !e.textContent.trim() || e.closest('.mhc-bar')) return;
    if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible') cut.push(`${e.tagName.toLowerCase()} "${e.textContent.trim().slice(0, 30)}"`);
  });
  return { w: W, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, over: out.slice(0, 14), overCount: out.length, cut: cut.slice(0, 8) };
};
