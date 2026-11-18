/**
 * Ink-spill theme transition.
 *
 * inkTransition(apply, x, y) spreads the new theme out from (x, y) as an organic
 * ink splash with a burning ember edge, using the View Transitions API.
 *
 * Both engines share one "arrival-time" field: a float per point of the viewport,
 * lower = the ink reaches it sooner. Each frame picks a front R and shows the new
 * theme where v < R, the old theme where v > R + rim, and the ember gradient
 * (::view-transition background) in the band between.
 *
 * - Chromium/Firefox: the field is thresholded into a canvas mask every frame.
 * - WebKit (Safari, every iOS browser): it blanks snapshots when a mask image
 *   changes, so the field is traced into clip-path: path() outlines instead.
 */

const DURATION = 1500;
const FRAMES = 36; // WebKit clip-path keyframes
const MAX_FINE_CELLS = 700_000; // keeps per-frame mask work bounded on huge screens

type Field = {
  w: number;
  h: number;
  ox: number;
  oy: number;
  cell: number; // fine cell size, CSS px
  cols: number;
  rows: number;
  v: Float32Array;
  min: number;
  max: number;
  frames?: { neu: string[]; old: string[] };
};

type Job = { w: number; h: number; ox: number; oy: number; gen: Generator<void, Field> };

/* ------------------------------------------------------------------ */
/* Environment                                                         */
/* ------------------------------------------------------------------ */

let webkitCache: boolean | undefined;
function isWebKit() {
  // QA hook: <html data-ink-engine="clip"> forces the WebKit (clip-path) engine in any browser.
  if (document.documentElement.dataset.inkEngine === "clip") return true;
  if (webkitCache === undefined) {
    const ua = navigator.userAgent;
    webkitCache =
      /iPhone|iPad|iPod/.test(ua) || (/AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg/.test(ua));
  }
  return webkitCache;
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type IdleDeadlineLike = { timeRemaining: () => number };
const requestIdle: (cb: (d: IdleDeadlineLike) => void) => void = (cb) => {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(cb, { timeout: 1200 });
  } else {
    // Safari has no requestIdleCallback: give each slice ~8ms.
    setTimeout(() => {
      const end = performance.now() + 8;
      cb({ timeRemaining: () => Math.max(0, end - performance.now()) });
    }, 16);
  }
};

