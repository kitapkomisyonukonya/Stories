/* ==========================================================================
   Stories — promo film engine
   A deterministic timeline: window.__seek(t) renders the exact frame for time t
   (seconds). Nothing depends on wall-clock time, so every frame is reproducible
   and can be captured one by one by scripts/render.py.
   ========================================================================== */
(() => {
'use strict';

const W = 1920, H = 1080, CX = 960, CY = 540;
let DURATION = 89.333;   // read from timeline.json at start-up
const OLD_END = 39.65; // end of the finale in the finale's own (original) clock

/* ---------- math & easing ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t;
  const sy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; const d = dx(t); if (Math.abs(e) < 1e-6 || !d) break; t -= e / d; }
    return sy(clamp(t));
  };
}
const E = {
  out: bezier(0.22, 1, 0.36, 1),        // the app's own motion curve (menu / cards)
  outSoft: bezier(0.16, 1, 0.3, 1),
  inOut: bezier(0.65, 0, 0.35, 1),
  cam: bezier(0.45, 0, 0.15, 1),          // camera moves: slow in, long settle
  in: bezier(0.55, 0, 0.9, 0.4),
  inStrong: bezier(0.7, 0, 0.95, 0.3),
  lin: t => t,
  back: t => { const c1 = 1.55, c3 = c1 + 1; const u = t - 1; return 1 + c3 * u * u * u + c1 * u * u; },
  expo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};
/** normalized, eased progress of t inside [a,b] */
const P = (t, a, b, e = E.out) => e(clamp((t - a) / (b - a)));
/** keyframes: [[time, value, easeInto?], ...] */
function K(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const k0 = keys[i - 1], k1 = keys[i];
    if (t <= k1[0]) {
      const e = k1[2] || E.inOut;
      const p = e((t - k0[0]) / (k1[0] - k0[0] || 1));
      if (Array.isArray(k0[1])) return k0[1].map((v, j) => lerp(v, k1[1][j], p));
      return lerp(k0[1], k1[1], p);
    }
  }
  return keys[keys.length - 1][1];
}
/* seeded noise */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const smoothNoise = (x, seed = 0) => { // cheap 1D value noise for hand-held drift
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const h = n => { const s = Math.sin((n + seed * 101.3) * 127.1) * 43758.5453; return s - Math.floor(s); };
  return lerp(h(i), h(i + 1), u) * 2 - 1;
};

/* ---------- DOM helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function el(tag, cls, html, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
function tf(e, o) {
  const s = o.s == null ? 1 : o.s;
  e.style.transform =
    `translate3d(${(o.x || 0).toFixed(2)}px,${(o.y || 0).toFixed(2)}px,${(o.z || 0).toFixed(2)}px)` +
    (o.rx ? ` rotateX(${o.rx.toFixed(3)}deg)` : '') + (o.ry ? ` rotateY(${o.ry.toFixed(3)}deg)` : '') + (o.rz ? ` rotateZ(${o.rz.toFixed(3)}deg)` : '') +
    ` scale(${o.sx != null ? o.sx.toFixed(4) : s.toFixed(4)},${o.sy != null ? o.sy.toFixed(4) : s.toFixed(4)})`;
}
const op = (e, v) => { e.style.opacity = clamp(v).toFixed(4); };
const blur = (e, px, extra = '') => { e.style.filter = (px > 0.05 ? `blur(${px.toFixed(2)}px) ` : '') + extra; };
const show = (e, on) => { e.style.display = on ? '' : 'none'; };
/** camera-style transform: point (px,py) of a 1920×1080 plane lands at screen (sx,sy) */
function camTf(e, c) {
  e.style.transform = `translate3d(${(c.sx ?? CX).toFixed(2)}px,${(c.sy ?? CY).toFixed(2)}px,${(c.z || 0).toFixed(2)}px) rotateX(${(c.rx || 0).toFixed(3)}deg) rotateY(${(c.ry || 0).toFixed(3)}deg) rotateZ(${(c.rz || 0).toFixed(3)}deg) scale(${c.s.toFixed(4)}) translate(${(-c.px).toFixed(2)}px,${(-c.py).toFixed(2)}px)`;
}
/** position of an element inside a plane (unaffected by transforms) */
function planePos(node, root) {
  let x = 0, y = 0, n = node;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y, w: node.offsetWidth, h: node.offsetHeight, cx: x + node.offsetWidth / 2, cy: y + node.offsetHeight / 2 };
}
/** wrap every word of an element's text into <span class="w"> for per-word motion */
function splitWords(root) {
  const out = [];
  const walk = node => {
    Array.from(node.childNodes).forEach(ch => {
      if (ch.nodeType === 3) {
        const parts = ch.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); out.push(s);
        });
        node.replaceChild(frag, ch);
      } else if (ch.nodeType === 1) walk(ch);
    });
  };
  walk(root);
  return out;
}
/** wrap inner of kinetic lines so they can rise from a mask */
function maskLines(root) {
  return Array.from(root.querySelectorAll('.line, .eyebrow')).map(l => { l.innerHTML = `<span>${l.innerHTML}</span>`; return l.firstChild; });
}
function riseIn(span, t, t0, dur = 0.7, dist = 110) {
  const p = P(t, t0, t0 + dur, E.outSoft);
  span.style.transform = `translate3d(0,${((1 - p) * dist).toFixed(2)}%,0)`;
  return p;
}

/** the brand arch outline (from the library logo) as an absolute pixel path */
function archD(x, y, w, h, closed = true) {
  const X = u => (x + u * w).toFixed(2), Y = v => (y + v * h).toFixed(2);
  const d = `M${X(0)},${Y(1)} L${X(0)},${Y(0.4)} C${X(0)},${Y(0.29)} ${X(0.07)},${Y(0.235)} ${X(0.19)},${Y(0.195)} C${X(0.32)},${Y(0.15)} ${X(0.43)},${Y(0.095)} ${X(0.5)},${Y(0)} C${X(0.57)},${Y(0.095)} ${X(0.68)},${Y(0.15)} ${X(0.81)},${Y(0.195)} C${X(0.93)},${Y(0.235)} ${X(1)},${Y(0.29)} ${X(1)},${Y(0.4)} L${X(1)},${Y(1)}`;
  return closed ? d + ' Z' : d;
}

/** the app's own icons (icons.js, Phosphor regular, as in src/components/ui/icons.tsx) */
const ico = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 256 256" fill="currentColor">${(window.ICONS || {})[name] || ''}</svg>`;
document.querySelectorAll('path[data-ico]').forEach(p => { const svg = p.parentNode; svg.setAttribute('fill', 'currentColor'); svg.innerHTML = (window.ICONS || {})[p.dataset.ico] || ''; });

/* ---------- global overlays ---------- */
const DPR = window.devicePixelRatio || 1;
const dustCv = $('#dust'); dustCv.width = W * DPR; dustCv.height = H * DPR; dustCv.style.width = W + 'px'; dustCv.style.height = H + 'px';
const dust = dustCv.getContext('2d'); dust.scale(DPR, DPR);   // particles drawn at device resolution (sharp at 4K)
const grainCv = $('#grain'), grain = grainCv.getContext('2d');
const grainImg = grain.createImageData(1920, 1080);
const DUST = (() => { const r = rng(42); return Array.from({ length: 140 }, () => ({ x: r(), y: r(), z: r(), s: r(), ph: r() * 6.28 })); })();
function drawDust(t, amt, drift = 0, tint = [255, 228, 170]) {
  dust.clearRect(0, 0, W, H);
  if (amt <= 0.001) return;
  for (const p of DUST) {
    const depth = 0.3 + p.z * 0.7;
    const x = ((p.x * W + t * (12 + 30 * depth) + drift * depth * 400) % (W + 80) + W + 80) % (W + 80) - 40;
    const y = ((p.y * H - t * (8 + 18 * depth) + Math.sin(t * 0.7 + p.ph) * 14) % (H + 80) + H + 80) % (H + 80) - 40;
    const r = 0.6 + depth * 2.6 * (0.6 + p.s);
    const a = amt * (0.25 + 0.6 * p.s) * (0.6 + 0.4 * Math.sin(t * 2 + p.ph));
    const g = dust.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]},${a.toFixed(3)})`);
    g.addColorStop(1, `rgba(${tint[0]},${tint[1]},${tint[2]},0)`);
    dust.fillStyle = g; dust.beginPath(); dust.arc(x, y, r * 3, 0, 6.283); dust.fill();
  }
}
function drawGrain(frameIndex) {
  const r = rng(1000 + frameIndex), d = grainImg.data;
  for (let i = 0; i < d.length; i += 4) { const v = (r() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  grain.putImageData(grainImg, 0, 0);
}

/* ======================================================================
   SCENES
   ====================================================================== */
const scenes = [];
/* A scene runs on its own clock. `warp` = [clockA, clockB, filmA, filmB] maps film time onto it,
   so a scene choreographed once can be re-timed (slowed down / moved) without touching its keys. */
/* A scene runs on its own clock. timeline.json → warps[id] = [[clock, film], ...] maps film time onto it
   piecewise-linearly, so holds (where a feature is read) can be lengthened without slowing transitions. */
const scene = (id, a, b, update) => scenes.push({ id, el: document.getElementById(id), a, b, update });
let WARPS = {};
/** film seconds between scene clock c0 and scene clock c (through the warp) */
function filmSince(id, c0, c) { return clockFilm(id, c) - clockFilm(id, c0); }
function clockFilm(id, c) {
  const k = WARPS[id];
  if (!k) return c;
  let i = 1;
  while (i < k.length - 1 && c > k[i][0]) i++;
  const [c0, f0] = k[i - 1], [c1, f1] = k[i];
  return f0 + (c - c0) * (f1 - f0) / (c1 - c0);
}
function sceneClock(id, t) {
  const k = WARPS[id];
  if (!k) return t;
  let i = 1;
  while (i < k.length - 1 && t > k[i][1]) i++;
  const [c0, f0] = k[i - 1], [c1, f1] = k[i];
  return c0 + (t - f0) * (c1 - c0) / (f1 - f0);
}

/* ---------------------- S0 · CIVILIZATION OPENER ----------------------
   "Dil öğrenirken tarihini ve medeniyetini de keşfet."
   A slow camera journey through arch-framed panels — prophets' stories, Mecca,
   Jerusalem, Bukhara, Kashgari, Yasawi, Yunus Emre, Istanbul — which then settle
   into one constellation behind the message and collapse into the brand star. */
{
  const S = $('#s0'), world = $('#s0world');
  const STOPS = [
    { name: 'Peygamberlerin Hikâyeleri', sub: 'Hz. Âdem · Hz. İbrahim · Hz. Musa', imgs: ['adam_b1_05', 'abraham_b1_03', 'moses_a2_15'] },
    { name: 'Mekke', sub: 'Kâbe’nin şehri', imgs: ['civ/mekke|mecca_b1_10'] },
    { name: 'Kudüs', sub: 'Mescid-i Aksâ’nın şehri', imgs: ['civ/kudus|designed/kudus'] },
    { name: 'Buhara', sub: 'İpek Yolu’nun ilim şehri', imgs: ['civ/buhara|designed/buhara'] },
    { name: 'Kaşgarlı Mahmud', sub: 'Dîvânu Lugâti’t-Türk', imgs: ['civ/kasgarli|designed/kasgarli'] },
    { name: 'Ahmed Yesevi', sub: 'Pîr-i Türkistan', imgs: ['civ/yesevi|designed/yesevi'] },
    { name: 'Yunus Emre', sub: 'Anadolu’nun gönül eri', imgs: ['yunusEmre_b1_07'] },
    { name: 'İstanbul', sub: 'İki kıtanın buluştuğu şehir', imgs: ['civ/istanbul|designed/istanbul'] },
  ];
  const GAPZ = 1500, FOCUS = 420, T0 = 1.7, STEP = 1.7, PX = 420;
  const frame = w => `<svg class="civ-frame" viewBox="0 0 588 728" preserveAspectRatio="none"><path d="${archD(14, 14, 560, 700, false)}" fill="none" stroke="url(#goldStroke)" stroke-width="2"/><path d="${archD(4, 4, 580, 720, false)}" fill="none" stroke="rgba(243,213,138,.35)" stroke-width="1"/></svg>`;
  const panels = [];
  STOPS.forEach((st, i) => {
    const side = i % 2 ? 1 : -1;               // panel right (+1) or left (-1) of the path
    st.imgs.forEach((im, k) => {
      // 'civ/x|fallback': supplied artwork in assets/img/civ/ wins; otherwise the fallback is used (resolved in ready())
      const [want, alt] = im.split('|');
      const p = el('div', 'civ', `<div class="civ-img"><img src="assets/img/${alt || want}.jpg"${alt ? ` data-want="assets/img/${want}.jpg"` : ''}></div>${frame()}`, world);
      const focus = { 'civ/mekke': '57% 60%', 'civ/kudus': '59% 45%', 'civ/istanbul': '72% 50%', 'civ/buhara': '47% 40%', 'civ/kasgarli': '42% 50%', 'civ/yesevi': '40% 45%' }[want];
      if (focus) p.querySelector('img').dataset.focus = focus;
      const fan = st.imgs.length > 1 ? (k - 1) : 0;
      panels.push({ el: p, img: p.querySelector('img'), i, k, side,
        x: side * PX + fan * 250 * -side, y: -30 + Math.abs(fan) * 40, z: -(i * GAPZ + FOCUS) - Math.abs(fan) * 380, s: k ? 0.86 : 1, rz: fan * 4 * -side });
    });
    const lab = el('div', 'civ-label' + (side < 0 ? ' right' : ''), `<div class="ix">${String(i + 1).padStart(2, '0')} / 08</div><div class="nm"><span>${st.name}</span></div><div class="sb"><span>${st.sub}</span></div>`, S);
    lab.setAttribute('lang', 'tr');
    if (st.name.length > 14) lab.querySelector('.nm').style.fontSize = '84px';
    st.label = lab; st.side = side; st.nm = lab.querySelector('.nm > span'); st.sb = lab.querySelector('.sb > span');
  });
  const msg = $('#s0msg'), l1 = msg.querySelector('.l1'), l2 = msg.querySelector('.l2');
  const l1s = l1.firstChild, l2s = l2.firstChild;
  const path = $('#s0path'), spark = $('#s0spark');
  const station = t => (t - T0) / STEP;                         // 0 at the first stop, 7 at İstanbul
  const camZ = t => {
    if (t < T0) return -GAPZ * 0.5 * (1 - E.outSoft(clamp(t / T0)));
    const s = Math.min(station(t), 7.6);
    return GAPZ * (s - 0.6 * Math.sin(2 * Math.PI * s) / (2 * Math.PI));   // eases (never stops) at every station
  };
  const END = T0 + 7.6 * STEP - 0.07;                          // gallery → constellation (14.55)
  const zEnd = camZ(END);
  const ARC = panels.map((p, j) => {
    const n = panels.length, u = j / (n - 1) - 0.5;
    return { x: u * 2500, y: 250 + u * u * 420, z: -(zEnd + 1100) - Math.abs(u) * 420 };
  });
  const JS = 0.84, JY = 90;                                     // journey: panel scale and drop below the sentence
  let lw = null;

  scene('s0', 0, END + 4.35, t => {
    if (!lw) lw = STOPS.map(st => st.label.offsetWidth);
    const cz = t < END ? camZ(t) : zEnd + (t - END) * 90;
    const settle = P(t, END, END + 1.5, E.cam);
    const out = P(t, END + 3.27, END + 4.12, bezier(0.7, 0, 0.9, 0.4));
    const sway = smoothNoise(t * 0.35, 71) * 1.2;
    tf(world, { x: CX, y: CY, z: cz, rz: sway * (1 - settle), ry: smoothNoise(t * 0.3, 72) * 1.5 });
    const anchors = [];
    panels.forEach((p, j) => {
      const a = ARC[j];
      const x = lerp(p.x, a.x, settle), y = lerp(p.y, a.y, settle), z = lerp(p.z, a.z, settle);
      const rel = cz + z;                                    // 0 = at the lens, negative = ahead
      const vis = rel < 900;
      show(p.el, vis); if (!vis) return;
      const sc = lerp(p.s * JS, 0.72, settle) * (1 - out * 0.9);   // smaller on the journey so the sentence above has room
      tf(p.el, { x: x * (1 - out) - 280, y: (y + JY * (1 - settle)) * (1 - out) - 350, z: z, s: sc, rz: lerp(p.rz, 0, settle), ry: lerp(p.side * -14, 0, settle) });
      const fadeFar = clamp((rel + 5200) / 1800), fadeNear = clamp((900 - rel) / 500);
      const queued = lerp(lerp(0.28, 1, clamp((rel + 2100) / 900)), 1, settle);   // upcoming stops stay dim until they take focus
      op(p.el, fadeFar * fadeNear * queued * lerp(1, 0.55, settle) * (1 - out));
      blur(p.el, Math.max(0, (-rel - 3300) / 700) + Math.max(0, (rel - 250) / 90) + settle * 1.6);
      p.img.style.transform = `translate3d(${(smoothNoise(t * 0.4, j) * 12 + (x / 2300) * 20).toFixed(1)}px,${(-rel * 0.004).toFixed(1)}px,0) scale(1.02)`;
      if (p.k === 0 && settle < 0.5) { const r = p.el.getBoundingClientRect(); if (rel > -5200 && rel < 300) anchors.push([r.left + r.width / 2, r.bottom - r.height * 0.02, p.i]); }
    });
    /* names travel with their panels, then yield to the message */
    STOPS.forEach((st, i) => {
      const s = station(t);
      const vin = P(s, i - 0.36, i - 0.16, E.outSoft), vout = P(s, i + 0.4, i + 0.56, E.in);
      // screen-space type, opposite the panel it names
      const drift = (s - i) * -40;
      if (st.side > 0) { st.label.style.left = '150px'; st.label.style.right = 'auto'; }
      else { st.label.style.right = '150px'; st.label.style.left = 'auto'; }
      st.label.style.top = '430px';
      tf(st.label, { x: drift * st.side * -1, y: 0 });
      st.nm.style.transform = `translate3d(0,${((1 - vin) * 110).toFixed(1)}%,0)`;
      st.sb.style.transform = `translate3d(0,${((1 - P(s, i - 0.3, i - 0.08, E.outSoft)) * 120).toFixed(1)}%,0)`;
      op(st.label, (t < END ? 1 : 0) * clamp(vin * 1.5) * (1 - vout));
      show(st.label, vin > 0 && vout < 1);
      blur(st.label, vout * 10, 'drop-shadow(0 8px 26px rgba(0,0,0,.65))');
    });
    /* the route that threads the stops */
    anchors.sort((a, b) => a[2] - b[2]);
    let d = '';
    anchors.forEach(([x, y], k) => {
      if (!k) { d = `M${x.toFixed(1)},${y.toFixed(1)}`; return; }
      const [px, py] = anchors[k - 1];
      d += ` C${((px + x) / 2).toFixed(1)},${(py + 60).toFixed(1)} ${((px + x) / 2).toFixed(1)},${(y + 60).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    });
    path.setAttribute('d', d);
    path.style.strokeDashoffset = (-t * 40).toFixed(1);
    op($('#s0thread'), P(t, 1.8, 2.6, E.lin) * (1 - settle));
    /* message: the whole sentence opens the film and stays above the journey, then moves to the centre */
    const toC = P(t, END + 0.1, END + 1.0, E.cam);
    l1.style.top = lerp(52, 300, toC).toFixed(1) + 'px';
    l1.style.fontSize = lerp(46, 54, toC).toFixed(1) + 'px';
    l1s.style.transform = `translate3d(0,${((1 - P(t, 0.25, 0.95, E.outSoft)) * 110).toFixed(1)}%,0)`;
    l2.style.top = lerp(112, 370, toC).toFixed(1) + 'px';
    l2.style.fontSize = lerp(74, 96, toC).toFixed(1) + 'px';
    l2s.style.transform = `translate3d(0,${((1 - P(t, 0.5, 1.2, E.outSoft)) * 110).toFixed(1)}%,0)`;
    op(msg, 1 - out); blur(msg, out * 12, 'drop-shadow(0 12px 34px rgba(0,0,0,.7))');
    /* collapse into the brand star (S1 picks it up) */
    const sp = P(t, END + 3.32, END + 4.07, E.inOut);
    tf(spark, { s: 0.2 + sp * 0.5 }); op(spark, Math.sin(Math.PI * clamp((t - END - 3.32) / 1.0)) * 0.9);
    drawDust(t, 0.3 + 0.25 * settle, cz / 2500);
  });
}

