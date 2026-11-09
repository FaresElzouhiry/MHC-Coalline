/* Dev helper: saves the WebGL canvas of the current page as assets/img/shots/<name>.jpg (needs serve.ps1).
   It steps the scene by hand first, so it also works while the preview pane is in the background. */
window.shot = async (name, w = 1280, steps = 90, crop = null) => {
  const st = window.__stage, gl = st.canvas, K = window.Kit;
  for (let i = 0; i < steps; i++) {
    K.scroll.y = K.scroll.sy = window.scrollY;
    st.time += 0.05;
    st.cbs.forEach((f) => f(0.05, st.time));
  }
  st.renderOnce();
  const r = crop ? [crop[0] * gl.width, crop[1] * gl.height, crop[2] * gl.width, crop[3] * gl.height] : [0, 0, gl.width, gl.height];
  const h = Math.round(w * r[3] / r[2]), c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(gl, r[0], r[1], r[2], r[3], 0, 0, w, h);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.84));
  const res = await fetch('/__shot?name=' + name, { method: 'POST', body: blob });
  return { status: res.status, kb: Math.round(blob.size / 1024), w, h };
};