/* ------------------------------------------------------------------ */
/* Noise                                                               */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeFbm(seed: number) {
  const hash = (x: number, y: number) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const vnoise = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
  return (x: number, y: number, octaves: number) => {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    let f = 1;
    for (let o = 0; o < octaves; o++) {
      sum += amp * vnoise(x * f + o * 17.31, y * f + o * 9.17);
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return sum / norm;
  };
}

/* ------------------------------------------------------------------ */
/* The ink field                                                       */
/* ------------------------------------------------------------------ */

function* buildField(w: number, h: number, ox: number, oy: number): Generator<void, Field> {
  const seed = (Math.random() * 2 ** 31) | 0;
  const rand = mulberry32(seed);
  const fbm = makeFbm(seed);
  const S = Math.max(w, h);

  const reach = Math.max(
    Math.hypot(ox, oy),
    Math.hypot(w - ox, oy),
    Math.hypot(ox, h - oy),
    Math.hypot(w - ox, h - oy)
  );

  // Main spill at the handle, plus 2-3 secondary bursts that land a little later.
  const sources = [{ x: ox, y: oy, delay: 0, reach, lx: rand() * 50, ly: rand() * 50 }];
  const bursts = 2 + (rand() < 0.5 ? 1 : 0);
  for (let k = 0; k < bursts; k++) {
    sources.push({
      x: w * (0.12 + rand() * 0.76),
      y: h * (0.3 + rand() * 0.6),
      delay: 0.16 + k * 0.1 + rand() * 0.06,
      reach: reach * (0.55 + rand() * 0.3),
      lx: rand() * 50,
      ly: rand() * 50,
    });
  }

  // Coarse grid: the expensive noise is evaluated here.
  const cc = Math.max(2.5, w / 440);
  const ccols = Math.ceil(w / cc) + 1;
  const crows = Math.ceil(h / cc) + 1;
  const coarse = new Float32Array(ccols * crows);

  for (let j = 0; j < crows; j++) {
    const py = j * cc;
    const y = py / S;
    for (let i = 0; i < ccols; i++) {
      const px = i * cc;
      const x = px / S;
      // Domain-warped fBm: two low-frequency warps feed a 6-octave field (blotchy edge).
      const wx = fbm(x * 2.2 + 1.7, y * 2.2 + 9.2, 3) - 0.5;
      const wy = fbm(x * 2.2 + 8.3, y * 2.2 + 2.8, 3) - 0.5;
      const n = fbm((x + wx * 0.6) * 6, (y + wy * 0.6) * 6, 6);

      let f = Infinity;
      for (const s of sources) {
        const dx = px - s.x;
        const dy = py - s.y;
        const d = Math.hypot(dx, dy) / s.reach;
        const a = Math.atan2(dy, dx);
        const c = Math.cos(a);
        const sn = Math.sin(a);
        const lobe = fbm(c * 2.5 + s.lx, sn * 2.5 + s.ly, 3);
        const streak = fbm(c * 14 + wx * 2 + s.lx, sn * 14 + d * 1.5 + wy * 2 + s.ly, 3);
        const finger = Math.pow(Math.max(0, streak - 0.5), 1.5) * 2.6;
        const rough = Math.min(1, d * 2.5 + 0.2);
        const v =
          s.delay + d * (1 - 0.5 * Math.max(0, lobe - 0.4)) + n * 0.42 * rough - finger * 0.3 * rough;
        if (v < f) f = v;
      }
      coarse[j * ccols + i] = f;
    }
    if ((j & 7) === 7) yield;
  }

  // Fine grid: bilinear upsample.
  const cell = Math.max(1.25, Math.sqrt((w * h) / MAX_FINE_CELLS));
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const v = new Float32Array(cols * rows);
  const scale = cell / cc;
  for (let j = 0; j < rows; j++) {
    const gy = Math.min(j * scale, crows - 1.001);
    const y0 = Math.floor(gy);
    const ty = gy - y0;
    const r0 = y0 * ccols;
    const r1 = r0 + ccols;
    for (let i = 0; i < cols; i++) {
      const gx = Math.min(i * scale, ccols - 1.001);
      const x0 = Math.floor(gx);
      const tx = gx - x0;
      const top = coarse[r0 + x0] + (coarse[r0 + x0 + 1] - coarse[r0 + x0]) * tx;
      const bot = coarse[r1 + x0] + (coarse[r1 + x0 + 1] - coarse[r1 + x0]) * tx;
      v[j * cols + i] = top + (bot - top) * ty;
    }
    if ((j & 31) === 31) yield;
  }

  // Splatter: drops that land ahead of the front.
  const dropScale = S / 1440 + 0.35;
  for (let k = 0; k < 110; k++) {
    const ang = rand() * Math.PI * 2;
    const dist = reach * (0.06 + Math.pow(rand(), 0.7) * 0.75);
    const cx = ox + Math.cos(ang) * dist;
    const cy = oy + Math.sin(ang) * dist;
    const r = (3 + Math.pow(rand(), 2.5) * 24) * dropScale;
    if (cx < -r || cy < -r || cx > w + r || cy > h + r) continue;
    const dropDist = dist / reach;
    const i0 = Math.max(0, Math.floor((cx - r) / cell));
    const i1 = Math.min(cols - 1, Math.ceil((cx + r) / cell));
    const j0 = Math.max(0, Math.floor((cy - r) / cell));
    const j1 = Math.min(rows - 1, Math.ceil((cy + r) / cell));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const q = Math.hypot(i * cell - cx, j * cell - cy);
        if (q >= r) continue;
        const val = dropDist - 0.16 + (q / r) * 0.05;
        const idx = j * cols + i;
        if (val < v[idx]) v[idx] = val;
      }
    }
  }

  let min = Infinity;
  let max = -Infinity;
  for (let k = 0; k < v.length; k++) {
    const x = v[k];
    if (x < min) min = x;
    if (x > max) max = x;
  }

  return { w, h, ox, oy, cell, cols, rows, v, min, max };
}

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

