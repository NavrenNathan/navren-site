/* ==========================================================================
   NAVREN — SIGNAL ROOM · hero visuals
   One canvas per <div class="hero-vis" data-vis="KEY"><canvas></canvas></div>
   Keys: strategy · communications · search · content · email · services ·
         who · notfound.   Registry: NVX.vis.reg(key, { init(c), draw(c, dt) })
   c = { el, cv, ctx, w, h, dpr, t, st }  (CSS-pixel space, t in seconds)
   Everything is drawn inside the canvas; no DOM text is created.
   ========================================================================== */
(function(){
  'use strict';
  var W = window, D = document;
  if(!W.HTMLCanvasElement || !D.querySelectorAll) return;
  var NVX = W.NVX = W.NVX || {};
  if(NVX.vis && NVX.vis._live) return;

  /* ------------------------------------------------------------ palette */
  var PAPER = '232,237,234', MUTED = '147,163,158', FAINT = '118,134,127',
      JADE = '13,107,84', JB = '61,170,136', MINT = '139,224,192', HI = '223,255,242',
      INK = '11,17,16', PANEL = '17,26,24', PANEL2 = '19,32,28';
  var cMUTED = [147,163,158], cMINT = [139,224,192], cPAPER = [232,237,234], cFAINT = [118,134,127];
  var FM = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var LS = 1.3, TAU = Math.PI * 2;

  /* ------------------------------------------------------------ math */
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function sstep(a, b, x){ var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function eio(t){ t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eos(t){ t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function esin(t){ t = clamp(t, 0, 1); return .5 - .5 * Math.cos(Math.PI * t); }
  function hash(n){ var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function vn(x){ var i = Math.floor(x), f = x - i; f = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), f); }
  function bz(a, b, c, d, t){ var m = 1 - t; return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d; }
  function prng(seed){
    var s = seed >>> 0;
    return function(){
      s = (s + 0x6D2B79F5) >>> 0; var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rgba(c, a){ a = a < 0 ? 0 : a > 1 ? 1 : a; return 'rgba(' + c + ',' + (Math.round(a * 1000) / 1000) + ')'; }
  function mix(c1, c2, t){
    t = clamp(t, 0, 1);
    return Math.round(c1[0] + (c2[0] - c1[0]) * t) + ',' + Math.round(c1[1] + (c2[1] - c1[1]) * t) + ',' + Math.round(c1[2] + (c2[2] - c1[2]) * t);
  }
  /* width of a mono string (Plex Mono advance = .6em) — font-load independent */
  function tw(s, size, ls){ size = size || 9.5; ls = ls == null ? LS : ls; return s.length * size * .6 + Math.max(0, s.length - 1) * ls; }

  /* ------------------------------------------------------------ drawing helpers */
  var lsOK = null;
  function setLS(ctx, v){
    if(lsOK === false) return false;
    try{
      if(!('letterSpacing' in ctx)){ lsOK = false; return false; }
      ctx.letterSpacing = v + 'px'; lsOK = true; return true;
    }catch(e){ lsOK = false; return false; }
  }
  /* mono label, vertically centred on y (caps), x anchored by align */
  function mono(ctx, s, x, y, align, col, size, weight, ls){
    size = size || 9.5; ls = ls == null ? LS : ls; align = align || 'left';
    ctx.font = (weight || 500) + ' ' + size + 'px ' + FM;
    var sp = ls ? setLS(ctx, ls) : false;
    if(sp){ if(align === 'right') x += ls; else if(align === 'center') x += ls / 2; }
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = col;
    ctx.fillText(s, x, y + size * .36);
    if(sp) setLS(ctx, 0);
  }
  function sq(ctx, x, y, s, col){ ctx.fillStyle = col; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
  function sqC(ctx, x, y, s, col){ ctx.fillStyle = col; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
  function ring(ctx, x, y, s, col, lw){
    ctx.strokeStyle = col; ctx.lineWidth = lw || 1;
    ctx.strokeRect(x - s / 2, y - s / 2, s, s);
  }
  function ringC(ctx, x, y, s, col){
    s = Math.round(s); ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x - s / 2) + .5, Math.round(y - s / 2) + .5, s - 1, s - 1);
  }
  function dashH(ctx, x0, x1, y, col){
    ctx.fillStyle = col; y = Math.round(y);
    for(var x = Math.round(x0); x < x1; x += 6) ctx.fillRect(x, y, Math.min(2, x1 - x), 1);
  }
  function dashV(ctx, x, y0, y1, col){
    ctx.fillStyle = col; x = Math.round(x);
    for(var y = Math.round(y0); y < y1; y += 6) ctx.fillRect(x, y, 1, Math.min(2, y1 - y));
  }
  function dotH(ctx, x0, x1, y, col){ ctx.fillStyle = col; y = Math.round(y); for(var x = Math.round(x0); x < x1; x += 6) ctx.fillRect(x, y, 1.4, 1); }
  function dotV(ctx, x, y0, y1, col){ ctx.fillStyle = col; x = Math.round(x); for(var y = Math.round(y0); y < y1; y += 6) ctx.fillRect(x, y, 1, 1.4); }
  function rrp(ctx, x, y, w, h, r){
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function brackets(ctx, x, y, w, h, L, col){
    L = Math.round(L); if(L < 1) return;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    ctx.fillStyle = col;
    ctx.fillRect(x, y, L, 1); ctx.fillRect(x, y, 1, L);
    ctx.fillRect(x + w - L, y, L, 1); ctx.fillRect(x + w - 1, y, 1, L);
    ctx.fillRect(x, y + h - 1, L, 1); ctx.fillRect(x, y + h - L, 1, L);
    ctx.fillRect(x + w - L, y + h - 1, L, 1); ctx.fillRect(x + w - 1, y + h - L, 1, L);
  }
  var GLOW = null;
  function glowSprite(){
    if(GLOW) return GLOW;
    var s = 128, cv = D.createElement('canvas'); cv.width = cv.height = s;
    var g = cv.getContext('2d'), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(223,255,242,.85)');
    gr.addColorStop(.1, 'rgba(139,224,192,.6)');
    gr.addColorStop(.32, 'rgba(61,170,136,.22)');
    gr.addColorStop(.62, 'rgba(61,170,136,.06)');
    gr.addColorStop(1, 'rgba(61,170,136,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return (GLOW = cv);
  }
  /* soft glow: mint core → jade-bright → transparent */
  function glowDot(ctx, x, y, r, a){
    if(!(a > .004) || r <= 0) return;
    var ga = ctx.globalAlpha; ctx.globalAlpha = ga * Math.min(1, a);
    ctx.drawImage(glowSprite(), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = ga;
  }
  /* fade canvas content to transparent towards the edges */
  function fadeEdges(ctx, w, h, fx, fy){
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; var g;
    if(fx){
      g = ctx.createLinearGradient(0, 0, fx, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, fx, h);
      g = ctx.createLinearGradient(w - fx, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g; ctx.fillRect(w - fx, 0, fx, h);
    }
    if(fy){
      g = ctx.createLinearGradient(0, 0, 0, fy); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, fy);
      g = ctx.createLinearGradient(0, h - fy, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g; ctx.fillRect(0, h - fy, w, fy);
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------ sampled paths (arc-length) */
  var P0 = { x:0, y:0 };
  function Path(xs, ys){
    var n = xs.length, L = 0;
    this.n = n; this.x = new Float32Array(xs); this.y = new Float32Array(ys); this.s = new Float32Array(n);
    for(var i = 1; i < n; i++){
      var dx = this.x[i] - this.x[i - 1], dy = this.y[i] - this.y[i - 1];
      L += Math.sqrt(dx * dx + dy * dy); this.s[i] = L;
    }
    this.len = L;
  }
  Path.prototype.at = function(d, o){
    var n = this.n, s = this.s;
    if(d <= 0){ o.x = this.x[0]; o.y = this.y[0]; return o; }
    if(d >= this.len){ o.x = this.x[n - 1]; o.y = this.y[n - 1]; return o; }
    var lo = 0, hi = n - 1;
    while(hi - lo > 1){ var m = (lo + hi) >> 1; if(s[m] <= d) lo = m; else hi = m; }
    var f = (d - s[lo]) / ((s[hi] - s[lo]) || 1);
    o.x = this.x[lo] + (this.x[hi] - this.x[lo]) * f; o.y = this.y[lo] + (this.y[hi] - this.y[lo]) * f;
    return o;
  };
  Path.prototype.trace = function(ctx, d0, d1){
    var p = this.at(d0, P0); ctx.moveTo(p.x, p.y);
    for(var i = 1; i < this.n; i++){
      if(this.s[i] <= d0) continue;
      if(this.s[i] >= d1) break;
      ctx.lineTo(this.x[i], this.y[i]);
    }
    p = this.at(d1, P0); ctx.lineTo(p.x, p.y);
  };
  function bezPath(x0, y0, x1, y1, x2, y2, x3, y3, n){
    var xs = [], ys = [];
    for(var i = 0; i <= n; i++){ var t = i / n; xs.push(bz(x0, x1, x2, x3, t)); ys.push(bz(y0, y1, y2, y3, t)); }
    return new Path(xs, ys);
  }
  /* orthogonal polyline with rounded corners */
  function polyPath(pts, r){
    var xs = [pts[0]], ys = [pts[1]], n = pts.length / 2;
    for(var i = 1; i < n - 1; i++){
      var ax = pts[i * 2 - 2], ay = pts[i * 2 - 1], bx = pts[i * 2], by = pts[i * 2 + 1], cx = pts[i * 2 + 2], cy = pts[i * 2 + 3];
      var d1 = Math.hypot(bx - ax, by - ay), d2 = Math.hypot(cx - bx, cy - by);
      if(d1 < .01 || d2 < .01){ continue; }
      var rr = Math.min(r, d1 / 2, d2 / 2);
      var sx = bx - (bx - ax) / d1 * rr, sy = by - (by - ay) / d1 * rr, ex = bx + (cx - bx) / d2 * rr, ey = by + (cy - by) / d2 * rr;
      xs.push(sx); ys.push(sy);
      for(var k = 1; k <= 6; k++){
        var t = k / 6, m = 1 - t;
        xs.push(m * m * sx + 2 * m * t * bx + t * t * ex); ys.push(m * m * sy + 2 * m * t * by + t * t * ey);
      }
    }
    xs.push(pts[n * 2 - 2]); ys.push(pts[n * 2 - 1]);
    return new Path(xs, ys);
  }

  /* ------------------------------------------------------------ engine */
  var REG = {}, items = [], booted = false, raf = 0, last = 0, fontGen = 0, reduced = false, mq = null;
  try{ mq = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : null; }catch(e){ mq = null; }
  reduced = !!(mq && mq.matches);
  var rAF = W.requestAnimationFrame ? function(f){ return W.requestAnimationFrame(f); } : function(f){ return W.setTimeout(function(){ f(Date.now()); }, 16); };
  var ro = null, io = null;

  function measure(it){
    var c = it.c, el = c.el;
    var w = Math.round(el.clientWidth || 0), h = Math.round(el.clientHeight || 0);
    if(w < 4 || h < 4){ it.ok = false; return false; }
    var dpr = Math.min(2, W.devicePixelRatio || 1);
    if(it.ok && w === c.w && h === c.h && dpr === c.dpr) return false;
    c.w = w; c.h = h; c.dpr = dpr;
    c.cv.width = Math.round(w * dpr); c.cv.height = Math.round(h * dpr);
    c.cv.style.width = w + 'px'; c.cv.style.height = h + 'px';
    it.ok = true;
    if(!it.inited){
      it.inited = true;
      if(typeof it.def.init === 'function'){
        try{ it.def.init(c); }catch(e){ fail(it, e); }
      }
    }
    return true;
  }
  function fail(it, e){
    it.dead = true;
    try{ it.c.ctx.setTransform(1, 0, 0, 1, 0, 0); it.c.ctx.clearRect(0, 0, it.c.cv.width, it.c.cv.height); }catch(_){}
    if(NVX.debug && W.console) W.console.warn('[NVX.vis]', e);
  }
  function paint(it, dt){
    if(it.dead || !it.ok) return;
    var c = it.c, ctx = c.ctx;
    ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.setLineDash([]); ctx.lineWidth = 1;
    ctx.clearRect(0, 0, c.w, c.h);
    try{ it.def.draw(c, dt); }catch(e){ fail(it, e); }
  }
  function active(it){ return it.ok && it.vis && !it.dead; }
  function kick(){
    if(raf || reduced || D.hidden) return;
    for(var i = 0; i < items.length; i++){
      if(active(items[i])){ last = 0; raf = rAF(tick); return; }
    }
  }
  function tick(now){
    raf = 0;
    if(reduced || D.hidden) return;
    var dt = last ? (now - last) / 1000 : 1 / 60; last = now;
    if(!(dt >= 0)) dt = 0; if(dt > .05) dt = .05;
    var any = false;
    for(var i = 0; i < items.length; i++){
      var it = items[i];
      if(!active(it)) continue;
      it.c.t += dt; paint(it, dt); any = true;
    }
    if(any) raf = rAF(tick);
  }
  function refresh(it){ if(measure(it)) paint(it, 0); }
  function repaintAll(){ for(var i = 0; i < items.length; i++){ if(items[i].ok) paint(items[i], 0); } }
  function attach(el){
    if(el.__nvx) return;
    var key = el.getAttribute('data-vis'), def = REG[key];
    if(!def) return;
    var cv = el.querySelector('canvas');
    if(!cv){ cv = D.createElement('canvas'); el.appendChild(cv); }
    var ctx = null;
    try{ ctx = cv.getContext('2d'); }catch(e){ ctx = null; }
    if(!ctx) return;
    cv.style.display = 'block';
    var it = { def:def, c:{ el:el, cv:cv, ctx:ctx, w:0, h:0, dpr:1, t:0, st:{} }, ok:false, vis:!io, inited:false, dead:false };
    el.__nvx = it; items.push(it);
    if(ro) ro.observe(el);
    if(io) io.observe(el);
    refresh(it);
  }
  function scan(){
    booted = true;
    var els = D.querySelectorAll('.hero-vis[data-vis]');
    for(var i = 0; i < els.length; i++) attach(els[i]);
    kick();
  }
  if(W.ResizeObserver){
    ro = new W.ResizeObserver(function(en){
      for(var i = 0; i < en.length; i++){ var it = en[i].target.__nvx; if(it) refresh(it); }
      kick();
    });
  } else {
    W.addEventListener('resize', function(){ for(var i = 0; i < items.length; i++) refresh(items[i]); kick(); });
  }
  if(W.IntersectionObserver){
    io = new W.IntersectionObserver(function(en){
      for(var i = 0; i < en.length; i++){ var it = en[i].target.__nvx; if(it) it.vis = en[i].isIntersecting; }
      kick();
    }, { rootMargin:'80px 0px 80px 0px' });
  }
  D.addEventListener('visibilitychange', function(){ if(!D.hidden) kick(); });
  W.addEventListener('load', function(){ for(var i = 0; i < items.length; i++) refresh(items[i]); kick(); });
  if(mq){
    var onMQ = function(){
      var r = !!mq.matches; if(r === reduced) return;
      reduced = r; repaintAll(); kick();
    };
    if(mq.addEventListener) mq.addEventListener('change', onMQ); else if(mq.addListener) mq.addListener(onMQ);
  }
  if(D.fonts){
    var onFonts = function(){ fontGen++; repaintAll(); };
    if(D.fonts.ready && D.fonts.ready.then) D.fonts.ready.then(onFonts, function(){});
    if(D.fonts.addEventListener) D.fonts.addEventListener('loadingdone', onFonts);
  }

  function reg(key, def){
    if(!key || !def || typeof def.draw !== 'function') return;
    REG[key] = def;
    if(booted) scan();
  }
  NVX.vis = {
    _live: true,
    reg: reg,
    boot: scan,
    reduced: function(){ return reduced; },
    util: { clamp:clamp, lerp:lerp, sstep:sstep, eio:eio, eos:eos, esin:esin, hash:hash, vn:vn, rgba:rgba, mix:mix, tw:tw,
            mono:mono, sq:sq, ring:ring, dashH:dashH, dashV:dashV, rrp:rrp, brackets:brackets, glowDot:glowDot, fadeEdges:fadeEdges,
            C:{ PAPER:PAPER, MUTED:MUTED, FAINT:FAINT, JADE:JADE, JB:JB, MINT:MINT, HI:HI, INK:INK, PANEL:PANEL } }
  };

  /* ================================================================ 1 · strategy — positioning map */
  /* competitor offsets inside the crowded cluster (units of cluster radius) */
  var COMP = [[-.30,-.35],[.08,-.10],[-.62,.16],[.36,-.50],[-.14,.40],[-.86,-.22],[.50,.12],[-.42,-.68],[.22,.56],[.74,-.28],[-.66,.62],[-.02,-.66],[.44,.48],[-.96,.30]];
  var YOUP = [.08,-.08, -.06,.02, .14,-.64, .52,-.52]; /* start (cluster units), c1, c2, end (plot units) */
  reg('strategy', {
    init: function(c){},
    draw: function(c){
      var ctx = c.ctx, w = c.w, h = c.h, P = 15;
      var T = reduced ? 11.2 : c.t % P, tt = c.t;
      var pl = clamp(w * .06, 16, 40), pt = clamp(h * .065, 14, 34);
      var x0 = Math.round(pl), x1 = Math.round(w - pl), y0 = Math.round(pt), y1 = Math.round(h - pt);
      var cx = Math.round((x0 + x1) / 2), cy = Math.round((y0 + y1) / 2), hw = (x1 - x0) / 2, hh = (y1 - y0) / 2;
      var ARR = 8.0;
      var fi = reduced ? 1 : sstep(0, 1.2, T), fo = reduced ? 1 : 1 - sstep(13.2, 14.7, T), ya = fi * fo;
      var qa = (reduced ? 1 : sstep(ARR, ARR + 1.5, T)) * fo;

      // quarter dotted grid
      dotV(ctx, x0 + hw * .5, y0, y1, rgba(PAPER, .05)); dotV(ctx, cx + hw * .5, y0, y1, rgba(PAPER, .05));
      dotH(ctx, x0, x1, y0 + hh * .5, rgba(PAPER, .05)); dotH(ctx, x0, x1, cy + hh * .5, rgba(PAPER, .05));

      // open quadrant tint + brackets
      if(qa > .002){
        ctx.fillStyle = rgba(JB, .06 * qa); ctx.fillRect(cx + 1, y0, x1 - cx - 1, cy - y0);
        var bl = 14 * eos((reduced ? 1 : (T - ARR - .2) / 1.2));
        brackets(ctx, cx + 6, y0 + 6, x1 - cx - 12, cy - y0 - 12, bl, rgba(MINT, .6 * qa));
        mono(ctx, 'OPEN SPACE', x1 - 14, y0 + 20, 'right', rgba(MINT, .8 * qa));
      }

      // axes
      ctx.fillStyle = rgba(PAPER, .2);
      ctx.fillRect(x0, cy, x1 - x0, 1); ctx.fillRect(cx, y0, 1, y1 - y0);
      var step = Math.max(16, Math.round(hw / 7));
      ctx.fillStyle = rgba(PAPER, .13);
      for(var d = step; d < hw - 6; d += step){ ctx.fillRect(cx + d, cy - 2, 1, 5); ctx.fillRect(cx - d, cy - 2, 1, 5); }
      step = Math.max(16, Math.round(hh / 6));
      for(d = step; d < hh - 6; d += step){ ctx.fillRect(cx - 2, cy + d, 5, 1); ctx.fillRect(cx - 2, cy - d, 5, 1); }
      sqC(ctx, x0, cy + .5, 3, rgba(PAPER, .4)); sqC(ctx, x1, cy + .5, 3, rgba(PAPER, .4));
      sqC(ctx, cx + .5, y0, 3, rgba(PAPER, .4)); sqC(ctx, cx + .5, y1, 3, rgba(PAPER, .4));
      var lc = rgba(MUTED, .9), la = rgba(mix(cMUTED, cMINT, qa), .9);
      mono(ctx, 'PREMIUM', cx - 9, y0 + 4, 'right', la);
      mono(ctx, 'VALUE', cx - 9, y1 - 4, 'right', lc);
      mono(ctx, 'GENERALIST', x0, cy + 12, 'left', lc);
      mono(ctx, 'SPECIALIST', x1, cy + 12, 'right', la);

      // competitors — a crowded, gently drifting cluster
      var R = Math.min(hw, hh) * .5, ccx = cx - hw * .44, ccy = cy + hh * .5;
      brackets(ctx, ccx - R * 1.12, ccy - R * .74, R * 2.05, R * 1.48, 7, rgba(PAPER, .2));
      mono(ctx, 'CROWDED', ccx - R * 1.12, ccy + R * .74 + 11, 'left', rgba(FAINT, .85));
      ctx.lineWidth = 1;
      for(var i = 0; i < COMP.length; i++){
        var p = COMP[i], ph = hash(i * 7.1) * TAU;
        var dx = Math.sin(tt * .31 + ph) * 3 + Math.sin(tt * .17 + ph * 1.7) * 2;
        var dy = Math.cos(tt * .26 + ph * 1.3) * 2.6 + Math.sin(tt * .14 + ph) * 1.5;
        var X = ccx + p[0] * R + dx, Y = ccy + p[1] * R * .78 + dy;
        ctx.strokeStyle = rgba(PAPER, .22 + .2 * hash(i * 3.3));
        ctx.strokeRect(X - 3, Y - 3, 6, 6);
      }

      // YOU — travels out of the crowd into open space
      if(ya > .002){
        var u = reduced ? 1 : eio((T - 1.6) / 6.4);
        var ax = ccx + YOUP[0] * R, ay = ccy + YOUP[1] * R, bx = cx + YOUP[2] * hw, by = cy + YOUP[3] * hh,
            ex = cx + YOUP[4] * hw, ey = cy + YOUP[5] * hh, fx = cx + YOUP[6] * hw, fy = cy + YOUP[7] * hh;
        var X1 = bz(ax, bx, ex, fx, u), Y1 = bz(ay, by, ey, fy, u);
        if(u > .002){
          ctx.save(); ctx.globalAlpha = ya; ctx.setLineDash([2, 4]); ctx.strokeStyle = rgba(JB, .85); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(ax, ay);
          var n = Math.max(2, Math.round(48 * u));
          for(var k = 1; k <= n; k++){ var uu = u * k / n; ctx.lineTo(bz(ax, bx, ex, fx, uu), bz(ay, by, ey, fy, uu)); }
          ctx.stroke(); ctx.restore();
          sq(ctx, ax, ay, 3, rgba(JB, .7 * ya));
        }
        // arrival pulse rings
        if(!reduced){
          for(k = 0; k < 2; k++){
            var pp = (T - ARR - k * .45) / 1.9;
            if(pp > 0 && pp < 1) ring(ctx, X1, Y1, 12 + 54 * eos(pp), rgba(MINT, .5 * (1 - pp) * fo));
          }
        }
        var arrived = reduced ? 1 : sstep(ARR - .4, ARR + .6, T);
        var br = reduced ? .5 : .5 + .5 * Math.sin(T * 1.6);
        glowDot(ctx, X1, Y1, 30 + 10 * arrived, (.55 + .25 * arrived * br) * ya);
        ctx.globalAlpha = ya;
        sq(ctx, X1, Y1, 10, '#0D6B54');
        ctx.strokeStyle = rgba(MINT, .95); ctx.lineWidth = 1; ctx.strokeRect(X1 - 4.5, Y1 - 4.5, 9, 9);
        sq(ctx, X1, Y1, 3, '#DFFFF2');
        if(arrived > 0) ring(ctx, X1, Y1, 17, rgba(MINT, (.25 + .2 * br) * arrived));
        mono(ctx, 'YOU', X1 + 13, Y1 - 1, 'left', rgba(MINT, 1));
        ctx.globalAlpha = 1;
      }
    }
  });

  /* ================================================================ 2 · communications — message routing */
  var AUD = ['INVESTORS', 'PIPELINE', 'PARTNERS', 'TEAM'], AUD2 = ['UPDATES', 'OUTBOUND', 'CO-MARKETING', 'ALL-HANDS'], CORD = [0, 2, 1, 3, 2, 0, 3, 1];
  reg('communications', {
    init: function(c){ c.st.lit = new Float32Array(4); c.st.heat = new Float32Array(4); },
    layout: function(c){
      var S = c.st, w = c.w, h = c.h;
      var pad = clamp(w * .055, 14, 40);
      S.sx = Math.round(pad + 34); S.sy = Math.round(h / 2);
      S.nx = Math.round(w - pad - tw('CO-MARKETING') - 18);
      var spread = Math.min(h * .33, 170);
      S.ny = []; S.R = [];
      for(var i = 0; i < 4; i++){
        var y = Math.round(S.sy - spread + spread * 2 * i / 3);
        S.ny.push(y);
        var x0 = S.sx + 14, x3 = S.nx - 9, dx = x3 - x0;
        S.R.push(bezPath(x0, S.sy, x0 + dx * .48, S.sy, x0 + dx * .52, y, x3, y, 40));
      }
      S.lw = w; S.lh = h;
    },
    draw: function(c){
      var ctx = c.ctx, S = c.st, w = c.w, h = c.h;
      if(S.lw !== w || S.lh !== h) this.layout(c);
      var t = reduced ? 8.2 : c.t, I = 3.6, TR = 3.0, RD = .5, RB = 2.6;
      var k0 = Math.floor(t / I), j, r, te, p, ta, q, i, R;
      for(i = 0; i < 4; i++){ S.lit[i] = 0; S.heat[i] = 0; }
      var flash = 0;

      // guides + base routes
      dashV(ctx, S.nx, S.ny[0] - 22, S.ny[3] + 23, rgba(PAPER, .08));
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(PAPER, .14);
      ctx.beginPath(); for(i = 0; i < 4; i++) S.R[i].trace(ctx, 0, S.R[i].len); ctx.stroke();

      // pass 1 — lit route segments
      for(j = k0 - 3; j <= k0; j++){
        if(j < 0) continue;
        r = CORD[j % 8]; te = t - j * I; R = S.R[r]; p = te / TR;
        ctx.beginPath();
        if(p < 1){ ctx.strokeStyle = rgba(JB, .55); R.trace(ctx, 0, esin(p) * R.len); ctx.stroke(); }
        else {
          ta = te - TR; var ha = .55 * Math.exp(-ta * 1.3);
          if(ha > .01){ ctx.strokeStyle = rgba(JB, ha); R.trace(ctx, 0, R.len); ctx.stroke(); }
          S.lit[r] = Math.max(S.lit[r], ta < .35 ? sstep(0, .35, ta) : ta < 1.2 ? 1 : Math.exp(-(ta - 1.2) * .9));
        }
      }
      // pass 2 — reply blips + envelopes
      for(j = k0 - 3; j <= k0; j++){
        if(j < 0) continue;
        r = CORD[j % 8]; te = t - j * I; R = S.R[r]; p = te / TR;
        if(p < 1){
          if(p < .12) flash = Math.max(flash, 1 - p / .12);
          R.at(esin(p) * R.len, P0);
          var ea = sstep(0, .06, p) * (1 - sstep(.95, 1, p));
          glowDot(ctx, P0.x, P0.y, 18, .45 * ea);
          ctx.globalAlpha = ea;
          var ex = Math.round(P0.x - 6) + .5, ey = Math.round(P0.y - 4) + .5;
          ctx.fillStyle = rgba(INK, 1); ctx.fillRect(ex, ey, 12, 8);
          ctx.strokeStyle = rgba(MINT, .95); ctx.lineWidth = 1; ctx.strokeRect(ex, ey, 12, 8);
          ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + 6, ey + 4.5); ctx.lineTo(ex + 12, ey); ctx.stroke();
          ctx.globalAlpha = 1;
        } else {
          ta = te - TR; q = (ta - RD) / RB;
          if(q >= 0 && q < 1){
            R.at((1 - esin(q)) * R.len, P0);
            var ba = sstep(0, .1, q) * (1 - sstep(.9, 1, q));
            glowDot(ctx, P0.x, P0.y, 10, .4 * ba);
            sq(ctx, P0.x, P0.y, 3, rgba(MINT, .9 * ba));
          }
          if(q >= .92 && q < 1.6) flash = Math.max(flash, .6 * (1 - sstep(1, 1.6, q)) * sstep(.92, 1, q));
        }
      }

      // audience nodes
      for(i = 0; i < 4; i++){
        var L = S.lit[i], nx = S.nx, ny = S.ny[i];
        glowDot(ctx, nx, ny, 28, .75 * L);
        if(L > .01) ringC(ctx, nx, ny, 19, rgba(MINT, .45 * L));
        sqC(ctx, nx, ny, 9, rgba(PANEL, 1));
        ringC(ctx, nx, ny, 9, rgba(mix(cPAPER, cMINT, L), .32 + .6 * L));
        if(L > .01) sqC(ctx, nx, ny, 3, rgba(HI, L));
        mono(ctx, AUD[i], nx + 16, ny - 6, 'left', rgba(mix(cMUTED, cMINT, L), .9 + .1 * L));
        mono(ctx, AUD2[i], nx + 16, ny + 8, 'left', rgba(FAINT, .55 + .3 * L));
      }

      // sender
      var sx = S.sx, sy = S.sy;
      glowDot(ctx, sx, sy, 40, .42 + .35 * flash);
      ringC(ctx, sx, sy, 29, rgba(PAPER, .13));
      brackets(ctx, sx - 14, sy - 14, 29, 29, 4, rgba(MINT, .35 + .4 * flash));
      sqC(ctx, sx, sy, 12, '#0D6B54');
      ringC(ctx, sx, sy, 12, rgba(MINT, .9));
      sqC(ctx, sx, sy, 4, '#DFFFF2');
      mono(ctx, 'ONE STORY', sx, sy + 30, 'center', rgba(MUTED, .9));
    }
  });

  /* ================================================================ 3 · search — results climb */
  var QUERIES = ['marketing agency for startups', 'local seo bellevue', 'b2b saas positioning'];
  reg('search', {
    init: function(c){ c.st.p = new Float32Array(4); },
    draw: function(c){
      var ctx = c.ctx, S = c.st, w = c.w, h = c.h, P = 12;
      var tt = reduced ? 10.3 : c.t, cyc = Math.floor(tt / P), T = tt - cyc * P, qi = cyc % 3, q = QUERIES[qi];
      var A = reduced ? 1 : 1 - sstep(10.9, 11.85, T);
      var pad = clamp(w * .055, 14, 34), fx = Math.round(pad), fw = Math.round(w - 2 * pad);
      var fy = Math.round(clamp(h * .07, 12, 34)), fh = Math.round(clamp(h * .085, 30, 38));
      var my = fy + fh / 2;

      // search field
      rrp(ctx, fx + .5, fy + .5, fw - 1, fh - 1, 5);
      ctx.fillStyle = rgba(PANEL, .94); ctx.fill(); ctx.strokeStyle = rgba(PAPER, .2); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(fx + 15.5, my - 1, 4.2, 0, TAU); ctx.moveTo(fx + 18.6, my + 2.1); ctx.lineTo(fx + 21.5, my + 5);
      ctx.strokeStyle = rgba(MUTED, .85); ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 1;
      var TS = .5, CH = .1;
      var n = reduced ? q.length : clamp(Math.floor((T - TS) / CH), 0, q.length);
      var s = q.substring(0, n), qx = fx + 31, qs = fh >= 34 ? 11.5 : 11;
      ctx.save(); ctx.beginPath(); ctx.rect(qx - 2, fy + 1, fw - 42, fh - 2); ctx.clip();
      ctx.globalAlpha = A; mono(ctx, s, qx, my, 'left', rgba(PAPER, .92), qs, 500, .15);
      ctx.restore();
      var typing = !reduced && T < TS + q.length * CH + .3;
      var ca = (reduced ? 1 : sstep(0, .4, T)) * A * (typing ? 1 : .55 + .45 * Math.cos(T * 4.4));
      var cxp = Math.min(qx + tw(s, qs, .15) + 2, fx + fw - 12);
      ctx.fillStyle = rgba(MINT, .9 * ca); ctx.fillRect(Math.round(cxp), Math.round(my - 6.5), 1, 13);

      // results
      var meta = h >= 300, ry0 = fy + fh + (meta ? 34 : 14), ry1 = h - clamp(h * .045, 10, 24), rh = (ry1 - ry0) / 5;
      var TRS = 3.8, S0 = 5.2, SI = 1.2, SD = .95, i, k;
      var bx0 = fx + 30, bx1 = fx + fw, bw = bx1 - bx0;
      var big = rh >= 46;
      if(meta) mono(ctx, 'ABOUT 2,140,000 RESULTS', fx + 2, fy + fh + 17, 'left', rgba(FAINT, .7 * A * (reduced ? 1 : sstep(TRS - .2, TRS + .4, T))));
      for(k = 0; k < 4; k++) S.p[k] = reduced ? 1 : eio((T - (S0 + k * SI)) / SD);
      var hp = 4 - (S.p[0] + S.p[1] + S.p[2] + S.p[3]);
      var rank = 5; for(k = 0; k < 4; k++) if(S.p[k] > .5) rank--;
      var top1 = reduced ? 1 : sstep(S0 + 3 * SI + SD, S0 + 3 * SI + SD + .7, T);
      var ha = A * (reduced ? 1 : sstep(TRS + .48, TRS + .98, T));
      // slot numbers
      for(i = 0; i < 5; i++){
        var on = (Math.round(hp) === i) ? ha : 0;
        mono(ctx, '0' + (i + 1), fx + 1, ry0 + rh * (i + .5), 'left', rgba(mix(cFAINT, cMINT, on), .6 + .25 * on));
      }
      // ordinary rows
      for(var id = 0; id < 4; id++){
        var pos = id + S.p[3 - id], ra = A * (reduced ? 1 : sstep(TRS + id * .12, TRS + id * .12 + .5, T));
        if(ra < .003) continue;
        this.row(ctx, bx0, ry0 + rh * pos, bw, rh, big, qi * 31 + id * 7, ra, 0);
      }
      // highlighted row
      if(ha > .003){
        var yy = ry0 + rh * hp, mid = yy + rh / 2;
        var lift = 0; for(k = 0; k < 4; k++) lift = Math.max(lift, Math.sin(Math.PI * S.p[k]));
        glowDot(ctx, bx0 + 4, mid, rh * 1.5, (.18 + .5 * top1) * ha);
        ctx.globalAlpha = ha;
        ctx.fillStyle = rgba(PANEL, .96); ctx.fillRect(bx0 - 10, yy + 3, bw + 10, rh - 6);
        ctx.fillStyle = rgba(JB, .09 + .05 * top1); ctx.fillRect(bx0 - 10, yy + 3, bw + 10, rh - 6);
        ctx.strokeStyle = rgba(MINT, .32 + .35 * top1 + .15 * lift); ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(bx0 - 10) + .5, Math.round(yy + 3) + .5, Math.round(bw + 10) - 1, Math.round(rh - 6) - 1);
        if(top1 > .01) brackets(ctx, bx0 - 14, yy - 1, bw + 18, rh + 2, 6 * top1, rgba(MINT, .7 * top1));
        ctx.globalAlpha = 1;
        this.row(ctx, bx0, yy, bw, rh, big, 900 + qi, ha, 1);
        // rank readout
        var rs = '#' + rank, rx = bx1 - 10;
        mono(ctx, rs, rx, mid, 'right', rgba(MINT, ha), 11, 500, .6);
        var ax = rx - tw(rs, 11, .6) - 9, aa = ha * (.35 + .65 * Math.max(lift, top1));
        ctx.beginPath(); ctx.moveTo(ax - 3.5, mid + 2); ctx.lineTo(ax, mid - 2.5); ctx.lineTo(ax + 3.5, mid + 2);
        ctx.strokeStyle = rgba(MINT, aa); ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 1;
      }
    },
    row: function(ctx, x, y, w, rh, big, seed, a, hl){
      var sp = clamp(rh * .12, 5, 9), th = rh >= 64 ? 6 : 5;
      var oU = th + sp, oD = oU + 2 + sp * .8, oE = oD + 3 + sp * .55;
      var bh = big ? oE + 2 : 14, by = Math.round(y + (rh - bh) / 2);
      var w0 = .42 + .26 * hash(seed + 1), w1 = .22 + .14 * hash(seed + 2), w2 = .62 + .25 * hash(seed + 3), w3 = .4 + .3 * hash(seed + 4);
      var tx = x + (hl ? 12 : 0), rw = w - (hl ? 64 : 10);
      ctx.globalAlpha = a;
      if(hl) sq(ctx, x + 3, by + th / 2, 5, rgba(MINT, 1));
      ctx.fillStyle = hl ? rgba(MINT, .78) : rgba(PAPER, .2); ctx.fillRect(tx, by, Math.round(rw * w0), big ? th : 4);
      if(big){
        ctx.fillStyle = hl ? rgba(MINT, .45) : rgba(JB, .38); ctx.fillRect(tx, Math.round(by + oU), Math.round(rw * w1), 2);
        ctx.fillStyle = rgba(PAPER, hl ? .2 : .08); ctx.fillRect(tx, Math.round(by + oD), Math.round(rw * w2), 3);
        ctx.fillRect(tx, Math.round(by + oE), Math.round(rw * w3), 2);
      } else {
        ctx.fillStyle = rgba(PAPER, hl ? .2 : .08); ctx.fillRect(tx, by + 10, Math.round(rw * w2), 3);
      }
      ctx.globalAlpha = 1;
    }
  });

  /* ================================================================ 4 · content — page assembling */
  var SPARK = []; for(var si = 0; si < 18; si++) SPARK.push(.12 + .62 * Math.pow(si / 17, 1.5) + .1 * hash(si * 2.3));
  function cursorPath(ctx, x, y, s){
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 13 * s); ctx.lineTo(x + 3.4 * s, y + 10 * s);
    ctx.lineTo(x + 5.8 * s, y + 15.2 * s); ctx.lineTo(x + 7.8 * s, y + 14.3 * s); ctx.lineTo(x + 5.5 * s, y + 9.3 * s);
    ctx.lineTo(x + 9.8 * s, y + 9.3 * s); ctx.closePath();
  }
  reg('content', {
    init: function(c){},
    /* a block: dashed blueprint outline appears, fill grows in, outline fades */
    blk: function(ctx, T, t0, x, y, w, h, col, A){
      if(T < t0) return;
      var oa = sstep(t0, t0 + .3, T) * (1 - sstep(t0 + .75, t0 + 1.2, T));
      var f = eos((T - t0 - .15) / .6);
      if(oa > .01){
        ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = rgba(MINT, .5 * oa * A); ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(x - 2) + .5, Math.round(y - 2) + .5, Math.round(w + 3), Math.round(h + 3)); ctx.restore();
      }
      if(f > 0){ ctx.globalAlpha = A; ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w * f)), Math.round(h)); ctx.globalAlpha = 1; }
    },
    draw: function(c){
      var ctx = c.ctx, w = c.w, h = c.h, P = 12;
      var T = reduced ? 10 : c.t % P;
      var A = reduced ? 1 : 1 - sstep(10.9, 11.85, T);
      var pad = clamp(w * .05, 12, 34), ohx = 18, ohy = 16;
      var fx = Math.round(pad), fy = Math.round(pad * .85), fw = Math.round(w - 2 * pad - ohx), fh = Math.round(h - fy - pad - ohy);
      var tb = fh > 260 ? 22 : 18;
      // browser frame (constant)
      rrp(ctx, fx + .5, fy + .5, fw - 1, fh - 1, 6);
      ctx.fillStyle = rgba('13,21,19', .9); ctx.fill(); ctx.strokeStyle = rgba(PAPER, .2); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = rgba(PAPER, .1); ctx.fillRect(fx + 1, fy + tb, fw - 2, 1);
      for(var i = 0; i < 3; i++){ ctx.beginPath(); ctx.arc(fx + 11 + i * 8, fy + tb / 2, 2, 0, TAU); ctx.fillStyle = rgba(PAPER, .22); ctx.fill(); }
      if(fw > 300){
        var ub = Math.min(fw * .42, 230);
        rrp(ctx, Math.round(fx + fw / 2 - ub / 2) + .5, fy + 5.5, Math.round(ub), tb - 11, 3);
        ctx.strokeStyle = rgba(PAPER, .1); ctx.stroke();
        ctx.fillStyle = rgba(PAPER, .12); ctx.fillRect(Math.round(fx + fw / 2 - ub / 2 + 8), Math.round(fy + tb / 2 - .5), Math.round(ub * .38), 1);
      }
      // layout
      var ip = Math.round(clamp(fw * .055, 12, 26));
      var ax0 = fx + ip, ax1 = fx + fw - ip, ay0 = fy + tb + Math.round(ip * .7), ay1 = fy + fh - ip, cw = ax1 - ax0;
      var ny = ay0 + 5;
      var tcw = Math.round(cw * .54), icx0 = Math.round(ax0 + tcw + cw * .07), icw = ax1 - icx0;
      var hb = Math.round(clamp(fh * .032, 6, 11)), g1 = Math.round(clamp(fh * .04, 8, 18)), sgap = Math.round(clamp(fh * .03, 7, 11));
      var ctaH = Math.round(clamp(fh * .068, 14, 24)), ctaW = Math.round(clamp(tcw * .42, 50, 104)), g2 = Math.round(clamp(fh * .055, 10, 24));
      var Hb = hb * 3 + g1 + sgap * 2 + 3 + g2 + ctaH, gMin = Math.round(clamp(fh * .1, 18, 40));
      var cdh = Math.round(clamp(fh * .15, 44, 64)), cards = (ay1 - ny - gMin - Hb) > cdh + 22, cdy = ay1 - cdh;
      var hy0 = Math.round(ny + Math.max(gMin, ((cards ? cdy : ay1) - ny - Hb) * (cards ? .45 : .3)));
      var sy0 = hy0 + hb * 3 + g1, ctaY = sy0 + sgap * 2 + 3 + g2, heroB = ctaY + ctaH;

      // nav
      this.blk(ctx, T, .3, ax0, ny - 3.5, 7, 7, '#0D6B54', A);
      this.blk(ctx, T, .4, ax0 + 12, ny - 1, 30, 3, rgba(PAPER, .35), A);
      var nn = cw > 240 ? 3 : 2;
      for(i = 0; i < nn; i++) this.blk(ctx, T, .55 + i * .1, ax1 - 44 - (nn - i) * 26, ny - 1, 16, 2, rgba(PAPER, .22), A);
      if(T > .8){
        var na = A * sstep(.8, 1.2, T);
        ctx.strokeStyle = rgba(PAPER, .3 * na); ctx.lineWidth = 1; ctx.strokeRect(ax1 - 36 + .5, Math.round(ny - 6) + .5, 35, 11);
      }
      // headline, sub lines
      this.blk(ctx, T, 1.0, ax0, hy0, tcw * .94, hb, rgba(PAPER, .52), A);
      this.blk(ctx, T, 1.35, ax0, hy0 + hb * 2, tcw * .68, hb, rgba(PAPER, .52), A);
      var sw = [.96, .9, .58];
      for(i = 0; i < 3; i++) this.blk(ctx, T, 1.9 + i * .22, ax0, sy0 + i * sgap, tcw * sw[i], 3, rgba(PAPER, .2), A);
      // image box
      var ix = icx0, iy = hy0, iw = icw, ih = heroB - hy0;
      if(T > 2.8){
        var ip1 = eio((T - 2.8) / .9), per = 2 * (iw + ih), L = per * ip1;
        ctx.globalAlpha = A;
        ctx.fillStyle = rgba(PAPER, .025 * ip1); ctx.fillRect(ix, iy, iw, ih);
        ctx.beginPath(); ctx.moveTo(ix + .5, iy + .5);
        var segs = [iw, ih, iw, ih], px = ix + .5, py = iy + .5, dirs = [[1,0],[0,1],[-1,0],[0,-1]];
        for(i = 0; i < 4 && L > 0; i++){ var sl = Math.min(segs[i] - 1, L); px += dirs[i][0] * sl; py += dirs[i][1] * sl; ctx.lineTo(px, py); L -= sl; }
        ctx.strokeStyle = rgba(PAPER, .2); ctx.lineWidth = 1; ctx.stroke();
        var xa = eio((T - 3.55) / .6);
        if(xa > 0){
          ctx.beginPath();
          ctx.moveTo(ix, iy); ctx.lineTo(ix + iw * xa, iy + ih * xa);
          ctx.moveTo(ix + iw, iy); ctx.lineTo(ix + iw - iw * xa, iy + ih * xa);
          ctx.strokeStyle = rgba(PAPER, .1); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // feature cards (only when there is room)
      if(cards){
        var cg = 10, cwd = (cw - cg * 2) / 3;
        for(i = 0; i < 3; i++){
          var t0 = 4.1 + i * .18, ccx = ax0 + i * (cwd + cg);
          if(T < t0) continue;
          var ca = A * sstep(t0, t0 + .4, T);
          ctx.strokeStyle = rgba(PAPER, .14 * ca); ctx.strokeRect(Math.round(ccx) + .5, cdy + .5, Math.round(cwd) - 1, cdh - 1);
          var cu = cdh > 54 ? 12 : 10;
          this.blk(ctx, T, t0 + .1, ccx + cu, cdy + cu, 6, 6, rgba(JB, .65), A);
          this.blk(ctx, T, t0 + .2, ccx + cu, cdy + cu * 2 + 2, cwd * .55, 3, rgba(PAPER, .32), A);
          this.blk(ctx, T, t0 + .3, ccx + cu, cdy + cu * 2 + 10, cwd * .7, 2, rgba(PAPER, .13), A);
          if(cdh > 54) this.blk(ctx, T, t0 + .4, ccx + cu, cdy + cu * 2 + 16, cwd * .48, 2, rgba(PAPER, .13), A);
        }
      }
      // CTA
      var cx0 = ax0, ccy = ctaY, click = 7.1;
      var press = reduced ? 0 : sstep(click - .05, click + .05, T) * (1 - sstep(click + .15, click + .45, T));
      if(T > 4.6){
        this.blk(ctx, T, 4.6, cx0, ccy, ctaW, ctaH, press > 0 ? rgba(JB, .7 + .3 * press) : '#0D6B54', A);
        var la = A * sstep(5.0, 5.4, T);
        ctx.fillStyle = rgba(PAPER, .8 * la); ctx.fillRect(Math.round(cx0 + ctaW * .22), Math.round(ccy + ctaH / 2 - 1), Math.round(ctaW * .56), 2);
        ctx.fillStyle = rgba(MINT, .55 * la); ctx.fillRect(Math.round(cx0), Math.round(ccy), Math.round(ctaW), 1);
      }
      // click ripple
      if(!reduced && T > click && T < click + 1.1){
        var rp = (T - click) / 1.1, g = 2 + 11 * eos(rp);
        ctx.strokeStyle = rgba(MINT, .6 * (1 - rp) * (1 - rp) * A); ctx.lineWidth = 1;
        rrp(ctx, cx0 - g + .5, ccy - g + .5, ctaW + g * 2 - 1, ctaH + g * 2 - 1, 3 + g * .3); ctx.stroke();
      }
      // readout panel (overhangs the frame corner)
      var lgR = w >= 480 && h >= 380, rw = lgR ? 156 : 140, rh2 = lgR ? 60 : 52, rx = fx + fw - rw + ohx, ry = fy + fh - rh2 + ohy;
      var pa = A * (reduced ? 1 : sstep(7.25, 7.75, T));
      if(pa > .003){
        var vp = reduced ? 1 : eio((T - 7.45) / 1.9), v = 1.8 + 1.4 * vp, vs = v.toFixed(1) + '%';
        ctx.globalAlpha = pa;
        ctx.fillStyle = rgba(INK, .97); ctx.fillRect(rx, ry, rw, rh2);
        ctx.strokeStyle = rgba(PAPER, .2); ctx.strokeRect(rx + .5, ry + .5, rw - 1, rh2 - 1);
        sq(ctx, rx, ry, 3, rgba(MINT, .9));
        mono(ctx, 'CONV', rx + 10, ry + 14, 'left', rgba(MUTED, .95));
        var vx = rx + rw - 10;
        mono(ctx, vs, vx, ry + 14, 'right', rgba(MINT, 1), 9.5, 500, 1);
        var arx = vx - tw(vs, 9.5, 1) - 12;
        ctx.beginPath(); ctx.moveTo(arx - 4, ry + 14.5); ctx.lineTo(arx + 3, ry + 14.5); ctx.moveTo(arx + 1, ry + 12.5); ctx.lineTo(arx + 3, ry + 14.5); ctx.lineTo(arx + 1, ry + 16.5);
        ctx.strokeStyle = rgba(FAINT, .9); ctx.stroke();
        mono(ctx, '1.8%', arx - 8, ry + 14, 'right', rgba(FAINT, .9), 9.5, 500, 1);
        // sparkline
        var sx0 = rx + 10, sx1 = rx + rw - 10, syb = ry + rh2 - 9, sh = rh2 - 36, np = SPARK.length, upto = (np - 1) * vp;
        ctx.fillStyle = rgba(PAPER, .08); ctx.fillRect(sx0, syb, sx1 - sx0, 1);
        ctx.beginPath();
        for(i = 0; i <= Math.ceil(upto); i++){
          var fi2 = Math.min(i, upto), i0 = Math.floor(fi2), fr = fi2 - i0;
          var vv = SPARK[i0] + ((SPARK[Math.min(i0 + 1, np - 1)] - SPARK[i0]) * fr);
          var X = sx0 + (sx1 - sx0) * fi2 / (np - 1), Y = syb - 2 - vv * sh;
          if(i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        }
        ctx.strokeStyle = rgba(MINT, .95); ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.stroke(); ctx.lineWidth = 1;
        if(upto > 0){ sq(ctx, X, Y, 3, '#DFFFF2'); glowDot(ctx, X, Y, 10, .5); }
        ctx.globalAlpha = 1;
      }
      // cursor
      var cs = 5.1, ce = 7.05;
      var ta = A * (reduced ? 1 : sstep(cs - .1, cs + .3, T));
      if(ta > .003){
        var mp = reduced ? 1 : eio((T - cs) / (ce - cs));
        var x0 = fx + fw * .9, y0 = fy + fh * .82, x2 = cx0 + ctaW * .62, y2 = ccy + ctaH * .55;
        var cxm = lerp(x0, x2, .5) + 10, cym = Math.max(y0, y2) + 18;
        var m1 = 1 - mp, X2 = m1 * m1 * x0 + 2 * m1 * mp * cxm + mp * mp * x2, Y2 = m1 * m1 * y0 + 2 * m1 * mp * cym + mp * mp * y2;
        var s = 1 - .12 * press;
        ctx.globalAlpha = ta;
        cursorPath(ctx, X2, Y2, s);
        ctx.fillStyle = rgba(PAPER, .96); ctx.fill(); ctx.strokeStyle = rgba(INK, 1); ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  });

  /* ================================================================ 5 · email — automation flow */
  var ENODE = ['TRIGGER', 'WAIT 1D', 'EMAIL', 'OPENED', 'NOT OPENED', 'REVIEW ASK', 'SMS'];
  var ESEQ = [[0, 1, 2, 4], [0, 1, 3, 5]], EEND = [1, 2, 3, 4, 5, 6], EWAIT = 1.6;
  reg('email', {
    init: function(c){
      var S = c.st; S.rnd = prng(20261011); S.g = new Float32Array(7); S.acc = .2; S.dots = [];
      for(var i = 0; i < 40; i++) S.dots.push({ on:false, br:0, k:0, d:0, wait:0 });
    },
    layout: function(c){
      var S = c.st, w = c.w, h = c.h, i;
      var pad = clamp(w * .05, 14, 34), nh = h < 260 ? 20 : h >= 400 ? 26 : 22, np = w >= 520 ? 24 : 20;
      var nw = []; for(i = 0; i < 7; i++) nw.push(Math.round(tw(ENODE[i]) + np));
      var cols = [nw[0], nw[1], nw[2], Math.max(nw[3], nw[4]), Math.max(nw[5], nw[6])];
      var sum = 0; for(i = 0; i < 5; i++) sum += cols[i];
      var gap = (w - 2 * pad - sum) / 4;
      var N = [], E = [], R = 8;
      S.wide = gap >= 18;
      if(S.wide){
        var x = pad, cx = [];
        for(i = 0; i < 5; i++){ cx.push(Math.round(x + cols[i] / 2) + .5); x += cols[i] + gap; }
        var ym = Math.round(h / 2) + .5, dy = Math.round(clamp(h * .23, 36, 112));
        N = [[cx[0], ym], [cx[1], ym], [cx[2], ym], [cx[3], ym - dy], [cx[3], ym + dy], [cx[4], ym - dy], [cx[4], ym + dy]];
        var xm = Math.round((cx[2] + nw[2] / 2 + cx[3] - cols[3] / 2) / 2) + .5;
        S.pct = [xm + 8, ym - dy / 2, xm + 8, ym + dy / 2, 'left'];
        E = [ polyPath([cx[0], ym, cx[1], ym], R), polyPath([cx[1], ym, cx[2], ym], R),
              polyPath([cx[2], ym, xm, ym, xm, ym - dy, cx[3], ym - dy], R), polyPath([cx[2], ym, xm, ym, xm, ym + dy, cx[3], ym + dy], R),
              polyPath([cx[3], ym - dy, cx[4], ym - dy], R), polyPath([cx[3], ym + dy, cx[4], ym + dy], R) ];
      } else {
        var ya = Math.round(h * .2) + .5, yb = Math.round(h * .55) + .5, yc = Math.round(h * .83) + .5;
        var xa = Math.round(pad + nw[0] / 2) + .5, xc = Math.round(w - pad - nw[2] / 2) + .5, xb = Math.round((xa + nw[0] / 2 + xc - nw[2] / 2) / 2) + .5;
        var b1 = Math.round(Math.max(pad + nw[5] / 2, w * .28)) + .5, b2 = Math.round(Math.min(w - pad - nw[4] / 2, w * .72)) + .5;
        var bus = Math.round((ya + yb) / 2 + 2) + .5;
        S.pct = [b1 + 8, (bus + yb - nh / 2) / 2 + 1, b2 + 8, (bus + yb - nh / 2) / 2 + 1, 'left'];
        N = [[xa, ya], [xb, ya], [xc, ya], [b1, yb], [b2, yb], [b1, yc], [b2, yc]];
        E = [ polyPath([xa, ya, xb, ya], R), polyPath([xb, ya, xc, ya], R),
              polyPath([xc, ya, xc, bus, b1, bus, b1, yb], R), polyPath([xc, ya, xc, bus, b2, bus, b2, yb], R),
              polyPath([b1, yb, b1, yc], R), polyPath([b2, yb, b2, yc], R) ];
      }
      S.N = N; S.E = E; S.nw = nw; S.nh = nh; S.lw = w; S.lh = h;
    },
    step: function(S, dt){
      var i, d, e;
      S.acc -= dt;
      if(S.acc <= 0){
        S.acc += 1.0 + S.rnd() * .55;
        for(i = 0; i < S.dots.length; i++){
          d = S.dots[i];
          if(!d.on){ d.on = true; d.br = S.rnd() < .62 ? 0 : 1; d.k = 0; d.d = 0; d.wait = 0; S.g[0] = Math.max(S.g[0], .8); break; }
        }
      }
      for(i = 0; i < S.dots.length; i++){
        d = S.dots[i]; if(!d.on) continue;
        if(d.wait > 0){ d.wait -= dt; continue; }
        d.d += 30 * dt;
        var ei = ESEQ[d.br][d.k]; e = S.E[ei];
        if(d.d >= e.len){
          var nd = EEND[ei]; S.g[nd] = 1;
          d.d -= e.len; d.k++;
          if(d.k >= 4){ d.on = false; continue; }
          if(nd === 1){ d.wait = EWAIT; d.d = 0; }
        }
      }
      var dec = Math.exp(-dt * 1.7);
      for(i = 0; i < 7; i++) S.g[i] *= dec;
    },
    draw: function(c, dt){
      var ctx = c.ctx, S = c.st, w = c.w, h = c.h, i;
      if(S.lw !== w || S.lh !== h){
        this.layout(c); S.pre = false;
        if(!S.warm){ S.warm = true; for(i = 0; i < 420; i++) this.step(S, 1 / 30); } // arrive mid-flow
      }
      if(reduced){
        if(!S.pre){
          S.rnd = prng(20261011); S.acc = .2; for(i = 0; i < S.dots.length; i++) S.dots[i].on = false;
          for(i = 0; i < 7; i++) S.g[i] = 0;
          for(i = 0; i < 480; i++) this.step(S, 1 / 30);
          S.pre = true;
        }
      } else { S.pre = false; if(dt > 0) this.step(S, dt); }
      // edges
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(PAPER, .17); ctx.beginPath();
      for(i = 0; i < S.E.length; i++) S.E[i].trace(ctx, 0, S.E[i].len);
      ctx.stroke();
      if(S.pct){
        mono(ctx, '62%', S.pct[0], S.pct[1], 'left', rgba(FAINT, .8));
        mono(ctx, '38%', S.pct[2], S.pct[3], 'left', rgba(FAINT, .8));
      }
      // subscribers
      var waitMax = 0;
      for(i = 0; i < S.dots.length; i++){
        var d = S.dots[i]; if(!d.on) continue;
        if(d.wait > 0){ waitMax = Math.max(waitMax, 1 - d.wait / EWAIT); continue; }
        var e = S.E[ESEQ[d.br][d.k]];
        for(var k = 3; k >= 1; k--){
          if(d.d - k * 4 < 0) continue;
          e.at(d.d - k * 4, P0); sq(ctx, P0.x, P0.y, 2, rgba(MINT, .5 - k * .13));
        }
        e.at(d.d, P0);
        glowDot(ctx, P0.x, P0.y, 9, .45);
        sq(ctx, P0.x, P0.y, 3, rgba(HI, .95));
      }
      // nodes
      var nh = S.nh;
      for(i = 0; i < 7; i++){
        var n = S.N[i], nw = S.nw[i], g = S.g[i], x = Math.round(n[0] - nw / 2) + .5, y = Math.round(n[1] - nh / 2) + .5;
        glowDot(ctx, n[0], n[1], nw * .62, .5 * g);
        rrp(ctx, x, y, nw - 1, nh - 1, 4);
        ctx.fillStyle = rgba(PANEL, 1); ctx.fill();
        if(g > .01){ ctx.fillStyle = rgba(JB, .12 * g); ctx.fill(); }
        ctx.strokeStyle = rgba(mix(cPAPER, cMINT, g), .22 + .55 * g); ctx.lineWidth = 1; ctx.stroke();
        mono(ctx, ENODE[i], n[0], n[1], 'center', rgba(mix(cMUTED, cMINT, g), .92));
        if(i === 1 && waitMax > 0){
          ctx.fillStyle = rgba(MINT, .55); ctx.fillRect(x + 4, y + nh - 4, Math.round((nw - 9) * waitMax), 1);
        }
      }
      // start marker
      var n0 = S.N[0];
      sq(ctx, n0[0] - S.nw[0] / 2 - 7, n0[1], 3, rgba(MINT, .7));
    }
  });

  /* ================================================================ 6 · services — five disciplines, one system */
  var SRC = ['STRATEGY', 'COMMS', 'SEARCH', 'CONTENT', 'EMAIL'];
  reg('services', {
    init: function(c){ c.st.rnd = prng(5150); },
    layout: function(c){
      var S = c.st, w = c.w, h = c.h, i;
      var pad = clamp(w * .05, 14, 34);
      S.lx = Math.round(pad + tw('STRATEGY'));
      S.sx = S.lx + 14;
      S.kx = Math.round(lerp(S.sx, w - pad, .44)); S.ky = Math.round(h * .6);
      var gap = clamp(h * .105, 24, 50), yc = h * .57;
      S.ys = []; S.cp = new Float32Array(40);
      for(i = 0; i < 5; i++){
        var y = Math.round(yc + (i - 2) * gap); S.ys.push(y);
        var x0 = S.sx + 7, x3 = S.kx - 14, dx = x3 - x0;
        S.cp.set([x0, y, x0 + dx * .5, y, x0 + dx * .56, S.ky, x3, S.ky], i * 8);
      }
      // compounding output curve
      var ox0 = S.kx + 14, ox1 = Math.round(w - pad - 4), oyT = Math.round(Math.max(pad + 18, h * .12)), K = 3.3, xs = [], ys = [];
      for(i = 0; i <= 80; i++){
        var u = i / 80;
        xs.push(lerp(ox0, ox1, u)); ys.push(S.ky - (S.ky - oyT) * (Math.exp(K * u) - 1) / (Math.exp(K) - 1));
      }
      S.out = new Path(xs, ys); S.ox1 = ox1; S.oyT = oyT;
      // particles
      var N = Math.round(clamp(w * h / 560, 220, 520));
      if(!S.pu || S.pu.length !== N){
        S.pu = new Float32Array(N); S.ps = new Float32Array(N); S.po = new Float32Array(N); S.pi = new Uint8Array(N); S.pb = new Uint8Array(N);
        for(i = 0; i < N; i++) this.spawn(S, i, S.rnd());
      }
      S.amp = clamp(h * .03, 5, 13);
      S.lw = w; S.lh = h;
    },
    spawn: function(S, i, u){
      var r = S.rnd;
      S.pu[i] = u; S.ps[i] = .085 + .06 * r(); S.pi[i] = (r() * 5) | 0;
      var g = (r() + r() + r()) / 3 - .5; S.po[i] = g * 2; S.pb[i] = r() < .08 ? 1 : 0;
    },
    draw: function(c, dt){
      var ctx = c.ctx, S = c.st, w = c.w, h = c.h, i, k;
      if(S.lw !== w || S.lh !== h) this.layout(c);
      var t = reduced ? 3.9 : c.t, cp = S.cp;
      // guide curves
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(PAPER, .07); ctx.beginPath();
      for(i = 0; i < 5; i++){ k = i * 8; ctx.moveTo(cp[k], cp[k + 1] + .5); ctx.bezierCurveTo(cp[k + 2], cp[k + 3] + .5, cp[k + 4], cp[k + 5] + .5, cp[k + 6], cp[k + 7] + .5); }
      ctx.stroke();
      // output chart guides
      dashH(ctx, S.kx + 18, S.ox1 + 1, S.ky, rgba(PAPER, .1));
      dashV(ctx, S.ox1, S.oyT + 8, S.ky, rgba(PAPER, .08));
      // particles (additive)
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgb(' + MINT + ')';
      var N = S.pu.length, amp = S.amp;
      for(i = 0; i < N; i++){
        var u = S.pu[i];
        if(!reduced && dt > 0){ u += S.ps[i] * dt; if(u >= 1){ this.spawn(S, i, u - 1); u = S.pu[i]; } S.pu[i] = u; }
        k = S.pi[i] * 8;
        var X = bz(cp[k], cp[k + 2], cp[k + 4], cp[k + 6], u), Y = bz(cp[k + 1], cp[k + 3], cp[k + 5], cp[k + 7], u);
        var conv = Math.pow(1 - u, 1.4);
        Y += S.po[i] * amp * conv; X += S.po[i] * 3 * conv;
        var a = sstep(0, .06, u) * (.3 + .45 * u * u) * (1 - sstep(.97, 1, u) * .5);
        var s = S.pb[i] ? 2.2 : 1.6;
        ctx.globalAlpha = S.pb[i] ? Math.min(1, a * 1.8) : a;
        ctx.fillRect(X - s / 2, Y - s / 2, s, s);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      // sources
      for(i = 0; i < 5; i++){
        var y = S.ys[i];
        sqC(ctx, S.sx, y, 7, rgba(PANEL, 1));
        ringC(ctx, S.sx, y, 7, rgba(MINT, .6));
        sqC(ctx, S.sx, y, 1, rgba(MINT, .9));
        mono(ctx, SRC[i], S.lx, y, 'right', rgba(MUTED, .92));
      }
      // output line — compounding
      var O = S.out, L = O.len;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); O.trace(ctx, 0, L);
      ctx.strokeStyle = rgba(MINT, .07); ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = rgba(MINT, .42); ctx.lineWidth = 1.3; ctx.stroke();
      var PO = 6.5, ph = reduced ? .74 : (t % PO) / PO, uh = ph * 1.32;
      var hd = Math.min(uh, 1) * L, tl = Math.max(0, uh - .38) * L;
      var fa = sstep(0, .05, ph) * (1 - sstep(.96, 1, ph));
      if(hd - tl > 1){
        O.at(tl, P0); var tx = P0.x, ty = P0.y; O.at(hd, P0);
        var gr = ctx.createLinearGradient(tx, ty, P0.x, P0.y);
        gr.addColorStop(0, rgba(MINT, 0)); gr.addColorStop(1, rgba(MINT, .95 * fa));
        ctx.beginPath(); O.trace(ctx, tl, hd);
        ctx.strokeStyle = rgba(MINT, .1 * fa); ctx.lineWidth = 7; ctx.stroke();
        ctx.strokeStyle = gr; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.lineWidth = 1; ctx.lineCap = 'butt';
      var ha = fa * (1 - sstep(.95, 1.04, uh));
      O.at(hd, P0);
      glowDot(ctx, P0.x, P0.y, 26, .9 * ha);
      sq(ctx, P0.x, P0.y, 5, rgba(HI, ha));
      // end marker
      var endP = sstep(.96, 1.06, uh) * (1 - sstep(1.12, 1.3, uh));
      glowDot(ctx, S.ox1, S.oyT, 18 + 10 * endP, .25 + .45 * endP);
      sqC(ctx, S.ox1, S.oyT, 5, rgba(MINT, .85));
      ringC(ctx, S.ox1, S.oyT, 13, rgba(MINT, .3 + .4 * endP));
      mono(ctx, 'COMPOUNDING', S.ox1 - 14, S.oyT, 'right', rgba(mix(cMUTED, cMINT, endP), .92));
      // core
      var br = reduced ? .5 : .5 + .5 * Math.sin(t * 1.25);
      glowDot(ctx, S.kx, S.ky, 52 + 6 * br, .55 + .2 * br);
      ringC(ctx, S.kx, S.ky, 33, rgba(MINT, .16 + .08 * br));
      brackets(ctx, S.kx - 23, S.ky - 23, 47, 47, 6, rgba(MINT, .45));
      sqC(ctx, S.kx, S.ky, 19, '#0D6B54');
      ringC(ctx, S.kx, S.ky, 19, rgba(MINT, .95));
      sqC(ctx, S.kx, S.ky, 7, '#DFFFF2');
      mono(ctx, 'ONE SYSTEM', S.kx, S.ky + 34, 'center', rgba(MUTED, .85));
    }
  });

  /* ================================================================ 7 · who — four markets */
  var MKT = ['TECH', 'COMMERCE', 'PROFESSIONAL', 'LOCAL'], WORD = [0, 1, 3, 2];
  function launchF(x){ var u = clamp((x - .3) / .7, 0, 1), k = 3.6; return .08 + .025 * vn(x * 12 + 3) + .84 * (Math.exp(k * u) - 1) / (Math.exp(k) - 1); }
  function ordV(i){
    var wk = [.84, .9, .95, 1, 1.08, 1.24, 1.13][((i % 7) + 7) % 7];
    var v = (.5 + .15 * Math.sin(i * .052) + .07 * Math.sin(i * .15 + 1)) * wk * (.8 + .32 * hash(i * 1.3));
    if(hash(i * 3.7 + 1) > .945) v *= 1.38;
    return clamp(v, .12, .97);
  }
  function ordMA(i){ var s = 0; for(var k = 0; k < 7; k++) s += ordV(i - k); return s / 7; }
  reg('who', {
    init: function(c){ c.st.pos = 120.4; },
    draw: function(c, dt){
      var ctx = c.ctx, S = c.st, w = c.w, h = c.h, i;
      if(!reduced && dt > 0) S.pos += dt * .8;
      var t = reduced ? 1.6 : c.t;
      var pad = Math.round(clamp(w * .03, 8, 20)), g = Math.round(clamp(w * .025, 8, 14));
      var pw = Math.floor((w - 2 * pad - g) / 2), ph = Math.floor((h - 2 * pad - g) / 2);
      var PP = 3.8, TRN = 1.1, st = Math.floor(t / PP), pt = t - st * PP;
      var cur = WORD[st % 4], prev = WORD[(st + 3) % 4], p = eio(pt / TRN);
      var hA = 1;
      if(st === 0 && !reduced){ prev = cur; p = 1; hA = sstep(0, 1, t); }
      var act = [0, 0, 0, 0];
      act[cur] += p; act[prev] += 1 - p; if(cur === prev) act[cur] = 1;
      var rx = [], ry = [];
      for(i = 0; i < 4; i++){ rx.push(pad + (i % 2) * (pw + g)); ry.push(pad + (i >> 1) * (ph + g)); }
      for(i = 0; i < 4; i++){
        var x = rx[i], y = ry[i], a = act[i] * hA;
        rrp(ctx, x + .5, y + .5, pw - 1, ph - 1, 10);
        ctx.fillStyle = rgba(PANEL, .78); ctx.fill();
        if(a > .01){ ctx.fillStyle = rgba(JB, .045 * a); ctx.fill(); }
        ctx.strokeStyle = rgba(PAPER, .1); ctx.lineWidth = 1; ctx.stroke();
        mono(ctx, MKT[i], x + 13, y + 16, 'left', rgba(mix(cMUTED, cMINT, a), .92));
        if(pw > 150) mono(ctx, '0' + (i + 1), x + pw - 13, y + 16, 'right', rgba(FAINT, .6));
        sqC(ctx, x + pw - (pw > 150 ? 36 : 14), y + 16, 3, rgba(MINT, .25 + .7 * a));
        var gx = x + 14, gy = y + 32, gw = pw - 28, gh = ph - 32 - 14, b = .42 + .58 * a;
        if(gh < 16) continue;
        ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 24, pw - 4, ph - 26); ctx.clip();
        if(i === 0) this.tech(ctx, gx, gy, gw, gh, t, b);
        else if(i === 1) this.comm(ctx, S, gx, gy, gw, gh, b);
        else if(i === 2) this.pro(ctx, gx, gy, gw, gh, t, b);
        else this.local(ctx, gx, gy, gw, gh, t, b);
        ctx.restore();
      }
      // sweeping outline
      var hx = lerp(rx[prev], rx[cur], p), hy = lerp(ry[prev], ry[cur], p);
      ctx.globalAlpha = hA;
      rrp(ctx, hx + .5, hy + .5, pw - 1, ph - 1, 10);
      ctx.strokeStyle = rgba(JB, .16); ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = rgba(MINT, .7); ctx.lineWidth = 1; ctx.stroke();
      ctx.globalAlpha = 1;
    },
    tech: function(ctx, gx, gy, gw, gh, t, b){
      var by = Math.round(gy + gh), P = 5.2, cyc = reduced ? .8 : (t % P) / P;
      var prog = esin(cyc / .72), A = (reduced ? 1 : 1 - sstep(.88, 1, cyc)) * b;
      dotH(ctx, gx, gx + gw, gy + gh * .5, rgba(PAPER, .05));
      ctx.fillStyle = rgba(PAPER, .16); ctx.fillRect(gx, by, gw, 1);
      dashV(ctx, gx + gw * .3, gy, by, rgba(MINT, .16));
      ctx.save(); ctx.setLineDash([1, 4]); ctx.strokeStyle = rgba(PAPER, .13); ctx.beginPath();
      for(var px = 0; px <= gw; px += 3){ var X = gx + px, Y = by - launchF(px / gw) * gh; if(px) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.restore();
      if(prog <= 0) return;
      var xe = gw * prog;
      ctx.globalAlpha = A; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      for(px = 0; px < xe; px += 2){ X = gx + px; Y = by - launchF(px / gw) * gh; if(px) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      var hx = gx + xe, hy = by - launchF(prog) * gh; ctx.lineTo(hx, hy);
      ctx.strokeStyle = rgba(MINT, .12); ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = rgba(MINT, .95); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.lineWidth = 1; ctx.lineCap = 'butt';
      glowDot(ctx, hx, hy, 18, .9);
      sq(ctx, hx, hy, 4, '#EFFFF8');
      ctx.globalAlpha = 1;
    },
    comm: function(ctx, S, gx, gy, gw, gh, b){
      var by = Math.round(gy + gh), xr = gx + gw, pitch = clamp(gw / 15, 7, 13), bw = Math.max(3, Math.round(pitch * .55));
      var pos = S.pos, N = Math.floor(pos), f = pos - N, cnt = Math.ceil(gw / pitch) + 2;
      ctx.fillStyle = rgba(PAPER, .16); ctx.fillRect(gx, by, gw, 1);
      ctx.globalAlpha = b;
      var mxa = 0, myb = 0, first = true;
      ctx.beginPath();
      for(var j = -1; j < cnt; j++){
        var i = N - j, x = xr - (pos - i) * pitch - pitch / 2, grow = 1;
        if(i > N){ grow = sstep(0, 1, f); x = xr - pitch / 2; }
        if(x < gx - pitch || x > xr) continue;
        var ea = sstep(gx - 4, gx + 26, x);
        var v = ordV(i), bh = v * gh * .82 * grow;
        ctx.fillStyle = i > N ? rgba(MINT, .55 * ea) : rgba(JB, .55 * ea); ctx.fillRect(Math.round(x - bw / 2), by - bh, bw, bh);
        ctx.fillStyle = rgba(MINT, (i > N ? .95 : .55) * ea); ctx.fillRect(Math.round(x - bw / 2), Math.round(by - bh), bw, 1.5);
      }
      ctx.globalAlpha = 1;
      // 7-day moving average
      ctx.beginPath();
      for(j = 0; j < cnt; j++){
        i = N - j; x = xr - (pos - i) * pitch - pitch / 2;
        if(x < gx + 2) break;
        var Y = by - ordMA(i) * gh * .82;
        if(first){ ctx.moveTo(x, Y); mxa = x; myb = Y; first = false; } else ctx.lineTo(x, Y);
      }
      ctx.lineJoin = 'round';
      ctx.strokeStyle = rgba(MINT, .9 * b); ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
      if(!first){ glowDot(ctx, mxa, myb, 14, .8 * b); sq(ctx, mxa, myb, 4, rgba(HI, b)); }
    },
    pro: function(ctx, gx, gy, gw, gh, t, b){
      var cw = Math.min(gw * .62, gh * 1.5, 150), ch = cw / 1.75, cx = gx + gw / 2, cy = gy + gh / 2;
      var P = 6.4, cyc = reduced ? 0 : t % P;
      var ang = Math.PI * eio((cyc - 2.4) / 1.05) + Math.PI * eio((cyc - 5.2) / 1.05);
      var sx = Math.cos(ang), back = sx < 0, s = Math.max(.02, Math.abs(sx));
      // shadow/floor
      ctx.fillStyle = rgba(PAPER, .07); ctx.fillRect(Math.round(cx - cw * .45 * s), Math.round(cy + ch / 2 + 7), Math.round(cw * .9 * s), 1);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, 1);
      var x = -cw / 2, y = -ch / 2;
      ctx.globalAlpha = b;
      if(!back){
        ctx.fillStyle = rgba(PANEL2, 1); ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = rgba(PAPER, .28); ctx.lineWidth = 1 / s; ctx.strokeRect(x + .5, y + .5, cw - 1, ch - 1);
        ctx.fillStyle = '#0D6B54'; ctx.fillRect(x + 8, y + 8, 7, 7);
        ctx.fillStyle = rgba(MINT, .9); ctx.fillRect(x + 10.5, y + 10.5, 2, 2);
        ctx.fillStyle = rgba(PAPER, .6); ctx.fillRect(x + 8, y + ch * .55, cw * .46, 3);
        ctx.fillStyle = rgba(PAPER, .22); ctx.fillRect(x + 8, y + ch * .55 + 7, cw * .3, 2);
        ctx.fillStyle = rgba(PAPER, .14); ctx.fillRect(x + cw - 8 - cw * .26, y + ch - 13, cw * .26, 2); ctx.fillRect(x + cw - 8 - cw * .18, y + ch - 8, cw * .18, 2);
      } else {
        ctx.fillStyle = rgba(PANEL2, 1); ctx.fillRect(x, y, cw, ch);
        ctx.fillStyle = rgba(JADE, .55); ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = rgba(MINT, .5); ctx.lineWidth = 1 / s; ctx.strokeRect(x + .5, y + .5, cw - 1, ch - 1);
        ctx.strokeStyle = rgba(MINT, .9); ctx.strokeRect(-6.5, -9.5, 13, 13);
        ctx.fillStyle = rgba(HI, .95); ctx.fillRect(-2, -5, 4, 4);
        ctx.fillStyle = rgba(MINT, .6); ctx.fillRect(-cw * .16, 9, cw * .32, 2);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    },
    local: function(ctx, gx, gy, gw, gh, t, b){
      var sw = Math.min(gw * .7, gh * 1.6, 210), sh = sw * .62;
      if(sh > gh){ sh = gh; sw = sh / .62; }
      var x = Math.round(gx + (gw - sw) / 2), base = Math.round(gy + gh), top = Math.round(base - sh);
      var awn = Math.round(sh * .2), fac = top + awn;
      ctx.globalAlpha = b;
      ctx.fillStyle = rgba(PAPER, .14); ctx.fillRect(Math.round(gx), base, Math.round(gw), 1);
      // facade
      ctx.fillStyle = rgba(PANEL2, 1); ctx.fillRect(x, fac, Math.round(sw), base - fac);
      ctx.strokeStyle = rgba(PAPER, .24); ctx.lineWidth = 1; ctx.strokeRect(x + .5, fac + .5, Math.round(sw) - 1, base - fac - 1);
      // awning — alternating stripes with a pointed hem
      var ns = 7, stw = (sw + 6) / ns, ax = x - 3;
      for(var i = 0; i < ns; i++){
        ctx.fillStyle = i % 2 ? rgba(PANEL2, 1) : '#0D6B54';
        ctx.beginPath(); ctx.moveTo(ax + i * stw, top); ctx.lineTo(ax + (i + 1) * stw, top); ctx.lineTo(ax + (i + 1) * stw, top + awn - 3);
        ctx.lineTo(ax + (i + .5) * stw, top + awn + 1); ctx.lineTo(ax + i * stw, top + awn - 3); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = rgba(MINT, .5); ctx.fillRect(ax, top, Math.round(sw + 6), 1);
      // window + door
      var oc = t % 4.8, on = reduced ? 1 : sstep(0, .6, oc) * (1 - sstep(3.0, 3.6, oc));
      var wx = Math.round(x + sw * .09), wy = Math.round(fac + (base - fac) * .2), ww = Math.round(sw * .5), wh = Math.round((base - fac) * .5);
      ctx.fillStyle = rgba(INK, 1); ctx.fillRect(wx, wy, ww, wh);
      if(on > .01){ ctx.fillStyle = rgba(JB, .1 * on); ctx.fillRect(wx, wy, ww, wh); }
      ctx.strokeStyle = rgba(PAPER, .2); ctx.strokeRect(wx + .5, wy + .5, ww - 1, wh - 1);
      var dx = Math.round(x + sw * .68), dw = Math.round(sw * .22), dy = Math.round(fac + (base - fac) * .2);
      ctx.fillStyle = rgba(INK, 1); ctx.fillRect(dx, dy, dw, base - dy);
      ctx.strokeStyle = rgba(PAPER, .2); ctx.strokeRect(dx + .5, dy + .5, dw - 1, base - dy - .5);
      ctx.fillStyle = rgba(MINT, .5); ctx.fillRect(dx + dw - 5, Math.round(dy + (base - dy) * .55), 2, 2);
      // OPEN sign
      var fs = clamp(sw * .05, 6.5, 9.5), sl = tw('OPEN', fs, fs * .14), sgw = Math.round(sl + fs * 1.3), sgh = Math.round(fs * 1.65);
      var sgx = Math.round(wx + ww / 2 - sgw / 2), sgy = Math.round(wy + wh / 2 - sgh / 2);
      ctx.globalAlpha = 1;
      glowDot(ctx, wx + ww / 2, wy + wh / 2, sw * .26, .7 * on * b);
      ctx.globalAlpha = b;
      ctx.strokeStyle = rgba(mix(cFAINT, cMINT, on), .35 + .6 * on); ctx.strokeRect(sgx + .5, sgy + .5, sgw - 1, sgh - 1);
      mono(ctx, 'OPEN', sgx + sgw / 2, sgy + sgh / 2, 'center', rgba(mix(cFAINT, cMINT, on), .45 + .55 * on), fs, 500, fs * .14);
      ctx.globalAlpha = 1;
    }
  });

  /* ================================================================ 8 · notfound — lost signal */
  reg('notfound', {
    init: function(c){},
    draw: function(c){
      var ctx = c.ctx, w = c.w, h = c.h, P = 6.6;
      var tt = reduced ? 0 : c.t, T = reduced ? 3.85 : c.t % P;
      var pad = Math.round(clamp(w * .045, 12, 30));
      var x0 = pad, x1 = w - pad, y0 = pad, y1 = h - pad, sw = x1 - x0, sh = y1 - y0, cy = Math.round((y0 + y1) / 2);
      // screen
      ctx.fillStyle = rgba('13,21,19', .65); ctx.fillRect(x0, y0, sw, sh);
      ctx.strokeStyle = rgba(PAPER, .14); ctx.lineWidth = 1; ctx.strokeRect(x0 + .5, y0 + .5, sw - 1, sh - 1);
      brackets(ctx, x0 - 4, y0 - 4, sw + 8, sh + 8, 9, rgba(PAPER, .3));
      // graticule
      var cols = Math.max(6, Math.round(sw / 60)), rows = Math.max(4, Math.round(sh / 56)); if(rows % 2) rows++;
      for(var i = 1; i < cols; i++) dotV(ctx, x0 + sw * i / cols, y0 + 3, y1 - 3, rgba(PAPER, .055));
      for(i = 1; i < rows; i++) if(i !== rows / 2) dotH(ctx, x0 + 3, x1 - 3, y0 + sh * i / rows, rgba(PAPER, .055));
      ctx.fillStyle = rgba(PAPER, .11); ctx.fillRect(x0 + 1, cy, sw - 2, 1);
      for(i = 1; i < cols * 5; i++){ var tx = Math.round(x0 + sw * i / (cols * 5)); ctx.fillRect(tx, cy - (i % 5 ? 1 : 3), 1, i % 5 ? 3 : 7); }
      // timing
      var S0 = 2.4, S1 = 4.7, D0 = 5.4, D1 = 6.4;
      var sp = (T - S0) / (S1 - S0), sweeping = T >= S0 && T <= S1 + .05;
      var sx = x0 + sw * lerp(clamp(sp, 0, 1), esin(sp), .6);
      var decay = 1 - sstep(D0, D1, T), lockA = T >= S0 ? decay : 0;
      var amp = sh * .26, lam = sw / 3.3, phase = tt * 1.3;
      // trace
      var ix = x0 + 2, ex = x1 - 2;
      var noiseY = function(x){ return (vn(x * .085 + tt * 1.4) - .5) * 5 + (vn(x * .41 + tt * 3.1 + 40) - .5) * 2.6; };
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for(var x = ix; x <= ex; x += 2){
        var m = lockA * (T < S1 ? sstep(0, 36, sx - x) : 1);
        var y = cy + .5 + noiseY(x) * (1 - m) + Math.sin((x - x0) / lam * TAU - phase) * amp * m;
        if(x === ix) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(PAPER, .34); ctx.lineWidth = 1.1; ctx.stroke();
      if(lockA > .01){
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, (T < S1 ? sx : x1) - x0, sh); ctx.clip();
        ctx.beginPath();
        for(x = ix; x <= ex; x += 2){
          m = lockA * (T < S1 ? sstep(0, 36, sx - x) : 1);
          y = cy + .5 + noiseY(x) * (1 - m) + Math.sin((x - x0) / lam * TAU - phase) * amp * m;
          if(x === ix) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(MINT, .12 * lockA); ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = rgba(MINT, .95 * lockA); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
      ctx.lineWidth = 1;
      // sweep
      if(sweeping){
        var sa = sstep(0, .06, sp) * (1 - sstep(.94, 1, sp));
        var bw = Math.min(44, sw * .14), g = ctx.createLinearGradient(sx - bw, 0, sx, 0);
        g.addColorStop(0, rgba(JB, 0)); g.addColorStop(1, rgba(JB, .09 * sa));
        ctx.fillStyle = g; ctx.fillRect(sx - bw, y0 + 1, bw, sh - 2);
        ctx.fillStyle = rgba(MINT, .7 * sa); ctx.fillRect(Math.round(sx), y0 + 1, 1, sh - 2);
        sq(ctx, sx, y0, 4, rgba(MINT, sa)); sq(ctx, sx, y1, 4, rgba(MINT, sa));
      }
      // readouts
      var lockOn = lockA * (T < S1 ? sstep(.2, .6, sp) : 1);
      mono(ctx, '404', x0 + 14, y0 + 22, 'left', rgba(PAPER, .88), 20, 500, 1);
      var blink = reduced ? 1 : .55 + .45 * Math.cos(tt * 2.2);
      sqC(ctx, x0 + 17, y0 + 45, 5, lockOn > .02 ? rgba(MINT, .5 + .5 * lockOn) : rgba(FAINT, .5 + .4 * blink));
      mono(ctx, 'SIGNAL LOST', x0 + 26, y0 + 45, 'left', rgba(MUTED, .92));
      var fr = lockOn > .5 ? 'CH1  4.04 kHz' : 'CH1  --.-- Hz';
      mono(ctx, fr, x1 - 12, y1 - 14, 'right', rgba(mix(cFAINT, cMINT, lockOn), .85));
      if(w > 380) mono(ctx, 'AUTO  2 ms/DIV', x0 + 14, y1 - 14, 'left', rgba(FAINT, .7));
    }
  });

  /* ------------------------------------------------------------ boot */
  if(D.readyState === 'loading') D.addEventListener('DOMContentLoaded', scan);
  else scan();
})();