/* ------------------------------ S1 · HOOK ------------------------------ */
{
  const world = $('#s1world');
  const CARDS = [
    ['moses_a2_15', -610, -150, 900, 430, 560, -6],
    ['abraham_b1_03', 560, 170, 1500, 440, 570, 5],
    ['mecca_b1_06', -520, 230, 2100, 420, 540, 4],
    ['yunusEmre_b1_07', 590, -190, 2700, 430, 560, -5],
    ['abraham_a2_09', -600, -60, 3300, 420, 540, -3],
    ['mecca_b2_12', 540, 120, 3850, 400, 520, 6],
    ['yunusEmre_b2_08', -470, 210, 4400, 400, 520, 3],
    ['moses_a2_03', 480, -230, 4950, 380, 490, -4],
  ].map(([img, x, y, z, w, h, rz]) => {
    const c = el('div', 'card3d', `<img src="assets/img/${img}.jpg"><div class="shade"></div>`, world);
    c.style.width = w + 'px'; c.style.height = h + 'px';
    return { c, x, y, z, w, h, rz };
  });
  const FINAL_Z = 6000;
  // destination: an arch-shaped window (the logo's arch) glowing with the first chapter's light
  const FW = 2600, FH = 2400;
  const fin = el('div', 'fin-wrap', `<div class="fin-glow"></div><div class="fin-arch"><img src="assets/img/adam_b1_01.jpg"></div>`, world);
  fin.style.width = FW + 'px'; fin.style.height = FH + 'px';
  window.__FINAL_W = FW;

  const words = [['Oku', 1.18, -330, -40], ['Dinle', 1.78, 300, 60], ['Anla', 2.34, 0, 0]].map(([txt, t0, x, y]) => {
    const w = el('div', 'word3d', `<span class="m"><span>${txt}<span class="dot">.</span></span></span>`, $('#s1'));
    return { w, inner: w.querySelector('.m > span'), t0, x, y };
  });
  const archPath = $('#s1archPath'), star = $('#s1star'), persp = $('#s1persp');
  const archPath2 = archPath.cloneNode(); archPath.parentNode.appendChild(archPath2);
  const AR = { x: 760, y: 300, w: 400, h: 560 };

  scene('s1', 0, 3.9, t => {
    /* star ignition */
    const ign = P(t, 0.12, 0.7, E.out);
    const flare = Math.exp(-Math.pow((t - 0.95) / 0.12, 2));
    const starOut = P(t, 0.95, 1.35, E.in);
    tf(star, { x: 0, y: lerp(40, -70, P(t, 0.1, 1.0, E.cam)) + starOut * -30, s: (0.15 + 0.85 * ign) * (1 + flare * 0.6) * (1 + starOut * 3), rz: t * 18 });
    op(star, ign * (1 - starOut));

    /* the arch draws itself, then becomes the window we fly through */
    const draw = P(t, 0.3, 1.15, E.inOut);
    const open = P(t, 1.0, 2.05, bezier(0.6, 0, 0.8, 0.6));
    const k = 1 + open * 7.5;
    const ax = CX - (AR.w * k) / 2, ay = 580 - (580 - AR.y) * k, aw = AR.w * k, ah = AR.h * k + 400 * open;
    // two halves, drawn from each base up to the apex
    const full = archD(ax, ay, aw, ah, false);
    const X = u => (ax + u * aw).toFixed(2), Y = v => (ay + v * ah).toFixed(2);
    archPath.setAttribute('d', `M${X(0)},${Y(1)} L${X(0)},${Y(0.4)} C${X(0)},${Y(0.29)} ${X(0.07)},${Y(0.235)} ${X(0.19)},${Y(0.195)} C${X(0.32)},${Y(0.15)} ${X(0.43)},${Y(0.095)} ${X(0.5)},${Y(0)}`);
    archPath2.setAttribute('d', `M${X(1)},${Y(1)} L${X(1)},${Y(0.4)} C${X(1)},${Y(0.29)} ${X(0.93)},${Y(0.235)} ${X(0.81)},${Y(0.195)} C${X(0.68)},${Y(0.15)} ${X(0.57)},${Y(0.095)} ${X(0.5)},${Y(0)}`);
    const hl = archPath.getTotalLength();
    [archPath, archPath2].forEach(pth => { pth.style.strokeDasharray = `${(hl * draw).toFixed(1)} ${(hl + 10).toFixed(1)}`; });
    op($('#s1arch'), 1 - P(t, 1.5, 2.1, E.lin));
    $('#s1arch').style.strokeWidth = 2.4 + open * 4;

    persp.style.clipPath = `path('${archD(ax, ay, aw, ah)}')`;
    op(persp, P(t, 0.8, 1.1, E.lin));

    /* camera dolly through the library */
    const camZ = K(t, [[0.9, 0], [3.45, FINAL_Z, bezier(0.5, 0.0, 0.4, 1)]]);
    const sway = smoothNoise(t * 0.9, 3) * 1.4;
    for (const o of CARDS) {
      const rel = camZ - o.z; // >0 : card is closer than its rest depth
      const vis = rel < 1350;
      show(o.c, vis);
      if (!vis) continue;
      tf(o.c, { x: CX - o.w / 2 + o.x, y: CY - o.h / 2 + o.y, z: rel, rz: o.rz + rel * 0.004, ry: (o.x > 0 ? -1 : 1) * 12 });
      op(o.c, clamp((1350 - rel) / 350) * clamp((rel + 3400) / 1300));
      blur(o.c, Math.max(0, (rel - 700) / 60) + Math.max(0, (-rel - 2600) / 900));
    }
    tf(fin, { x: CX - FW / 2, y: CY - FH / 2, z: camZ - FINAL_Z });
    op(fin, clamp((camZ - 300) / 1200));
    tf(world, { rz: sway * (1 - P(t, 3.2, 3.9)), x: 0 });

    /* kinetic words, flying past the lens */
    for (const o of words) {
      const pin = P(t, o.t0, o.t0 + 0.42, E.outSoft);
      const pass = P(t, o.t0 + 0.5, o.t0 + (o === words[2] ? 1.05 : 0.8), E.in);
      o.inner.style.transform = `translate3d(0,${((1 - pin) * 105).toFixed(1)}%,0)`;
      o.w.style.left = (CX - o.w.offsetWidth / 2 + o.x) + 'px';
      o.w.style.top = (CY - 90 + o.y) + 'px';
      tf(o.w, { s: 1 + pass * 2.4, x: o.x * pass * 1.4, z: 0 });
      op(o.w, (t < o.t0 ? 0 : 1) * (1 - pass));
      blur(o.w, pass * 22, 'drop-shadow(0 10px 28px rgba(0,0,0,.5))');
    }
    drawDust(t, 0.25 + 0.5 * P(t, 0.8, 1.6), camZ / 900);
    $('#flash').style.opacity = (flare * 0.55).toFixed(3);
  });
}

/* --------------------------- S2 · STORY PAGE --------------------------- */
const pageEn = $('#page-en');
const enWords = splitWords($('#pgTextEn'));
{
  const persp = $('#s2persp'), backdrop = $('#s2backdrop');
  const img = $('#pgImg'), player = $('#player');
  const hs1 = $('#hs1'), hs2 = $('#hs2'), hsCard = $('#hsCard');
  const title = $('.pg-title', pageEn), chap = pageEn.querySelector('.pg-chapter');
  const word = $('#vwMessenger');
  let imgRect = null, wRect = null;
  const svg = $('#callouts'), labels = $('#calloutLabels');
  const CALLOUTS = [
    { key: 'player', text: 'Sesli anlatım', sub: 'her bölüm için', t0: 5.05, t1: 7.35, target: () => player, dx: -330, dy: -40, anchor: 'right' },
    { key: 'hs', text: 'Keşif noktası', sub: 'görselin içinde', t0: 6.0, t1: 7.4, target: () => hs1, dx: -250, dy: -170, anchor: 'bottom' },
    { key: 'word', text: 'Word Notes', sub: 'dokun, anlamını gör', t0: 6.75, t1: 7.55, target: () => word, dx: 40, dy: 250, anchor: 'top' },
  ].map(c => {
    c.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    c.path.setAttribute('fill', 'none'); c.path.setAttribute('stroke', '#F3D58A'); c.path.setAttribute('stroke-width', '1.6');
    c.dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.dot.setAttribute('r', '6'); c.dot.setAttribute('fill', '#FFF3CF');
    c.ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.ring.setAttribute('fill', 'none'); c.ring.setAttribute('stroke', '#F3D58A'); c.ring.setAttribute('stroke-width', '1.5');
    svg.append(c.path, c.ring, c.dot);
    c.label = el('div', 'co', `<div class="chip"><i></i>${c.text}<small>${c.sub}</small></div>`, labels);
    return c;
  });

  scene('s2', 3.9, 9.25, t => {
    if (!wRect) {
      pageEn.style.transform = 'none';
      const pr = pageEn.getBoundingClientRect();
      const rel = n => { const r = n.getBoundingClientRect(); return { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height, cx: r.left - pr.left + r.width / 2, cy: r.top - pr.top + r.height / 2 }; };
      wRect = rel(word); imgRect = rel(img);
    }
    /* camera: from the image filling the frame → hero product angle → into "Messenger" */
    const imgFocus = { px: imgRect.cx, py: imgRect.cy, s: window.__FINAL_W / imgRect.w };
    const pull = P(t, 3.9, 5.3, bezier(0.22, 0, 0.1, 1));
    const push = P(t, 7.45, 8.45, bezier(0.6, 0, 0.9, 0.55));
    const after = P(t, 8.45, 9.25, E.out);
    const hand = { x: smoothNoise(t * 0.5, 7) * 6, y: smoothNoise(t * 0.45, 9) * 5 };
    let c = {
      px: lerp(imgFocus.px, 1000 + (t - 5.4) * 14, pull), py: lerp(imgFocus.py, 545, pull),
      s: Math.exp(lerp(Math.log(imgFocus.s), Math.log(0.9 + (t - 5.4) * 0.014), pull)),
      ry: lerp(0, -13 + (t - 5.4) * 1.5, pull), rx: lerp(0, 6, pull), rz: lerp(0, -0.6, pull),
      sx: CX + hand.x * pull, sy: CY + hand.y * pull,
    };
    const S3S = 96 / 21.6;
    c = {
      px: lerp(c.px, wRect.cx, push), py: lerp(c.py, wRect.cy, push),
      s: Math.exp(lerp(Math.log(c.s), Math.log(S3S), push)) * (1 + after * 0.25),
      ry: lerp(c.ry, 0, push), rx: lerp(c.rx, 0, push), rz: lerp(c.rz, 0, push), sx: lerp(c.sx, CX, push), sy: lerp(c.sy, CY, push),
    };
    camTf(pageEn, c);
    blur(pageEn, after * 14);
    op(pageEn, 1 - P(t, 8.45, 8.85, E.inOut));
    op(backdrop, P(t, 4.2, 5.2) * (1 - push));
    tf(backdrop, { x: -c.ry * 3, y: c.rx * 3, s: 1 });

    /* page furniture assembles */
    const hdr = P(t, 4.0, 4.6);
    title.style.clipPath = `inset(0 ${(100 - 100 * P(t, 4.2, 4.9, E.outSoft)).toFixed(1)}% 0 0)`;
    chap.style.opacity = P(t, 4.5, 5.0).toFixed(3);
    enWords.forEach((w, i) => {
      const p = P(t, 4.35 + i * 0.011, 4.85 + i * 0.011, E.outSoft);
      w.style.opacity = p.toFixed(3); w.style.transform = `translateY(${((1 - p) * 14).toFixed(2)}px)`;
    });
    const pl = P(t, 4.3, 4.9, E.back);
    player.style.transform = `translateY(${((1 - pl) * -30).toFixed(1)}px) scale(${(0.92 + 0.08 * pl).toFixed(4)})`;
    player.style.opacity = P(t, 4.3, 4.6).toFixed(3);
    /* narration starts */
    const playing = t > 4.78;
    $('#plBtn .play').style.opacity = playing ? 0 : 1; $('#plBtn .pause').style.opacity = playing ? 1 : 0;
    const press = Math.exp(-Math.pow((t - 4.76) / 0.07, 2));
    $('#plBtn').style.transform = `scale(${(1 - press * 0.12).toFixed(3)})`;
    const prog = clamp((t - 4.78) / 58);
    $('#plFill').style.width = (prog * 100).toFixed(3) + '%'; $('#plKnob').style.left = (prog * 100).toFixed(3) + '%';
    $('#plTime').textContent = `0:0${Math.max(0, Math.floor(t - 4.78))}`;
    /* hotspots */
    [hs1, hs2].forEach((h, i) => {
      const a = P(t, 5.2 + i * 0.15, 5.6 + i * 0.15, E.back);
      const pulse = (Math.sin((t - 5) * 5 + i) + 1) / 2;
      h.style.transform = `scale(${(a * (1 + pulse * 0.08)).toFixed(3)})`;
      h.style.boxShadow = `0 0 0 ${(pulse * 14).toFixed(1)}px rgba(225,113,0,${(0.35 * (1 - pulse)).toFixed(3)})`;
    });
    const hc = P(t, 6.05, 6.5, E.back) * (1 - P(t, 7.5, 7.8));
    hsCard.style.opacity = clamp(hc * 1.4).toFixed(3);
    hsCard.style.transform = `translateY(${((1 - hc) * 16).toFixed(1)}px) scale(${(0.9 + 0.1 * hc).toFixed(3)})`;

    /* callouts, anchored to the live projected position of the UI they describe */
    for (const co of CALLOUTS) {
      const vis = P(t, co.t0, co.t0 + 0.5, E.outSoft) * (1 - P(t, co.t1, co.t1 + 0.3, E.in));
      if (vis <= 0.001) { co.path.style.opacity = 0; co.dot.style.opacity = 0; co.ring.style.opacity = 0; co.label.style.opacity = 0; continue; }
      const r = co.target().getBoundingClientRect();
      const tx = co.key === 'player' ? r.left + 8 : r.left + r.width / 2, ty = co.key === 'word' ? r.bottom + 4 : r.top + r.height / 2;
      const lw = co.label.offsetWidth, lh = co.label.offsetHeight;
      const lx = clamp(tx + co.dx, 40 + lw / 2, W - 40 - lw / 2), ly = clamp(ty + co.dy, 40 + lh / 2, H - 40 - lh / 2);
      co.label.style.transform = `translate3d(${(lx - lw / 2).toFixed(1)}px,${(ly - lh / 2 + (1 - vis) * 12).toFixed(1)}px,0)`;
      co.label.style.opacity = vis.toFixed(3);
      const ey = co.anchor === 'bottom' ? ly + lh / 2 : co.anchor === 'top' ? ly - lh / 2 : ly;
      const ex = co.anchor === 'right' ? lx + lw / 2 : lx;
      const d = `M${ex.toFixed(1)},${ey.toFixed(1)} L${tx.toFixed(1)},${ty.toFixed(1)}`;
      co.path.setAttribute('d', d);
      const len = Math.hypot(tx - ex, ty - ey);
      const lp = P(t, co.t0 + 0.1, co.t0 + 0.55, E.inOut);
      co.path.style.strokeDasharray = `${len}`; co.path.style.strokeDashoffset = `${(len * (1 - lp)).toFixed(1)}`;
      co.path.style.opacity = vis;
      co.dot.setAttribute('cx', tx); co.dot.setAttribute('cy', ty); co.dot.style.opacity = vis * lp;
      const rp = ((t - co.t0) * 1.2) % 1;
      co.ring.setAttribute('cx', tx); co.ring.setAttribute('cy', ty); co.ring.setAttribute('r', 6 + rp * 22); co.ring.style.opacity = vis * lp * (1 - rp);
    }
    drawDust(t, 0.35 * (1 - pull) + 0.12, 0);
    op($('#s2'), 1 - P(t, 8.9, 9.25, E.lin));
  });
}

/* --------------------------- S3 · WORD NOTES --------------------------- */
{
  const world = $('#s3world'), bg = $('#s3bg'), word = $('#s3word');
  const NOTES = [
    ['Messenger', 'noun', 'A person chosen by Allah to deliver His message.', 'نبي', 'شخص يختاره الله ليبلّغ الناس رسالته ويهديهم.'],
    ['ruler', 'noun', 'A person given responsibility to lead or manage.', 'خليفة', 'من يُكلَّف بالمسؤولية والعمارة في الأرض.'],
    ['curiosity', 'noun', 'A strong wish to know more.', 'فضول', 'رغبة قوية في معرفة المزيد.'],
    ['fabulous', 'adjective', 'Very impressive or wonderful.', 'الرائعة', 'جميلة ومثيرة للإعجاب.'],
  ];
  const card = ([w, pos, d, aw, ad], small) => el('div', 'wn' + (small ? ' small' : ''),
    `<div class="wn-word">${w}<span class="wn-pos">${pos}</span></div><div class="wn-lbl">MEANING</div><div class="wn-def">${d}</div><div class="wn-hr"></div><div class="wn-arl">العربية</div><div class="wn-arw">${aw}</div><div class="wn-ard">${ad}</div>`, world);
  const main = card(NOTES[0], false);
  const mainParts = Array.from(main.children);
  /* v10: "Save to My words" on every Word Note → "In My words" */
  const save = el('div', 'wn-save', `${ico('BookBookmark')}<span>Save to My words</span>`, main);
  const saveTxt = save.querySelector('span'), saveIco = save.querySelector('svg');
  const tapF = el('div', 'tap', null, $('#s3'));
  const TAP_SAVE = 11.25;
  const ring = NOTES.slice(1).map((n, i) => ({ c: card(n, true), i }));
  const head = $('#s3head'), headSpans = maskLines(head);
  const count = $('#s3count'), num = $('#s3num');
  let mainSize = null;

  scene('s3', 8.45, 12.5, t => {
    if (!mainSize) mainSize = { w: main.offsetWidth, h: main.offsetHeight, ww: main.querySelector('.wn-word').offsetWidth };
    op(bg, P(t, 8.5, 8.95, E.inOut) * (1 - P(t, 12.2, 12.5, E.lin)));
    const dk = P(t, 8.55, 8.95, E.inOut);
    /* 1 — tap on the word */
    const tap = Math.exp(-Math.pow((t - 8.72) / 0.09, 2));
    const lift = P(t, 8.85, 9.65, E.cam);
    const W0 = word.offsetWidth, H0 = word.offsetHeight;
    // start: centered, same size as the zoomed page word · end: sits as the card's headword
    const cardX = CX - mainSize.w / 2 - 330 * P(t, 10.3, 11.1, E.cam), cardY = CY - mainSize.h / 2 - 40 * P(t, 10.3, 11.1, E.cam);
    const endS = 54 / 96;
    const wx = lerp(CX - W0 / 2, cardX + 50, lift), wy = lerp(CY - H0 / 2 - 6, cardY + 38, lift);
    const ws = lerp(1, endS, lift) * (1 + tap * 0.05);
    word.style.transform = `translate3d(${wx.toFixed(2)}px,${wy.toFixed(2)}px,0) scale(${ws.toFixed(4)})`;
    word.style.color = `rgb(${lerp(20, 255, dk) | 0},${lerp(34, 247, dk) | 0},${lerp(26, 228, dk) | 0})`;
    word.style.setProperty('--u', (1 - P(t, 8.95, 9.4, E.in)).toFixed(3));
    op(word, t < 9.7 ? 1 : 0);
    word.style.textShadow = `0 0 ${(tap * 40).toFixed(1)}px rgba(243,213,138,${(tap * 0.9).toFixed(2)})`;

    /* 2 — the Word Note unfolds around it */
    const unfold = P(t, 9.05, 9.75, E.cam);
    const exitRing = P(t, 11.9, 12.4, E.inStrong);
    const float = { ry: smoothNoise(t * 0.6, 2) * 4 - 8 * P(t, 10.3, 11.1, E.cam), rx: smoothNoise(t * 0.5, 5) * 3 + 4 };
    tf(main, { x: cardX, y: cardY, z: -exitRing * 900, ...float });
    main.style.clipPath = `inset(0 ${((1 - unfold) * (mainSize.w - mainSize.ww - 80)).toFixed(1)}px ${((1 - unfold) * (mainSize.h - 110)).toFixed(1)}px 0 round 22px)`;
    op(main, P(t, 9.0, 9.2, E.lin) * (1 - exitRing));
    main.querySelector('.wn-word').style.opacity = t < 9.7 ? 0 : 1;
    mainParts.slice(1).forEach((p, i) => {
      const q = P(t, 9.45 + i * 0.08, 9.95 + i * 0.08, E.outSoft);
      p.style.opacity = q.toFixed(3); p.style.transform = `translateY(${((1 - q) * 16).toFixed(1)}px)`;
    });

    /* 3 — the rest of the chapter's Word Notes orbit in */
    const SLOTS = [[1010, 120, -260, -14], [1400, 250, -520, -18], [1060, 520, -380, -12], [1430, 620, -700, -20], [1250, -60, -1000, -16], [1580, 430, -1100, -22]];
    ring.forEach(({ c, i }) => {
      const t0 = 10.35 + i * 0.1;
      const p = P(t, t0, t0 + 0.95, E.cam);
      const [x, y, z, ry] = SLOTS[i];
      const drift = (t - 10.3) * 14;
      tf(c, { x: lerp(x + 700, x, p) - drift, y: y + Math.sin(t * 0.9 + i) * 8, z: lerp(z - 1800, z, p) - exitRing * 1200, ry: ry + (1 - p) * -25, rx: 4, rz: (i % 2 ? 1 : -1) * 1.5 });
      op(c, P(t, t0, t0 + 0.4, E.lin) * (1 - exitRing) * (i > 3 ? 0.55 : 1));
      blur(c, (-z - 250) / 160 + (1 - p) * 8 + exitRing * 6);
    });
    /* save the word */
    const sv = P(t, 9.9, 10.3, E.outSoft);
    save.style.opacity = sv.toFixed(3); save.style.transform = `translateY(${((1 - sv) * 14).toFixed(1)}px) scale(${(1 - Math.exp(-Math.pow((t - TAP_SAVE) / 0.04, 2)) * 0.06).toFixed(3)})`;
    const saved = t >= TAP_SAVE + 0.02;
    save.classList.toggle('on', saved);
    saveTxt.textContent = saved ? 'In My words' : 'Save to My words';
    saveIco.innerHTML = (window.ICONS || {})[saved ? 'Check' : 'BookBookmark'] || '';
    {
      const v = P(t, TAP_SAVE - 0.3, TAP_SAVE - 0.1, E.lin) * (1 - P(t, TAP_SAVE + 0.15, TAP_SAVE + 0.35, E.lin));
      const r = save.getBoundingClientRect(), x = r.left + r.width * 0.3, y = r.top + r.height / 2;
      const mv = P(t, TAP_SAVE - 0.3, TAP_SAVE, E.outSoft), press = Math.exp(-Math.pow((t - TAP_SAVE) / 0.05, 2));
      tapF.style.left = lerp(x + 120, x, mv) + 'px'; tapF.style.top = lerp(y + 90, y, mv) + 'px';
      tapF.style.transform = `scale(${(1 - press * 0.25).toFixed(3)})`;
      const rp = clamp((t - TAP_SAVE) / 0.35);
      tapF.style.setProperty('--r', (1 + rp * 1.8).toFixed(3)); tapF.style.setProperty('--ro', (t > TAP_SAVE ? 1 - rp : 0).toFixed(3));
      op(tapF, v * (1 - exitRing));
    }
    /* 4 — type + counter */
    headSpans.forEach((s, i) => riseIn(s, t, 10.45 + i * 0.12, 0.8));
    op(head, 1 - P(t, 11.95, 12.3, E.lin));
    const cp = P(t, 11.0, 11.9, E.out);
    num.textContent = Math.round(cp * 4);
    op(count, P(t, 10.95, 11.2, E.lin) * (1 - P(t, 11.95, 12.3, E.lin)));
    tf(count, { y: (1 - P(t, 10.95, 11.5, E.outSoft)) * 30 });
    drawDust(t, 0.3, 0.2);
  });
}