const ease = (t: number) => 0.55 * t + 0.45 * (1 - Math.pow(1 - t, 2.4));

function front(f: Field, t: number) {
  const range = f.max - f.min;
  const soft = (range / Math.max(f.w, f.h)) * 1.1;
  const rim = t >= 1 ? 0 : range * 0.022 * (0.5 + 0.5 * Math.sin(Math.min(t * 1.2, 1) * Math.PI));
  const R = f.min - soft - rim + (range + 3 * soft + 2 * rim) * ease(t);
  return { R, rim, soft };
}

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/* ------------------------------------------------------------------ */
/* Chromium: canvas mask                                               */
/* ------------------------------------------------------------------ */

let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;
let maskImage: ImageData | null = null;

function drawMask(f: Field, t: number) {
  if (!maskCanvas || maskCanvas.width !== f.cols || maskCanvas.height !== f.rows) {
    maskCanvas = document.createElement("canvas");
    maskCanvas.width = f.cols;
    maskCanvas.height = f.rows;
    maskCtx = maskCanvas.getContext("2d");
    maskImage = maskCtx!.createImageData(f.cols, f.rows);
  }
  const { R, rim, soft } = front(f, t);
  const px = new Uint32Array(maskImage!.data.buffer);
  const v = f.v;
  const inv = 1 / soft;
  const oldAt = R + rim;
  for (let k = 0; k < v.length; k++) {
    const x = v[k];
    const aNew = smooth((R - x) * inv);
    const aOld = smooth((x - oldAt) * inv);
    const alpha = aNew > aOld ? aNew : aOld;
    if (alpha === 0) {
      px[k] = 0;
      continue;
    }
    const lum = Math.round((aNew / alpha) * 255);
    // little-endian RGBA
    px[k] = ((Math.round(alpha * 255) << 24) | (lum << 16) | (lum << 8) | lum) >>> 0;
  }
  maskCtx!.putImageData(maskImage!, 0, 0);
  document.documentElement.style.setProperty("--ink", `url("${maskCanvas.toDataURL()}")`);
}

/* ------------------------------------------------------------------ */
/* WebKit: marching squares to clip-path: path()                       */
/* ------------------------------------------------------------------ */

type Samples = { G: Float64Array; xs: number[]; ys: number[]; nx: number; ny: number };

function sampleGrid(f: Field): Samples {
  const step = 5;
  const realX: number[] = [];
  for (let i = 0; i < f.cols; i += step) realX.push(i);
  if (realX[realX.length - 1] !== f.cols - 1) realX.push(f.cols - 1);
  const realY: number[] = [];
  for (let j = 0; j < f.rows; j += step) realY.push(j);
  if (realY[realY.length - 1] !== f.rows - 1) realY.push(f.rows - 1);

  // Outer ring: "outside" (never inked) far off-screen so every loop closes.
  // Inner pad ring: a copy of the edge, far off-screen, so loops that touch the
  // border also cover the area under iOS toolbars.
  const OUT = 1e9;
  const xs = [-f.w - 1, -f.w, ...realX.map((i) => i * f.cell), 2 * f.w, 2 * f.w + 1];
  const ys = [-f.h - 1, -f.h, ...realY.map((j) => j * f.cell), 2 * f.h, 2 * f.h + 1];
  const nx = xs.length;
  const ny = ys.length;
  const G = new Float64Array(nx * ny);
  for (let gj = 0; gj < ny; gj++) {
    for (let gi = 0; gi < nx; gi++) {
      if (gi === 0 || gj === 0 || gi === nx - 1 || gj === ny - 1) {
        G[gj * nx + gi] = OUT;
        continue;
      }
      const ri = Math.min(Math.max(gi - 2, 0), realX.length - 1);
      const rj = Math.min(Math.max(gj - 2, 0), realY.length - 1);
      G[gj * nx + gi] = f.v[realY[rj] * f.cols + realX[ri]];
    }
  }
  return { G, xs, ys, nx, ny };
}

