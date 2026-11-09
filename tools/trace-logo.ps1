# Traces a bitmap of the logo into clean vector contours (marching squares on an up-scaled, slightly blurred copy).
# Output: a JSON list of closed loops plus an SVG for checking the result.
# powershell -ExecutionPolicy Bypass -File tools\trace-logo.ps1 -Src assets\logo\source-card-black.jpg -X 100 -Y 15 -W 250 -H 206 -Out tools\logo-trace
param(
  [Parameter(Mandatory = $true)][string]$Src,
  [int]$X = 0, [int]$Y = 0, [int]$W = 0, [int]$H = 0,
  [int]$Up = 6, [double]$Sigma = 0.55, [double]$Thr = 0.5, [double]$Eps = 0.9, [double]$MinArea = 6,
  [Parameter(Mandatory = $true)][string]$Out
)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Text;

public static class LogoTracer {
  static float[] Gray(Bitmap b, int x0, int y0, int w, int h) {
    float[] g = new float[w * h];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      Color c = b.GetPixel(x0 + x, y0 + y);
      g[y * w + x] = (0.299f * c.R + 0.587f * c.G + 0.114f * c.B) / 255f;
    }
    return g;
  }
  static float CR(float a, float b, float c, float d, float t) {
    return 0.5f * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  }
  static float[] Upscale(float[] s, int w, int h, int up, out int W, out int H) {
    W = (w - 1) * up + 1; H = (h - 1) * up + 1;
    float[] o = new float[W * H];
    float[] col = new float[4];
    for (int Y = 0; Y < H; Y++) {
      float fy = (float)Y / up; int iy = (int)fy; float ty = fy - iy;
      for (int X = 0; X < W; X++) {
        float fx = (float)X / up; int ix = (int)fx; float tx = fx - ix;
        for (int j = -1; j <= 2; j++) {
          int yy = Math.Min(h - 1, Math.Max(0, iy + j));
          int r = yy * w;
          col[j + 1] = CR(s[r + Math.Max(0, ix - 1)], s[r + ix], s[r + Math.Min(w - 1, ix + 1)], s[r + Math.Min(w - 1, ix + 2)], tx);
        }
        o[Y * W + X] = CR(col[0], col[1], col[2], col[3], ty);
      }
    }
    return o;
  }
  static float[] Blur(float[] s, int W, int H, double sigma) {
    int rad = (int)Math.Ceiling(sigma * 3); float[] k = new float[rad * 2 + 1]; float sum = 0;
    for (int i = -rad; i <= rad; i++) { k[i + rad] = (float)Math.Exp(-i * i / (2 * sigma * sigma)); sum += k[i + rad]; }
    for (int i = 0; i < k.Length; i++) k[i] /= sum;
    float[] a = new float[W * H], b = new float[W * H];
    for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
      float v = 0; for (int i = -rad; i <= rad; i++) v += k[i + rad] * s[y * W + Math.Min(W - 1, Math.Max(0, x + i))];
      a[y * W + x] = v;
    }
    for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
      float v = 0; for (int i = -rad; i <= rad; i++) v += k[i + rad] * a[Math.Min(H - 1, Math.Max(0, y + i)) * W + x];
      b[y * W + x] = v;
    }
    return b;
  }
  public static string Run(string path, int x0, int y0, int w, int h, int up, double sigma, double thr, double eps, double minArea, string outBase) {
    Bitmap bmp = new Bitmap(path);
    if (w <= 0) w = bmp.Width - x0; if (h <= 0) h = bmp.Height - y0;
    float[] g = Gray(bmp, x0, y0, w, h);
    bmp.Dispose();
    int W, H;
    float[] v = Upscale(g, w, h, up, out W, out H);
    v = Blur(v, W, H, sigma * up);
    // white frame so every contour closes
    for (int x = 0; x < W; x++) { v[x] = 1; v[(H - 1) * W + x] = 1; }
    for (int y = 0; y < H; y++) { v[y * W] = 1; v[y * W + W - 1] = 1; }
    int edges = W * H * 2;
    int[] next = new int[edges];
    for (int i = 0; i < edges; i++) next[i] = -1;
    float t = (float)thr;
    Func<int, int, int> HE = (x, y) => (y * W + x) * 2;
    Func<int, int, int> VE = (x, y) => (y * W + x) * 2 + 1;
    for (int y = 0; y < H - 1; y++) for (int x = 0; x < W - 1; x++) {
      float a = v[y * W + x], b = v[y * W + x + 1], c = v[(y + 1) * W + x + 1], d = v[(y + 1) * W + x];
      int cs = (a < t ? 8 : 0) | (b < t ? 4 : 0) | (c < t ? 2 : 0) | (d < t ? 1 : 0);
      if (cs == 0 || cs == 15) continue;
      int T = HE(x, y), B = HE(x, y + 1), L = VE(x, y), R = VE(x + 1, y);
      bool mid = (a + b + c + d) / 4 < t;
      switch (cs) {
        case 1: next[L] = B; break;
        case 2: next[B] = R; break;
        case 3: next[L] = R; break;
        case 4: next[R] = T; break;
        case 5: if (mid) { next[L] = T; next[R] = B; } else { next[L] = B; next[R] = T; } break;
        case 6: next[B] = T; break;
        case 7: next[L] = T; break;
        case 8: next[T] = L; break;
        case 9: next[T] = B; break;
        case 10: if (mid) { next[T] = R; next[B] = L; } else { next[T] = L; next[B] = R; } break;
        case 11: next[T] = R; break;
        case 12: next[R] = L; break;
        case 13: next[R] = B; break;
        case 14: next[B] = L; break;
      }
    }
    Func<int, double[]> Pt = (e) => {
      int idx = e / 2; int y = idx / W; int x = idx - y * W;
      if ((e & 1) == 0) { float a = v[idx], b = v[idx + 1]; double k = (t - a) / (b - a); return new double[] { x + k, y }; }
      else { float a = v[idx], b = v[idx + W]; double k = (t - a) / (b - a); return new double[] { x, y + k }; }
    };
    List<List<double[]>> loops = new List<List<double[]>>();
    bool[] seen = new bool[edges];
    for (int e = 0; e < edges; e++) {
      if (next[e] < 0 || seen[e]) continue;
      List<double[]> loop = new List<double[]>();
      int cur = e; bool closed = false;
      while (cur >= 0 && !seen[cur]) { seen[cur] = true; loop.Add(Pt(cur)); cur = next[cur]; if (cur == e) { closed = true; break; } }
      if (closed && loop.Count > 8) loops.Add(loop);
    }
    // simplify + describe
    StringBuilder js = new StringBuilder("{\"w\":" + W.ToString() + ",\"h\":" + H.ToString() + ",\"loops\":[");
    StringBuilder svg = new StringBuilder();
    StringBuilder rep = new StringBuilder();
    CultureInfo ci = CultureInfo.InvariantCulture;
    int kept = 0, pts = 0;
    for (int li = 0; li < loops.Count; li++) {
      List<double[]> l = loops[li];
      double area = 0, minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      for (int i = 0; i < l.Count; i++) {
        double[] p = l[i], q = l[(i + 1) % l.Count];
        area += p[0] * q[1] - q[0] * p[1];
        minx = Math.Min(minx, p[0]); maxx = Math.Max(maxx, p[0]); miny = Math.Min(miny, p[1]); maxy = Math.Max(maxy, p[1]);
      }
      area /= 2;
      if (Math.Abs(area) < minArea * up * up) continue;
      List<double[]> s = SimplifyClosed(l, eps);
      if (s.Count < 3) continue;
      if (kept > 0) js.Append(',');
      js.Append("{\"id\":" + kept + ",\"a\":" + area.ToString("0", ci) + ",\"b\":[" + minx.ToString("0", ci) + "," + miny.ToString("0", ci) + "," + maxx.ToString("0", ci) + "," + maxy.ToString("0", ci) + "],\"p\":[");
      svg.Append('M');
      for (int i = 0; i < s.Count; i++) {
        if (i > 0) { js.Append(','); svg.Append('L'); }
        js.Append(s[i][0].ToString("0.0", ci) + "," + s[i][1].ToString("0.0", ci));
        svg.Append(s[i][0].ToString("0.0", ci) + " " + s[i][1].ToString("0.0", ci));
      }
      svg.Append('Z');
      js.Append("]}");
      rep.AppendLine(string.Format(ci, "#{0}  area {1,10:0}  bbox [{2:0},{3:0} .. {4:0},{5:0}]  pts {6}", kept, area, minx, miny, maxx, maxy, s.Count));
      pts += s.Count; kept++;
    }
    js.Append("]}");
    File.WriteAllText(outBase + ".json", js.ToString());
    File.WriteAllText(outBase + ".svg", "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + W + " " + H + "\"><rect width=\"100%\" height=\"100%\" fill=\"#fff\"/><path fill-rule=\"evenodd\" d=\"" + svg.ToString() + "\"/></svg>");
    return "size " + W + "x" + H + "  loops " + kept + "  points " + pts + Environment.NewLine + rep.ToString();
  }
  static double DistSeg(double[] p, double[] a, double[] b) {
    double dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    if (l < 1e-9) return Math.Sqrt((p[0] - a[0]) * (p[0] - a[0]) + (p[1] - a[1]) * (p[1] - a[1]));
    double k = Math.Max(0, Math.Min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l));
    double qx = a[0] + k * dx - p[0], qy = a[1] + k * dy - p[1];
    return Math.Sqrt(qx * qx + qy * qy);
  }
  static void Rdp(List<double[]> l, int i, int j, double eps, bool[] keep) {
    if (j <= i + 1) return;
    double best = -1; int bi = -1;
    for (int k = i + 1; k < j; k++) { double d = DistSeg(l[k], l[i], l[j]); if (d > best) { best = d; bi = k; } }
    if (best > eps) { keep[bi] = true; Rdp(l, i, bi, eps, keep); Rdp(l, bi, j, eps, keep); }
  }
  static List<double[]> SimplifyClosed(List<double[]> l, double eps) {
    int n = l.Count; int far = 0; double best = -1;
    for (int i = 1; i < n; i++) { double dx = l[i][0] - l[0][0], dy = l[i][1] - l[0][1], d = dx * dx + dy * dy; if (d > best) { best = d; far = i; } }
    List<double[]> ring = new List<double[]>(l); ring.Add(l[0]);
    bool[] keep = new bool[n + 1]; keep[0] = true; keep[far] = true; keep[n] = true;
    Rdp(ring, 0, far, eps, keep); Rdp(ring, far, n, eps, keep);
    List<double[]> o = new List<double[]>();
    for (int i = 0; i < n; i++) if (keep[i]) o.Add(l[i]);
    return o;
  }
}
'@
$base = [IO.Path]::GetFullPath($Out)
$srcFull = [IO.Path]::GetFullPath($Src)
[LogoTracer]::Run($srcFull, $X, $Y, $W, $H, $Up, $Sigma, $Thr, $Eps, $MinArea, $base)