/* ------------------------- S4 · ENGLISH ⇄ ARABIC ------------------------ */
{
  const enL = $('#s4en'), arL = $('#s4ar');
  const en = pageEn.cloneNode(true); en.id = 'page-en2'; enL.appendChild(en);
  const ar = pageEn.cloneNode(true); ar.id = 'page-ar'; ar.classList.add('rtl'); arL.appendChild(ar);
  [enL, arL].forEach(l => { l.style.perspective = '1500px'; });
  en.querySelectorAll('.w').forEach(w => { w.style.opacity = 1; w.style.transform = 'none'; });
  en.querySelector('.hs-card').remove(); ar.querySelector('.hs-card').remove();
  en.querySelector('.pg-title').style.clipPath = 'none'; en.querySelector('.pg-chapter').style.opacity = 1;
  en.querySelector('.player').style.opacity = 1;
  // Arabic source: src/data/adam/b1/ar/pages.ts (chapter 1), word for word (v10: Adam is «نبي», as in the story text now)
  ar.querySelector('.pg-title').textContent = 'الْمُقَدِّمَةُ وَالْخَلْق';
  ar.querySelector('.pg-title').style.clipPath = 'none';
  ar.querySelector('.pg-chapter').textContent = 'الفصل ١'; ar.querySelector('.pg-chapter').style.opacity = 1;
  ar.querySelector('.pg-book-title').textContent = 'قصص الأنبياء: آدم (عليه السلام)';
  ar.querySelector('.pg-book-meta').textContent = 'المستوى B1 · صفحة ١';
  ar.querySelector('.pg-lang').innerHTML = '<span class="on" style="font-family:Arakom;font-weight:400;font-size:17px">العربية</span><span>EN</span>';
  ar.querySelector('.pg-count').textContent = 'صفحة ١ / ١٧';
  ar.querySelector('.pg-brand').textContent = 'قصص الأنبياء عليهم السلام';
  ar.querySelectorAll('.pl-time')[1].textContent = '1:04';
  ar.querySelector('.player').style.opacity = 1;
  const arText = ar.querySelector('.pg-text');
  const AR_FIRST = 'آدَمُ عَلَيْهِ السَّلَامُ هُوَ أَوَّلُ <b class="vw">نَبِيٍّ</b> وَأَبُو الْبَشَرِ جَمِيعًا.';   // = the narrated clip (narration_ar_ch1.wav)
  arText.innerHTML = `<p><span class="nar">${AR_FIRST}</span> خَلَقَهُ اللهُ مِنَ التُّرَابِ، وَأَكْرَمَهُ تَكْرِيمًا عَظِيمًا، وَأَعْطَاهُ قِيمَةً كَبِيرَةً كَأَوَّلِ إِنْسَانٍ. يَحْكِي الْقُرْآنُ الْكَرِيمُ قِصَّةَ آدَمَ عَلَيْهِ السَّلَامُ فِي سُوَرٍ مُخْتَلِفَةٍ. تَتَحَدَّثُ سُوَرُ الْأَعْرَافِ، وَالْبَقَرَةِ، وَالْحِجْرِ، وَالْإِسْرَاءِ، وَصَاد، وَطه عَنْ قِصَّةِ آدَمَ عَلَيْهِ السَّلَامُ بِوُضُوحٍ. نَحْنُ، أَحْفَادَ آدَمَ، يُمْكِنُنَا أَنْ نَتَعَلَّمَ دُرُوسًا كَثِيرَةً مِنْ هَذِهِ الْقِصَّةِ <b class="vw">الرَّائِعَةِ</b> وَالْحَقِيقِيَّةِ. تُوجَدُ فِي هَذِهِ الْقِصَّةِ رَسَائِلُ مُهِمَّةٌ وَمُتَنَوِّعَةٌ حَوْلَ دَوْرِ الْإِنْسَانِ فِي الْحَيَاةِ.</p><p>بَعْدَ أَنْ خَلَقَ اللهُ السَّمَاءَ وَالْأَرْضَ، أَخْبَرَ الْمَلَائِكَةَ أَنَّهُ سَيَخْلُقُ إِنْسَانًا. وَقَالَ إِنَّهُ قَرَّرَ أَنْ يَجْعَلَ <b class="vw">خَلِيفَةً</b> فِي الْأَرْضِ. وَكَانَ هَذَا الْخَلِيفَةُ سَيَعِيشُ فِيهَا سَنَوَاتٍ كَثِيرَةً. فَتَعَجَّبَتِ الْمَلَائِكَةُ وَبَدَأَتْ تَنْتَظِرُ <b class="vw">بِفُضُولٍ</b>.</p>`;
  const arNar = arText.querySelector('.nar');
  const toggle = $('#s4toggle'), knob = $('#s4knob'), seam = $('#s4seam');
  const arTag = $('#s4arTag'), trTag = $('#s4trTag');
  /* Arabic hotspots on the chapter illustration (src/data/adam/b1/ar/pages.ts, chapter 1 hotspots, unchanged) */
  const arImg = ar.querySelector('.pg-img'), arHs = [...ar.querySelectorAll('.hotspot')];
  const AR_HS = [
    ['مخلوق من التراب', 'خلق الله آدم عليه السلام من التراب، وأكرمه كأول إنسان.'],
    ['المسؤولية في الأرض', 'أخبر الله الملائكة أنه سيجعل في الأرض خليفة.'],
  ];
  const arCards = AR_HS.map(([b, e]) => el('div', 'hs-card hs-ar', `<b>${b}</b><em>${e}</em>`, arImg));
  const arPlay = ar.querySelector('.pl-btn'), arFill = ar.querySelector('.pl-fill'), arKnob = ar.querySelector('.pl-knob');
  const arTime = ar.querySelectorAll('.pl-time')[0];
  const tap = $('#s4tap'), chip = $('#s4chip');
  let hsGeo = null;
  // the hotspot beat is inserted at clock HB0; everything after it keeps its choreography, HD later
  const HB0 = 14.9, HD = 2.5, L = c => c + HD;
  const TAPS = [15.35, 16.4];

  scene('s4', 12.3, L(17.6), t => {
    if (!hsGeo) {
      const img = planePos(arImg, ar);
      hsGeo = {
        img, hs: arHs.map(h => ({ x: img.x + h.offsetLeft, y: img.y + h.offsetTop })),
        cards: arCards.map((c, i) => {                      // each card opens just above its hotspot
          const h = arHs[i], w = c.offsetWidth, hh = c.offsetHeight;
          c.style.left = clamp(h.offsetLeft - w / 2, 14, img.w - w - 14) + 'px'; c.style.top = (h.offsetTop - 34 - hh) + 'px';
          return { w, h: hh };
        }),
      };
    }
    const intro = P(t, 12.3, 12.95, E.cam);
    const flip = P(t, 13.3, 14.35, bezier(0.6, 0, 0.3, 1));   // seam travels right → left (RTL)
    const settle = P(t, 14.35, 15.3, E.cam);
    const recede = P(t, L(15.05), L(15.9), E.cam);
    const leave = P(t, L(17.15), L(17.6), E.inStrong);
    const ry = lerp(-15, 15, P(t, 13.25, 14.5, E.inOut));
    const hand = smoothNoise(t * 0.5, 11) * 4;
    let cam = {
      px: 960, py: 540, s: lerp(0.62, 0.8, intro) + settle * 0.04 - recede * 0.12,
      ry: ry, rx: 7 - recede * 3, rz: lerp(-0.6, 0.6, flip), sx: CX + hand - recede * 60, sy: CY + recede * 40,
    };
    /* hotspot beat: the camera leans into the Arabic illustration, two taps, then eases back out */
    const zin = P(t, 14.75, 15.35, E.cam) * (1 - P(t, 17.05, L(15.2), E.cam));
    if (zin > 0) {
      const g = hsGeo.img;
      cam = {
        px: lerp(cam.px, g.x + g.w * 0.5, zin), py: lerp(cam.py, g.y + g.h * 0.47, zin),
        s: Math.exp(lerp(Math.log(cam.s), Math.log(1.2), zin)),
        ry: lerp(cam.ry, 15 - 20 * zin, zin), rx: lerp(cam.rx, 3, zin), rz: lerp(cam.rz, 0, zin),
        sx: lerp(cam.sx, CX + 120 + hand, zin), sy: lerp(cam.sy, CY + 10, zin),
      };
    }
    camTf(en, cam); camTf(ar, cam);
    const seamX = lerp(W + 60, -60, flip);
    enL.style.clipPath = `inset(0 ${Math.max(0, W - seamX).toFixed(1)}px 0 0)`;
    arL.style.clipPath = `inset(0 0 0 ${Math.max(0, seamX).toFixed(1)}px)`;
    const dim = recede * 0.7 + leave * 0.3;
    [en, ar].forEach(p => { p.style.filter = `brightness(${(lerp(0.55, 1, intro) * (1 - dim)).toFixed(3)}) blur(${(recede * 6 + leave * 10).toFixed(2)}px)`; });
    op(enL, P(t, 12.35, 12.75, E.lin)); op(arL, 1 - leave);
    seam.style.left = seamX + 'px';
    op(seam, Math.sin(Math.PI * flip) * 1.2);
    /* the Arabic narration of the same page plays on (the app's chapter-1 recording, female voice, 1:04;
       the clip is its first sentence, which the page highlights while it is heard) */
    const arPlaying = t > 14.42;
    arPlay.querySelector('.play').style.opacity = arPlaying ? 0 : 1; arPlay.querySelector('.pause').style.opacity = arPlaying ? 1 : 0;
    const sec = Math.max(0, filmSince('s4', 14.42, t));
    const prog = clamp((sec + 2.26) / 64.29 * (arPlaying ? 1 : 0));
    arFill.style.width = (prog * 100).toFixed(3) + '%'; arKnob.style.left = (prog * 100).toFixed(3) + '%';
    arTime.textContent = `0:0${Math.min(9, Math.floor(arPlaying ? sec + 2.26 : 0))}`;
    const nh = arPlaying ? clamp(sec / 0.25) * (1 - clamp((sec - 5.04) / 0.4)) : 0;
    arNar.style.background = `rgba(243,213,138,${(0.38 * nh).toFixed(3)})`;
    /* hotspots pulse; tap → Arabic card */
    arHs.forEach((h, i) => {
      const pulse = (Math.sin((t - 14.4) * 5 + i) + 1) / 2 * P(t, 14.6, 15.0);
      const hit = Math.exp(-Math.pow((t - TAPS[i]) / 0.07, 2));
      h.style.transform = `scale(${((1 + pulse * 0.1) * (1 - hit * 0.15)).toFixed(3)})`;
      h.style.boxShadow = `0 0 0 ${(pulse * 16).toFixed(1)}px rgba(225,113,0,${(0.38 * (1 - pulse) * P(t, 14.6, 15.0)).toFixed(3)})`;
    });
    arCards.forEach((c, i) => {
      const a = P(t, TAPS[i] + 0.05, TAPS[i] + 0.45, E.back) * (1 - P(t, TAPS[i] + 0.88, TAPS[i] + 1.05, E.in));
      c.style.opacity = clamp(a * 1.4).toFixed(3);
      c.style.transform = `translateY(${((1 - a) * 16).toFixed(1)}px) scale(${(0.9 + 0.1 * a).toFixed(3)})`;
    });
    /* the finger */
    let tv = 0;
    TAPS.forEach((tt, i) => {
      const v = P(t, tt - 0.3, tt - 0.12, E.lin) * (1 - P(t, tt + 0.2, tt + 0.4, E.lin));
      if (v <= 0) return;
      tv = v;
      const r = arHs[i].getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const mv = P(t, tt - 0.3, tt, E.outSoft), press = Math.exp(-Math.pow((t - tt) / 0.06, 2));
      tap.style.left = lerp(x + 90, x, mv) + 'px'; tap.style.top = lerp(y + 70, y, mv) + 'px';
      tap.style.transform = `scale(${(1 - press * 0.25).toFixed(3)})`;
      const rp = clamp((t - tt) / 0.4);
      tap.style.setProperty('--r', (1 + rp * 1.8).toFixed(3)); tap.style.setProperty('--ro', (t > tt ? 1 - rp : 0).toFixed(3));
    });
    op(tap, tv);
    const cv = P(t, 15.45, 15.85, E.outSoft) * (1 - P(t, 17.1, 17.4, E.in));
    op(chip, cv); tf(chip, { y: (1 - cv) * 14 });
    /* toggle: the real EN / العربية switch, one tap */
    const tIn = P(t, 12.35, 12.85, E.back), tOut = P(t, 13.35, 13.8, E.in);
    const press = Math.exp(-Math.pow((t - 13.02) / 0.07, 2));
    tf(toggle, { s: (0.8 + 0.4 * tIn) * (1 - press * 0.06) * (1 + tOut * 0.6), y: -tOut * 20 });
    op(toggle, P(t, 12.35, 12.6, E.lin) * (1 - tOut));
    blur(toggle, tOut * 16);
    knob.style.transform = `translateX(${(P(t, 13.02, 13.4, E.back) * 164).toFixed(1)}px)`;
    /* the Arabic tagline of the library */
    const reveal = P(t, L(15.2), L(16.1), bezier(0.5, 0, 0.2, 1));
    arTag.style.clipPath = `inset(-40% -8% -40% ${((1 - reveal) * 100).toFixed(2)}%)`;
    arTag.style.webkitMaskImage = reveal >= 1 ? 'none' : `linear-gradient(to left, #000 ${(reveal * 100).toFixed(1)}%, transparent ${(reveal * 100 + 12).toFixed(1)}%)`;
    tf(arTag, { x: (1 - reveal) * -40 - leave * 80, s: 1 + (t - L(15.2)) * 0.012 });
    op(arTag, 1 - leave); blur(arTag, leave * 12);
    const tr = P(t, L(15.75), L(16.4), E.outSoft);
    trTag.style.opacity = (tr * (1 - leave)).toFixed(3); tf(trTag, { y: (1 - tr) * 18 });
    drawDust(t < HB0 ? t : t < L(HB0) ? HB0 + (t - HB0) * 0.2 : t - HD + 0.5, 0.25, 0.1);
  });
}