function contour(s: Samples, level: number): string {
  const { G, xs, ys, nx, ny } = s;
  const adj = new Map<number, number[]>();
  const link = (a: number, b: number) => {
    const la = adj.get(a);
    if (la) la.push(b);
    else adj.set(a, [b]);
    const lb = adj.get(b);
    if (lb) lb.push(a);
    else adj.set(b, [a]);
  };

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const tl = G[j * nx + i];
      const tr = G[j * nx + i + 1];
      const br = G[(j + 1) * nx + i + 1];
      const bl = G[(j + 1) * nx + i];
      const idx = (tl < level ? 8 : 0) | (tr < level ? 4 : 0) | (br < level ? 2 : 0) | (bl < level ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const top = 2 * (j * nx + i);
      const bottom = 2 * ((j + 1) * nx + i);
      const left = 2 * (j * nx + i) + 1;
      const right = 2 * (j * nx + i + 1) + 1;
      switch (idx) {
        case 1: case 14: link(left, bottom); break;
        case 2: case 13: link(bottom, right); break;
        case 3: case 12: link(left, right); break;
        case 4: case 11: link(top, right); break;
        case 6: case 9: link(top, bottom); break;
        case 7: case 8: link(left, top); break;
        case 5: {
          // tr + bl inside: the centre average decides whether they connect
          const centre = (tl + tr + br + bl) / 4 < level;
          if (centre) { link(left, top); link(bottom, right); }
          else { link(top, right); link(left, bottom); }
          break;
        }
        case 10: {
          // tl + br inside
          const centre = (tl + tr + br + bl) / 4 < level;
          if (centre) { link(top, right); link(left, bottom); }
          else { link(left, top); link(bottom, right); }
          break;
        }
      }
    }
  }

  const point = (id: number) => {
    const node = id >> 1;
    const i = node % nx;
    const j = (node - i) / nx;
    const v0 = G[node];
    if ((id & 1) === 0) {
      const v1 = G[node + 1];
      const t = (level - v0) / (v1 - v0);
      return [Math.round(xs[i] + t * (xs[i + 1] - xs[i])), Math.round(ys[j])];
    }
    const v1 = G[node + nx];
    const t = (level - v0) / (v1 - v0);
    return [Math.round(xs[i]), Math.round(ys[j] + t * (ys[j + 1] - ys[j]))];
  };

  const visited = new Set<number>();
  let d = "";
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    let prev = -1;
    let cur: number | undefined = start;
    let loop = "";
    let lx = NaN;
    let ly = NaN;
    while (cur !== undefined && !visited.has(cur)) {
      visited.add(cur);
      const [x, y] = point(cur);
      if (x !== lx || y !== ly) {
        loop += (loop ? "L" : "M") + x + " " + y;
        lx = x;
        ly = y;
      }
      const nb: number[] = adj.get(cur)!;
      const next: number | undefined = nb[0] !== prev ? nb[0] : nb[1];
      prev = cur;
      cur = next;
    }
    if (loop) d += loop + "Z";
  }
  return d;
}

function* buildFrames(f: Field): Generator<void, void> {
  const s = sampleGrid(f);
  yield;
  const W = f.w;
  const H = f.h;
  const outer = `M${-3 * W} ${-3 * H}H${4 * W}V${4 * H}H${-3 * W}Z`;
  const neu: string[] = [];
  const old: string[] = [];
  for (let k = 0; k < FRAMES; k++) {
    const { R, rim } = front(f, k / (FRAMES - 1));
    neu.push(contour(s, R) || "M0 0Z");
    old.push(outer + contour(s, R + rim));
    yield;
  }
  f.frames = { neu, old };
}

/* ------------------------------------------------------------------ */
/* Precompute + cache                                                  */
/* ------------------------------------------------------------------ */

let cache: Field | null = null;
let job: Job | null = null;

