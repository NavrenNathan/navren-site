/* NAVREN — Start here: a pen-sketched skyline that draws itself in (every page) */
/* START HERE — Skyline Sketch: seeded pen-sketch city that draws itself in on view, then a light scroll parallax */
(function(){
var NVV={
  reduced:(function(){ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })(),
  visible:function(r){ return !!(r && r.offsetParent!==null); },
  reg:function(slot,v,fn){ Array.prototype.forEach.call(document.querySelectorAll('section.cta'), function(s){ if(!s.querySelector('.sky-art')) return; try{ fn(s); }catch(e){ if(window.console) console.warn('[start-here]', e); } }); }
};
try{
/* Concept 1 — Skyline Sketch
   A pen-sketched panorama drawn in code on three canvases (back / mid / front).
   Seeded PRNG -> identical drawing on every load; regenerated (same seed) on resize.
   Draw-on: one rAF loop advances a "pen" through each building's strokes, then stops.
   After that: a cheap scroll-linked parallax on the back and mid layers. */
NVV.reg('cta', 1, function(root){
  var sec = root;
  var city = sec.querySelector('.sky-city');
  var lays = [].slice.call(sec.querySelectorAll('.sky-layer'));
  var cvs = lays.map(function(l){ return l.querySelector('canvas'); });
  var ctxs = cvs.map(function(c){ return c.getContext('2d'); });
  var washBox = sec.querySelector('.sky-washes');
  var elTitle = sec.querySelector('h2'), elSub = sec.querySelector('.wrap > p:not(.eyebrow)'), elBtns = sec.querySelector('.cta-actions');
  var RED = !!NVV.reduced;
  var SEED = 0x51CE7C4;
  var RGB = [[232,237,234],[139,224,192],[61,170,136]];   // paper, mint, jade-bright
  var PAR = [10, 5, 0];                                    // parallax px per layer (back, mid, front)

  var scene = null, grads = null, started = false, done = RED, inView = false;
  var raf = 0, last = 0, T = 0, pr = 0, rt = 0, lastW = 0, lastH = 0;

  /* ---------------- utilities ---------------- */
  function mulberry(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sm(e0, e1, x){ var t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }

  /* ---------------- geometry of the copy (section coords) ---------------- */
  function measure(){
    var sr = sec.getBoundingClientRect();
    var W = Math.round(sr.width), H = Math.round(sr.height);
    if(W < 10 || H < 10) return null;
    function rel(el){ var r = el.getBoundingClientRect(); return { l:r.left - sr.left, t:r.top - sr.top, r:r.right - sr.left, b:r.bottom - sr.top }; }
    var t = rel(elTitle), s = rel(elSub), b = rel(elBtns), tl = t.l, tr = t.r;
    try{
      var rg = document.createRange(); rg.selectNodeContents(elTitle);
      var rs = rg.getClientRects();
      if(rs.length){ tl = 1e9; tr = -1e9; for(var i = 0; i < rs.length; i++){ tl = Math.min(tl, rs[i].left - sr.left); tr = Math.max(tr, rs[i].right - sr.left); } }
    }catch(e){}
    var mob = W < 640;
    var top = Math.max(0, Math.round(t.t + (t.b - t.t) * 0.45));
    return {
      W:W, H:H, mob:mob, top:top, Hc:H - top, gp:mob ? 18 : 26,
      tT:t.t - top, tB:t.b - top, sT:s.t - top, bB:b.b - top,
      cl:Math.min(tl, s.l, b.l), cr:Math.max(tr, s.r, b.r)
    };
  }

  /* =====================================================================
     SCENE GENERATION
     ===================================================================== */
  function gen(m){
    var R = mulberry(SEED);
    function rr(a, b){ return a + (b - a) * R(); }
    function pick(a){ return a[Math.floor(R() * a.length)]; }
    var W = m.W, Hc = m.Hc, G = Hc - m.gp, mob = m.mob;
    var layers = [[], [], []], occ = [[], [], []], washC = [];
    function wpush(c){ c.it = cur; washC.push(c); }
    var cur = null, occList = null;

    /* ---- styles per layer: O outline, E edge, D grid detail, F fine, H hatch ---- */
    var STY = [
      { O:{w:1.0, a:.30, c:1, ov0:3, ov1:6, dbl:.14, wob:.85},
        E:{w:.85, a:.22, c:1, ov0:2, ov1:4, dbl:.04, wob:.7},
        D:{w:.7,  a:.15, c:1, ov0:1, ov1:2.5, wob:.6, jit:.4},
        F:{w:.7,  a:.16, c:1, ov0:0, ov1:1, wob:.4, jit:.3},
        H:{w:.65, a:.13, c:2, ov0:0, ov1:1, wob:.35, jit:.3, step:4} },
      { O:{w:1.15,a:.46, c:1, ov0:4, ov1:7, dbl:.24, wob:.95},
        E:{w:.95, a:.34, c:1, ov0:2, ov1:5, dbl:.08, wob:.8},
        D:{w:.75, a:.22, c:1, ov0:1, ov1:3, wob:.7, jit:.4},
        F:{w:.72, a:.25, c:1, ov0:0, ov1:1, wob:.4, jit:.3},
        H:{w:.7,  a:.22, c:2, ov0:0, ov1:1, wob:.35, jit:.3, step:4} },
      { O:{w:1.4, a:.76, c:0, ov0:5, ov1:9, dbl:.44, wob:1},
        E:{w:1.1, a:.56, c:0, ov0:3, ov1:6, dbl:.18, wob:.9},
        D:{w:.85, a:.36, c:1, ov0:1.5, ov1:3.5, wob:.75, jit:.5},
        F:{w:.8,  a:.44, c:1, ov0:.5, ov1:1.5, wob:.45, jit:.35},
        H:{w:.75, a:.36, c:2, ov0:0, ov1:1, wob:.35, jit:.35, step:4} },
      { O:{w:1.3, a:.8, c:0, ov0:3, ov1:6, dbl:.3, wob:.7},          // crane
        E:{w:1.15, a:.74, c:0, ov0:2, ov1:5, dbl:.22, wob:.6},
        D:{w:.85, a:.5, c:1, ov0:1, ov1:2, wob:.5, jit:.3},
        F:{w:.85, a:.56, c:1, ov0:.5, ov1:1.5, wob:.4, jit:.3},
        H:{w:.75, a:.42, c:2, ov0:0, ov1:1, wob:.3, jit:.3, step:4} }
    ];

    /* ---- one hand-drawn line as a polyline: overshoot, bow, low-frequency wobble ---- */
    function pts(x1, y1, x2, y2, o){
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy); if(L < .6) return null;
      var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      var e0 = (o.ov0 || 0) * (R() * 1.25 - .25), e1 = (o.ov1 || 0) * (.3 + R() * .85);
      var jt = o.jit == null ? .7 : o.jit, j0 = (R() - .5) * 2 * jt, j1 = (R() - .5) * 2 * jt;
      if(L > 30) j1 += (R() - .5) * L * .011 * (o.wob == null ? 1 : o.wob);   // the hand never holds a perfect plumb
      var sx = x1 - ux * e0 + nx * j0, sy = y1 - uy * e0 + ny * j0, ex = x2 + ux * e1 + nx * j1, ey = y2 + uy * e1 + ny * j1;
      var LL = L + e0 + e1; if(LL < .6) return null;
      var wob = o.wob == null ? 1 : o.wob;
      var bow = (R() * 2 - 1) * Math.min(3.4, .3 + LL * .0058) * wob;
      var a2 = (R() * 2 - 1) * Math.min(1.6, LL * .0032) * wob, p2 = R() * 6.283;
      var k3 = Math.max(1, LL / (50 + R() * 70)), a3 = (.12 + R() * .32) * wob, p3 = R() * 6.283;
      var step = o.step || 5, n = Math.max(2, Math.ceil(LL / step));
      var out = new Float32Array((n + 1) * 2);
      for(var i = 0; i <= n; i++){
        var t = i / n, off = bow * Math.sin(Math.PI * t) + a2 * Math.sin(6.283 * t + p2) + a3 * Math.sin(6.283 * k3 * t + p3);
        out[i * 2] = sx + (ex - sx) * t + nx * off; out[i * 2 + 1] = sy + (ey - sy) * t + ny * off;
      }
      return out;
    }

    /* ---- hidden-line removal against nearer layers (rects), with bisection at the edges ---- */
    function clip(p, list, g){
      var n = p.length >> 1, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, i, j;
      for(i = 0; i < n; i++){ var X = p[i * 2], Y = p[i * 2 + 1]; if(X < x0) x0 = X; if(X > x1) x1 = X; if(Y < y0) y0 = Y; if(Y > y1) y1 = Y; }
      var rs = [];
      for(j = 0; j < list.length; j++){ var r = list[j]; if(r.x1 + g > x0 && r.x0 - g < x1 && r.y1 + g > y0 && r.y0 - g < y1) rs.push(r); }
      if(!rs.length) return [p];
      function ins(x, y){ for(var k = 0; k < rs.length; k++){ var r = rs[k]; if(x > r.x0 - g && x < r.x1 + g && y > r.y0 - g && y < r.y1 + g) return true; } return false; }
      var out = [], c = [], px = p[0], py = p[1], pin = ins(px, py);
      if(!pin) c.push(px, py);
      for(i = 1; i < n; i++){
        var x = p[i * 2], y = p[i * 2 + 1], inn = ins(x, y);
        if(inn !== pin){
          var ax = px, ay = py, bx = x, by = y;
          for(var k = 0; k < 7; k++){ var mx = (ax + bx) / 2, my = (ay + by) / 2; if(ins(mx, my) === pin){ ax = mx; ay = my; } else { bx = mx; by = my; } }
          if(pin){ c.push(bx, by); } else { c.push(ax, ay); if(c.length >= 4) out.push(new Float32Array(c)); c = []; }
        }
        if(!inn) c.push(x, y);
        px = x; py = y; pin = inn;
      }
      if(c.length >= 4) out.push(new Float32Array(c));
      return out;
    }

    function mk(p, w, a, c){
      var n = p.length >> 1, cum = new Float32Array(n), L = 0;
      for(var i = 1; i < n; i++){ var dx = p[i * 2] - p[i * 2 - 2], dy = p[i * 2 + 1] - p[i * 2 - 1]; L += Math.sqrt(dx * dx + dy * dy); cum[i] = L; }
      return { p:p, cum:cum, len:L, w:w, a:a, c:c };
    }
    function push(p, st){
      var w = st.w * rr(.85, 1.15), a = Math.min(1, st.a * rr(.78, 1.12));
      var pcs = occList && occList.length ? clip(p, occList, rr(-1.2, 2.8)) : [p];
      for(var i = 0; i < pcs.length; i++){
        if(pcs[i].length < 4) continue;
        var s = mk(pcs[i], w, a, st.c);
        if(s.len > 1.5){ cur.strokes.push(s); cur.L += s.len; }
      }
    }
    function L(x1, y1, x2, y2, st){
      var p = pts(x1, y1, x2, y2, st); if(p) push(p, st);
      if(st.dbl && R() < st.dbl){
        var dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l, d = (R() < .5 ? -1 : 1) * (.9 + R() * 1.6);
        var t0 = R() < .5 ? 0 : R() * .35, t1 = R() < .5 ? 1 : 1 - R() * .35;
        var q = pts(x1 + dx * t0 + nx * d, y1 + dy * t0 + ny * d, x1 + dx * t1 + nx * d, y1 + dy * t1 + ny * d, st);
        if(q) push(q, { w:st.w * .8, a:st.a * .55, c:st.c });
      }
    }
    /* long line drawn in two or three pulls of the pen (small gaps or overlaps) */
    function B(x1, y1, x2, y2, st){
      var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      var n = len > 200 && R() < .7 ? 3 : len > 80 && R() < .55 ? 2 : 1;
      if(n === 1){ L(x1, y1, x2, y2, st); return; }
      var a = 0;
      for(var i = 0; i < n; i++){
        var b = i === n - 1 ? 1 : (i + 1) / n + rr(-.12, .12) / n;
        var g = rr(-4, 6) / len, aa = i ? a + g : a;
        L(x1 + (x2 - x1) * aa, y1 + (y2 - y1) * aa, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b, st);
        a = b;
      }
    }
    /* small polyline (window boxes, tanks): jittered corners, one stroke */
    function P(v, st, close){
      var n = v.length >> 1, q = [], j = st.jit == null ? .4 : st.jit, i, k;
      for(i = 0; i < n; i++) q.push(v[i * 2] + rr(-1, 1) * j, v[i * 2 + 1] + rr(-1, 1) * j);
      if(close){ q.push(q[0] + rr(-1.2, 1.2), q[1] + rr(-1.2, 1.2)); n++; }
      var out = [], so = { wob:(st.wob || 1) * .5, ov0:0, ov1:0, jit:0, step:st.step || 4 };
      for(i = 0; i < n - 1; i++){
        var s = pts(q[i * 2], q[i * 2 + 1], q[i * 2 + 2], q[i * 2 + 3], i === n - 2 ? { wob:so.wob, ov0:0, ov1:st.ov1 || 0, jit:0, step:so.step } : so);
        if(!s) continue;
        for(k = out.length ? 2 : 0; k < s.length; k++) out.push(s[k]);
      }
      if(out.length >= 4) push(new Float32Array(out), st);
    }
    function A(cx, cy, rx, ry, a0, a1, st){
      var n = Math.max(5, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 3)), out = [];
      var wa = rr(-.5, .5) * (st.wob || 1), ph = R() * 6.28;
      for(var i = 0; i <= n; i++){
        var t = i / n, a = a0 + (a1 - a0) * t, f = 1 + wa * Math.sin(Math.PI * t + ph) / Math.max(rx, ry, 1);
        out.push(cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f);
      }
      push(new Float32Array(out), st);
    }
    function lb(x1, y1, x2, y2, a, b, c, d){
      var t0 = 0, t1 = 1, dx = x2 - x1, dy = y2 - y1, p = [-dx, dx, -dy, dy], q = [x1 - a, c - x1, y1 - b, d - y1];
      for(var i = 0; i < 4; i++){
        if(p[i] === 0){ if(q[i] < 0) return null; }
        else { var r = q[i] / p[i]; if(p[i] < 0){ if(r > t1) return null; if(r > t0) t0 = r; } else { if(r < t0) return null; if(r < t1) t1 = r; } }
      }
      return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
    }
    /* loose hatching: parallel flicks at an angle, trimmed and occasionally skipped */
    function hatch(x0, y0, x1, y1, ang, gap, st, dens){
      if(x1 - x0 < 3 || y1 - y0 < 3) return;
      var dx = Math.cos(ang), dy = -Math.sin(ang), nx = -dy, ny = dx;
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rad = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) / 2 + 2;
      for(var o = -rad + rr(0, gap); o < rad; o += gap * rr(.75, 1.3)){
        if(R() > dens) continue;
        var bx = cx + nx * o, by = cy + ny * o;
        var s = lb(bx - dx * rad * 2, by - dy * rad * 2, bx + dx * rad * 2, by + dy * rad * 2, x0, y0, x1, y1);
        if(!s) continue;
        var ta = rr(0, .16), tb = 1 - rr(0, .2);
        var X1 = s[0] + (s[2] - s[0]) * ta, Y1 = s[1] + (s[3] - s[1]) * ta, X2 = s[0] + (s[2] - s[0]) * tb, Y2 = s[1] + (s[3] - s[1]) * tb;
        if(Math.abs(X2 - X1) + Math.abs(Y2 - Y1) > 2.5) L(X1, Y1, X2, Y2, st);
      }
    }

    function item(li, t0){ cur = { strokes:[], L:0, t0:t0, dur:.8, s:0, k:0, d:0 }; layers[li].push(cur); occList = li === 2 ? null : li === 1 ? occ[2] : occ[2].concat(occ[1]); return cur; }

    /* ---------------- facades ---------------- */
    function facade(kind, x0, y0, x1, y1, S, fh, bw, dens, topf, wash){
      if(x1 - x0 < 6 || y1 - y0 < 8) return;
      var Wd = x1 - x0, Ht = y1 - y0, k, j, x, y, nb, bwx, nf;
      function hl(y, st){ // horizontal floor line, respecting a slanted top
        var xa = x0, xb = x1;
        if(topf){
          var ya = topf(x0), yb = topf(x1);
          if(y < Math.min(ya, yb) + 2) { if(Math.abs(yb - ya) < .5) return; var xc = x0 + (x1 - x0) * (y - 2 - ya) / (yb - ya); if(ya < yb){ xb = Math.min(x1, xc); } else { xa = Math.max(x0, xc); } }
          if(xb - xa < 4) return;
        }
        L(xa + rr(-1, 2.5), y, xb - rr(-1, 2.5), y, st);
      }
      function vt(x){ return topf ? topf(x) + 3 : y0; }
      if(kind === 'curtain'){
        nb = Math.max(1, Math.round(Wd / bw)); bwx = Wd / nb;
        for(k = 1; k < nb; k++){ if(R() > dens) continue; x = x0 + k * bwx + rr(-1.1, 1.1); B(x, y1 - rr(0, 2), x, vt(x) + rr(-1, 2), S.D); }
        nf = Math.floor(Ht / fh);
        for(j = 1; j <= nf; j++){ y = y0 + j * fh + rr(-1, 1); if(y > y1 - 3) break; if(R() > dens) continue; hl(y, S.D); }
        if(wash){ for(j = 1; j < nf; j++) for(k = 0; k < nb; k++){ var cy = y0 + j * fh; if(cy + fh > y1 - 2) continue; var cx = x0 + k * bwx; if(topf && cy < topf(cx + bwx) + 4) continue; wpush({ x:cx + 1, y:cy + 1, w:bwx - 2, h:fh - 2 }); } }
      } else if(kind === 'ribbon'){
        nf = Math.floor(Ht / fh); nb = Math.max(1, Math.round(Wd / (bw * 2.2))); bwx = Wd / nb;
        for(j = 0; j < nf; j++){
          y = y0 + j * fh + fh * .28; var y2 = y + fh * .5; if(y2 > y1 - 2) break;
          if(R() > dens) continue;
          hl(y, S.D); if(R() < .85) hl(y2, S.D);
          if(dens > .8 && R() < .55){ for(k = 1; k < nb; k++){ if(R() < .35) continue; x = x0 + k * bwx; L(x, y2, x, y, S.F); } }
          if(wash && R() < .5){ var c0 = Math.floor(R() * nb); wpush({ x:x0 + c0 * bwx + 1, y:y + 1, w:bwx - 2, h:y2 - y - 2 }); }
        }
      } else if(kind === 'punched'){
        nf = Math.floor((Ht - 2) / fh); nb = Math.max(1, Math.floor(Wd / bw)); bwx = Wd / nb;
        var ww = Math.min(bwx * .56, 9), wh = Math.min(fh * .56, 11);
        for(j = 0; j < nf; j++){
          y = y0 + j * fh + (fh - wh) * .45;
          for(k = 0; k < nb; k++){
            if(R() > dens) continue;
            x = x0 + k * bwx + (bwx - ww) / 2 + rr(-.5, .5);
            var sh = R();
            if(sh < .72) P([x, y, x + ww, y, x + ww, y + wh, x, y + wh], S.F, true);
            else if(sh < .86) P([x, y + wh, x, y, x + ww, y, x + ww, y + wh, x - 1.5, y + wh], S.F);
            else { L(x, y + wh, x, y, S.F); L(x + ww, y + wh, x + ww, y, S.F); L(x - 1, y + wh, x + ww + 1, y + wh, S.F); }
            if(wash) wpush({ x:x + .5, y:y + .5, w:ww - 1, h:wh - 1, p:1 });
          }
        }
      } else if(kind === 'pilaster'){
        var pg = Math.max(bw * 1.45, 11); nb = Math.max(1, Math.round(Wd / pg)); bwx = Wd / nb;
        for(k = 1; k < nb; k++){ if(R() > dens) continue; x = x0 + k * bwx; B(x - 1.2, y1, x - 1.2, vt(x), S.D); if(dens > .6) B(x + 1.3, y1 - rr(0, 4), x + 1.3, vt(x) + rr(0, 3), S.D); }
        nf = Math.floor(Ht / fh);
        for(j = 3; j < nf; j += 3){ if(R() > dens) continue; hl(y0 + j * fh, S.D); }
        if(wash){ for(j = 1; j < nf - 1; j++) for(k = 0; k < nb; k++) if(R() < .3) wpush({ x:x0 + k * bwx + 2.5, y:y0 + j * fh + 1, w:bwx - 5, h:fh - 2 }); }
      } else if(kind === 'fins'){
        nb = Math.max(2, Math.round(Wd / (bw * .62))); bwx = Wd / nb;
        for(k = 1; k < nb; k++){ if(R() > dens) continue; x = x0 + k * bwx + rr(-.8, .8); B(x, y1 - rr(0, 3), x, vt(x) + rr(0, 4), S.D); }
        nf = Math.floor(Ht / fh);
        for(j = 4; j < nf; j += 4){ if(R() > dens) continue; hl(y0 + j * fh, S.E); }
        if(wash){ for(j = 1; j < nf - 1; j += 2){ k = Math.floor(R() * (nb - 2)); wpush({ x:x0 + k * bwx + 1, y:y0 + j * fh, w:bwx * 2 - 2, h:fh * 1.6 }); } }
      } else if(kind === 'bands'){
        nf = Math.floor(Ht / fh);
        for(j = 1; j <= nf; j++){ y = y0 + j * fh; if(y > y1 - 3) break; if(R() > dens) continue; hl(y, S.D); }
        nb = Math.max(1, Math.round(Wd / (bw * 3))); bwx = Wd / nb;
        for(k = 1; k < nb; k++){ if(R() > dens * .8) continue; x = x0 + k * bwx; B(x, y1, x, vt(x), S.D); }
      }
    }

    /* ---------------- rooftop & street furniture ---------------- */
    function tank(xc, yr, S, sc){
      // timber water tank on a steel stand: tall staved drum, shallow cone, hoops
      var tw = 12 * sc, th = 17 * sc, lh = 8 * sc, tr = 4.5 * sc, x0 = xc - tw / 2, x1 = xc + tw / 2, yb = yr - lh, yt = yb - th;
      L(x0 + 1.5, yr + .5, x0 + 1.5, yb, S.F); L(x1 - 1.5, yr + .5, x1 - 1.5, yb, S.F); L(xc, yr + .5, xc, yb, S.F);
      L(x0 + 1.5, yr - 1, x1 - 1.5, yb + 1.5, S.H); L(x1 - 1.5, yr - 1, x0 + 1.5, yb + 1.5, S.H);
      L(x0 - 1.5, yb, x1 + 1.5, yb, S.F);
      L(x0, yb, x0 - .4, yt, S.E); L(x1, yt, x1 + .4, yb, S.E);
      A(xc, yb - th * .3, tw / 2 + .2, 1.3, .15, Math.PI - .15, S.F);
      A(xc, yb - th * .64, tw / 2 + .3, 1.3, .15, Math.PI - .15, S.F);
      L(x0 - 1.8, yt + .6, xc + .3, yt - tr, S.E); L(xc - .3, yt - tr, x1 + 1.8, yt + .6, S.E);
      L(x0 - 1.5, yt + .8, x1 + 1.5, yt + .8, S.F);
      L(xc, yt - tr, xc, yt - tr - 2.5, S.F);
      L(x1 - 3, yb - 2, x1 - 3, yt + 2, S.H);
      return { x0:x0, y0:yt - tr * .5, x1:x1, y1:yb };
    }
    function antenna(xc, yr, h, S){
      L(xc - 1, yr, xc - 1, yr - h, S.E); L(xc + 1, yr, xc + 1, yr - h * .72, S.F);
      L(xc - 5, yr - h * .32, xc + 5, yr - h * .32, S.F); L(xc - 3.5, yr - h * .58, xc + 3.5, yr - h * .58, S.F);
      L(xc - 3, yr - 1, xc - 3, yr - h * .2, S.F); L(xc + 3, yr - 1, xc + 3, yr - h * .2, S.F);
    }
    function spire(xc, yr, w, h, S){
      L(xc - w / 2, yr, xc + .4, yr - h, S.O); L(xc - .4, yr - h, xc + w / 2, yr, S.O);
      L(xc, yr - h - 3, xc, yr - h - h * .32, S.F);
      for(var i = 1; i <= 3; i++){ var f = i / 4.2, hw = w / 2 * (1 - f); L(xc - hw, yr - h * f, xc + hw, yr - h * f, S.F); }
      hatch(xc, yr - h * .9, xc + w / 2, yr - 1, 1.05, 3.4, S.H, .8);
    }
    function pyramid(x0, x1, yr, ph, S){
      var xc = (x0 + x1) / 2; L(x0, yr, xc + .5, yr - ph, S.O); L(xc - .5, yr - ph, x1, yr, S.O);
      L(xc, yr - ph, xc, yr - ph - 9, S.F);
      hatch(xc + 1, yr - ph + 4, x1 - 1, yr - 1, 1.15, 3.6, S.H, .75);
    }
    function pent(x0, x1, yr, S){
      var h = rr(7, 13); L(x0, yr, x0, yr - h, S.E); L(x0, yr - h, x1, yr - h, S.E); L(x1, yr - h, x1, yr, S.E);
      for(var y = yr - h + 3.5; y < yr - 1.5; y += 2.8) L(x0 + 1.5, y, x1 - 1.5, y, S.F);
      return { x0:x0, y0:yr - h, x1:x1, y1:yr };
    }
    function awning(x0, x1, y, S){
      L(x0, y, x1, y, S.F); L(x0 - 3, y + 8, x1 + 3, y + 8, S.F); L(x0, y, x0 - 3, y + 8, S.F); L(x1, y, x1 + 3, y + 8, S.F);
      for(var x = x0 + 3; x < x1 - 1; x += 3.6) L(x, y + 1, x + (x - (x0 + x1) / 2) * .08, y + 7.5, S.H);
    }

    /* ---------------- generic building ---------------- */
    function drawB(b, S, lod){
      var T = b.tiers, n = T.length, i, t, bot, rects = [];
      function ry(t, x){ return t.slant == null ? t.top : t.top + (t.slant - t.top) * (x - t.x0) / (t.x1 - t.x0); }
      // massing first: left wall up, roof across, right wall down
      for(i = 0; i < n; i++){
        t = T[i]; bot = i ? T[i - 1].top : G;
        var tr = t.slant == null ? t.top : t.slant;
        B(t.x0, bot, t.x0, t.top, S.O);
        L(t.x0, t.top, t.x1, tr, S.O);
        B(t.x1, tr, t.x1, bot, S.O);
        rects.push({ x0:t.x0, y0:Math.min(t.top, tr), x1:t.x1, y1:bot });
        if(b.parapet && i === n - 1 && t.slant == null) L(t.x0 + rr(2, 6), t.top - 2.6, t.x1 - rr(2, 8), t.top - 2.6, S.F);
        if(b.cornice && i === 0) L(t.x0 - 2.5, t.top + 3.5, t.x1 + 2.5, t.top + 3.5, S.E);
      }
      var tt = T[n - 1], xc = (tt.x0 + tt.x1) / 2;
      if(b.spire) spire(xc, tt.top, b.spireW || (tt.x1 - tt.x0) * .62, b.spire, S);
      if(b.pyr){ pyramid(tt.x0 + 1, tt.x1 - 1, tt.top, b.pyr, S); }
      if(b.ant) antenna(xc + (b.antOff || 0), tt.top, b.ant, S);
      if(b.pent){ var pw = (tt.x1 - tt.x0) * rr(.3, .5), px = tt.x0 + (tt.x1 - tt.x0 - pw) * rr(.15, .85); rects.push(pent(px, px + pw, tt.top, S)); }
      if(b.tank){ rects.push(tank(tt.x0 + (tt.x1 - tt.x0) * b.tank, tt.top, S, b.tsc || 1)); }
      // street level
      if(lod === 2 && b.gh){
        var t0 = T[0], gy = G - b.gh;
        L(t0.x0 + 1, gy, t0.x1 - 1, gy, S.E);
        var nd = Math.max(2, Math.round((t0.x1 - t0.x0) / rr(15, 24))), dw = (t0.x1 - t0.x0) / nd;
        for(var k = 1; k < nd; k++) if(R() < .75) L(t0.x0 + k * dw, gy + 2, t0.x0 + k * dw, G, S.F);
        if(b.awn){ var aw = Math.min(46, (t0.x1 - t0.x0) * .5), ax = t0.x0 + (t0.x1 - t0.x0 - aw) * rr(.2, .8); awning(ax, ax + aw, gy + 3, S); }
      }
      // facades, top tier last so the pen works down the building
      var dens = lod === 2 ? .96 : lod === 1 ? (mob ? .34 : .5) : .22;
      for(i = n - 1; i >= 0; i--){
        t = T[i]; bot = i ? T[i - 1].top : G;
        var side = b.side && i < (b.sideN == null ? n : b.sideN) ? b.side : 0;
        var fb = (i === 0 && lod === 2 && b.gh) ? G - b.gh - 3 : bot - 3;
        var topf = t.slant == null ? null : (function(tt){ return function(x){ return ry(tt, x) + 3; }; })(t);
        if(lod > 0 || R() < .5) facade(b.face, t.x0 + 2.5, t.top + (b.cap || 4), t.x1 - side - 2.5, fb, S, b.fh, b.bw, dens, topf, lod === 2 && b.wash);
        if(side){
          var sx = t.x1 - side;
          L(sx, ry(t, sx) + 1, sx, bot, S.E);
          if(lod === 2 || R() < .6){
            var hy0 = t.top + (bot - t.top) * rr(0, .25), hy1 = bot - (bot - t.top) * rr(0, .18);
            hatch(sx + 1, hy0, t.x1 - 1, hy1, rr(.95, 1.15), lod === 2 ? rr(3.6, 4.6) : 5, S.H, .88);
          }
        }
      }
      return rects;
    }

    /* ---------------- building recipes ---------------- */
    function recipe(type, x0, w, h, lod){
      var x1 = x0 + w, top = G - h, b = { tiers:null, face:'curtain', fh:rr(11, 15), bw:rr(9, 13.5), cap:rr(3, 6) };
      if(lod < 2){ b.fh = rr(13, 18); b.bw = rr(10, 16); }
      if(type === 'deco'){
        b.tiers = [ { x0:x0, x1:x1, top:G - h * .5 }, { x0:x0 + w * .11, x1:x1 - w * .11, top:G - h * .78 }, { x0:x0 + w * .24, x1:x1 - w * .24, top:G - h * .92 }, { x0:x0 + w * .34, x1:x1 - w * .34, top:G - h } ];
        b.face = 'pilaster'; b.side = Math.round(w * .13); b.sideN = 2; b.spire = Math.min(78, h * .22); b.cornice = true;
      } else if(type === 'glass'){
        b.tiers = [ { x0:x0, x1:x1, top:G - h * .93 }, { x0:x0 + w * .16, x1:x1 - w * .16, top:G - h } ];
        b.face = lod === 2 && R() < .35 ? 'fins' : 'curtain'; b.side = Math.round(clamp(w * .16, 9, 16)); b.sideN = 1; b.bw = rr(8, 11.5);
      } else if(type === 'slant'){
        var dn = w * rr(.28, .5);
        b.tiers = [ R() < .5 ? { x0:x0, x1:x1, top:top, slant:top + dn } : { x0:x0, x1:x1, top:top + dn, slant:top } ];
        b.face = R() < .55 ? 'curtain' : 'fins'; b.bw = rr(9, 13);
      } else if(type === 'setback'){
        var i0 = w * rr(.08, .2), i1 = w * rr(.08, .2);
        b.tiers = [ { x0:x0, x1:x1, top:G - h * rr(.56, .7) }, { x0:x0 + i0, x1:x1 - i1, top:G - h * rr(.84, .9) } ];
        if(R() < .6) b.tiers.push({ x0:x0 + i0 + w * .12, x1:x1 - i1 - w * .12, top:G - h });
        else b.tiers[1].top = G - h;
        b.face = pick(['ribbon', 'curtain', 'punched', 'fins']); b.pent = R() < .5; b.parapet = !b.pent;
        if(b.face === 'punched'){ b.fh = rr(13, 16); b.bw = rr(11, 14); }
      } else if(type === 'pyramid'){
        b.tiers = [ { x0:x0, x1:x1, top:G - h * .8 }, { x0:x0 + w * .13, x1:x1 - w * .13, top:G - h * .86 } ];
        b.pyr = Math.min(h * .14, w * .62); b.face = 'pilaster'; b.side = Math.round(w * .14); b.sideN = 1;
      } else if(type === 'slab'){
        b.tiers = [ { x0:x0, x1:x1, top:top } ]; b.face = R() < .65 ? 'ribbon' : 'bands'; b.parapet = true; b.pent = R() < .6;
      } else if(type === 'walkup'){
        b.tiers = [ { x0:x0, x1:x1, top:top } ]; b.face = 'punched'; b.cornice = true; b.fh = rr(13, 16); b.bw = rr(11, 15);
      } else { // box
        b.tiers = [ { x0:x0, x1:x1, top:top } ]; b.face = pick(['curtain', 'bands', 'fins', 'pilaster', 'punched']); b.parapet = R() < .5;
        if(b.face === 'punched'){ b.fh = rr(13, 17); b.bw = rr(11, 15); }
      }
      if(lod < 2 && b.face === 'punched') b.face = 'bands';
      return b;
    }

    /* ---------------- the tower crane (what's being built) ---------------- */
    function crane(mx, yb, hm, jL, cjL, S, dir){
      var mw = 7, yt = yb - hm, xl = mx - mw / 2, xr = mx + mw / 2, i, z, nz;
      B(xl, yb, xl, yt, S.E); B(xr, yb, xr, yt, S.E);
      z = []; nz = Math.max(4, Math.floor(hm / 7.5)); for(i = 0; i <= nz; i++) z.push(i % 2 ? xr : xl, yb - i * hm / nz); P(z, S.F);
      var yj = yt - 1, jd = 6.5, tip = mx + dir * jL, cj = mx - dir * cjL;
      L(mx, yj, tip, yj, S.E);
      L(mx, yj - jd, tip, yj - 2.2, S.E);
      L(tip, yj + 1, tip, yj - 3, S.F);
      z = []; nz = Math.max(6, Math.floor(jL / 7)); for(i = 0; i <= nz; i++){ var f = i / nz; z.push(mx + dir * jL * f, i % 2 ? yj : yj - jd + (jd - 2.2) * f); } P(z, S.F);
      L(mx, yj, cj, yj, S.E); L(mx, yj - 4, cj, yj - 3, S.F);
      var cwx = cj + dir * 1.5; P([cwx, yj + 1, cwx, yj + 10, cwx + dir * 12, yj + 10, cwx + dir * 12, yj + 1], S.E, true);
      hatch(Math.min(cwx, cwx + dir * 12) + 1, yj + 2, Math.max(cwx, cwx + dir * 12) - 1, yj + 9, 1.0, 2.6, S.H, .9);
      var ay = yj - jd - 17;
      L(xl, yj - jd, mx + .3, ay, S.E); L(mx - .3, ay, xr, yj - jd, S.E);
      L(mx, ay, mx + dir * jL * .64, yj - jd + (jd - 2.2) * .64, S.F); L(mx, ay, cj, yj - 3.5, S.F);
      var cx0 = dir > 0 ? xr : xl - 8; P([cx0, yj + 1, cx0, yj + 9, cx0 + 8, yj + 9, cx0 + 8, yj + 1], S.F, true);
      var tx = mx + dir * jL * .7, drop = rr(44, 66);
      L(tx - 3.5, yj + 1.8, tx + 3.5, yj + 1.8, S.F);
      L(tx - 1, yj + 2, tx - 1, yj + drop, S.F); L(tx + 1, yj + 2, tx + 1, yj + drop, S.F);
      P([tx - 2.5, yj + drop, tx - 2.5, yj + drop + 4, tx + 2.5, yj + drop + 4, tx + 2.5, yj + drop], S.F, true);
      L(tx, yj + drop + 4, tx - 12, yj + drop + 13, S.F); L(tx, yj + drop + 4, tx + 12, yj + drop + 13, S.F);
      P([tx - 17, yj + drop + 13, tx + 17, yj + drop + 13, tx + 17, yj + drop + 16.5, tx - 17, yj + drop + 16.5], S.E, true);
    }
    function construction(x0, w, h, S){
      var x1 = x0 + w, top = G - h, fh = 14, yc = G - h * .58, k, y, nb = Math.max(3, Math.round(w / 19)), bw = w / nb, rects = [];
      B(x0, G, x0, top, S.O); B(x1, top, x1, G, S.O);
      L(x0, yc, x1, yc, S.O);
      L(x0 - 4, top, x1 + 5, top, S.O);
      for(y = yc - fh; y > top + 4; y -= fh) L(x0 - rr(1, 4), y, x1 + rr(1, 4), y, S.E);
      for(k = 1; k < nb; k++){ var x = x0 + k * bw; B(x, yc, x, top, S.D); if(R() < .4) L(x, top, x, top - rr(4, 9), S.F); }
      var bx = Math.floor(R() * (nb - 1)), by = Math.floor(rr(0, 2));
      var xa = x0 + bx * bw, ya = yc - by * fh, yb2 = Math.max(top, ya - fh);
      L(xa, ya, xa + bw, yb2, S.F); L(xa + bw, ya, xa, yb2, S.F);
      // scaffold up the left side of the open frame
      for(y = yc; y > top - 1; y -= fh / 2) L(x0 - 7, y, x0 - 1, y, S.F);
      L(x0 - 6.5, yc + 6, x0 - 6.5, top - 6, S.F);
      for(y = yc; y > top + fh; y -= fh) L(x0 - 6.5, y, x0 - 1, y - fh, S.H);
      // clad lower floors
      L(x0 + 1, G - 20, x1 - 1, G - 20, S.E);
      for(k = 1; k < 4; k++) if(R() < .8) L(x0 + k * w / 4, G - 18, x0 + k * w / 4, G, S.F);
      facade('ribbon', x0 + 2.5, yc + 4, x1 - 2.5, G - 23, S, 13, 11, .96, null, true);
      rects.push({ x0:x0, y0:top, x1:x1, y1:G });
      return rects;
    }

    /* ---------------- copy-aware height limits + skyline profile ---------------- */
    var cl = m.cl, cr = m.cr, yIn = m.bB + (mob ? 34 : 30), yOut = m.sT - (mob ? 0 : 6);
    function topLim(x){
      var d = x < cl ? cl - x : x > cr ? x - cr : 0;
      return yIn + (yOut - yIn) * sm(10, 120, d);
    }
    function avail(x){ return Math.max(40, G - topLim(x)); }
    var HL, HR;
    if(mob){ HL = W * .18; HR = W * .85; }
    else { HL = clamp(cl * .5, 70, 260); HR = clamp((cr + W) / 2, W - 260, W - 70); }
    var sg = mob ? W * .2 : Math.max(120, W * .085);
    // downtown clusters around the two hero towers, a lower valley under the copy
    function prof(x){
      var a = Math.exp(-Math.pow((x - HL) / sg, 2)), b = Math.exp(-Math.pow((x - HR) / sg, 2));
      return .34 + .66 * Math.max(a, b);
    }

    /* ===================== FRONT ===================== */
    var S2 = STY[2], specs = [];
    var lm;
    if(mob){
      lm = [ { c:HL, w:70, type:'deco', f:1 }, { c:W * .53, w:78, type:'construction', f:.54 }, { c:HR, w:60, type:'glass', f:.92 } ];
    } else {
      lm = [ { c:HL, w:clamp(cl * .5, 92, 124), type:'deco', f:1 },
             { c:(cl + cr) / 2 + (cr - cl) * .14, w:126, type:'construction', f:.56 },
             { c:HR, w:clamp((W - cr) * .46, 82, 108), type:'glass', f:.97 } ];
    }
    lm.forEach(function(o){ o.x0 = o.c - o.w / 2; o.x1 = o.c + o.w / 2; o.land = true; });
    var minW = mob ? 38 : 52, maxW = mob ? 80 : 140;
    function fill(a, b){
      var x = a;
      while(b - x > 2){
        var w = rr(minW, maxW); if(!mob && R() < .14) w = rr(150, 190);
        if(b - x - w < minW) w = b - x;
        var gap = R() < .22 ? rr(5, 14) : 0;
        if(w - gap > 18) specs.push({ x0:x + gap, x1:x + w });
        x += w;
      }
    }
    var xx = -rr(10, 34);
    for(var i = 0; i < lm.length; i++){ fill(xx, lm[i].x0); specs.push(lm[i]); xx = lm[i].x1 + (R() < .5 ? rr(4, 10) : 0); }
    fill(xx, W + rr(8, 30));
    // heights: alternate low and high neighbours, scaled up near the two downtown clusters
    var band = R() < .5 ? 1 : 0;
    specs.forEach(function(s, i){
      var xc = (s.x0 + s.x1) / 2, av = avail(xc);
      if(s.land){
        s.h = av * s.f;
        if(mob) s.h -= s.type === 'deco' ? 40 : s.type === 'glass' ? 22 : 0;   // spire / antenna stay under the buttons
        band = 1; return;
      }
      var pf = prof(xc);
      band = R() < .8 ? 1 - band : band;
      var nextL = specs[i + 1] && specs[i + 1].land, prevL = specs[i - 1] && specs[i - 1].land;
      if(nextL || prevL) band = 0;
      var f = band ? rr(.52, .88) : rr(.2, .42);
      f *= .6 + .4 * pf;
      if(band && pf < .5 && R() < .35) f = rr(.62, .8);      // the odd taller block in the valley
      s.f = clamp(f, .16, .9); s.h = av * s.f;
      var w = s.x1 - s.x0;
      if(s.h > 260) s.type = pick(['glass', 'slant', 'setback', 'box', 'setback', 'glass']);
      else if(s.h > 150) s.type = w > 140 ? 'slab' : pick(['setback', 'slab', 'glass', 'box', 'slant', 'box']);
      else { var lr = R(); s.type = w > 150 || lr < .28 ? 'slab' : lr < .78 ? 'walkup' : 'box'; }
    });
    var tanks = 0, lastTank = -1e9;
    specs.forEach(function(s){
      if(s.land || tanks >= (mob ? 2 : 3) || s.x0 - lastTank < W * .14) return;
      if((s.type === 'walkup' && R() < .6) || (s.type === 'slab' && R() < .3)){ s.tank = rr(.22, .72); tanks++; lastTank = s.x0; }
    });
    if(tanks < 2){ specs.forEach(function(s){ if(tanks < 2 && !s.land && !s.tank && s.h < 230){ s.type = 'walkup'; s.tank = rr(.25, .7); tanks++; } }); }

    // ground line first: a few long pulls of the pen
    item(2, 0);
    var gx = -12;
    while(gx < W + 10){ var gl = rr(W * .22, W * .42); L(gx, G + rr(-.6, .6), Math.min(W + 14, gx + gl), G + rr(-.6, .6), { w:1.2, a:.55, c:0, ov0:0, ov1:6, wob:.5, jit:.5, step:6 }); gx += gl - rr(6, 22); }
    for(var q = 0; q < (mob ? 2 : 4); q++){ var qx = rr(0, W * .85); L(qx, G + 7, qx + rr(40, 160), G + 7.5, { w:.8, a:.2, c:1, ov0:0, ov1:3, wob:.4, jit:.4 }); }
    cur.dur = .55;

    var craneSpec = null;
    specs.forEach(function(s){
      var w = s.x1 - s.x0, xc = (s.x0 + s.x1) / 2, u = xc / W;
      var it = item(2, .78 + u * 1.5 + rr(-.06, .06)), rects;
      if(s.type === 'construction'){
        rects = construction(s.x0, w, s.h, S2); craneSpec = s; s.item = it;
      } else {
        var b = recipe(s.type, s.x0, w, s.h, 2);
        b.wash = true;
        if(!b.side && (s.type === 'setback' || s.type === 'box' || s.type === 'slab') && w > 70 && R() < .45){ b.side = Math.round(rr(10, 16)); b.sideN = 1; }
        if(s.type === 'walkup' || (s.type === 'slab' && R() < .5)){ b.gh = rr(16, 22); b.awn = R() < .55; }
        else if(R() < .6) b.gh = rr(18, 26);
        if(s.tank){ b.tank = s.tank; b.pent = false; }
        if(s.type === 'glass' && s.land) b.ant = mob ? 34 : Math.min(60, s.h * .14);
        else if(s.type === 'glass' && R() < .5) b.ant = rr(16, 30);
        if(s.type === 'deco' && s.land) b.spire = mob ? 46 : Math.min(80, s.h * .19);
        rects = drawB(b, S2, 2);
      }
      it.dur = clamp(.55 + it.L / 15000, .6, 1.15);
      for(var r = 0; r < rects.length; r++) occ[2].push(rects[r]);
      s.top = G - s.h;
    });
    if(craneSpec){
      var cs = craneSpec, cw = cs.x1 - cs.x0, ctop = G - cs.h;
      var it = item(2, cs.item.t0 + cs.item.dur * .75);
      var mx = cs.x0 + cw * .3, hm = Math.max(50, ctop - (yIn + (mob ? 34 : 30)));
      var jL = mob ? Math.min(W * .36, 140) : clamp(cw * 1.5, 160, 205), cjL = jL * .33;
      crane(mx, ctop, hm, jL, cjL, STY[3], 1);
      it.dur = .95;
    }
    function frontTop(x){ var y = G; for(var i = 0; i < specs.length; i++){ var s = specs[i]; if(x >= s.x0 && x <= s.x1) y = Math.min(y, s.top); } return y; }

    /* ===================== MID ===================== */
    var S1 = STY[1];
    (function(){
      var x = -rr(4, 30), prev = 0;
      while(x < W + 10){
        var w = rr(mob ? 40 : 40, mob ? 78 : 110), gap = R() < .32 ? rr(4, 18) : 0, x0 = x + gap, x1 = x + w, xc = (x0 + x1) / 2;
        var lim = G - (topLim(xc) - (mob ? 4 : 24)), ft = G - frontTop(xc);
        var h = lim * (rr(.3, .95) * .6 + prof(xc) * .45 - .05);
        if(h < ft + 14) h = R() < .55 ? ft + rr(16, 60) : 0;
        if(Math.abs(h - prev) < 22) h += rr(26, 54) * (R() < .5 ? -1 : 1);
        h = Math.min(h, lim);
        if(h > 40 && x1 - x0 > 16){
          prev = h;
          var it = item(1, .32 + (xc / W) * 1.25 + rr(-.05, .05));
          var type = h > 230 ? pick(['glass', 'setback', 'slant', 'box', 'setback']) : pick(['box', 'setback', 'slab', 'box']);
          var b = recipe(type, x0, x1 - x0, h, 1);
          if(R() < .22) b.ant = rr(14, 30);
          if(type === 'slab' && R() < .4) { b.tank = rr(.2, .7); b.tsc = .9; }
          var rects = drawB(b, S1, 1);
          it.dur = clamp(.4 + it.L / 9000, .45, .8);
          for(var r = 0; r < rects.length; r++) occ[1].push(rects[r]);
        }
        x += w;
      }
    })();

    /* ===================== BACK ===================== */
    var S0 = STY[0];
    // the architect's faint construction lines, blocked in before anything else
    (function(){
      var saved = occList; item(0, 0); occList = null;
      var gs = { w:.7, a:mob ? .09 : .1, c:1, ov0:0, ov1:10, wob:.5, jit:.4, step:7 };
      var ys = mob ? [.42, .7] : [.3, .52, .74];
      for(var i = 0; i < ys.length; i++){
        var y = G - (G - yIn) * ys[i] + rr(-8, 8), x0 = rr(-20, W * .3), x1 = x0 + rr(W * .35, W * .75);
        L(x0, y, Math.min(W + 20, x1), y + rr(-1.5, 1.5), gs);
      }
      if(!mob){ L(HL + rr(-30, 30), G + 4, HL + rr(-30, 30), G - avail(HL) * .9, gs); L(HR + rr(-30, 30), G + 4, HR + rr(-30, 30), G - avail(HR) * .8, gs); }
      cur.dur = .5; occList = saved;
    })();
    (function(){
      var x = -rr(2, 20), prev = 0;
      while(x < W + 10){
        var w = rr(mob ? 22 : 26, mob ? 50 : 76), gap = R() < .3 ? rr(4, 26) : 0, x0 = x + gap, x1 = x + w, xc = (x0 + x1) / 2;
        var lim = G - (topLim(xc) - (mob ? 10 : 44)), ft = G - frontTop(xc);
        var h = lim * (rr(.35, 1) * .55 + prof(xc) * .5 - .05);
        if(h < ft + 20) h = R() < .6 ? ft + rr(24, 90) : 0;
        if(Math.abs(h - prev) < 24) h += rr(28, 60) * (R() < .5 ? -1 : 1);
        h = Math.min(h, lim);
        if(h > 50 && x1 - x0 > 12 && R() > .08){
          prev = h;
          var it = item(0, .05 + (xc / W) * 1.0 + rr(-.05, .05));
          var type = pick(['box', 'box', 'setback', 'glass', 'slant', 'box', 'setback']);
          var b = recipe(type, x0, x1 - x0, h, 0);
          b.side = 0; b.pent = false; b.pyr = 0;
          if(R() < .18) b.ant = rr(12, 26);
          else if(type === 'box' && R() < .14){ b.spire = rr(18, 32); b.spireW = Math.min(9, (x1 - x0) * .22); }
          drawB(b, S0, 0);
          it.dur = clamp(.35 + it.L / 7000, .4, .7);
        }
        x += w;
      }
    })();

    /* ---- washes: a few front windows, kept clear of the copy ---- */
    var washes = [], wN = mob ? 5 : 10, minY = m.bB + 60;
    var okC = washC.filter(function(c){ return c.y > minY && c.y + c.h < G - 4 && c.w > 3 && c.h > 3; });
    var used = [];
    for(var wi = 0; wi < wN; wi++){
      var bx0 = W * wi / wN, bx1 = W * (wi + 1) / wN;
      var inBin = okC.filter(function(c){ return c.x >= bx0 && c.x < bx1 && used.indexOf(c.it) < 0; });
      if(!inBin.length) continue;
      var c = inBin[Math.floor(R() * inBin.length)]; used.push(c.it);
      var run = !c.p && c.w < 14 ? Math.floor(rr(2, 4)) : 1;
      washes.push({ x:c.x + rr(-1, 1), y:c.y + rr(-1, 1), w:(c.w + 2) * run * rr(.92, 1.08) - 2, h:c.h * rr(.94, 1.1), r:rr(-.8, .8) });
    }

    var end = 0;
    layers.forEach(function(L2){ L2.forEach(function(it){ end = Math.max(end, it.t0 + it.dur); }); });
    return { layers:layers, washes:washes, end:end, W:W, Hc:Hc, G:G, yIn:yIn };
  }

  /* =====================================================================
     RENDERING
     ===================================================================== */
  function size(m){
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    city.style.setProperty('--sky-top', m.top + 'px');
    // mask: an elliptical pocket around the copy + a fade at the top of the city
    city.style.setProperty('--sky-mx', ((m.cl + m.cr) / 2).toFixed(1) + 'px');
    city.style.setProperty('--sky-my', ((m.tT + m.bB) / 2).toFixed(1) + 'px');
    city.style.setProperty('--sky-rx', ((m.cr - m.cl) / 2 + (m.mob ? 40 : 76)).toFixed(1) + 'px');
    city.style.setProperty('--sky-ry', ((m.bB - m.tT) / 2 + (m.mob ? 40 : 52)).toFixed(1) + 'px');
    city.style.setProperty('--sky-lf', Math.max(60, m.sT + 20).toFixed(1) + 'px');
    sec.style.setProperty('--sky-gp', m.gp + 'px');
    cvs.forEach(function(c, i){
      var d = i === 0 ? Math.min(dpr, 1.5) : dpr;            // faint back layer needs less resolution
      c.width = Math.round(m.W * d); c.height = Math.round(m.Hc * d);
      ctxs[i].setTransform(d, 0, 0, d, 0, 0);
      ctxs[i].lineCap = 'butt'; ctxs[i].lineJoin = 'round';
    });
  }
  function makeGrads(sc){
    var Hc = sc.Hc, G = sc.G, span = G - sc.yIn;
    grads = [];
    for(var li = 0; li < 3; li++){
      grads.push(RGB.map(function(c){
        var g = ctxs[li].createLinearGradient(0, 0, 0, Hc);
        for(var i = 0; i <= 16; i++){
          var y = Hc * i / 16, a = 1;
          if(li === 0) a *= 1 - .86 * sm(G - span * .62, G - 4, y);
          if(li === 1) a *= 1 - .55 * sm(G - span * .45, G, y);
          g.addColorStop(i / 16, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')');
        }
        return g;
      }));
    }
  }
  function seg(ctx, li, st, d0, d1){
    var p = st.p, cum = st.cum, n = cum.length, i = 0;
    while(i < n - 2 && cum[i + 1] <= d0) i++;
    var f = cum[i + 1] > cum[i] ? (d0 - cum[i]) / (cum[i + 1] - cum[i]) : 0;
    ctx.strokeStyle = grads[li][st.c]; ctx.lineWidth = st.w; ctx.globalAlpha = st.a;
    ctx.beginPath();
    ctx.moveTo(p[i * 2] + (p[i * 2 + 2] - p[i * 2]) * f, p[i * 2 + 1] + (p[i * 2 + 3] - p[i * 2 + 1]) * f);
    i++;
    while(i < n - 1 && cum[i] < d1){ ctx.lineTo(p[i * 2], p[i * 2 + 1]); i++; }
    var j = i - 1, g = cum[i] > cum[j] ? (Math.min(d1, cum[i]) - cum[j]) / (cum[i] - cum[j]) : 1;
    ctx.lineTo(p[j * 2] + (p[i * 2] - p[j * 2]) * g, p[j * 2 + 1] + (p[i * 2 + 1] - p[j * 2 + 1]) * g);
    ctx.stroke();
  }
  function full(ctx, li, st){
    var p = st.p, n = p.length >> 1;
    ctx.strokeStyle = grads[li][st.c]; ctx.lineWidth = st.w; ctx.globalAlpha = st.a;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for(var i = 1; i < n; i++) ctx.lineTo(p[i * 2], p[i * 2 + 1]);
    ctx.stroke();
  }
  function clearAll(){ ctxs.forEach(function(c){ c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); }); }
  function drawAll(){
    clearAll();
    scene.layers.forEach(function(L2, li){
      var ctx = ctxs[li];
      L2.forEach(function(it){ for(var k = 0; k < it.strokes.length; k++) full(ctx, li, it.strokes[k]); it.k = it.strokes.length; it.s = it.L; });
    });
    ctxs.forEach(function(c){ c.globalAlpha = 1; });
  }
  function ease(t){ return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function advance(t){
    scene.layers.forEach(function(L2, li){
      var ctx = ctxs[li];
      for(var q = 0; q < L2.length; q++){
        var it = L2[q]; if(it.k >= it.strokes.length) continue;
        var p = (t - it.t0) / it.dur; if(p <= 0) continue;
        var s = it.L * ease(p > 1 ? 1 : p);
        while(it.s < s - 1e-3 && it.k < it.strokes.length){
          var st = it.strokes[it.k], need = s - it.s, d1 = Math.min(st.len, it.d + need);
          if(d1 > it.d) seg(ctx, li, st, it.d, d1);
          it.s += d1 - it.d;
          if(d1 >= st.len - 1e-3){ it.k++; it.d = 0; } else it.d = d1;
        }
      }
    });
  }
  function placeWashes(){
    var h = '';
    scene.washes.forEach(function(w, i){
      h += '<i class="sky-w" style="left:' + w.x.toFixed(1) + 'px;top:' + w.y.toFixed(1) + 'px;width:' + w.w.toFixed(1) + 'px;height:' + w.h.toFixed(1) +
           'px;transform:rotate(' + w.r.toFixed(2) + 'deg);transition-delay:' + (RED ? 0 : (i * .13).toFixed(2)) + 's"></i>';
    });
    washBox.innerHTML = h;
  }
  function washesOn(){ washBox.classList.add('sky-on'); }

  /* ---------------- lifecycle ---------------- */
  function build(){
    var m = measure(); if(!m) return;
    lastW = m.W; lastH = m.H;
    size(m);
    scene = gen(m);
    makeGrads(scene);
    placeWashes();
    if(done){ drawAll(); washesOn(); }
    else if(started){ done = true; stop(); drawAll(); washesOn(); }   // resized mid-draw: settle at the finished drawing
    else { clearAll(); washBox.classList.remove('sky-on'); }
    parallax();
  }
  function frame(now){
    raf = 0;
    if(!inView || !NVV.visible(root) || done){ last = 0; return; }
    var dt = last ? Math.min(120, now - last) : 16; last = now; T += dt / 1000;
    advance(T);
    if(T >= scene.end + .05){ done = true; ctxs.forEach(function(c){ c.globalAlpha = 1; }); washesOn(); return; }
    raf = requestAnimationFrame(frame);
  }
  function play(){ if(!raf && !done && scene) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } last = 0; }

  function parallax(){
    pr = 0;
    if(RED || !scene || !NVV.visible(root)) return;
    var r = sec.getBoundingClientRect(), vh = window.innerHeight || 1;
    var p = clamp((r.top + r.height * .5 - vh * .5) / vh, -1.2, 1.2);
    lays[0].style.transform = 'translate3d(0,' + (-p * PAR[0]).toFixed(2) + 'px,0)';
    lays[1].style.transform = 'translate3d(0,' + (-p * PAR[1]).toFixed(2) + 'px,0)';
  }
  window.addEventListener('scroll', function(){ if(RED || !inView || pr) return; if(!NVV.visible(root)) return; pr = requestAnimationFrame(parallax); }, { passive:true });

  build();

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        inView = e.isIntersecting; if(!inView) stop();
      });
      if(inView && started) play();
    }, { threshold:[0, .3, .6] }).observe(sec);
  } else { started = true; done = true; if(scene){ drawAll(); washesOn(); } }
  // the pen starts once the city itself is properly in view
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting && e.intersectionRatio >= .3 && !started){ started = true; inView = true; if(!done) play(); } });
    }, { threshold:[.3] }).observe(city);
  }
  if('ResizeObserver' in window){
    new ResizeObserver(function(){
      clearTimeout(rt);
      rt = setTimeout(function(){
        if(!NVV.visible(root)) return;
        var r = sec.getBoundingClientRect();
        if(Math.abs(r.width - lastW) < 1 && Math.abs(r.height - lastH) < 1) return;
        build();
      }, 160);
    }).observe(sec);
  }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ var r = sec.getBoundingClientRect(); if(r.width > 0 && (Math.abs(r.width - lastW) >= 1 || Math.abs(r.height - lastH) >= 1)) build(); });
});
}catch(e){ if(window.console) console.warn('[start-here]', e); }
})();