/* ------------- S5 · CHAPTER LOOP · story → Quick Challenge → Language Focus ------------- */
// The reader's real chapter order (StoryPage.tsx): the chapter text, then its Quick Challenge,
// then its "After reading" Language Focus. Every one of the 12 chapters repeats this loop.
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5.5 12.5l4 4 9-9" fill="none" stroke="#1a1408" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function flowRow(labels) {
  return '<div class="fl-row">' + labels.map((l, i) => (i ? '<b class="fl-l"><em></em></b>' : '') + `<div class="fl-n"><i>${CHECK_SVG}</i><span>${l}</span></div>`).join('') + '</div>';
}
/** state per node: 0 upcoming, 1 active, 2 done (fractional values blend) */
function paintFlow(root, states, fills) {
  const nodes = root.querySelectorAll('.fl-n'), lines = root.querySelectorAll('.fl-l em');
  nodes.forEach((n, i) => {
    const s = states[i];
    const act = clamp(1 - Math.abs(s - 1)), done = clamp(s - 1);
    n.style.setProperty('--dot', (act * (1 - done)).toFixed(3));
    n.style.setProperty('--chk', done.toFixed(3));
    n.style.setProperty('--txt', (0.42 + 0.58 * clamp(s)).toFixed(3));
    const ring = n.querySelector('i');
    ring.style.background = done > 0.5 ? 'var(--gold)' : 'rgba(10,10,8,.6)';
    ring.style.borderColor = s > 0.5 ? 'var(--gold-hi)' : 'rgba(194,170,107,.45)';
  });
  lines.forEach((l, i) => l.parentNode.querySelector('em').style.setProperty('--fill', clamp(fills[i]).toFixed(3)));
}
/** matching lines between two columns inside a card; pairs = [[leftIndex, rightIndex], ...] */
function matchLines(svg, lefts, rights, pairs, t, t0, step) {
  const box = svg.getBoundingClientRect();
  const sx = svg.clientWidth / (box.width || 1), sy = svg.clientHeight / (box.height || 1);
  let html = '';
  pairs.forEach(([li, ri], k) => {
    const p = P(t, t0 + k * step, t0 + k * step + step * 0.8, E.inOut);
    const L = lefts[li], R = rights[ri];
    const x1 = L.offsetLeft + L.offsetWidth, y1 = L.offsetTop + L.offsetHeight / 2;
    const x2 = R.offsetLeft, y2 = R.offsetTop + R.offsetHeight / 2;
    L.classList.toggle('ok', p >= 1); R.classList.toggle('ok', p >= 1);
    if (p <= 0) return;
    const mx = (x1 + x2) / 2;
    const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    html += `<path d="${d}" stroke="#00bc7d" stroke-width="3" fill="none" pathLength="1" stroke-dasharray="${p.toFixed(3)} 1" stroke-linecap="round"/>` +
      `<circle cx="${x1}" cy="${y1}" r="6" fill="#00bc7d"/>` + (p >= 1 ? `<circle cx="${x2}" cy="${y2}" r="6" fill="#00bc7d"/>` : '');
  });
  svg.innerHTML = html;
}
function matchCard(cls, eyebrow, title, sub, question, instr, lefts, rights, headL = 'CONCEPTS', headR = 'MEANINGS', parent) {
  const c = el('div', 'ui mt ui-pad ' + cls, `<div class="ui-ey">${eyebrow}</div><div class="ui-t">${title}</div><div class="ui-s">${sub}</div>
    <div class="mt-q">${question}</div><div class="mt-i">${instr}</div>
    <div class="mt-cols"><div><h5>${headL}</h5>${lefts.map(x => `<div class="mt-c">${x}</div>`).join('')}</div><div><h5>${headR}</h5>${rights.map(x => `<div class="mt-m">${x}</div>`).join('')}</div><svg class="mt-svg"></svg></div>`, parent);
  return { c, L: Array.from(c.querySelectorAll('.mt-c')), R: Array.from(c.querySelectorAll('.mt-m')), svg: c.querySelector('.mt-svg') };
}
const ADAM_CH = ['Introduction & The Creation', 'The Shaping of Adam', 'Iblis’s Arrogance', 'The Expulsion of Iblis', 'Life in Paradise and the Warning', 'Satan’s lies and Adam’s Departure from Paradise', 'Forgiveness and Repentance', 'Struggle and Survival on Earth', 'The First Messenger and the Path of Guidance', 'The Two Sons: Habil and Qabil', 'The First Conflict and the Raven', 'The Legacy of Adam'];
{
  const S = $('#s5'), world = $('#s5world'), qc = $('#qc'), q = $('#qcQ');
  const opts = [0, 1, 2].map(i => $('#qo' + i)), fb = $('#qcFb'), tap = $('#s5tap');
  const qWords = splitWords(q);
  const oldHead = $('#s5head'); if (oldHead) oldHead.remove();
  const flow = el('div', 'flow', `<div class="fl-eye"><span lang="tr">Bölüm 1</span> · Introduction &amp; The Creation</div>${flowRow(['Hikâye', 'Quick Challenge', 'Language Focus'])}`, S);
  /* Language Focus panel — real Chapter 1 activities (src/data/adam/b1/en/languageFocus.ts) */
  const LFA = [
    ['True Now or Happened Then?', 'CLASSIFY', 'Is it true now, or an event that happened in the story? Put it in the right group.'],
    ['Order, Report, Look Forward', 'COMPLETE', 'Complete the lines from Chapter 1 with words from the bank.'],
    ['Find and Fix the Mistake', 'CORRECT', 'Each sentence has one mistake. Tap the wrong words, then choose the correction.'],
    ['Build a Connected Account', 'USE', 'Write or say four connected B1 sentences using Chapter 1 language patterns.'],
  ];
  const lf = el('div', 'ui lf', `<div class="lf-head"><div class="ico brown"><svg viewBox="0 0 24 24"><path d="M5 4.5h11a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z M5 18a2 2 0 0 1 2-2h11" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg></div>
    <div><div class="lf-meta">AFTER READING<span>4 activities</span></div><div class="lf-title">Language Focus</div><div class="lf-sub">Open when you are ready to notice, connect, and use the language.</div></div>
    <div class="lf-prog"><small>PROGRESS</small><b id="lfCount">0 / 4</b><div class="bar"><i id="lfBar"></i></div></div></div>
    <div class="lf-rows">${LFA.map(([ti, tg, d], i) => `<div class="lf-row"><div class="n">${i + 1}</div><div><b>${ti}</b><span class="tag">${tg}</span><p>${d}</p></div><div class="arr">→</div></div>`).join('')}</div>`, world);
  const lfRows = Array.from(lf.querySelectorAll('.lf-row'));
  // Activity 4 of the real Chapter 1 Language Focus (languageFocus.ts): a USE / writing task
  const WRITE = 'The Qur’an tells Adam’s story. After Allah created the sky and the earth, He told the angels that He was going to create a human.';
  const task = { c: el('div', 'ui lfw', `<div class="lfw-top"><div class="ui-ey">LANGUAGE FOCUS</div><div class="ui-t">Build a Connected Account</div><div class="ui-s">Write or say four connected B1 sentences. Use at least three different Chapter 1 language patterns from this Language Focus.</div></div>
    <div class="lfw-q">Can you move from source information into past narration and then describe what was still going to happen?</div>
    <div class="lfw-box"><div class="lfw-ta"><span class="lfw-txt"></span><i class="lfw-caret"></i><span class="lfw-ph">Write your short response here…</span></div></div>
    ${[['INDIVIDUAL', 'Sentence 1 — Present the source: “The Qur’an tells/describes ...”'], ['INDIVIDUAL', 'Sentence 2 — Shift to the story: “After ..., Allah ...”'], ['INDIVIDUAL', 'Sentence 3 — Report the announcement: “He told the angels that ...”'], ['PAIR', 'Sentence 4 — Look forward from that past moment using “was going to” or “would”.']].map(([m, q]) => `<div class="lfw-p"><small>${m}</small><b>${q}</b><em>✓</em></div>`).join('')}
    <div class="lfw-btn">I’ve reflected on these</div>`, world) };
  const lfwTxt = task.c.querySelector('.lfw-txt'), lfwPh = task.c.querySelector('.lfw-ph'), lfwCaret = task.c.querySelector('.lfw-caret');
  const lfwP = Array.from(task.c.querySelectorAll('.lfw-p')), lfwBtn = task.c.querySelector('.lfw-btn');
  /* chapter rail: all 12 chapters of Adam (B1), each with its own Quick Challenge and Language Focus */
  const railW = $('#s5railw');
  const mods = ADAM_CH.map((ti, i) => el('div', 'rail-m', `<div class="ri"><img src="assets/img/adam_b1/ch${String(i + 1).padStart(2, '0')}.jpg"></div><div class="rb"><div class="rn" lang="tr">BÖLÜM ${String(i + 1).padStart(2, '0')}</div><div class="rt">${ti}</div><div class="rc"><span class="h" lang="tr">Hikâye</span><i class="ar a0"></i><span class="q">Quick Challenge</span><i class="ar a1"></i><span class="l">Language Focus</span></div></div>`, railW));
  const modQ = mods.map(m => m.querySelector('.rc .q')), modL = mods.map(m => m.querySelector('.rc .l')), modA = mods.map(m => m.querySelector('.rc .a1')), modA0 = mods.map(m => m.querySelector('.rc .a0'));
  const railHead = el('div', 'kin', '<div class="eyebrow">Hikâye → <span lang="en">Quick Challenge</span> → <span lang="en">Language Focus</span></div><div class="line">Her bölümün</div><div class="line">kendi hikâyesi,</div><div class="line gold">kendi alıştırmaları var.</div>', S);
  railHead.setAttribute('lang', 'tr');
  railHead.style.bottom = '70px'; railHead.querySelectorAll('.line').forEach(l => { l.style.fontSize = '56px'; });
  const railSpans = maskLines(railHead);
  let fbH = null;

  scene('s5', 20.5, 29.6, t => {
    if (fbH == null) { fb.style.height = 'auto'; fbH = fb.offsetHeight; }
    const hand = { x: smoothNoise(t * 0.45, 51) * 5, y: smoothNoise(t * 0.4, 52) * 4 };
    /* flow indicator */
    const fIn = P(t, 20.7, 21.3, E.outSoft), fOut = P(t, 27.8, 27.97, E.in);
    op(flow, fIn * (1 - fOut)); tf(flow, { y: (1 - fIn) * -16 });
    paintFlow(flow, [1 + P(t, 21.1, 21.5), P(t, 21.2, 21.6) + P(t, 24.45, 24.85), P(t, 24.6, 25.0) + P(t, 27.7, 28.0)], [P(t, 21.0, 21.6, E.inOut), P(t, 24.4, 25.0, E.inOut)]);
    /* Quick Challenge */
    const inn = P(t, 20.75, 21.5, E.outSoft);
    const up = P(t, 24.3, 25.2, E.cam);
    tf(qc, { x: 410 + hand.x - up * 180, y: lerp(lerp(560, 200, inn), -620, up) + hand.y, z: lerp(-600, 0, inn) - up * 500, rx: lerp(24, 3, inn) + up * 10, ry: lerp(10, -4, inn), rz: lerp(-2.5, 0, inn) });
    op(qc, P(t, 20.75, 21.0, E.lin) * (1 - P(t, 24.9, 25.3, E.lin)));
    qWords.forEach((w, i) => { const p = P(t, 21.0 + i * 0.03, 21.5 + i * 0.03, E.outSoft); w.style.opacity = p; w.style.transform = `translateY(${((1 - p) * 20).toFixed(1)}px)`; });
    opts.forEach((o, i) => { const p = P(t, 21.45 + i * 0.12, 22.0 + i * 0.12, E.outSoft); o.style.opacity = p.toFixed(3); o.style.transform = `translateX(${((1 - p) * 60).toFixed(1)}px)`; });
    const r = opts[1].getBoundingClientRect();
    const tx = r.left + r.width * 0.36, ty = r.top + r.height * 0.55;
    const mv = P(t, 22.55, 23.05, E.cam);
    tap.style.left = lerp(tx + 520, tx, mv) + 'px'; tap.style.top = lerp(ty + 330, ty, mv) + 'px';
    const press = Math.exp(-Math.pow((t - 23.1) / 0.07, 2));
    tap.style.transform = `scale(${(1 - press * 0.25).toFixed(3)})`;
    const rp = P(t, 23.1, 23.6, E.out);
    tap.style.setProperty('--r', (1 + rp * 1.8).toFixed(3)); tap.style.setProperty('--ro', (t > 23.1 ? 1 - rp : 0).toFixed(3));
    op(tap, P(t, 22.55, 22.75, E.lin) * (1 - P(t, 23.4, 23.7, E.lin)));
    const ok = t >= 23.12;
    opts[1].classList.toggle('ok', ok);
    const pop = ok ? Math.exp(-Math.pow((t - 23.2) / 0.12, 2)) : 0;
    opts[1].style.transform += ` scale(${(1 + pop * 0.035).toFixed(4)})`;
    const fbp = P(t, 23.25, 23.75, E.cam);
    fb.style.height = (fbp * fbH).toFixed(1) + 'px'; fb.style.opacity = P(t, 23.25, 23.45, E.lin).toFixed(3);
    fb.style.marginTop = (12 * fbp).toFixed(1) + 'px'; fb.style.borderWidth = fbp > 0.01 ? '1.5px' : '0';
    /* Language Focus rises from below, then its first activity opens */
    const lIn = P(t, 24.45, 25.35, E.cam), lSide = P(t, 25.95, 26.7, E.cam), lOut = P(t, 27.8, 27.98, E.inStrong);
    tf(lf, { x: 340 - lSide * 250 + hand.x, y: lerp(1250, 250, lIn) + hand.y, z: -lSide * 380 - lOut * 900, rx: lerp(18, 2, lIn), ry: lSide * 16 });
    op(lf, P(t, 24.45, 24.7, E.lin) * (1 - lSide * 0.35) * (1 - lOut));
    lfRows.forEach((row, i) => { const p = P(t, 24.95 + i * 0.1, 25.5 + i * 0.1, E.outSoft); row.style.opacity = p.toFixed(3); row.style.transform = `translateY(${((1 - p) * 26).toFixed(1)}px)`; });
    lfRows[3].classList.toggle('hl', t > 25.75);
    lfRows[3].style.transform += ` scale(${(1 - Math.exp(-Math.pow((t - 25.8) / 0.07, 2)) * 0.02).toFixed(4)})`;
    const doneA = t >= 27.7;
    lfRows[3].querySelector('.n').classList.toggle('done', doneA);
    lfRows[3].querySelector('.n').textContent = doneA ? '✓' : '4';
    $('#lfCount').textContent = doneA ? '1 / 4' : '0 / 4';
    $('#lfBar').style.width = (P(t, 27.7, 28.0) * 25) + '%';
    const tIn = P(t, 25.95, 26.75, E.cam);
    tf(task.c, { x: lerp(2100, 720, tIn) + hand.x, y: 150 + hand.y, z: 120 - lOut * 900, ry: lerp(-24, -6, tIn), rx: 2, s: 0.94 });
    op(task.c, P(t, 25.95, 26.2, E.lin) * (1 - lOut));
    // the learner writes, following the four sentence prompts; each prompt is ticked as it is used
    const typed = Math.round(WRITE.length * P(t, 26.55, 27.62, E.lin));
    lfwTxt.textContent = WRITE.slice(0, typed);
    lfwPh.style.display = typed ? 'none' : '';
    lfwCaret.style.opacity = t > 26.45 && t < 27.75 && (Math.floor(t * 6) % 2 === 0 || (typed > 0 && typed < WRITE.length)) ? 1 : 0;
    lfwP.forEach((pp, j) => pp.classList.toggle('on', t >= 26.9 + j * 0.24));
    lfwBtn.classList.toggle('on', t >= 27.62);
    /* every chapter repeats the loop — this stretch plays ~4x slower in film time (timeline.json warps) */
    const rIn = P(t, 27.98, 28.12, E.outSoft), rOut = P(t, 29.36, 29.46, E.in);
    const pan = P(t, 27.98, 29.46, bezier(0.35, 0, 0.55, 1));
    camTf(railW, { px: 300 + pan * 5 * 440, py: 280, s: 1.14, sx: 1080 + hand.x, sy: 400 + (1 - rIn) * 80, z: -120 - rOut * 300, ry: -12, rx: 3 });
    mods.forEach((m, i) => {
      tf(m, { x: i * 440, y: Math.sin(i * 1.3) * 14, z: 0 });
      // as the camera reaches a chapter, its own Quick Challenge and then its Language Focus light up
      const cx = m.getBoundingClientRect(); const c = cx.left + cx.width / 2;
      const q = clamp((1500 - c) / 160), l = clamp((1330 - c) / 160);
      modA0[i].style.setProperty('--on', q.toFixed(3)); modQ[i].style.setProperty('--on', q.toFixed(3)); modA[i].style.setProperty('--on', l.toFixed(3)); modL[i].style.setProperty('--on', l.toFixed(3));
    });
    op($('#s5rail'), rIn * (1 - rOut)); blur(railW, rOut * 6);
    railSpans.forEach((sp, i) => riseIn(sp, t, 28.04 + i * 0.035, 0.2));
    op(railHead, 1 - P(t, 29.34, 29.44, E.lin));
    drawDust(t, 0.22, 0);
  });
}