function* fullJob(w: number, h: number, ox: number, oy: number): Generator<void, Field> {
  const f = yield* buildField(w, h, ox, oy);
  if (isWebKit()) yield* buildFrames(f);
  return f;
}

const fits = (o: { w: number; h: number; ox: number; oy: number }, w: number, h: number, x: number, y: number) =>
  o.w === w && o.h === h && Math.abs(o.ox - x) < 120 && Math.abs(o.oy - y) < 120;

function pump() {
  requestIdle((deadline) => {
    if (!job) return;
    while (deadline.timeRemaining() > 2) {
      const r = job.gen.next();
      if (r.done) {
        cache = r.value;
        job = null;
        return;
      }
    }
    pump();
  });
}

/** Build the field ahead of time (in idle slices) so a pull starts instantly. */
export function prepareInk(x: number, y: number) {
  if (typeof window === "undefined" || typeof document.startViewTransition !== "function") return;
  if (prefersReducedMotion()) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (cache && fits(cache, w, h, x, y)) return;
  if (job && fits(job, w, h, x, y)) return;
  const idle = !job;
  job = { w, h, ox: x, oy: y, gen: fullJob(w, h, x, y) };
  if (idle) pump();
}

function takeField(w: number, h: number, x: number, y: number): Field {
  if (cache && fits(cache, w, h, x, y)) {
    const f = cache;
    cache = null;
    return f;
  }
  // Not ready yet: finish the pending job (or build one) synchronously.
  const gen = job && fits(job, w, h, x, y) ? job.gen : fullJob(w, h, x, y);
  job = null;
  let r = gen.next();
  while (!r.done) r = gen.next();
  return r.value;
}

/* ------------------------------------------------------------------ */
/* The transition                                                      */
/* ------------------------------------------------------------------ */

let current: ViewTransition | null = null;

export function inkTransition(apply: () => void, x: number, y: number) {
  if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
    apply();
    return;
  }
  if (current) {
    // A second pull mid-splash: finish the first one now and switch instantly.
    current.skipTransition();
    apply();
    return;
  }

  const root = document.documentElement;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const field = takeField(w, h, x, y);
  const webkit = isWebKit() && !!field.frames;

  root.style.setProperty("--ink-x", `${Math.round(x)}px`);
  root.style.setProperty("--ink-y", `${Math.round(y)}px`);
  if (webkit) {
    root.classList.add("ink-clip");
  } else {
    root.classList.add("ink-switch");
    drawMask(field, 0);
  }

  const vt = document.startViewTransition(apply);
  current = vt;
  let raf = 0;
  const safety = window.setTimeout(() => vt.skipTransition(), DURATION + 1500);

  vt.ready
    .then(() => {
      const started = performance.now();
      // Thump: the page reacts as the ink lands.
      root.animate(
        { transform: ["scale(1)", "scale(1.022) rotate(-0.25deg)", "scale(0.996)", "scale(1)"] },
        { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)", pseudoElement: "::view-transition-image-pair(root)" }
      );

      if (webkit) {
        const opts: KeyframeAnimationOptions = { duration: DURATION, easing: "linear", fill: "forwards" };
        root.animate(
          { clipPath: field.frames!.neu.map((p) => `path(evenodd, "${p}")`) },
          { ...opts, pseudoElement: "::view-transition-new(root)" }
        );
        root.animate(
          { clipPath: field.frames!.old.map((p) => `path(evenodd, "${p}")`) },
          { ...opts, pseudoElement: "::view-transition-old(root)" }
        );
        return;
      }

      // Keeps the transition alive for DURATION while the mask is redrawn.
      root.animate({ opacity: [1, 1] }, { duration: DURATION, pseudoElement: "::view-transition-new(root)" });
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / DURATION);
        drawMask(field, t);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })
    .catch(() => {
      /* skipped or aborted: finished still fires and cleans up */
    });

  vt.finished.finally(() => {
    window.clearTimeout(safety);
    cancelAnimationFrame(raf);
    root.classList.remove("ink-switch", "ink-clip");
    root.style.removeProperty("--ink");
    current = null;
    // A fresh, different splash for next time.
    prepareInk(x, y);
  });
}
