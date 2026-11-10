/* Dev helper: perf(n) times the scene by hand, so it also works while the preview pane is in the background.
   It draws n frames back to back and waits once for the graphics card: ms = average cost of one frame.
   Run it a few times and read the lowest value; other work on the machine only adds time. */
window.perf = async (n = 30, runs = 3) => {
  const st = window.__stage, gl = st.renderer.getContext(), K = window.Kit, px = new Uint8Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const best = [];
  for (let r = 0; r < runs; r++) {
    sync(); await new Promise((res) => setTimeout(res, 30));
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      K.scroll.y = K.scroll.sy = window.scrollY;
      st.time += 1 / 60; st.cbs.forEach((f) => f(1 / 60, st.time));
      st.renderOnce();
    }
    sync();
    best.push((performance.now() - t0) / n);
  }
  const c = st.canvas;
  return { tier: st.tier, dpr: +st.dpr.toFixed(2), mpx: +(c.width * c.height / 1e6).toFixed(2), ms: +Math.min(...best).toFixed(1) };
};