/* -------- S5b · END OF BOOK · the real finalized order (uiBookFinalization.ts) --------
   Knowledge Check → Master Glossary → Vocabulary Challenge → Language Review → Final Challenge */
{
  const S = $('#s5b'), world = $('#s5bworld');
  const track = el('div', 'track', `<div class="fl-eye" style="font-size:17px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:18px" lang="tr">Bölümler bittikten sonra · kitabın sonunda</div>${flowRow(['Knowledge Check', 'Master Glossary', 'Vocabulary Challenge', 'Language Review', 'Final Challenge'])}`, S);
  const capBox = el('div', 'caption', '', S);
  const CAPS = [
    ['Knowledge Check', 'Bütün kitabı kapsayan anlama soruları'],
    ['Master Glossary', 'Kitabın bütün kelimeleri, tek bir sözlükte'],
    ['Vocabulary Challenge', 'Anlamdan bağlama, bağlamdan kullanıma'],
    ['Language Review', 'Kitabın dil yapıları, yeni bağlamlarda'],
    ['Final Challenge', 'Bütün hikâyeyi bir araya getiren final'],
  ].map(([k, c]) => el('div', 'cap', `<small lang="en">${k}</small><span lang="tr">${c}</span>`, capBox));
  const ICON_CAP = '<svg viewBox="0 0 24 24"><path d="M2.5 9L12 4.5 21.5 9 12 13.5z M6 11v4.2c0 1.6 2.7 3 6 3s6-1.4 6-3V11" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  const ICON_BOOK = '<svg viewBox="0 0 24 24"><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z M12 6.5v13" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  const ICON_TROPHY = '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0z M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11 M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11 M12 13v4 M8.5 20h7 M9.5 17h5" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* Knowledge Check (src/data/adam/b1/en/exercises.ts) */
  const kc = el('div', 'ui kc', `<div class="kc-box"><div class="ico">${ICON_CAP}</div><div><div class="ui-ey">AFTER THE STORY</div><div class="ui-t" style="font-size:40px">B1 Knowledge Check: Prophet Adam (pbuh)</div><div class="ui-s">Check your understanding of the key relationships, events and ideas across the whole book.</div></div></div>
    <div class="kc-ans"><span id="kcA">Answered 0/8</span><div class="bar"><i id="kcBar"></i></div></div>
    <div class="kc-q"><div class="qq"><span>1</span>How is Adam introduced at the beginning of the book?</div>
      <div class="kc-o"><span>A</span>As a ruler who lived after many other messengers</div><div class="kc-o" id="kcB"><span>B</span>As the first Messenger and father of all humans</div><div class="kc-o"><span>C</span>As one of Qabil’s sons</div></div>
    <div class="kc-q"><div class="qq"><span>2</span>Chapter 2 presents knowledge and intellect as important gifts given to Adam for learning and understanding.</div><div class="kc-tf"><div id="kcT">True</div><div>False</div></div></div>`, world);

  /* Master Glossary — all 48 words of the book (src/data/adam/b1/en/pages.ts, glossary page) */
  const GLOSS = [["admired", "verb", 3, "Felt respect and approval for someone.", "Feelings & Attitudes"], ["admitting", "verb", 12, "Accepting or saying that something is true.", "Learning & Values"], ["angry", "adjective", 4, "Feeling strong displeasure.", "Feelings"], ["arrogant", "adjective", 3, "Too proud and sure of one’s own importance.", "Character & Values"], ["barrier", "noun", 7, "Something that prevents progress or clear understanding.", "Ideas & Obstacles"], ["blessings", "noun", 5, "Good things or gifts for which people are thankful.", "Spiritual Life"], ["careful", "adjective", 4, "Paying attention to avoid danger or harm.", "Safety & Awareness"], ["community", "noun", 9, "A group of people living or acting together.", "Society"], ["Creator", "noun", 4, "The One who creates.", "Belief & Faith"], ["curiosity", "noun", 1, "A strong wish to know more.", "Learning & Thinking"], ["digging", "verb", 11, "Making a hole in the ground.", "Actions"], ["disagreement", "noun", 10, "A serious difference of opinion.", "Relationships & Conflict"], ["distinguishing", "verb", 7, "Recognizing the difference between things.", "Learning & Thinking"], ["enemy", "noun", 4, "Someone who is hostile or wishes harm.", "Relationships"], ["fabulous", "adjective", 1, "Very impressive or wonderful.", "Description"], ["forbidden", "adjective", 6, "Not allowed by a rule or command.", "Rules & Choices"], ["friend", "noun", 5, "A person who is trusted and cared about.", "Relationships"], ["goodness", "noun", 2, "What is good, helpful, or beneficial.", "Values"], ["guide", "verb", 12, "To show the right direction or way to act.", "Guidance & Faith"], ["handful", "noun", 2, "An amount that can be held in one hand.", "Quantity & Description"], ["harm", "verb", 11, "To hurt or damage someone or something.", "Actions & Safety"], ["inborn", "adjective", 6, "Present naturally from birth.", "Human Nature"], ["intellect", "noun", 2, "The ability to reason, learn, and understand.", "Learning & Thinking"], ["jealous", "adjective", 10, "Unhappy because someone else has something one wants.", "Feelings"], ["jealousy", "noun", 12, "A feeling of wanting what another person has.", "Feelings"], ["knowledge", "noun", 2, "Information and understanding that someone has.", "Learning & Thinking"], ["lonely", "adjective", 5, "Unhappy because one is without companionship.", "Feelings"], ["message", "noun", 12, "An important idea or teaching passed to others.", "Communication & Faith"], ["Messenger", "noun", 1, "A person chosen by Allah to deliver His message.", "Spiritual Life"], ["mistake", "noun", 7, "An action or decision that is wrong.", "Learning & Choices"], ["offering", "noun", 10, "A gift or sacrifice made to show devotion.", "Spiritual Life"], ["origin", "noun", 3, "The point or material from which something begins.", "Ideas & Identity"], ["panic", "noun", 11, "Sudden strong fear that makes calm thinking difficult.", "Feelings"], ["pardon", "verb", 7, "To forgive someone for a wrong action.", "Forgiveness & Values"], ["purpose", "noun", 9, "The reason why something exists or is done.", "Ideas & Meaning"], ["raven", "noun", 11, "A large black bird.", "Animals & Nature"], ["righteously", "adverb", 9, "In a morally right way.", "Values & Conduct"], ["ruler", "noun", 1, "A person given responsibility to lead or manage.", "Leadership & Responsibility"], ["sacred", "adjective", 9, "Connected with religion and deserving special respect.", "Spiritual Life"], ["shame", "noun", 6, "A painful feeling connected with awareness of wrong behavior.", "Feelings & Values"], ["shelter", "noun", 8, "A place that gives protection from danger or weather.", "Survival & Daily Life"], ["shepherd", "noun", 10, "A person who takes care of sheep or other animals.", "People & Roles"], ["struggle", "verb", 8, "To make a strong effort during difficulty.", "Challenges & Effort"], ["superiority", "noun", 3, "The state of being considered better or higher.", "Values & Equality"], ["survive", "verb", 8, "To continue to live despite difficulty or danger.", "Survival & Life"], ["visible", "adjective", 6, "Able to be seen.", "Description"], ["weapons", "noun", 8, "Objects used for protection or fighting.", "Objects & Safety"], ["wife", "noun", 5, "A married woman in relation to her spouse.", "Family & Relationships"]];
  const gl = el('div', 'ui gl', `<div class="gl-top"><div class="ico">${ICON_BOOK}</div><div><div class="ui-ey">VOCABULARY LEARNING HUB</div><div class="ui-t" style="font-size:42px">Master Glossary</div><div class="ui-s" style="font-size:18px">Review the story vocabulary, map your confidence and keep difficult words visible.</div></div>
    <div class="gl-map"><small>CONFIDENCE MAP</small><b id="glPct">0%</b><p>This stage reflects your current self-assessment of the vocabulary.</p><div class="bar"><i id="glBar" style="background:linear-gradient(90deg,#00bc7d,#34d399)"></i></div></div></div>
    <div class="gl-stats"><div class="gl-st a"><small>ALL WORDS</small><b>48</b></div><div class="gl-st c"><small>CONFIDENT</small><b id="glC">0</b></div><div class="gl-st p"><small>PRACTICE</small><b id="glP">0</b></div><div class="gl-st n"><small>NEW</small><b id="glN">48</b></div></div>
    <div class="gl-filters"><div class="gl-search">⌕&nbsp;&nbsp;Search for a word or definition…</div><div class="gl-chip on">All words · 48</div><div class="gl-chip" id="glCc">Confident · 0</div><div class="gl-chip" id="glPc">Practice · 0</div><div class="gl-chip" id="glNc">New · 48</div><div class="gl-sel">All Chapters&nbsp;&nbsp;⌄</div></div>
    <div class="gl-view"><div class="gl-grid" id="glGrid"></div></div>`, world);
  const cap1 = w => w.charAt(0).toUpperCase() + w.slice(1);
  const gcards = GLOSS.map(([w, pos, ch, d, cat], i) => el('div', 'gc', `<div class="gn">${String(i + 1).padStart(2, '0')}<em>NEW</em></div><div class="spk"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z M15.5 9.5c1 1.2 1 3.8 0 5" fill="none" stroke="#e17100" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="gw">${cap1(w)}</div><div class="gp">${pos}<b>·</b>Chapter ${ch}</div><div class="gd">${d}</div><div class="gk">${cat}</div><div class="gf">Word Focus</div><div class="gb"><span class="y">✓ I know this</span><span class="x">✕ Needs practice</span></div>`, gl.querySelector('#glGrid')));
  // self-assessment played out on screen: which card gets marked, and when
  const MARKS = [[0, 'conf'], [2, 'conf'], [3, 'prac'], [5, 'conf'], [6, 'conf'], [9, 'conf'], [11, 'prac'], [13, 'conf'], [14, 'conf'], [16, 'conf'], [18, 'conf'], [21, 'prac'], [22, 'conf'], [25, 'conf']];

  /* Vocabulary Challenge (live UI content) */
  const VW = ['Messenger', 'Origin', 'Friend', 'Struggle', 'Disagreement', 'Guide', 'Fabulous', 'Arrogant'];
  const VM = ['A place that gives protection from danger or weather.', 'Too proud and sure of one’s own importance.', 'A person who takes care of sheep or other animals.', 'The point or material from which something begins.', 'A person chosen by Allah to deliver His message.', 'To show the right direction or way to act.', 'To make a strong effort during difficulty.', 'A serious difference of opinion.'];
  const vc = el('div', 'ui vc', `<div class="hrow"><div class="ico">${ICON_BOOK}</div><div><div class="ui-ey">VOCABULARY CHALLENGE</div><div class="ui-s" style="margin-top:4px">Move from meaning recognition to story context and active recall.</div></div></div>
    <div class="tabs"><div class="on">Match</div><div>In Context</div><div>Recall &amp; Use</div></div>
    <div class="vc-cnt"><span id="vcN">0/12</span><div class="bar"><i id="vcBar"></i></div></div>
    <div class="vc-hint">Select a word, then select its meaning to make a match.</div>
    <div class="vc-cols"><div><h5>WORDS</h5>${VW.map(w => `<div class="vc-w">${w}</div>`).join('')}</div><div><h5>MEANINGS</h5>${VM.map(m => `<div class="vc-m">${m}</div>`).join('')}</div><svg class="mt-svg"></svg></div>`, world);
  const vcL = Array.from(vc.querySelectorAll('.vc-w')), vcR = Array.from(vc.querySelectorAll('.vc-m')), vcSvg = vc.querySelector('.mt-svg');
  const VPAIRS = [[0, 4], [1, 3], [7, 1], [3, 6]];

  /* Language Review (live UI content, task 1 / 8) */
  const lrWrap = el('div', 'ui', '', world); lrWrap.style.width = '1400px';
  const lrHead = el('div', 'ui-pad', `<div class="kc-box" style="display:block;padding:22px 30px"><div style="display:flex;justify-content:space-between"><div><div class="ui-ey">AFTER VOCABULARY</div><div class="ui-t" style="font-size:40px">Language Review</div></div><div style="width:190px;font-size:13px;letter-spacing:.16em;color:#8a8579;font-weight:700">TASK <b style="float:right;color:var(--rust);font-size:18px">5 / 8</b><div class="bar" style="margin-top:12px"><i style="width:62.5%"></i></div></div></div>
    <div class="tabs amber" style="margin-top:14px"><div class="done">✓ Notice</div><div class="on">Build</div><div>Use</div></div></div>`, lrWrap);
  // Task 5 / 8 of the real Language Review (exercises.ts): sequencing, in the Build stage
  const SEQ = ['After an earlier event, a new situation began.', 'Over time, the situation changed.', 'Later, people took on new roles and responsibilities.', 'The influence still continues today.'];
  const SEQ_SHOWN = [2, 0, 3, 1];   // presented out of order, as the app does
  const lr = { c: el('div', 'ui-pad lrs', `<div class="ui-ey">LANGUAGE TASK</div><div class="ui-t" style="font-size:34px">Build a Coherent Development</div>
    <div class="mt-q" style="font-size:26px;margin-top:14px">How can a paragraph move from an earlier event to change, later development, and continuing influence?</div>
    <div class="sq-h">Click the events in the correct order</div>
    ${SEQ_SHOWN.map(k => `<div class="sq-i" data-k="${k}"><span>—</span>${SEQ[k]}</div>`).join('')}
    <div class="sq-btn">SELECT ALL EVENTS (0/4)</div>`, lrWrap) };
  const sqItems = Array.from(lr.c.querySelectorAll('.sq-i')), sqBtn = lr.c.querySelector('.sq-btn');
  lr.c.style.paddingTop = '0'; lrHead.style.paddingBottom = '18px';

  /* Final Challenge */
  const fc = el('div', 'ui fc', `<div class="ico">${ICON_TROPHY}</div><h2>Final Challenge</h2><p>You’ve reached the end of the journey. Bring the whole story together with a carefully designed final challenge.</p><div class="go" id="fcGo">START THE CHALLENGE &nbsp;→</div>`, world);
  const fcq = el('div', 'ui fcq', `<div class="ui-ey">FINAL CHALLENGE · VALUE BEYOND ORIGIN</div><div class="ui-s" style="margin-top:6px">Choose the best supported conclusion.</div>
    <div class="kc-q" style="margin-top:22px"><div class="qq" style="font-size:30px;font-weight:700;letter-spacing:-0.02em">Which contrast best explains the story’s criticism of Iblis’s idea of superiority?</div>
    <div class="kc-o"><span>A</span>Iblis has less physical strength than Adam</div><div class="kc-o"><span>B</span>The angels are made from soil</div><div class="kc-o" style="height:auto;padding:14px 18px;line-height:1.35"><span style="flex:none">C</span>Iblis focuses on material origin while the story emphasizes knowledge and rejects race, color, or group as sources of greatness</div></div>`, world);

  const STATIONS = [kc, gl, vc, lrWrap, fc];
  const GAP = 2400;
  // camera holds on each station; [arrive, leave] in film time
  const HOLD = [[30.0, 31.45], [32.0, 35.45], [36.0, 38.1], [38.667, 40.8], [41.333, 43.0]];
  const camX = t => {
    const keys = [[29.3, -0.35]];
    HOLD.forEach(([a, b], i) => { keys.push([a, i, bezier(0.5, 0, 0.2, 1)]); keys.push([b, i, E.lin]); });
    return K(t, keys) * GAP;
  };
  const gate = $('#s5bgp');
  let sized = false;

  scene('s5b', 29.3, 43.0, t => {
    if (!sized) { sized = true; STATIONS.forEach((s, i) => { s.__w = s.offsetWidth; s.__h = s.offsetHeight; s.__s = Math.min(1, 730 / s.__h, 1560 / s.__w); }); }
    const hand = { x: smoothNoise(t * 0.45, 61) * 5, y: smoothNoise(t * 0.4, 62) * 4 };
    const cx = camX(t), speed = Math.abs(camX(t + 1 / 60) - cx) * 60;
    const leave = P(t, 42.55, 43.0, E.inStrong);
    camTf(world, { px: cx + CX, py: CY, s: 1, sx: CX + hand.x, sy: CY + hand.y, z: -leave * 700, ry: clamp(speed / 900, 0, 1) * -3 });
    blur(world, Math.min(9, speed / 1500) + leave * 8);
    STATIONS.forEach((s, i) => {
      const dz = i % 2 ? -120 : 0;
      tf(s, { x: i * GAP + CX - s.__w / 2, y: 532 - s.__h / 2, z: dz, ry: 0, rx: 2, s: s.__s });
      const vis = Math.abs(i * GAP - cx) < GAP * 1.2;
      show(s, vis);
    });
    op(world, P(t, 29.4, 29.8, E.lin));
    /* the gate: an arch the camera passes through into the review part of the book */
    const g = P(t, 29.35, 30.1, bezier(0.55, 0, 0.9, 0.6));
    const k = 0.35 + g * 6;
    const gw = 360 * k, gh = 500 * k;
    gate.setAttribute('d', archD(CX - gw / 2, 560 - gh * 0.62, gw, gh, false));
    op($('#s5bgate'), P(t, 29.3, 29.5, E.lin) * (1 - P(t, 29.8, 30.05, E.lin)));
    /* order track + captions */
    const at = HOLD.map(([a, b]) => P(t, a - 0.45, a - 0.1, E.lin));
    const states = at.map((v, i) => v + (i < 4 ? at[i + 1] : P(t, 42.35, 42.6)));
    const trIn = P(t, 29.5, 30.1, E.outSoft);
    op(track, trIn * (1 - leave)); tf(track, { y: (1 - trIn) * -16 });
    paintFlow(track, states, [1, 2, 3, 4].map(i => at[i]));
    CAPS.forEach((c, i) => {
      const a = HOLD[i][0], b = HOLD[i][1];
      const p = P(t, a - 0.1, a + 0.45, E.outSoft) * (1 - P(t, b - 0.05, b + 0.25, E.in));
      c.style.opacity = p.toFixed(3); c.style.transform = `translateY(${((1 - P(t, a - 0.1, a + 0.45, E.outSoft)) * 30).toFixed(1)}px)`;
    });
    /* Knowledge Check interactions */
    const kB = t >= 30.45, kT = t >= 30.95;
    $('#kcB').classList.toggle('ok', kB); $('#kcT').classList.toggle('ok', kT);
    $('#kcA').textContent = `Answered ${(kB ? 1 : 0) + (kT ? 1 : 0)}/8`; $('#kcBar').style.width = `${((kB ? 1 : 0) + (kT ? 1 : 0)) * 12.5}%`;
    /* Master Glossary: 48 cards, self-assessment, scroll */
    gcards.forEach((c, i) => { const p = P(t, 31.85 + i * 0.012, 32.35 + i * 0.012, E.outSoft); c.style.opacity = p.toFixed(3); c.style.transform = `translateY(${((1 - p) * 30).toFixed(1)}px)`; });
    let conf = 0, prac = 0;
    MARKS.forEach(([idx, kind], j) => {
      const on = t >= 32.6 + j * 0.17;
      gcards[idx].classList.toggle(kind, on);
      if (on) { kind === 'conf' ? conf++ : prac++; gcards[idx].querySelector('em').textContent = kind === 'conf' ? 'CONFIDENT' : 'PRACTICE'; gcards[idx].querySelector('em').style.color = kind === 'conf' ? '#06905f' : '#d2334a'; }
      else { gcards[idx].querySelector('em').textContent = 'NEW'; gcards[idx].querySelector('em').style.color = ''; }
    });
    $('#glC').textContent = conf; $('#glP').textContent = prac; $('#glN').textContent = 48 - conf - prac;
    $('#glCc').textContent = `Confident · ${conf}`; $('#glPc').textContent = `Practice · ${prac}`; $('#glNc').textContent = `New · ${48 - conf - prac}`;
    $('#glPct').textContent = Math.round(conf / 48 * 100) + '%'; $('#glBar').style.width = (conf / 48 * 100) + '%';
    const scroll = P(t, 32.85, 35.45, bezier(0.45, 0, 0.4, 1)) * 2400;
    $('#glGrid').style.transform = `translateY(${-scroll.toFixed(1)}px)`;
    /* Vocabulary Challenge */
    VPAIRS.forEach(([li], k) => vcL[li].classList.toggle('sel', t >= 36.35 + k * 0.42 && t < 36.35 + k * 0.42 + 0.3));
    matchLines(vcSvg, vcL, vcR, VPAIRS, t, 36.5, 0.42);
    const vn = VPAIRS.filter((_, k) => t >= 36.5 + k * 0.42 + 0.34).length;
    $('#vcN').textContent = `${vn}/12`; $('#vcBar').style.width = (vn / 12 * 100) + '%';
    /* Language Review */
    // events are clicked in order (1 → 4), then the order is checked
    let picked = 0;
    sqItems.forEach(it => {
      const k = +it.dataset.k, at = 39.31 + k * 0.33, on = t >= at;
      if (on) picked++;
      it.classList.toggle('sel', on);
      it.querySelector('span').textContent = on ? String(k + 1) : '—';
      it.style.transform = `scale(${(1 - Math.exp(-Math.pow((t - at) / 0.06, 2)) * 0.015).toFixed(4)})`;
    });
    const checked = t >= 40.55;
    sqItems.forEach(it => it.classList.toggle('ok', checked));
    sqBtn.textContent = checked ? 'Correct. The development moves from earlier event to change, later stage, and present continuity.' : picked === 4 ? 'CHECK ORDER' : `SELECT ALL EVENTS (${picked}/4)`;
    sqBtn.className = 'sq-btn' + (checked ? ' ok' : picked === 4 ? ' ready' : '');
    /* Final Challenge */
    const go = Math.exp(-Math.pow((t - 42.0) / 0.07, 2));
    $('#fcGo').style.transform = `scale(${(1 - go * 0.05).toFixed(3)})`;
    const qIn = P(t, 41.7, 42.3, E.cam);
    tf(fcq, { x: 4 * GAP + CX - 580, y: lerp(1300, 200, qIn), z: 160, s: 0.92 });
    op(fcq, P(t, 41.7, 41.9, E.lin));
    show(fcq, false);
    drawDust(t, 0.2, 0);
  });
}

/* ----------------------------- S6 · LEVELS ----------------------------- */
{
  const world = $('#s6world');
  const LV = [
    ['lv0', 24.05, 'Temel', 'The period before Islam was called the Age of Ignorance, or Jahiliyyah.'],
    ['lv1', 24.7, 'Orta', 'The period before Islam was called the Age of Ignorance, or Jahiliyyah, because religious and social disorder was common in society.'],
    ['lv2', 25.35, 'Üst', 'This period is called the Age of Ignorance because people did not truly know Allah and lacked justice, order, and peace in both their personal and social lives.'],
  ].map(([id, t0, tr, sample], i) => {
    const e = $('#' + id);
    e.querySelector('.lvl-tag span').textContent = tr;
    const s = el('div', 'lvl-txt', `“${sample}”`, e);
    return { e, t0, img: e.querySelector('.lvl-img img'), tag: e.querySelector('.lvl-tag'), s, i };
  });
  const head = $('#s6head'), headSpans = maskLines(head);
  const path = $('#s6path');
  const outlines = LV.map(() => { const q = document.createElementNS('http://www.w3.org/2000/svg', 'path'); q.setAttribute('fill', 'none'); q.setAttribute('stroke', 'url(#goldStroke)'); q.setAttribute('stroke-width', '1.6'); $('#s6line').appendChild(q); return q; });
  const style = el('style', null, `.lvl-txt{position:absolute;left:40px;right:34px;top:calc(100% + 26px);font-size:17.5px;line-height:1.5;font-style:italic;color:rgba(253,246,230,.78)} .lvl-txt::before{content:'';display:block;width:34px;height:2px;background:var(--gold);margin-bottom:12px}`, document.head);

  scene('s6', 22.6, 29.0, t => {
    const leave = P(t, 28.35, 28.95, E.inStrong);
    const cam = P(t, 22.7, 28.6, E.lin);
    const hand = { x: smoothNoise(t * 0.4, 31) * 6, y: smoothNoise(t * 0.35, 32) * 5 };
    tf(world, { x: -cam * 60 + hand.x, y: hand.y + leave * 60, z: cam * 70 - leave * 400, rx: 4, ry: lerp(6, -4, cam) });
    const apex = [];
    LV.forEach(o => {
      const p = P(t, o.t0 - 0.12, o.t0 + 0.75, E.cam);
      const x = 440 + o.i * 450, base = 890 - o.i * 55;
      tf(o.e, { x, y: base - 640, z: 0, s: 1 });
      o.e.style.height = '640px'; o.e.style.width = '430px';
      o.e.querySelector('.lvl-img').style.clipPath = `url(#arch)`;
      o.img.style.transform = `translate3d(${(-cam * 30 + (o.i - 1) * 10).toFixed(1)}px,${((1 - p) * 60).toFixed(1)}px,0) scale(${(1.12 - 0.08 * p).toFixed(4)})`;
      o.e.style.clipPath = `inset(${((1 - p) * 100).toFixed(2)}% -10% -40% -10%)`;
      op(o.e, P(t, o.t0 - 0.12, o.t0 + 0.2, E.lin) * (1 - leave));
      blur(o.e, leave * 8);
      const tg = P(t, o.t0 + 0.2, o.t0 + 0.8, E.outSoft);
      o.tag.style.transform = `translateY(${((1 - tg) * 40).toFixed(1)}px)`; o.tag.style.opacity = tg.toFixed(3);
      const sp = P(t, 26.35 + o.i * 0.22, 26.95 + o.i * 0.22, E.outSoft);
      o.s.style.opacity = sp.toFixed(3); o.s.style.transform = `translateY(${((1 - sp) * 16).toFixed(1)}px)`;
      const r = o.e.getBoundingClientRect();
      apex.push([r.left + r.width / 2, r.top - 20, p]);
      const ol = outlines[o.i];
      ol.setAttribute('d', archD(r.left, r.top, r.width, r.height, false));
      const L = ol.getTotalLength();
      const dp = P(t, 23.15 + o.i * 0.18, 24.05 + o.i * 0.18, E.inOut);
      ol.style.strokeDasharray = `${(L * dp).toFixed(1)} ${L}`;
      ol.style.opacity = (0.9 - 0.55 * p).toFixed(3);
    });
    /* gold progression line: A2 → B1 → B2 */
    let d = '';
    apex.forEach(([x, y], i) => { d += (i ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); });
    const last = apex[2]; d += ` L${(last[0] + 150).toFixed(1)},${(last[1] - 50).toFixed(1)}`;
    path.setAttribute('d', d);
    const len = path.getTotalLength();
    const lp = P(t, 24.8, 26.6, E.inOut);
    path.style.strokeDasharray = `${len}`; path.style.strokeDashoffset = `${(len * (1 - lp)).toFixed(1)}`;
    op($('#s6line'), 1 - leave);
    headSpans.forEach((s, i) => riseIn(s, t, 22.95 + i * 0.16, 0.8));
    op(head, 1 - leave);
    drawDust(t, 0.3, -0.1);
  });
}

/* ----------------------------- S7 · GUIDES ----------------------------- */
{
  /* section names and icons as the app shows them (Teacher's Book and Self-Study Guide, Adam B1) */
  const TG = [["Overview", "<path d=\"M96,104a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H104A8,8,0,0,1,96,104Zm8,40h64a8,8,0,0,0,0-16H104a8,8,0,0,0,0,16Zm128,48a32,32,0,0,1-32,32H88a32,32,0,0,1-32-32V64a16,16,0,0,0-32,0c0,5.74,4.83,9.62,4.88,9.66h0A8,8,0,0,1,24,88a7.89,7.89,0,0,1-4.79-1.61h0C18.05,85.54,8,77.61,8,64A32,32,0,0,1,40,32H176a32,32,0,0,1,32,32V168h8a8,8,0,0,1,4.8,1.6C222,170.46,232,178.39,232,192ZM96.26,173.48A8.07,8.07,0,0,1,104,168h88V64a16,16,0,0,0-16-16H67.69A31.71,31.71,0,0,1,72,64V192a16,16,0,0,0,32,0c0-5.74-4.83-9.62-4.88-9.66A7.82,7.82,0,0,1,96.26,173.48ZM216,192a12.58,12.58,0,0,0-3.23-8h-94a26.92,26.92,0,0,1,1.21,8,31.82,31.82,0,0,1-4.29,16H200A16,16,0,0,0,216,192Z\"></path>"], ["Curriculum Alignment", "<path d=\"M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z\"></path>"], ["Teaching Approach", "<path d=\"M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-16,0a72,72,0,0,0-73.74-72c-39,.92-70.47,33.39-70.26,72.39a71.65,71.65,0,0,0,27.64,56.3A32,32,0,0,1,96,186v6h64v-6a32.15,32.15,0,0,1,12.47-25.35A71.65,71.65,0,0,0,200,104Zm-16.11-9.34a57.6,57.6,0,0,0-46.56-46.55,8,8,0,0,0-2.66,15.78c16.57,2.79,30.63,16.85,33.44,33.45A8,8,0,0,0,176,104a9,9,0,0,0,1.35-.11A8,8,0,0,0,183.89,94.66Z\"></path>"], ["Reading Framework", "<path d=\"M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78l.09-.07L83,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,224h0ZM216,192H80a8,8,0,0,0-5.23,1.95L40,224V64H216ZM88,112a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H96A8,8,0,0,1,88,112Zm0,32a8,8,0,0,1,8-8h64a8,8,0,1,1,0,16H96A8,8,0,0,1,88,144Z\"></path>"], ["Chapter Support", "<path d=\"M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24Zm-8,160H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40H200Z\"></path>"], ["Classroom Management", "<path d=\"M224,128a8,8,0,0,1-8,8H104a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM104,72H216a8,8,0,0,0,0-16H104a8,8,0,0,0,0,16ZM216,184H104a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM43.58,55.16,48,52.94V104a8,8,0,0,0,16,0V40a8,8,0,0,0-11.58-7.16l-16,8a8,8,0,0,0,7.16,14.32ZM79.77,156.72a23.73,23.73,0,0,0-9.6-15.95,24.86,24.86,0,0,0-34.11,4.7,23.63,23.63,0,0,0-3.57,6.46,8,8,0,1,0,15,5.47,7.84,7.84,0,0,1,1.18-2.13,8.76,8.76,0,0,1,12-1.59A7.91,7.91,0,0,1,63.93,159a7.64,7.64,0,0,1-1.57,5.78,1,1,0,0,0-.08.11L33.59,203.21A8,8,0,0,0,40,216H72a8,8,0,0,0,0-16H56l19.08-25.53A23.47,23.47,0,0,0,79.77,156.72Z\"></path>"], ["Differentiation", "<path d=\"M160,40a32,32,0,1,0-32,32A32,32,0,0,0,160,40ZM128,56a16,16,0,1,1,16-16A16,16,0,0,1,128,56ZM231.5,87.71A19.62,19.62,0,0,0,212,72H44a20,20,0,0,0-8.38,38.16l.13,0,50.75,22.35-21,79.72A20,20,0,0,0,102,228.8l26-44.87,26,44.87a20,20,0,0,0,36.4-16.52l-21-79.72,50.75-22.35.13,0A19.64,19.64,0,0,0,231.5,87.71Zm-17.8,7.9-56.93,25.06a8,8,0,0,0-4.51,9.36L175.13,217a7,7,0,0,0,.49,1.35,4,4,0,0,1-5,5.45,4,4,0,0,1-2.25-2.07,6.31,6.31,0,0,0-.34-.63L134.92,164a8,8,0,0,0-13.84,0L88,221.05a6.31,6.31,0,0,0-.34.63,4,4,0,0,1-2.25,2.07,4,4,0,0,1-5-5.45,7,7,0,0,0,.49-1.35L103.74,130a8,8,0,0,0-4.51-9.36L42.3,95.61A4,4,0,0,1,44,88H212a4,4,0,0,1,1.73,7.61Z\"></path>"], ["Assessment & Rubrics", "<path d=\"M216,96A88,88,0,1,0,72,163.83V240a8,8,0,0,0,11.58,7.16L128,225l44.43,22.21A8.07,8.07,0,0,0,176,248a8,8,0,0,0,8-8V163.83A87.85,87.85,0,0,0,216,96ZM56,96a72,72,0,1,1,72,72A72.08,72.08,0,0,1,56,96ZM168,227.06l-36.43-18.21a8,8,0,0,0-7.16,0L88,227.06V174.37a87.89,87.89,0,0,0,80,0ZM128,152A56,56,0,1,0,72,96,56.06,56.06,0,0,0,128,152Zm0-96A40,40,0,1,1,88,96,40,40,0,0,1,128,56Z\"></path>"], ["Kinesthetic Learning", "<path d=\"M90.34,61.66a8,8,0,0,1,0-11.32l32-32a8,8,0,0,1,11.32,0l32,32a8,8,0,0,1-11.32,11.32L136,43.31V96a8,8,0,0,1-16,0V43.31L101.66,61.66A8,8,0,0,1,90.34,61.66Zm64,132.68L136,212.69V160a8,8,0,0,0-16,0v52.69l-18.34-18.35a8,8,0,0,0-11.32,11.32l32,32a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Zm83.32-72-32-32a8,8,0,0,0-11.32,11.32L212.69,120H160a8,8,0,0,0,0,16h52.69l-18.35,18.34a8,8,0,0,0,11.32,11.32l32-32A8,8,0,0,0,237.66,122.34ZM43.31,136H96a8,8,0,0,0,0-16H43.31l18.35-18.34A8,8,0,0,0,50.34,90.34l-32,32a8,8,0,0,0,0,11.32l32,32a8,8,0,0,0,11.32-11.32Z\"></path>"], ["Global Citizenship", "<path d=\"M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm88,104a87.61,87.61,0,0,1-3.33,24H174.16a157.44,157.44,0,0,0,0-48h38.51A87.61,87.61,0,0,1,216,128ZM102,168H154a115.11,115.11,0,0,1-26,45A115.27,115.27,0,0,1,102,168Zm-3.9-16a140.84,140.84,0,0,1,0-48h59.88a140.84,140.84,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.84a157.44,157.44,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154,88H102a115.11,115.11,0,0,1,26-45A115.27,115.27,0,0,1,154,88Zm52.33,0H170.71a135.28,135.28,0,0,0-22.3-45.6A88.29,88.29,0,0,1,206.37,88ZM107.59,42.4A135.28,135.28,0,0,0,85.29,88H49.63A88.29,88.29,0,0,1,107.59,42.4ZM49.63,168H85.29a135.28,135.28,0,0,0,22.3,45.6A88.29,88.29,0,0,1,49.63,168Zm98.78,45.6a135.28,135.28,0,0,0,22.3-45.6h35.66A88.29,88.29,0,0,1,148.41,213.6Z\"></path>"], ["Values Education", "<path d=\"M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z\"></path>"], ["Sensitive Notes", "<path d=\"M120,136V96a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,48a12,12,0,1,0-12-12A12,12,0,0,0,128,184ZM224,56v56c0,52.72-25.52,84.67-46.93,102.19-23.06,18.86-46,25.27-47,25.53a8,8,0,0,1-4.2,0c-1-.26-23.91-6.67-47-25.53C57.52,196.67,32,164.72,32,112V56A16,16,0,0,1,48,40H208A16,16,0,0,1,224,56Zm-16,0L48,56l0,56c0,37.3,13.82,67.51,41.07,89.81A128.25,128.25,0,0,0,128,223.62a129.3,129.3,0,0,0,39.41-22.2C194.34,179.16,208,149.07,208,112Z\"></path>"], ["English Tips", "<path d=\"M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78l.09-.07L83,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,224h0ZM216,192H80a8,8,0,0,0-5.23,1.95L40,224V64H216ZM88,112a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H96A8,8,0,0,1,88,112Zm0,32a8,8,0,0,1,8-8h64a8,8,0,1,1,0,16H96A8,8,0,0,1,88,144Z\"></path>"], ["Home Connection", "<path d=\"M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z\"></path>"], ["Quick Checklist", "<path d=\"M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z\"></path>"], ["Appendices", "<path d=\"M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z\"></path>"]];
  const SG = [["Study Home", "<path d=\"M96,104a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H104A8,8,0,0,1,96,104Zm8,40h64a8,8,0,0,0,0-16H104a8,8,0,0,0,0,16Zm128,48a32,32,0,0,1-32,32H88a32,32,0,0,1-32-32V64a16,16,0,0,0-32,0c0,5.74,4.83,9.62,4.88,9.66h0A8,8,0,0,1,24,88a7.89,7.89,0,0,1-4.79-1.61h0C18.05,85.54,8,77.61,8,64A32,32,0,0,1,40,32H176a32,32,0,0,1,32,32V168h8a8,8,0,0,1,4.8,1.6C222,170.46,232,178.39,232,192ZM96.26,173.48A8.07,8.07,0,0,1,104,168h88V64a16,16,0,0,0-16-16H67.69A31.71,31.71,0,0,1,72,64V192a16,16,0,0,0,32,0c0-5.74-4.83-9.62-4.88-9.66A7.82,7.82,0,0,1,96.26,173.48ZM216,192a12.58,12.58,0,0,0-3.23-8h-94a26.92,26.92,0,0,1,1.21,8,31.82,31.82,0,0,1-4.29,16H200A16,16,0,0,0,216,192Z\"></path>"], ["Study Path", "<path d=\"M224,128a8,8,0,0,1-8,8H104a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM104,72H216a8,8,0,0,0,0-16H104a8,8,0,0,0,0,16ZM216,184H104a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM43.58,55.16,48,52.94V104a8,8,0,0,0,16,0V40a8,8,0,0,0-11.58-7.16l-16,8a8,8,0,0,0,7.16,14.32ZM79.77,156.72a23.73,23.73,0,0,0-9.6-15.95,24.86,24.86,0,0,0-34.11,4.7,23.63,23.63,0,0,0-3.57,6.46,8,8,0,1,0,15,5.47,7.84,7.84,0,0,1,1.18-2.13,8.76,8.76,0,0,1,12-1.59A7.91,7.91,0,0,1,63.93,159a7.64,7.64,0,0,1-1.57,5.78,1,1,0,0,0-.08.11L33.59,203.21A8,8,0,0,0,40,216H72a8,8,0,0,0,0-16H56l19.08-25.53A23.47,23.47,0,0,0,79.77,156.72Z\"></path>"], ["1. One Chapter per Session", "<path d=\"M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z\"></path>"], ["2. Listen and Read", "<path d=\"M201.89,54.66A103.43,103.43,0,0,0,128.79,24H128A104,104,0,0,0,24,128v56a24,24,0,0,0,24,24H64a24,24,0,0,0,24-24V144a24,24,0,0,0-24-24H40.36A88,88,0,0,1,128,40h.67a87.71,87.71,0,0,1,87,80H192a24,24,0,0,0-24,24v40a24,24,0,0,0,24,24h16a24,24,0,0,0,24-24V128A103.41,103.41,0,0,0,201.89,54.66ZM64,136a8,8,0,0,1,8,8v40a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V136Zm152,48a8,8,0,0,1-8,8H192a8,8,0,0,1-8-8V144a8,8,0,0,1,8-8h24Z\"></path>"], ["3. Word Notes and Hotspots", "<path d=\"M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z\"></path>"], ["4. Quick Challenge", "<path d=\"M152,224a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h32A8,8,0,0,1,152,224ZM128,112a12,12,0,1,0-12-12A12,12,0,0,0,128,112Zm95.62,43.83-12.36,55.63a16,16,0,0,1-25.51,9.11L158.51,200h-61L70.25,220.57a16,16,0,0,1-25.51-9.11L32.38,155.83a16.09,16.09,0,0,1,3.32-13.71l28.56-34.26a123.07,123.07,0,0,1,8.57-36.67c12.9-32.34,36-52.63,45.37-59.85a16,16,0,0,1,19.6,0c9.34,7.22,32.47,27.51,45.37,59.85a123.07,123.07,0,0,1,8.57,36.67l28.56,34.26A16.09,16.09,0,0,1,223.62,155.83ZM99.43,184h57.14c21.12-37.54,25.07-73.48,11.74-106.88C156.55,47.64,134.49,29,128,24c-6.51,5-28.57,23.64-40.33,53.12C74.36,110.52,78.31,146.46,99.43,184Zm-15,5.85Q68.28,160.5,64.83,132.16L48,152.36,60.36,208l.18-.13ZM208,152.36l-16.83-20.2q-3.42,28.28-19.56,57.69l23.85,18,.18.13Z\"></path>"], ["5. Language Focus", "<path d=\"M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z\"></path>"], ["6. When It Is Hard", "<path d=\"M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-16,0a72,72,0,0,0-73.74-72c-39,.92-70.47,33.39-70.26,72.39a71.65,71.65,0,0,0,27.64,56.3A32,32,0,0,1,96,186v6h64v-6a32.15,32.15,0,0,1,12.47-25.35A71.65,71.65,0,0,0,200,104Zm-16.11-9.34a57.6,57.6,0,0,0-46.56-46.55,8,8,0,0,0-2.66,15.78c16.57,2.79,30.63,16.85,33.44,33.45A8,8,0,0,0,176,104a9,9,0,0,0,1.35-.11A8,8,0,0,0,183.89,94.66Z\"></path>"], ["7. Values in the Story", "<path d=\"M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z\"></path>"], ["8. At the End of the Book", "<path d=\"M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z\"></path>"]];
  const gIc = body => `<div class="ic"><svg viewBox="0 0 256 256" fill="currentColor">${body}</svg></div>`;
  const tgItems = TG.map(([s, g], i) => el('div', 'g-item', `${gIc(g)}<span class="n">${i + 1}</span><span class="t">${s.replace('&', '&amp;')}</span>`, $('#tgList')));
  const sgItems = SG.map(([s, g]) => el('div', 'g-item', `${gIc(g)}<span class="t">${s}</span>`, $('#sgList')));
  const tgMap = $('#tgList .g-map'), tgMapN = tgMap.querySelector('.g-map-r b'), tgEyebrow = $('#tg .g-eyebrow');
  const map = Array.from({ length: 12 }, (_, i) => el('div', '', String(i + 1), $('#sgMap')));
  const tg = $('#tg'), sg = $('#sg'), seam = $('#s7seam');
  const lblL = $('#s7lblL'), lblR = $('#s7lblR');
  const lblLs = Array.from(lblL.children), lblRs = Array.from(lblR.children);
  [tg, sg].forEach(g => { g.style.width = '1180px'; g.style.height = '780px'; });
  const SC = 0.74;

  scene('s7', 28.5, 34.6, t => {
    const sd = P(t, 28.55, 29.0, E.cam);
    const close = P(t, 33.55, 34.4, bezier(0.7, 0, 0.9, 0.5));
    seam.style.transform = `scale(${(1 + Math.pow(close, 3) * 26).toFixed(3)},${sd.toFixed(4)})`;
    op(seam, sd * (1 + close * 0.6));
    seam.style.boxShadow = `0 0 ${(24 + close * 60).toFixed(0)}px ${(6 + close * 30).toFixed(0)}px rgba(243,213,138,${(0.6 + close * 0.3).toFixed(2)})`;
    const oL = P(t, 28.9, 29.75, E.cam), oR = P(t, 31.5, 32.35, E.cam);
    const hand = smoothNoise(t * 0.4, 41) * 3;
    // pages hinge on the seam, like an opening book
    const gw = 1180 * SC, gh = 780 * SC;
    tg.style.transformOrigin = '100% 50%'; sg.style.transformOrigin = '0% 50%';
    tf(tg, { x: 945 - 1180, y: CY - 780 / 2 - 60 + hand, z: -120, ry: lerp(88, 17, oL) + close * 73, s: SC });
    tf(sg, { x: 975, y: CY - 780 / 2 - 60 - hand, z: -120, ry: lerp(-88, -17, oR) - close * 73, s: SC });
    op(tg, P(t, 28.9, 29.1, E.lin)); op(sg, P(t, 31.5, 31.7, E.lin));
    tg.style.filter = `brightness(${(0.55 + 0.45 * oL).toFixed(3)})`; sg.style.filter = `brightness(${(0.55 + 0.45 * oR).toFixed(3)})`;
    /* teacher side: browsing the 16-part guide map */
    const browse = Math.max(0, (t - 29.8) / 0.3);
    const active = Math.min(15, Math.floor(browse));
    const scroll = clamp(browse - 5, 0, 9) * 62;
    tgMap.style.transform = `translate3d(0,${(-scroll).toFixed(1)}px,0)`;
    tgMapN.textContent = `${active + 1} / 16`; tgEyebrow.textContent = `TEACHER WORKSPACE · ${active + 1} / 16`;
    const tp = Math.round((active + 1) / 16 * 100);
    $('#tgPct').textContent = tp + '%'; $('#tgBar').style.width = tp + '%';
    tgItems.forEach((it, i) => {
      const p = P(t, 29.3 + i * 0.035, 29.8 + i * 0.035, E.outSoft);
      it.style.opacity = p.toFixed(3);
      it.style.transform = `translate3d(${((1 - p) * -24).toFixed(1)}px,${(-scroll).toFixed(1)}px,0)`;
      it.classList.toggle('on', i === active);
    });
    /* student side: progress through the self-study route */
    sgItems.forEach((it, i) => {
      const p = P(t, 31.9 + i * 0.035, 32.4 + i * 0.035, E.outSoft);
      it.style.opacity = p.toFixed(3); it.classList.toggle('on', i === 0);
    });
    const done = Math.floor(clamp((t - 32.35) / 1.0) * 6);
    map.forEach((m, i) => { m.className = i < done ? 'done' : i === done ? 'on' : ''; });
    const pct = Math.round(lerp(8, 50, clamp((t - 32.35) / 1.0)));
    $('#sgPct').textContent = pct + '%'; $('#sgBar').style.width = pct + '%';
    $('#sgFrac').textContent = `${Math.min(12, done + 1)} / 12`; $('#sgDone').textContent = done;
    $('#sgAct').textContent = `${done * 5} / 60`;
    $('#sgFrac2').textContent = $('#sgFrac').textContent; $('#sgAct2').textContent = $('#sgAct').textContent; $('#sgBar2').style.width = pct + '%';
    /* labels */
    lblLs.forEach((s, i) => { const p = P(t, 29.35 + i * 0.1, 29.95 + i * 0.1, E.outSoft); s.style.opacity = p * (1 - close); s.style.transform = `translateY(${((1 - p) * 26).toFixed(1)}px)`; });
    lblRs.forEach((s, i) => { const p = P(t, 31.85 + i * 0.1, 32.45 + i * 0.1, E.outSoft); s.style.opacity = p * (1 - close); s.style.transform = `translateY(${((1 - p) * 26).toFixed(1)}px)`; });
    drawDust(t, 0.22, 0);
    $('#flash').style.opacity = (P(t, 34.25, 34.45, E.in) * 0.6).toFixed(3);
  });
}

/* ----------------------------- S8 · FINALE ----------------------------- */
{
  const wall = $('#s8wall');
  const tiles = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 11; c++) {
    const i = (r * 11 + c) % 60;
    const d = el('div', 'wall', `<img src="assets/img/wall/w${String(i).padStart(2, '0')}.jpg">`, wall);
    tiles.push({ d, r, c, ph: (r * 7 + c * 13) % 10 / 10 });
  }
  const word = $('#s8word');
  word.innerHTML = 'Lisandan Kültüre'.split('').map(ch => `<span class="clip"><span class="ch">${ch === ' ' ? '&nbsp;' : ch}</span></span>`).join('');
  const chars = Array.from(word.querySelectorAll('.ch'));
  const logo = $('#s8logo'), sheen = $('#s8sheen'), flare = $('#s8flare');
  const sub = $('#s8sub'), meta = $('#s8meta');

  scene('s8', 34.4, OLD_END, t => {
    const a = P(t, 34.45, 36.0, E.cam);
    const drift = t - 34.45;
    tf(wall, { x: CX, y: CY, z: -900 + drift * 60, rx: 24, rz: -9, s: 1 });
    tiles.forEach(o => {
      const x = (o.c - 5) * 254 - 115 + (o.r % 2) * 127, y = (o.r - 3) * 318 - 145;
      const p = P(t, 34.45 + o.ph * 0.5, 35.4 + o.ph * 0.5, E.cam);
      tf(o.d, { x, y: y + (1 - p) * 200, z: (1 - p) * -700 + Math.sin(drift * 0.8 + o.ph * 6) * 20 });
      op(o.d, p * 0.9);
    });
    op($('#s8dark'), 1);
    const lg = P(t, 34.5, 35.4, E.cam);
    tf(logo, { s: lerp(0.72, 1, lg) + drift * 0.012, y: (1 - lg) * 40 - P(t, 35.1, 35.9, E.cam) * 0 });
    op(logo, P(t, 34.5, 34.9, E.lin)); blur(logo, (1 - lg) * 18);
    sheen.style.backgroundPosition = `${(lerp(120, -40, P(t, 35.15, 36.1, E.inOut))).toFixed(1)}% 0`;
    const fl = Math.exp(-Math.pow((t - 35.25) / 0.25, 2));
    tf(flare, { s: 0.2 + fl * 0.9, rz: drift * 30 }); op(flare, fl);
    chars.forEach((c, i) => { const p = P(t, 35.3 + i * 0.035, 36.1 + i * 0.035, E.outSoft); c.style.transform = `translate3d(0,${((1 - p) * 135).toFixed(1)}%,0)`; });
    const sp = P(t, 35.95, 36.6, E.outSoft); sub.style.opacity = sp; sub.style.letterSpacing = `${lerp(0.6, 0.34, sp).toFixed(3)}em`;
    const mp = P(t, 36.6, 37.3, E.outSoft); meta.style.opacity = mp; tf(meta, { y: (1 - mp) * 16 });
    const fade = P(t, OLD_END - 0.55, OLD_END, E.inOut);
    $('#stage').style.filter = fade > 0 ? `brightness(${(1 - fade).toFixed(3)})` : '';
    drawDust(t, 0.45 * a, 0.05);
    $('#flash').style.opacity = (Math.exp(-Math.pow((t - 34.47) / 0.18, 2)) * 0.9).toFixed(3);
  });
}

function nHead(sec, eyebrow, lines, cls = '') {
  const h = el('div', 'kin nhead ' + cls, `<div class="eyebrow" lang="en">${eyebrow}</div>${lines.map(([x, g]) => `<div class="line${g ? ' gold' : ''}">${x}</div>`).join('')}`, sec);
  h.setAttribute('lang', 'tr');
  return { el: h, spans: maskLines(h) };
}
function headAt(h, t, t0, t1) {
  h.spans.forEach((s, i) => riseIn(s, t, t0 + i * 0.1, 0.75));
  const o = P(t, t1, t1 + 0.35, E.in);
  op(h.el, (t >= t0 ? 1 : 0) * (1 - o)); blur(h.el, o * 10, 'drop-shadow(0 10px 30px rgba(0,0,0,.6))');
  show(h.el, t >= t0 - 0.05 && o < 1);
}
/** the finger: approaches, presses at tt, ripples. Returns its visibility (0..1). */
function finger(tapEl, t, tt, target, fx = 0.5, fy = 0.5, pre = 0.32, post = 0.34) {
  const v = P(t, tt - pre, tt - pre * 0.55, E.lin) * (1 - P(t, tt + post * 0.5, tt + post, E.lin));
  if (v <= 0) return 0;
  let r = target.getBoundingClientRect();
  if (!r.width && target._lr) r = target._lr; else target._lr = r;   // the target may hide itself once pressed
  const x = r.left + r.width * fx, y = r.top + r.height * fy;
  const mv = P(t, tt - pre, tt, E.outSoft), press = Math.exp(-Math.pow((t - tt) / 0.06, 2));
  tapEl.style.left = lerp(x + 110, x, mv) + 'px'; tapEl.style.top = lerp(y + 80, y, mv) + 'px';
  tapEl.style.transform = `scale(${(1 - press * 0.25).toFixed(3)})`;
  const rp = clamp((t - tt) / 0.4);
  tapEl.style.setProperty('--r', (1 + rp * 1.8).toFixed(3)); tapEl.style.setProperty('--ro', (t > tt ? 1 - rp : 0).toFixed(3));
  return v;
}
const press = (t, tt) => 1 - Math.exp(-Math.pow((t - tt) / 0.06, 2)) * 0.05;
function shot(parent, src, w, h, radius = 26) {
  const d = el('div', 'shot', `<img src="assets/img/app/${src}">`, parent);
  d.style.width = w + 'px'; d.style.height = h + 'px'; d.style.borderRadius = radius + 'px';
  return d;
}
const glowBg = sec => el('div', 'nbg', '', sec);

/* ======================================================================
   v10 · INSERTED FEATURE SCENES
   The v8 film above plays exactly as it was. At seven points (timeline.json → inserts) it pauses
   on its own frame while one of these scenes fades in over it, plays, and fades out again; then v8
   carries on from the same frame. Each scene runs on its own clock u: −fade … len (seconds).
   The app screens are 2× screenshots of the running app (assets/img/app/, captured 4 Oct 2026);
   the result card, level test and My words dialogs are recomposed from the components' own text.
   ====================================================================== */
const INSERT_SCENES = {};
const ins = (id, len, update) => { INSERT_SCENES[id] = { id, el: document.getElementById(id), len, update }; };
/** a 1920×1080 app screenshot as a camera plane; extra states stack on top and cross-fade */
function appShot(parent, states) {
  const d = el('div', 'shot', '', parent);
  Object.assign(d.style, { width: W + 'px', height: H + 'px', borderRadius: '22px', transformOrigin: '0 0' });
  const imgs = states.map((s, i) => { const im = el('img', '', null, d); im.src = `assets/img/app/${s}.jpg`; Object.assign(im.style, { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: i ? 0 : 1 }); return im; });
  return { d, imgs };
}
/** a clipped window onto a screenshot (iw×ih css px); view(fx, fy, s) puts image point (fx,fy) at the window centre */
function winShot(parent, states, iw, ih, ww, wh, radius = 28) {
  const d = el('div', 'shot', '', parent);
  Object.assign(d.style, { width: ww + 'px', height: wh + 'px', borderRadius: radius + 'px' });
  const inner = el('div', '', '', d);
  Object.assign(inner.style, { position: 'absolute', left: 0, top: 0, width: iw + 'px', height: ih + 'px', transformOrigin: '0 0' });
  const imgs = states.map((s, i) => { const im = el('img', '', null, inner); im.src = `assets/img/app/${s}.jpg`; Object.assign(im.style, { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: i ? 0 : 1 }); return im; });
  const view = (fx, fy, s) => { inner.style.transform = `translate(${(ww / 2 - fx * s).toFixed(2)}px,${(wh / 2 - fy * s).toFixed(2)}px) scale(${s.toFixed(4)})`; };
  return { d, inner, imgs, view };
}
/** an invisible box inside a plane, in the plane's own (css) pixels: something to tap or light up */
function spot(parent, x, y, w, h, cls = '') { const s = el('div', cls, '', parent); Object.assign(s.style, { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); return s; }
const swapAt = (imgs, t, times, d = 0.18) => imgs.forEach((im, i) => { if (i) im.style.opacity = P(t, times[i - 1], times[i - 1] + d, E.inOut).toFixed(3); });
const handDrift = (t, seed) => ({ x: smoothNoise(t * 0.4, seed) * 5, y: smoothNoise(t * 0.35, seed + 1) * 4 });
/** a calmer finger than v9's: longer approach and release */
const tapAt = (tapEl, t, tt, target, fx = 0.5, fy = 0.5) => finger(tapEl, t, tt, target, fx, fy, 0.55, 0.6);

/* ----------------------- N1 · THREE PATHS ("Herkes için bir yol.") -----------------------
   src/components/layout/RolePicker.tsx: the same three choices, shown with icon and name only. */
{
  const S = $('#n1'), w = $('#n1w');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 62% 42%, rgba(216,179,92,.14), rgba(0,0,0,0) 70%)';
  const rp = el('div', 'rp', `<div class="rp-ey">FROM LANGUAGE TO CULTURE</div><div class="rp-h">How will you use the library?</div>
    <div class="rp-cards">${[['BookOpen', 'Student'], ['GraduationCap', 'Teacher'], ['User', 'On my own']].map(([i, n]) => `<div class="rp-c"><div class="ic">${ico(i)}</div><b>${n}</b></div>`).join('')}</div>`, w);
  const cards = Array.from(rp.querySelectorAll('.rp-c')), top = Array.from(rp.querySelectorAll('.rp-ey, .rp-h'));
  const head = nHead(S, 'Student · Teacher · On my own', [['Herkes için bir yol.', true]]);
  const tap = el('div', 'tap', null, S);
  const LIT = [[1.9, 3.1], [3.1, 4.3], [4.3, 5.5]], T_TAP = 6.1;
  let rw = null;
  ins('n1', 8.0, u => {
    if (!rw) rw = { w: rp.offsetWidth, h: rp.offsetHeight };
    const hd = handDrift(u, 91), a = P(u, -0.5, 0.9, E.cam), out = P(u, 7.4, 8.0, E.in);
    tf(rp, { x: 1170 - rw.w / 2 + hd.x, y: 410 - rw.h / 2 + hd.y + (1 - a) * 110, z: lerp(-700, 0, a) - out * 300, rx: lerp(14, 3, a), ry: lerp(-18, -7, a) });
    op(rp, P(u, -0.4, 0.2, E.lin)); blur(rp, out * 6);
    top.forEach((e, i) => { const q = P(u, 0.2 + i * 0.12, 0.8 + i * 0.12, E.outSoft); e.style.opacity = q.toFixed(3); e.style.transform = `translateY(${((1 - q) * 16).toFixed(1)}px)`; });
    cards.forEach((c, i) => {
      const q = P(u, 0.5 + i * 0.15, 1.2 + i * 0.15, E.outSoft);
      const [l0, l1] = LIT[i];
      const lit = i === 0 ? (u >= l0 && u < l1) || u >= T_TAP : u >= l0 && u < l1;
      c.classList.toggle('on', lit);
      c.style.opacity = q.toFixed(3);
      c.style.transform = `translateY(${((1 - q) * 40).toFixed(1)}px) scale(${((lit ? 1.03 : 1) * (i === 0 ? press(u, T_TAP) : 1)).toFixed(4)})`;
    });
    op(tap, tapAt(tap, u, T_TAP, cards[0], 0.5, 0.45) * (1 - out));
    headAt(head, u, 0.5, 7.45);
    drawDust(u + 60, 0.25, 0.05);
  });
}

/* ----------------------- N2 · BEFORE YOU READ ("Okumadan önce tahmin et.") -----------------------
   Prophet Adam B1, chapter 1, live: guess (soil) → Check my guess → Your guess was right! */
{
  const S = $('#n2'), w = $('#n2w');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 55% 40%, rgba(216,179,92,.12), rgba(0,0,0,0) 70%)';
  const { d: pg, imgs } = appShot(w, ['byr0', 'byr1', 'byr2']);
  const optB = spot(pg, 1102, 257, 252, 34), chk = spot(pg, 1472, 234, 144, 28);
  const hi = spot(pg, 828, 218, 802, 98, 'shot-hi');
  const shade = el('div', 'cap-shade deep', '', S); shade.style.zIndex = 5;
  const head = nHead(S, 'Before you read', [['Okumadan önce tahmin et.', true]]);
  const tap = el('div', 'tap', null, S);
  const T_B = 2.1, T_CHK = 3.9;
  ins('n2', 8.0, u => {
    const hd = handDrift(u, 93), a = P(u, -0.5, 1.0, E.cam), out = P(u, 7.4, 8.0, E.in);
    const z = P(u, 4.2, 7.4, E.inOut);
    camTf(pg, { px: lerp(1180, 1240, a) + z * 16, py: lerp(420, 330, a) + z * 10, s: lerp(1.05, 1.5, a) + z * 0.06, sx: CX + hd.x, sy: 400 + hd.y, z: lerp(-500, 0, a), ry: lerp(-14, -4, a), rx: lerp(6, 2, a) });
    op(pg, P(u, -0.45, 0.1, E.lin)); blur(pg, out * 6);
    swapAt(imgs, u, [T_B + 0.02, T_CHK + 0.02], 0.12);
    hi.style.opacity = (P(u, T_CHK + 0.15, T_CHK + 0.5, E.outSoft) * (1 - P(u, 6.6, 7.2, E.in)) * 0.9).toFixed(3);
    op(tap, Math.max(tapAt(tap, u, T_B, optB), tapAt(tap, u, T_CHK, chk)) * (1 - out));
    op(shade, P(u, 0, 0.6));
    headAt(head, u, 0.6, 7.45);
    drawDust(u + 64, 0.22, 0.05);
  });
}

/* --------------- N3 · I CAN ("Ne öğrendiğini kendin gör.") ---------------
   Prophet Adam B1, chapter 1, live: the I can card at the end of the chapter, answered Yes · Yes · Almost.
   The card is a 3× element screenshot (assets/img/app/ican_*.jpg), shown large so every line reads. */
{
  const S = $('#n3'), w = $('#n3w');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 50% 40%, rgba(0,153,102,.12), rgba(0,0,0,0) 70%)';
  const CW = 742, CH = 263, DW = 1560, k = DW / CW, DH = CH * k;
  const card = shot(w, 'ican_0.jpg', DW, DH, 30);
  const imgs = [card.firstChild];
  ['ican_1', 'ican_2', 'ican_3'].forEach(s => { const im = el('img', '', null, card); im.src = `assets/img/app/${s}.jpg`; Object.assign(im.style, { position: 'absolute', inset: 0, opacity: 0 }); imgs.push(im); });
  const rows = [[60, 58], [124, 54], [181, 54]].map(([y, h]) => spot(card, 8 * k, y * k, (CW - 16) * k, h * k, 'shot-hi'));
  const BT = [[542, 88, 46], [542, 151, 46], [606, 208, 70]].map(([x, y, bw]) => spot(card, (x - bw / 2) * k, (y - 18) * k, bw * k, 36 * k));
  const shade = el('div', 'cap-shade', '', S); shade.style.zIndex = 5;
  const head = nHead(S, 'I can · after every chapter', [['Ne öğrendiğini kendin gör.', true]]);
  const tap = el('div', 'tap', null, S);
  const TAPS = [2.0, 3.7, 5.4], END = 32 / 3;
  ins('n3', END, u => {
    const hd = handDrift(u, 95);
    const a = P(u, -0.5, 1.3, E.cam), push = P(u, 6.0, END, E.inOut);
    tf(card, { x: CX - DW / 2 + hd.x, y: 200 + hd.y + (1 - a) * 150 - push * 20, z: lerp(-700, 0, a) + push * 60, rx: lerp(16, 2, a), ry: lerp(-12, -2, a) + push * 2, s: 1 });
    op(card, P(u, -0.45, 0.15, E.lin));
    swapAt(imgs, u, TAPS.map(x => x + 0.02), 0.12);
    rows.forEach((r, i) => { const t0 = TAPS[i]; r.style.opacity = (P(u, t0 - 0.7, t0 - 0.35, E.outSoft) * (1 - P(u, t0 + 0.9, t0 + 1.3, E.in)) * 0.95).toFixed(3); });
    // after the three answers: all three lines light up together, the answers are the learner's own check
    const all = P(u, 6.6, 7.2, E.outSoft) * (1 - P(u, 9.6, 10.2, E.in));
    if (u > 6.4) rows.forEach(r => { r.style.opacity = (all * 0.75).toFixed(3); });
    op(tap, Math.max(...TAPS.map((tt, i) => tapAt(tap, u, tt, BT[i]))));
    op(shade, P(u, 0, 0.6));
    headAt(head, u, 0.6, END - 0.55);
    drawDust(u + 68, 0.22, 0.05);
  });
}

/* --------------- N3G · GROUP TASK ("Grupla, rollerle konuş.") ---------------
   Mecca Before Islam A2, chapter 10, "History Radio Show" (src/data/mecca/a2/en/groupTasks.ts), opened;
   the roles, then step 4: nobody plays a person from the story. */
{
  const S = $('#n3g'), w = $('#n3gw');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 55% 45%, rgba(0,153,102,.10), rgba(0,0,0,0) 70%)';
  const GW = 1800, GH = GW * 479 / 1734, k = GW / 1734;
  const gt = shot(w, 'gt1.jpg', GW, GH, 26);
  const roles = spot(gt, 10 * k, 128 * k, 1714 * k, 72 * k, 'shot-hi'), step4 = spot(gt, 10 * k, 334 * k, 620 * k, 32 * k, 'shot-hi');
  const shade = el('div', 'cap-shade', '', S); shade.style.zIndex = 5;
  const head = nHead(S, 'Group task', [['Grupla, rollerle konuş.', true]]);
  ins('n3g', 8.0, u => {
    const hd = handDrift(u, 96);
    const g = P(u, -0.5, 1.0, E.cam), push = P(u, 3.0, 8.0, E.inOut);
    tf(gt, { x: CX - GW / 2 + hd.x, y: 130 + hd.y + (1 - g) * 160, z: lerp(-700, 0, g) + push * 40, rx: lerp(16, 3, g), ry: lerp(-10, -3, g) });
    op(gt, P(u, -0.45, 0.1, E.lin));
    roles.style.opacity = (P(u, 1.3, 1.7, E.outSoft) * (1 - P(u, 3.4, 3.8, E.in))).toFixed(3);
    step4.style.opacity = (P(u, 3.9, 4.3, E.outSoft) * (1 - P(u, 6.8, 7.2, E.in))).toFixed(3);
    op(shade, P(u, 0, 0.6));
    headAt(head, u, 0.5, 7.45);
    drawDust(u + 70, 0.22, 0.05);
  });
}

/* ------- N6 · TEACHER · lesson card → class mode ("Derse hazır, tahtaya hazır.") -------
   Lesson card: Mecca Before Islam A2, chapter 10 (40 minutes), live. Class mode: Prophet Adam B1, chapter 1,
   live: Reading settings → Class mode on → bigger text → Show the answer. Both sit in windows on the right;
   the line stands on its own on the left. */
{
  const S = $('#n6'), w = $('#n6w');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 70% 48%, rgba(0,153,102,.10), rgba(0,0,0,0) 70%)';
  const LW = 760, LH = LW * 1940 / 1536, WIN = 880;
  const lcWin = el('div', 'shot', '', w); lcWin.style.width = LW + 'px'; lcWin.style.height = WIN + 'px'; lcWin.style.borderRadius = '28px';
  const lcImg = el('img', '', null, lcWin); lcImg.src = 'assets/img/app/lc.jpg'; lcImg.style.width = LW + 'px'; lcImg.style.height = LH + 'px';
  const CWW = 1040, CWH = 820;
  const cm = winShot(w, ['cm1', 'cm2', 'cm3', 'cm4'], W, H, CWW, CWH, 28);
  const tgl = spot(cm.inner, 1626, 370, 40, 22), ans = spot(cm.inner, 1490, 234, 126, 26);
  const shade = el('div', 'cap-shade left', '', S); shade.style.zIndex = 5;
  const head = nHead(S, 'Lesson card · Class mode', [['Derse hazır,', true], ['tahtaya hazır.', true]], 'mid');
  const tap = el('div', 'tap', null, S);
  const T_TGL = 6.5, T_CLOSE = 7.4, T_ANS = 8.9;
  ins('n6', 32 / 3, u => {
    const hd = handDrift(u, 97);
    /* 1 — the lesson card: aims, minute-by-minute steps, group task, exit ticket */
    const a = P(u, -0.5, 1.0, E.cam), aOut = P(u, 4.6, 5.3, E.cam);
    tf(lcWin, { x: 1380 - LW / 2 + hd.x, y: 100 + hd.y + (1 - a) * 140, z: lerp(-600, 0, a) - aOut * 800, rx: lerp(12, 2, a), ry: lerp(-18, -7, a) });
    op(lcWin, P(u, -0.45, 0.1, E.lin) * (1 - P(u, 4.8, 5.3, E.lin))); blur(lcWin, aOut * 8);
    lcImg.style.transform = `translateY(${(-P(u, 1.3, 4.3, E.inOut) * (LH - WIN)).toFixed(1)}px)`;
    /* 2 — class mode, in a window of the same size family */
    const c = P(u, 4.8, 5.9, E.cam), mv = P(u, T_CLOSE + 0.1, T_CLOSE + 1.2, E.cam);
    tf(cm.d, { x: 1390 - CWW / 2 + hd.x, y: 130 + hd.y + (1 - c) * 140, z: lerp(-600, 0, c), rx: lerp(10, 2, c), ry: lerp(-16, -6, c) });
    cm.view(lerp(1480, 1385, mv), lerp(340, 420, mv), lerp(1.1, 0.95, mv));
    op(cm.d, P(u, 4.8, 5.2, E.lin)); show(cm.d, u > 4.7);
    swapAt(cm.imgs, u, [T_TGL + 0.02, T_CLOSE, T_ANS + 0.02], 0.25);
    op(tap, Math.max(tapAt(tap, u, T_TGL, tgl), tapAt(tap, u, T_ANS, ans)));
    op(shade, P(u, 0, 0.6));
    headAt(head, u, 0.6, 32 / 3 - 0.55);
    drawDust(u + 72, 0.22, 0.05);
  });
}

/* ------- N7 · PLACES & PEOPLE · JOURNEY MAP ("Hikâyenin geçtiği yerleri keşfet.") -------
   Prophet Moses A2, live: Places & People (page 20; Midian is chosen) and Moses's Journey (page 2; Midian). */
{
  const S = $('#n7'), w = $('#n7w');
  glowBg(S).style.background = 'radial-gradient(70% 70% at 50% 50%, rgba(216,179,92,.12), rgba(0,0,0,0) 70%)';
  const { d: pp, imgs: ppI } = appShot(w, ['pp0', 'pp1']);
  const { d: mp, imgs: mpI } = appShot(w, ['map0', 'map1']);
  const midCard = spot(pp, 1045, 545, 150, 26), midList = spot(mp, 1490, 500, 220, 36);
  const shade = el('div', 'cap-shade deep', '', S); shade.style.zIndex = 5;
  const head = nHead(S, 'Places &amp; People · Journey map', [['Hikâyenin geçtiği yerleri keşfet.', true]]);
  const tap = el('div', 'tap', null, S);
  const T_MID = 1.9, T_MAP = 5.6;
  ins('n7', 8.0, u => {
    const hd = handDrift(u, 99);
    const a = P(u, -0.5, 1.0, E.cam), push = P(u, 2.2, 3.8, E.inOut), aOut = P(u, 3.7, 4.3, E.cam);
    camTf(pp, { px: lerp(960, 760, push), py: lerp(520, 470, push), s: lerp(0.78, 1.02, push) * (0.9 + 0.1 * a), sx: CX + hd.x, sy: 470 + hd.y, z: lerp(-500, 0, a) - aOut * 800, ry: lerp(-12, -5, a), rx: 3 });
    op(pp, P(u, -0.45, 0.1, E.lin) * (1 - P(u, 3.9, 4.3, E.lin))); blur(pp, aOut * 8);
    swapAt(ppI, u, [T_MID + 0.02], 0.2);
    const m = P(u, 3.8, 4.8, E.cam), mz = P(u, 4.6, 7.6, E.inOut);
    camTf(mp, { px: lerp(960, 1150, mz), py: lerp(560, 520, mz), s: lerp(0.8, 0.98, mz), sx: CX + 60 + hd.x, sy: 470 + hd.y, z: lerp(-600, 0, m), ry: lerp(16, 6, m), rx: 3 });
    op(mp, P(u, 3.8, 4.2, E.lin)); show(mp, u > 3.7);
    swapAt(mpI, u, [T_MAP + 0.02], 0.25);
    op(tap, Math.max(tapAt(tap, u, T_MID, midCard, 0.4, 0.5), tapAt(tap, u, T_MAP, midList, 0.35, 0.5)));
    op(shade, P(u, 0, 0.6));
    headAt(head, u, 0.6, 7.45);
    drawDust(u + 76, 0.25, 0.05);
  });
}

/* ------- N4 · RESULT CARD → CHECK A RESULT CODE ("Sonucunu öğretmenine göster.") -------
   v9's recomposition of the live dialogs, played 1.5× slower. */
{
  const S = $('#n4'), w = $('#n4w');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 50% 55%, rgba(216,179,92,.12), rgba(0,0,0,0) 70%)';
  // src/components/book/ResultCard.tsx + lib/resultCode.ts: 2ENLRSSA = Mecca Before Islam · A2,
  // chapters 100 %, Knowledge Check 90 %, Vocabulary Challenge done, Language Review 75 %, Final Challenge 85 %, “I can” 80 %
  const ROWS = [['Chapters read', '100%'], ['Knowledge Check', '90%'], ['Vocabulary Challenge', 'Done'], ['Language Review', '75%'], ['Final Challenge', '85%'], ['“I can”: Yes', '80%']];
  const CODE = '2ENLRSSA';
  const rc = el('div', 'dlg', `<div class="dlg-h"><div class="ic">${ico('Certificate')}</div><div><b>Result card</b><small>Mecca Before Islam · A2 · 3 October 2026</small></div></div>
    <div class="rc-name"><small>Your name</small><div class="rc-in"><span class="nm"></span></div></div>
    <div class="rc-rows">${ROWS.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
    <div class="rc-code"><small>TEACHER CODE</small><div class="c">${CODE}</div><p>Your teacher types this code in “Check a result code” to see the same results.</p></div>`, w);
  rc.style.width = '640px';
  const rcName = rc.querySelector('.nm'), rcRows = Array.from(rc.querySelectorAll('.rc-rows div')), rcCode = rc.querySelector('.rc-code');
  const cc = el('div', 'dlg', `<div class="dlg-h"><div class="ic">${ico('CheckCircle')}</div><div><b>Check a result code</b></div></div>
    <div class="ui-s" style="font-size:20px;margin-top:14px;color:#55524a">Type the code from the student’s result card.</div>
    <div class="cc-row"><div class="cc-in"><span class="tx"></span><i class="caret"></i></div><div class="cc-btn">Check</div></div>
    <div class="cc-res"><div class="cc-ok"><small>VALID CODE</small><h4>Mecca Before Islam · A2</h4></div>
    <div class="rc-rows">${ROWS.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
    <div class="cc-note">Scores are rounded to the nearest 5%. The code is a light check, not protection against cheating.</div></div>`, w);
  cc.style.width = '680px';
  const ccTx = cc.querySelector('.tx'), ccCaret = cc.querySelector('.caret'), ccBtn = cc.querySelector('.cc-btn'), ccRes = cc.querySelector('.cc-res');
  const ccRows = Array.from(ccRes.querySelectorAll('.rc-rows div'));
  const head = nHead(S, 'Result card · Check a result code', [['Sonucunu öğretmenine göster.', true]], 'top');
  const tap = el('div', 'tap', null, S);
  const T_CHECK = 3.45;
  let ccH = null;
  ins('n4', 8.0, u => {
    const t = Math.max(0, u) / 1.5;
    if (ccH == null) { ccRes.style.height = 'auto'; ccH = ccRes.offsetHeight; }
    const hand = { x: smoothNoise(t * 0.5, 97) * 5, y: smoothNoise(t * 0.45, 98) * 4 };
    const a = P(t, 0, 0.75, E.cam), mv = P(t, 1.9, 2.6, E.cam), out = P(t, 4.9, 5.3, E.inStrong);
    tf(rc, { x: lerp(CX - 320, 230, mv) + hand.x, y: 245 + hand.y + (1 - a) * 160, z: lerp(-600, 0, a) - mv * 250 - out * 600, rx: lerp(14, 2, a), ry: lerp(-14, 10, mv), s: 0.86 });
    op(rc, P(t, 0, 0.3, E.lin) * (1 - out) * (1 - mv * 0.35)); blur(rc, mv * 2 + out * 8);
    rcName.textContent = 'Zeynep'.slice(0, Math.round(6 * P(t, 0.55, 1.0, E.lin)));
    rcRows.forEach((r, i) => { const q = P(t, 0.6 + i * 0.08, 1.0 + i * 0.08, E.outSoft); r.style.opacity = q.toFixed(3); });
    const cp = P(t, 1.15, 1.5, E.back);
    rcCode.style.transform = `scale(${(0.94 + 0.06 * cp) * (1 + 0.03 * Math.exp(-Math.pow((t - 1.55) / 0.15, 2)))})`; rcCode.style.opacity = P(t, 1.1, 1.3).toFixed(3);
    rcCode.style.boxShadow = `0 0 0 ${(3 * Math.exp(-Math.pow((t - 1.6) / 0.25, 2))).toFixed(2)}px #e0b84c`;
    // the teacher types it
    const b = P(t, 2.0, 2.7, E.cam);
    tf(cc, { x: 1000 + hand.x + (1 - b) * 500, y: 150 + hand.y, z: lerp(-400, 0, b) - out * 600, rx: 2, ry: lerp(-28, -8, b), s: 0.92 });
    op(cc, P(t, 2.0, 2.25, E.lin) * (1 - out)); blur(cc, out * 10);
    const n = Math.round(CODE.length * P(t, 2.55, 3.2, E.lin));
    ccTx.textContent = CODE.slice(0, n);
    ccCaret.style.opacity = t < T_CHECK && (n < 8 || Math.floor(t * 4) % 2 === 0) ? 1 : 0;
    ccBtn.style.transform = `scale(${press(t, T_CHECK)})`;
    const rp = P(t, T_CHECK + 0.05, T_CHECK + 0.55, E.cam);
    ccRes.style.height = (rp * ccH).toFixed(1) + 'px'; ccRes.style.overflow = 'hidden'; ccRes.style.opacity = P(t, T_CHECK + 0.05, T_CHECK + 0.25).toFixed(3);
    ccRows.forEach((r, i) => { const q = P(t, T_CHECK + 0.3 + i * 0.07, T_CHECK + 0.6 + i * 0.07, E.outSoft); r.style.opacity = q.toFixed(3); });
    op(tap, finger(tap, t, T_CHECK, ccBtn) * (1 - out));
    headAt(head, u, 0.5, 7.45);
    drawDust(u + 100, 0.22, 0.05);
  });
}

/* ---------- N5 · ON MY OWN · level test result → My words review ("Kendi hızında öğren.") ----------
   v9's recomposition of the live dialogs, played 4/3 slower. */
{
  const S = $('#n5'), w = $('#n5w');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 62% 48%, rgba(216,179,92,.13), rgba(0,0,0,0) 70%)';
  // src/components/LevelTest*.tsx text (result for 3 A2 + 4 B1 + 1 B2 right = B1)
  const lt = el('div', 'dlg', `<div class="dlg-h"><div class="ic">${ico('Stack')}</div><div><b>Level test</b><small>Ten short questions, about three minutes.</small></div></div>
    <div class="lt-res"><small>Your suggested level</small><div class="lv">B1</div><p>Start at B1. You can follow a longer story<br>and the reasons for what happens.</p><div class="sc">You answered 8 of 10 questions correctly.</div></div>
    <div class="lt-btn">Start with Prophet Adam · B1 ${ico('ArrowRight')}</div><div class="lt-alt">I’ll choose myself</div><div class="lt-note">You can always open any level from the library.</div>`, w);
  lt.style.width = '700px';
  const ltLv = lt.querySelector('.lv'), ltParts = Array.from(lt.querySelectorAll('.lt-res > *, .lt-btn, .lt-alt, .lt-note'));
  // src/components/MyWords*.tsx — review card
  const WORDS = [['Messenger', 'A person chosen by Allah to deliver His message.'], ['curiosity', 'A strong wish to know more.']];
  const mw = el('div', 'dlg', `<div class="dlg-h"><div class="ic">${ico('BookBookmark')}</div><div><b>My words</b></div></div>
    <div class="mw-card"><small class="mw-n">1 / 3 · Prophet Adam · B1</small><div class="w">Messenger</div><div class="d"></div>
      <div class="bts"><i class="k">I knew it</i><i class="n">Not yet</i><i class="sm">Show the meaning</i></div></div>
    <div class="mw-prog"><i></i><i></i><i></i></div><div class="mw-list">List</div>`, w);
  mw.style.width = '720px';
  const mwN = mw.querySelector('.mw-n'), mwW = mw.querySelector('.w'), mwD = mw.querySelector('.d'), mwK = mw.querySelector('.k'), mwNo = mw.querySelector('.n'), mwSm = mw.querySelector('.sm');
  const mwCard = mw.querySelector('.mw-card'), mwProg = Array.from(mw.querySelectorAll('.mw-prog i'));
  const head = nHead(S, 'On my own · Level test · My words', [['Kendi hızında öğren.', true]]);
  const tap = el('div', 'tap', null, S);
  const T_SHOW = 3.55, T_KNEW = 4.45, T_SHOW2 = 5.15;
  ins('n5', 8.0, u => {
    const t = Math.max(0, u) * 6.0 / 8.0;
    const hand = { x: smoothNoise(t * 0.5, 93) * 5, y: smoothNoise(t * 0.45, 94) * 4 };
    const a = P(t, 0, 0.75, E.cam), swap = P(t, 2.35, 3.05, E.cam), out = P(t, 5.55, 5.98, E.inStrong);
    tf(lt, { x: 1290 - 350 + hand.x - swap * 520, y: 120 + hand.y + (1 - a) * 160, z: lerp(-600, 0, a) - swap * 700, rx: lerp(14, 2, a), ry: lerp(-18, -6, a) + swap * 14 });
    op(lt, P(t, 0, 0.3, E.lin) * (1 - P(t, 2.6, 3.0, E.lin))); blur(lt, swap * 8);
    const lvp = P(t, 0.55, 1.1, E.back);
    ltLv.style.transform = `scale(${(0.6 + 0.4 * lvp).toFixed(3)})`; ltLv.style.opacity = P(t, 0.55, 0.75).toFixed(3);
    ltParts.forEach((p, i) => { if (p === ltLv) return; const q = P(t, 0.5 + i * 0.09, 0.95 + i * 0.09, E.outSoft); p.style.opacity = q.toFixed(3); p.style.transform = `translateY(${((1 - q) * 14).toFixed(1)}px)`; });
    const b = P(t, 2.35, 3.05, E.cam);
    tf(mw, { x: 1290 - 360 + hand.x + (1 - b) * 600, y: 170 + hand.y, z: lerp(-500, 0, b) - out * 600, rx: 2, ry: lerp(-30, -6, b) });
    op(mw, P(t, 2.35, 2.6, E.lin) * (1 - out)); blur(mw, out * 10);
    // review: Show the meaning → I knew it → next word
    const second = t >= T_KNEW + 0.15;
    const flip = Math.sin(Math.PI * P(t, T_KNEW + 0.02, T_KNEW + 0.3, E.inOut));
    mwCard.style.transform = `rotateY(${(flip * 8).toFixed(2)}deg) scale(${(1 - flip * 0.03).toFixed(3)})`;
    mwN.textContent = second ? '2 / 3 · Prophet Adam · B1' : '1 / 3 · Prophet Adam · B1';
    mwW.textContent = WORDS[second ? 1 : 0][0];
    const shown = second ? t >= T_SHOW2 + 0.02 : t >= T_SHOW + 0.02;
    mwD.textContent = shown ? WORDS[second ? 1 : 0][1] : '';
    mwD.style.opacity = (second ? P(t, T_SHOW2, T_SHOW2 + 0.25) : P(t, T_SHOW, T_SHOW + 0.25)).toFixed(3);
    mwSm.style.visibility = shown ? 'hidden' : 'visible'; mwK.style.visibility = mwNo.style.visibility = shown ? 'visible' : 'hidden';
    mwSm.style.transform = `translateX(-50%) scale(${press(t, second ? T_SHOW2 : T_SHOW)})`; mwK.style.transform = `scale(${press(t, T_KNEW)})`;
    mwProg.forEach((p, i) => p.classList.toggle('on', i === 0 && t >= T_KNEW));
    op(tap, Math.max(finger(tap, t, T_SHOW, mwSm), finger(tap, t, T_KNEW, mwK), finger(tap, t, T_SHOW2, mwSm)) * (1 - out));
    headAt(head, u, 0.5, 7.45);
    drawDust(u + 80, 0.22, 0.05);
  });
}


/* ------- N8 · OFFLINE ("İnternet olmadan da oku, dinle.") -------
   Prophet Adam B1, live (production build): book menu → Save this book offline → Saving… → Saved for offline;
   then page 3 opened with Storage blocked, its picture coming from the saved copy. */
{
  const S = $('#n8'), w = $('#n8w');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 60% 45%, rgba(216,179,92,.12), rgba(0,0,0,0) 70%)';
  const MW = 700, MH = 760;
  const mn = winShot(w, ['m_idle', 'm_saving', 'm_saved'], 352, 760, MW, MH, 28);
  mn.d.style.background = '#16201b';
  const save = spot(mn.inner, 40, 424, 230, 32);
  const { d: pg } = appShot(w, ['offline_page']);
  const badge = el('div', 'off-badge', `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/><path class="sl" d="M2 2l20 20"/></svg><span>Offline</span>`, S);
  const slash = badge.querySelector('.sl');
  const shade = el('div', 'cap-shade deep', '', S); shade.style.zIndex = 5;
  const head = nHead(S, 'Save this book offline', [['İnternet olmadan da oku, dinle.', true]]);
  const tap = el('div', 'tap', null, S);
  const T_SAVE = 1.8, T_DONE = 3.6, END = 32 / 3;
  ins('n8', END, u => {
    const hd = handDrift(u, 101);
    /* 1 — the book menu */
    const a = P(u, -0.5, 1.0, E.cam), aOut = P(u, 5.0, 5.7, E.cam);
    tf(mn.d, { x: 1240 - MW / 2 + hd.x, y: 110 + hd.y + (1 - a) * 140, z: lerp(-600, 0, a) - aOut * 800, rx: lerp(12, 2, a), ry: lerp(-18, -7, a) });
    mn.view(176, lerp(300, 330, P(u, 0, 5, E.inOut)), 1.9);
    op(mn.d, P(u, -0.45, 0.1, E.lin) * (1 - P(u, 5.2, 5.7, E.lin))); blur(mn.d, aOut * 8); show(mn.d, u < 5.8);
    swapAt(mn.imgs, u, [T_SAVE + 0.05, T_DONE], 0.2);
    op(tap, tapAt(tap, u, T_SAVE, save, 0.35, 0.5));
    /* 2 — later, without internet: the page still opens with its picture */
    const c = P(u, 5.1, 6.3, E.cam), push = P(u, 6.0, END, E.inOut);
    camTf(pg, { px: lerp(960, 820, push), py: lerp(540, 470, push), s: lerp(0.74, 0.92, push) * (0.9 + 0.1 * c), sx: CX + hd.x, sy: 470 + hd.y, z: lerp(-600, 0, c), ry: lerp(14, 5, c), rx: 3 });
    op(pg, P(u, 5.1, 5.5, E.lin)); show(pg, u > 5.0);
    const b = P(u, 6.4, 6.9, E.back);
    badge.style.opacity = (P(u, 6.4, 6.6) * (1 - P(u, END - 0.5, END, E.lin))).toFixed(3);
    badge.style.transform = `translateX(-50%) scale(${(0.8 + 0.2 * b).toFixed(3)})`;
    slash.style.strokeDashoffset = (1 - P(u, 6.9, 7.4, E.outSoft)) * 30;
    op(shade, P(u, 0, 0.6));
    headAt(head, u, 0.6, END - 0.55);
    drawDust(u + 84, 0.22, 0.05);
  });
}

/* ------- N9 · PRINTABLE PDFs ("İndir, yazdır, sınıfa götür.") -------
   Prophet Adam B1, live: book menu → Printable PDFs → Story book (PDF); then the three real PDFs of the book
   (public/pdfs/books/adam-b1-en-*.pdf, rendered at 150 dpi): covers, which open on an inside page. */
{
  const S = $('#n9'), w = $('#n9w');
  glowBg(S).style.background = 'radial-gradient(60% 70% at 58% 45%, rgba(216,179,92,.13), rgba(0,0,0,0) 70%)';
  const MW = 700, MH = 760;
  const mn = winShot(w, ['m_saved', 'm_pdfhover'], 352, 760, MW, MH, 28);
  mn.d.style.background = '#16201b';
  const story = spot(mn.inner, 40, 598, 230, 32);
  const SW = 400, SH = SW * 1754 / 1240;
  const SLOTS = [['pdf_s1', 'pdf_s5', 'Story book'], ['pdf_t1', 'pdf_t8', 'Teacher’s Book'], ['pdf_g1', 'pdf_g5', 'Self-Study Guide']].map(([cov, inn, label], i) => {
    const d = el('div', 'pdf-slot', '', w); Object.assign(d.style, { width: SW + 'px', height: SH + 'px' });
    const page = el('div', 'pdf-page', `<img src="assets/img/app/${inn}.jpg">`, d);
    const cover = el('div', 'pdf-page cover', `<img src="assets/img/app/${cov}.jpg">`, d);
    const lb = el('div', 'pdf-label', label, d);
    return { d, page, cover, lb, x: 780 + i * 450 };
  });
  const shade = el('div', 'cap-shade deep', '', S); shade.style.zIndex = 5;
  const head = nHead(S, 'Printable PDFs', [['İndir, yazdır, sınıfa götür.', true]]);
  const tap = el('div', 'tap', null, S);
  const T_PDF = 1.7, END = 32 / 3;
  ins('n9', END, u => {
    const hd = handDrift(u, 103);
    /* 1 — the book menu */
    const a = P(u, -0.5, 1.0, E.cam), aOut = P(u, 2.8, 3.5, E.cam);
    tf(mn.d, { x: 1240 - MW / 2 + hd.x, y: 110 + hd.y + (1 - a) * 140, z: lerp(-600, 0, a) - aOut * 800, rx: lerp(12, 2, a), ry: lerp(-18, -7, a) });
    mn.view(176, 560, 1.9);
    op(mn.d, P(u, -0.45, 0.1, E.lin) * (1 - P(u, 3.0, 3.5, E.lin))); blur(mn.d, aOut * 8); show(mn.d, u < 3.6);
    swapAt(mn.imgs, u, [T_PDF - 0.15], 0.15);
    op(tap, tapAt(tap, u, T_PDF, story, 0.35, 0.5));
    /* 2 — the three PDFs: covers arrive, then open on an inside page */
    SLOTS.forEach((o, i) => {
      const p = P(u, 3.0 + i * 0.25, 4.3 + i * 0.25, E.cam), open = P(u, 5.6 + i * 0.45, 6.9 + i * 0.45, E.inOut);
      const drift = P(u, 4.0, END, E.inOut);
      tf(o.d, { x: o.x - SW / 2 + hd.x - drift * 30, y: 150 + hd.y + (1 - p) * 220, z: lerp(-900, 0, p) + drift * 50, rx: lerp(20, 4, p), ry: lerp(-24, -8, p) + i * 2, rz: (i - 1) * 1.2 * (1 - open * 0.5) });
      op(o.d, P(u, 3.0 + i * 0.25, 3.4 + i * 0.25, E.lin)); show(o.d, u > 2.9);
      o.cover.style.transform = `rotateY(${(-158 * open).toFixed(2)}deg)`;
      o.cover.style.filter = `brightness(${(1 - open * 0.45).toFixed(3)})`;
      o.lb.style.opacity = P(u, 4.2 + i * 0.2, 4.7 + i * 0.2).toFixed(3);
    });
    op(shade, P(u, 0, 0.6));
    headAt(head, u, 0.6, END - 0.55);
    drawDust(u + 88, 0.25, 0.05);
  });
}


/* ======================================================================
   TIMELINE DRIVER
   ====================================================================== */
function render(t, T = t) {
  $('#stage').style.filter = '';
  $('#flash').style.opacity = 0;
  let any = false;
  const local = s => sceneClock(s.id, t);
  for (const s of scenes) {
    const lt = local(s);
    s.el.style.display = lt >= s.a && lt < s.b ? 'block' : 'none';
  }
  for (const s of scenes) { const lt = local(s); if (lt >= s.a && lt < s.b) { s.update(lt); any = true; } }
  if (!any) drawDust(t, 0);
  drawGrain(Math.round(T * 30));  // grain refreshes at 30 Hz: organic, and kinder to the encoder
}

/* v10: film time T → v8 time + the inserted scenes that are on screen.
   An insert fades in over the still-running v8 (its first `fade` seconds), then v8 holds its frame
   for `len` seconds while the insert plays, the insert fades out over that frame, and v8 carries on.
   Inserts sharing one `at` follow each other and cross-fade. */
let INSERTS = [], FADE = 0.5;
function mapTime(T) {
  let off = 0, v8 = null;
  const act = [];
  for (let i = 0; i < INSERTS.length; i++) {
    const n = INSERTS[i], F = n.at + off;
    if (T < F - FADE) break;
    if (T < F) { act.push([n, T - F]); break; }
    if (T < F + n.len) {
      act.push([n, T - F]); v8 = n.at;
      const nx = INSERTS[i + 1];
      if (nx && nx.at === n.at && T >= F + n.len - FADE) act.push([nx, T - F - n.len]);
      break;
    }
    off += n.len;
  }
  return { v8: v8 == null ? T - off : v8, act };
}
function renderFilm(T) {
  const { v8, act } = mapTime(T);
  render(v8, T);
  for (const id in INSERT_SCENES) INSERT_SCENES[id].el.style.display = 'none';
  for (const [n, u] of act) {
    const sc = INSERT_SCENES[n.id], nx = INSERTS[INSERTS.indexOf(n) + 1];
    const chained = nx && nx.at === n.at;               // the next insert covers this one's exit
    const o = clamp((u + FADE) / FADE) * (chained ? 1 : 1 - clamp((u - (n.len - FADE)) / FADE));
    sc.el.style.display = 'block'; sc.el.style.opacity = o.toFixed(4);
    sc.update(u);
  }
}

async function ready() {
  const tl = await (await fetch('timeline.json')).json();
  WARPS = tl.warps || {}; DURATION = tl.duration; window.__duration = DURATION;
  INSERTS = tl.inserts || []; FADE = tl.insertFade ?? 0.5;
  // prefer supplied artwork (assets/img/civ/*) when it exists
  await Promise.all(Array.from(document.querySelectorAll('img[data-want]')).map(async i => {
    try { const r = await fetch(i.dataset.want, { method: 'HEAD' }); if (r.ok) { i.src = i.dataset.want; if (i.dataset.focus) i.style.objectPosition = i.dataset.focus; } } catch (e) { /* keep fallback */ }
  }));
  await document.fonts.ready;
  await Promise.all(['Poppins', 'Arakom'].flatMap(f => [400, 600, 700].map(w => document.fonts.load(`${w} 40px ${f}`, 'Aa ğşı ع'))));
  await Promise.all(Array.from(document.images).map(i => (i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = () => i.decode().then(r, r); i.onerror = r; }))));
}

window.__duration = DURATION;
window.__ready = ready();
window.__seek = async t => {
  renderFilm(t);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
};

/* live preview when opened directly in a browser: ?t=12.3 or plays in real time */
const q = new URLSearchParams(location.search);
window.__ready.then(() => {
  if (q.has('render')) return;
  if (q.has('t')) { renderFilm(parseFloat(q.get('t'))); return; }
  const t0 = performance.now();
  const loop = () => { const t = ((performance.now() - t0) / 1000) % DURATION; renderFilm(t); requestAnimationFrame(loop); };
  loop();
});
})();
