/* ============================================================
   NAVREN — live card visuals (homepage "Who we help" cards and the
   matching heroes on the four Who-we-help pages)
   01 launch curve · 02 daily orders · 03 business card · 04 open for business
   ============================================================ */
/* WHO WE HELP — Productivity: four dark cards with live canvases (03 = Business card, 04 = Open for business) */
(function(){
var NVV={
  reduced:(function(){ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })(),
  visible:function(){ return true; },
  reg:function(slot,v,fn){ fn(document.body); }
};
try{
/* card visuals: chosen visual per card. 01 tech = built-in launch curve, 02 = daily orders,
   03 pro = Business card, 04 local = Open for business. Hover lifts a card; pace stays steady. */
var NVK = window.NVK = { defs:{}, sel:{ pro:3, local:3 }, reg:function(slot, n, def){ this.defs[slot + n] = def; } };
/* 03 · Professional Services — Business card */
/* pro3 · Business card — one business card per beat, slid across the desk by a line-art hand, flipped face-up
   under the desk lamp, read, then filed onto a neat stack. ATTORNEY AT LAW → CERTIFIED ACCOUNTANT → CONSULTANT →
   REALTOR → INSURANCE ADVISOR → CREATIVE AGENCY. */
NVK.reg('pro', 3, (function(){
  var MINT = '139,224,192', JB = '61,170,136', JADE = '13,107,84', PAPER = '232,237,234', TAU = Math.PI * 2;
  var B = 7, MONO = '"IBM Plex Mono", ui-monospace, monospace';
  var COOL = [139, 224, 192], WARM = [246, 243, 231];
  var INK = '20,33,29';
  var CARDS = [
    { t:'ATTORNEY AT LAW', ic:0 },
    { t:'CERTIFIED ACCOUNTANT', ic:1 },
    { t:'CONSULTANT', ic:2 },
    { t:'REALTOR', ic:3 },
    { t:'INSURANCE ADVISOR', ic:4 },
    { t:'CREATIVE AGENCY', ic:5 }
  ];
  var NC = CARDS.length;

  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function sstep(a, b, x){ var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function eIO(t){ t = clamp(t, 0, 1); return .5 - .5 * Math.cos(Math.PI * t); }   // gentle sine in-out
  function rgba(c, a){ return 'rgba(' + c + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; }
  function rr(g, x, y, w, h, r){ r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function ln(g, x0, y0, x1, y1){ g.moveTo(x0, y0); g.lineTo(x1, y1); }
  // glow sprites (same as Open for business); LIGHT = the desk lamp, cool → warm by curTW
  var SPR = {}, LIGHT = 'L', curTW = 0;
  function sprite(col){
    if(SPR[col]) return SPR[col];
    var cv = document.createElement('canvas'); cv.width = cv.height = 96; var g = cv.getContext('2d');
    var gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(.5, rgba(col, .42)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 96, 96); return (SPR[col] = cv);
  }
  function glow(g, x, y, r, col, a){
    if(a <= .003 || r <= 0) return;
    if(col === LIGHT){ glow(g, x, y, r, COOL.join(','), a * (1 - curTW)); glow(g, x, y, r, WARM.join(','), a * curTW); return; }
    var ga = g.globalAlpha; g.globalAlpha = ga * clamp(a, 0, 1); g.drawImage(sprite(col), x - r, y - r, r * 2, r * 2); g.globalAlpha = ga;
  }
  function fontsOK(){ try{ return !document.fonts || document.fonts.check('500 10px "IBM Plex Mono"'); }catch(e){ return true; } }

  /* ------------------------------------------------------------ practice marks (24px box, centred) */
  function icon(g, k){
    g.beginPath();
    if(k === 0){ // scales
      ln(g, 0, -8, 0, 9); ln(g, -6, 10, 6, 10); ln(g, -9.5, -5.5, 9.5, -5.5); g.moveTo(1.6, -9.6); g.arc(0, -9.6, 1.6, 0, TAU);
      ln(g, -9.5, -5.5, -12.5, 2.5); ln(g, -9.5, -5.5, -6.5, 2.5); ln(g, 9.5, -5.5, 6.5, 2.5); ln(g, 9.5, -5.5, 12.5, 2.5);
      g.moveTo(-12.5, 2.5); g.quadraticCurveTo(-9.5, 7.5, -6.5, 2.5); g.moveTo(6.5, 2.5); g.quadraticCurveTo(9.5, 7.5, 12.5, 2.5);
    } else if(k === 1){ // calculator
      rr(g, -8, -11, 16, 22, 2.5); g.rect(-5, -8, 10, 5);
      for(var r = 0; r < 3; r++) for(var q = 0; q < 3; q++){ var x = -4 + q * 4, y = 1 + r * 3.6; g.moveTo(x + .9, y); g.arc(x, y, .9, 0, TAU); }
    } else if(k === 2){ // chess knight
      g.moveTo(-6, 7.5); g.quadraticCurveTo(-6.5, 2.5, -2, -.5); g.lineTo(-7, .8); g.quadraticCurveTo(-10, .2, -8.8, -2.6);
      g.lineTo(-2.5, -8.2); g.lineTo(-1.2, -11.5); g.lineTo(1, -8.6); g.quadraticCurveTo(7.5, -6, 6, 7.5); g.closePath();
      rr(g, -8.5, 7.5, 17, 3.5, 1.2); g.moveTo(-3, -4.6); g.arc(-3.8, -4.6, .8, 0, TAU);
    } else if(k === 3){ // house
      g.moveTo(-11, 0); g.lineTo(0, -10); g.lineTo(11, 0); g.moveTo(-7.5, -3); g.lineTo(-7.5, 10); g.lineTo(7.5, 10); g.lineTo(7.5, -3);
      g.rect(-2.2, 3.5, 4.4, 6.5); ln(g, 4.5, -8, 4.5, -4.5); ln(g, 4.5, -8, 7, -8); ln(g, 7, -8, 7, -2.3);
    } else if(k === 4){ // umbrella
      g.moveTo(-11.5, 0); g.arc(0, 0, 11.5, Math.PI, TAU);
      for(var i = 0; i < 3; i++){ var a0 = -11.5 + i * 7.667; g.moveTo(a0 + 7.667, 0); g.quadraticCurveTo(a0 + 3.83, -3, a0, 0); }
      ln(g, 0, -11.5, 0, -13); ln(g, 0, 0, 0, 8.5); g.moveTo(0, 8.5); g.arc(-2.4, 8.5, 2.4, 0, Math.PI);
    } else { // megaphone
      g.moveTo(-7, -3.2); g.lineTo(6, -9); g.lineTo(6, 9); g.lineTo(-7, 3.2); g.closePath(); rr(g, -10.5, -3.2, 3.5, 6.4, 1);
      ln(g, -4, 2, -2.5, 8); ln(g, -2.5, 8, .5, 7);
      g.moveTo(9.2, -4); g.quadraticCurveTo(11.4, 0, 9.2, 4); g.moveTo(12, -7); g.quadraticCurveTo(15.6, 0, 12, 7);
    }
    g.stroke();
  }

  /* ------------------------------------------------------------ card textures */
  function blank(W, H, dpr){
    var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    var g = cv.getContext('2d'); g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); return [cv, g];
  }
  function face(k, W, H, dpr){
    var p = blank(W, H, dpr), cv = p[0], g = p[1], q = W / 200, C = CARDS[k], pad = 15 * q;
    g.beginPath(); rr(g, 0, 0, W, H, 4 * q); g.fillStyle = '#E8EDEA'; g.fill();
    g.save(); g.clip();
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,.4)'); gr.addColorStop(.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(10,40,30,.1)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.restore();
    // logo mark
    g.save(); g.translate(pad + 12 * q, pad + 12 * q); g.scale(q, q);
    g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = 1.6; g.strokeStyle = 'rgb(' + JADE + ')'; icon(g, C.ic);
    g.restore();
    // title line
    var fs = 10 * q;
    g.font = '500 ' + fs.toFixed(2) + 'px ' + MONO; try{ g.letterSpacing = (1.5 * q).toFixed(2) + 'px'; }catch(e){}
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = 'rgb(' + INK + ')';
    g.fillText(C.t, pad, 72 * q);
    try{ g.letterSpacing = '0px'; }catch(e){}
    g.fillStyle = 'rgb(' + JADE + ')'; g.fillRect(pad, 78 * q, 14 * q, 1.6 * q);
    // contact detail bars (no names, no numbers)
    g.fillStyle = rgba(INK, .28);
    [[88, 70], [94, 54], [100, 62]].forEach(function(b){ g.beginPath(); rr(g, pad, b[0] * q, b[1] * q, 2.2 * q, 1.1 * q); g.fill(); });
    return cv;
  }
  function back(W, H, dpr){
    var p = blank(W, H, dpr), cv = p[0], g = p[1], q = W / 200;
    g.beginPath(); rr(g, 0, 0, W, H, 4 * q); g.fillStyle = '#0C4D3D'; g.fill();
    g.save(); g.clip();
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(139,224,192,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.2)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.restore();
    g.strokeStyle = rgba(MINT, .3); g.lineWidth = 1; g.beginPath(); rr(g, 7 * q, 7 * q, W - 14 * q, H - 14 * q, 2 * q); g.stroke();
    return cv;
  }
  function shadow(W, H, dpr){
    var pad = 28, p = blank(W + pad * 2, H + pad * 2, dpr), cv = p[0], g = p[1];
    g.setTransform(1, 0, 0, 1, 0, 0);
    var sx = cv.width / (W + pad * 2), off = 10000;
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 11 * sx; g.shadowOffsetX = off;
    g.fillStyle = '#000'; g.beginPath(); rr(g, pad * sx - off, pad * sx, W * sx, H * sx, 5 * sx); g.fill();
    return { cv:cv, pad:pad };
  }

  /* ------------------------------------------------------------ the hand (back of a right hand, palm down, fingers toward us) */
  function hand(g, x, y, m, rot){
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(m, m);
    g.lineJoin = 'round'; g.lineCap = 'round';
    var ink = rgba(PAPER, .78), body = '#0D1513', lw = 1.25 / m;
    function finger(pts, wb, wt){ // tapered finger along a polyline, rounded tip; base end hides under the palm
      var n = pts.length, L = [], R = [], i, dx, dy, dl;
      for(i = 0; i < n; i++){
        var p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
        dx = p1[0] - p0[0]; dy = p1[1] - p0[1]; dl = Math.sqrt(dx * dx + dy * dy); dx /= dl; dy /= dl;
        var wd = (i === n - 1 ? wt : lerp(wb, wt, i / (n - 1))) / 2;
        L.push([pts[i][0] - dy * wd, pts[i][1] + dx * wd]); R.push([pts[i][0] + dy * wd, pts[i][1] - dx * wd]);
      }
      var t = pts[n - 1], cx = t[0] - dx * wt / 2, cy = t[1] - dy * wt / 2;
      g.beginPath(); g.moveTo(L[0][0], L[0][1]);
      for(i = 1; i < n - 1; i++) g.lineTo(L[i][0], L[i][1]);
      g.lineTo(L[n - 1][0] - dx * wt / 2, L[n - 1][1] - dy * wt / 2);
      g.arc(cx, cy, wt / 2, Math.atan2(L[n - 1][1] - t[1], L[n - 1][0] - t[0]), Math.atan2(R[n - 1][1] - t[1], R[n - 1][0] - t[0]), true);
      for(i = n - 2; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
      g.fillStyle = body; g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke();
      // nail
      var nx = -dy, ny = dx, k = wt * .3;
      g.beginPath(); g.moveTo(cx + nx * k + dx * k * .9, cy + ny * k + dy * k * .9); g.lineTo(cx + nx * k, cy + ny * k);
      g.quadraticCurveTo(cx - dx * k * 1.1, cy - dy * k * 1.1, cx - nx * k, cy - ny * k); g.lineTo(cx - nx * k + dx * k * .9, cy - ny * k + dy * k * .9);
      g.strokeStyle = rgba(PAPER, .36); g.stroke();
    }
    // sleeve (runs off the top edge)
    g.beginPath(); g.moveTo(-24, -1000); g.lineTo(-24, -92); g.lineTo(24, -92); g.lineTo(24, -1000);
    g.fillStyle = '#111C19'; g.fill(); g.fillStyle = rgba(JADE, .14); g.fill(); g.strokeStyle = rgba(PAPER, .42); g.lineWidth = lw; g.stroke();
    // thumb, fingers (pinky → index), then the back of the hand over their bases
    finger([[14, -66], [26.5, -50], [31, -33]], 15, 11.5);
    finger([[-19, -46], [-22, -20]], 11, 9.5);
    finger([[-7, -48], [-8.5, -8]], 12, 10.5);
    finger([[6, -48], [6.5, -5]], 12, 10.5);
    finger([[18, -46], [20.5, -12]], 11.5, 10);
    g.beginPath();
    g.moveTo(-20, -90); g.lineTo(20, -90);
    g.bezierCurveTo(22, -78, 26, -62, 25.5, -50); g.quadraticCurveTo(25, -42, 18, -40);
    g.quadraticCurveTo(0, -36, -18, -40); g.quadraticCurveTo(-25, -42, -25.5, -50); g.bezierCurveTo(-26, -64, -22, -78, -20, -90); g.closePath();
    g.fillStyle = body; g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke();
    // shirt cuff
    g.beginPath(); rr(g, -26, -103, 52, 14, 2); g.fillStyle = '#16231F'; g.fill(); g.strokeStyle = rgba(PAPER, .55); g.lineWidth = lw; g.stroke();
    g.restore();
  }

  /* ------------------------------------------------------------ a card on the desk (flip = perspective slices) */
  function drawCard(ctx, S, k, x, y, ang, rot, lift, shade, s0){
    var W = S.CW, H = S.CH, ca = Math.cos(ang), sa = Math.sin(ang), sc = (s0 || 1) * (1 + lift);
    // shadow
    var sh = S.shadow, pw = Math.max(6, Math.abs(ca) * W) * sc, so = 3 + lift * 70;
    ctx.save(); ctx.translate(x + so * .35, y + so); ctx.rotate(rot);
    ctx.globalAlpha = .85 - lift * 2;
    ctx.drawImage(sh.cv, -pw / 2 - sh.pad, -H * sc / 2 - sh.pad, pw + sh.pad * 2, H * sc + sh.pad * 2);
    ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    if(Math.abs(sa) < .002){
      var tex = ca > 0 ? S.back : k < 0 ? S.plain : S.faces[k];
      ctx.drawImage(tex, -W / 2, -H / 2, W, H);
      if(shade > .01){ ctx.globalAlpha = shade; ctx.drawImage(S.dark, -W / 2, -H / 2, W, H); ctx.globalAlpha = 1; }
    } else {
      var front = ca > 0, src = front ? S.back : S.faces[k], N = 40, D = W * 2.6, tw = src.width / N;
      var dk = (1 - Math.abs(ca)) * .45 + shade;
      for(var j = 0; j < N; j++){
        var jj = front ? j : N - 1 - j;
        var lx0 = -W / 2 + j * W / N, lx1 = lx0 + W / N;
        var p0 = D / (D - lx0 * sa), p1 = D / (D - lx1 * sa);
        var X0 = lx0 * ca * p0, X1 = lx1 * ca * p1, hh = H * (p0 + p1) / 2;
        var xa = Math.min(X0, X1), xw = Math.abs(X1 - X0) + .6;
        ctx.drawImage(src, jj * tw, 0, tw, src.height, xa, -hh / 2, xw, hh);
      }
      if(dk > .01){ // one shading pass over the projected outline (no seams)
        var pl = D / (D + W / 2 * sa), pr = D / (D - W / 2 * sa), XL = -W / 2 * ca * pl, XR = W / 2 * ca * pr;
        ctx.beginPath(); ctx.moveTo(XL, -H * pl / 2); ctx.lineTo(XR, -H * pr / 2); ctx.lineTo(XR, H * pr / 2); ctx.lineTo(XL, H * pl / 2); ctx.closePath();
        ctx.fillStyle = 'rgba(6,12,10,' + clamp(dk, 0, 1).toFixed(3) + ')'; ctx.fill();
      }
    }
    ctx.restore();
  }

  return {
    label: ['03', 'BUSINESS CARD'],
    init: function(c){
      var w = c.w, h = c.h, dpr = c.dpr, wide = w >= 470;
      var CW = wide ? Math.round(clamp(Math.min(w * .32, (h - 92) * 1.65), 150, 218)) : Math.round(clamp(Math.min(w * .58, (h - 70) * 1.62), 140, 210));
      var CH = Math.round(CW * .57);
      var S = c.st = { wide:wide, CW:CW, CH:CH, q:CW / 200 };
      S.rx = Math.round(wide ? w * .4 : w / 2); S.ry = Math.round(wide ? h * .57 : h * .56);
      S.sx = Math.round(w * .765); S.sy = S.ry - Math.round(6 * S.q); S.ss = .9;
      S.faces = CARDS.map(function(C, k){ return face(k, CW, CH, dpr); });
      S.back = back(CW, CH, dpr);
      S.shadow = shadow(CW, CH, dpr);
      var dp = blank(CW, CH, dpr); dp[1].beginPath(); rr(dp[1], 0, 0, CW, CH, 4 * S.q); dp[1].fillStyle = '#0A1210'; dp[1].fill(); S.dark = dp[0];
      var pp = blank(CW, CH, dpr); pp[1].beginPath(); rr(pp[1], 0, 0, CW, CH, 4 * S.q); pp[1].fillStyle = '#E8EDEA'; pp[1].fill();
      pp[1].strokeStyle = 'rgba(10,20,17,.35)'; pp[1].lineWidth = 1; pp[1].stroke(); S.plain = pp[0];
      S.fok = fontsOK();
      // desk: a leather desk pad with a stitched edge — cached
      var tb = blank(w, h, dpr), g = tb[1];
      var px0 = wide ? Math.round(w * .07) : 14, px1 = w - px0, py0 = wide ? 50 : 46, py1 = h - 10;
      g.beginPath(); rr(g, px0 + .5, py0 + .5, px1 - px0 - 1, py1 - py0, 12); g.fillStyle = rgba(JADE, .09); g.fill();
      g.strokeStyle = rgba(PAPER, .13); g.lineWidth = 1; g.stroke();
      g.save(); g.setLineDash([3, 3]); g.strokeStyle = rgba(PAPER, .08); g.beginPath(); rr(g, px0 + 6.5, py0 + 6.5, px1 - px0 - 13, py1 - py0 - 12, 8); g.stroke(); g.restore();
      g.globalCompositeOperation = 'destination-out';
      var gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(.12, 'rgba(0,0,0,0)'); gr.addColorStop(.88, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.7)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      S.desk = tb[0];
    },
    draw: function(c, dt){
      var ctx = c.ctx, w = c.w, h = c.h, S = c.st; if(!S) return;
      if(!S.fok && fontsOK()){ S.fok = true; S.faces = CARDS.map(function(C, k){ return face(k, S.CW, S.CH, c.dpr); }); }
      var red = c.reduced, t = red ? .62 * B : c.t, q = S.q, CW = S.CW, CH = S.CH;
      var bi = Math.floor(t / B), u = (t - bi * B) / B, cur = ((bi % NC) + NC) % NC, prev = (cur + NC - 1) % NC;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(S.desk, 0, 0, w, h);

      // ---- card motion. Beat timeline in seconds (B = 7):
      // 0–1.3 hand slides the card in · 1.4–2.2 hand withdraws · 2.1–3.2 flip · 3.2–5.8 rest face-up · 5.8–6.95 onto the stack
      var sec = u * B;
      function seg(a, b){ return clamp((sec - a) / (b - a), 0, 1); }
      var x = S.rx, y = S.ry, ang = Math.PI, rot = 0, lift = 0, shade = 0, sc0 = 1, SHD = .52;
      var x0 = -CW * .5 - 40 * q;
      if(sec < 1.3){ var pi = Math.sin(Math.PI / 2 * seg(0, 1.3)); x = lerp(x0, S.rx, pi); y = S.ry + (1 - pi) * 10 * q; rot = (1 - pi) * -.09; ang = 0; }
      else if(sec < 2.1){ ang = 0; }
      else if(sec < 3.2){ var pf = eIO(seg(2.1, 3.2)); ang = Math.PI * pf; lift = Math.sin(Math.PI * pf) * .07; }
      else if(sec > 5.8){
        var ps = eIO(seg(5.8, 6.95)), tx = S.wide ? S.sx : w + CW * .75;
        x = lerp(S.rx, tx, ps); y = lerp(S.ry, S.wide ? S.sy : S.ry, ps); rot = lerp(0, .03, ps); lift = Math.sin(Math.PI * ps) * .02;
        if(S.wide){ shade = SHD * ps; sc0 = lerp(1, S.ss, ps); }
      }
      if(red){ x = S.rx; y = S.ry; ang = Math.PI; rot = 0; lift = 0; }
      // the lamp: warms as the card is turned face-up, cools as it is filed
      var L = red ? 1 : sstep(2.5, 3.6, sec) * (1 - sstep(5.8, 6.8, sec));
      curTW = red ? .85 : L * .9;
      glow(ctx, S.rx, S.ry - 6 * q, CW * 1.05, LIGHT, .07 + .1 * L);

      // ---- the filed stack (wide only): squared-up cards, previous practice on top
      if(S.wide){
        [[-.075, -4, 3], [.05, 3, 2], [-.025, 0, 0]].forEach(function(d){ drawCard(ctx, S, -1, S.sx + d[1] * q, S.sy + d[2] * q, Math.PI, d[0], 0, SHD, S.ss); });
        drawCard(ctx, S, prev, S.sx, S.sy, Math.PI, .03, 0, SHD, S.ss);
      }
      drawCard(ctx, S, cur, x, y, ang, rot, lift, shade, sc0);

      // ---- the hand that slides it across (withdraws before the flip)
      if(!red && sec < 2.2){
        var hm = CW / 140, hx = x - CW * .04, hy = y + CH * .04, hr = -Math.PI / 2 + .1 + rot;
        if(sec > 1.4){ var pw2 = eIO(seg(1.4, 2.2)); hx = lerp(S.rx - CW * .04, -10 * q, pw2); hy = S.ry + CH * .04 + pw2 * 8 * q; }
        hand(ctx, hx, hy, hm, hr);
      }
    }
  };
})());
/* 04 · Local & Service — Open for business */
/* local3 · Open for business — one storefront that becomes a different local business each beat.
   The shop stays open: a warm, lit line-art window says the trade, neon OPEN glows, a blade sign hangs out front.
   Every ~5.6s the whole storefront gently dissolves into the next trade (awning shape + stripes, name plate,
   wall, blade icon, window display): RESTAURANT → BARBER → NAIL SALON → GYM → BAKERY · CAFÉ → AUTO REPAIR → STUDIO. */
NVK.reg('local', 3, (function(){
  var MINT = '139,224,192', JB = '61,170,136', JADE = '13,107,84', PAPER = '232,237,234', TAU = Math.PI * 2;
  var B = 5.6, HOLD = 4.2, FAM = 'Manrope, system-ui, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, monospace';
  var COOL = [139, 224, 192], WARM = [246, 243, 231];
  // awning: d slope depth, vh valance, sc/sd scallop count/depth, st stripes, cu dome curve, sl slab (modern canopy)
  var BIZ = [
    { name:'RESTAURANT',    aw:{ d:20, vh:8, sc:7,  sd:4,   st:9,  cu:0,  sl:0 }, wall:0, icon:0 },
    { name:'BARBER',        aw:{ d:16, vh:7, sc:0,  sd:0,   st:15, cu:0,  sl:0 }, wall:1, icon:1, pole:1 },
    { name:'NAIL SALON',    aw:{ d:20, vh:6, sc:12, sd:2.5, st:0,  cu:13, sl:0 }, wall:2, icon:2 },
    { name:'GYM',           aw:{ d:5,  vh:9, sc:0,  sd:0,   st:0,  cu:0,  sl:1 }, wall:2, icon:3 },
    { name:'BAKERY · CAFÉ', aw:{ d:22, vh:9, sc:5, sd:5.5, st:7, cu:0, sl:0 }, wall:0, icon:4 },
    { name:'AUTO REPAIR',   aw:{ d:4,  vh:7, sc:0,  sd:0,   st:0,  cu:0,  sl:1 }, wall:3, icon:5, gar:1 },
    { name:'STUDIO',        aw:{ d:10, vh:4, sc:0,  sd:0,   st:0,  cu:0,  sl:0 }, wall:1, icon:6 }
  ];

  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function sstep(a, b, x){ var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function rgba(c, a){ return 'rgba(' + c + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; }
  function mix(a, b, t){ return Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)); }
  function rr(g, x, y, w, h, r){ r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function ln(g, x0, y0, x1, y1){ g.moveTo(x0, y0); g.lineTo(x1, y1); }
  // glows are drawn from small cached sprites; LIGHT = the shop's window light (cool→warm by curTW)
  var SPR = {}, LIGHT = 'L', curTW = 0;
  function sprite(col){
    if(SPR[col]) return SPR[col];
    var cv = document.createElement('canvas'); cv.width = cv.height = 96; var g = cv.getContext('2d');
    var gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(.5, rgba(col, .42)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 96, 96); return (SPR[col] = cv);
  }
  function glow(g, x, y, r, col, a){
    if(a <= .003 || r <= 0) return;
    if(col === LIGHT){ glow(g, x, y, r, COOL.join(','), a * (1 - curTW)); glow(g, x, y, r, WARM.join(','), a * curTW); return; }
    var ga = g.globalAlpha; g.globalAlpha = ga * clamp(a, 0, 1); g.drawImage(sprite(col), x - r, y - r, r * 2, r * 2); g.globalAlpha = ga;
  }

  /* ------------------------------------------------------------ window displays (140×100 box, floor ≈ 96) */
  // P: { ln: line colour, ac: accent rgb string, L: light 0..1, t: seconds, wc: light colour rgb string }
  var DISP = [
    function(g, P){ // restaurant: pendant lamps over two tables
      [42, 100].forEach(function(x){
        glow(g, x, 36, 34, LIGHT, .32 * P.L);
        g.beginPath(); ln(g, x, 0, x, 22); g.stroke();
        g.beginPath(); g.moveTo(x - 10, 31); g.quadraticCurveTo(x - 9, 22, x, 22); g.quadraticCurveTo(x + 9, 22, x + 10, 31); g.closePath();
        g.fillStyle = rgba(P.ac, .25 + .3 * P.L); g.fill(); g.stroke();
        g.fillStyle = rgba(P.wc, .5 + .5 * P.L); g.fillRect(x - 2, 31, 4, 2);
        g.beginPath(); ln(g, x - 17, 68, x + 17, 68); ln(g, x, 68, x, 92); ln(g, x - 8, 93, x + 8, 93); g.stroke();
        g.beginPath(); // chairs
        ln(g, x - 29, 76, x - 21, 76); ln(g, x - 29, 76, x - 30, 58); ln(g, x - 29, 76, x - 29, 93); ln(g, x - 21, 76, x - 21, 93);
        ln(g, x + 21, 76, x + 29, 76); ln(g, x + 29, 76, x + 30, 58); ln(g, x + 29, 76, x + 29, 93); ln(g, x + 21, 76, x + 21, 93);
        g.stroke();
        g.beginPath(); g.moveTo(x - 10, 58); g.lineTo(x - 7, 63); g.lineTo(x - 4, 58); ln(g, x - 7, 63, x - 7, 68); g.stroke();
        g.beginPath(); g.ellipse(x + 7, 66.5, 6, 1.6, 0, Math.PI, TAU); g.stroke();
      });
    },
    function(g, P){ // barber: mirror, counter, barber chair
      g.beginPath(); rr(g, 18, 8, 52, 44, 6); g.fillStyle = rgba(P.wc, .06 + .08 * P.L); g.fill(); g.stroke();
      g.save(); g.globalAlpha *= .45; g.beginPath(); ln(g, 28, 46, 44, 16); ln(g, 35, 46, 49, 20); g.stroke(); g.restore();
      g.beginPath(); ln(g, 12, 58, 76, 58); g.stroke();
      g.fillStyle = rgba(P.ac, .5 + .3 * P.L); g.fillRect(22, 50, 4, 8); g.fillRect(29, 47, 4, 11); g.fillRect(36, 52, 6, 6);
      glow(g, 70, 20, 40, LIGHT, .22 * P.L);
      // chair (facing the mirror)
      g.beginPath();
      g.moveTo(52, 95); g.lineTo(56, 90); g.lineTo(70, 90); g.lineTo(74, 95); g.closePath();
      ln(g, 63, 90, 63, 80);
      g.stroke();
      g.beginPath(); rr(g, 46, 73, 34, 7, 2.5); g.fillStyle = rgba(P.ac, .35 + .25 * P.L); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(76, 74); g.lineTo(84, 42); g.lineTo(93, 42); g.lineTo(86, 76); g.closePath(); g.fillStyle = rgba(P.ac, .25 + .2 * P.L); g.fill(); g.stroke();
      g.beginPath(); rr(g, 84, 33, 11, 7, 2.5); g.stroke();
      g.beginPath(); ln(g, 48, 65, 74, 65); ln(g, 51, 65, 51, 73); g.stroke();
      g.beginPath(); g.moveTo(47, 80); g.lineTo(38, 88); g.lineTo(29, 88); g.stroke();
      // towels on a shelf, right
      g.beginPath(); ln(g, 104, 40, 134, 40); g.stroke();
      g.beginPath(); rr(g, 107, 30, 10, 10, 2); rr(g, 120, 32, 10, 8, 2); g.stroke();
    },
    function(g, P){ // nail salon: manicure table with lamp, polish rack
      g.beginPath(); ln(g, 16, 64, 92, 64); ln(g, 22, 64, 22, 95); ln(g, 86, 64, 86, 95); g.stroke();
      g.beginPath(); rr(g, 36, 64, 30, 8, 1); g.stroke();
      g.beginPath(); g.moveTo(44, 64); g.quadraticCurveTo(52, 55, 60, 64); g.fillStyle = rgba(P.ac, .4 + .3 * P.L); g.fill(); g.stroke();
      // lamp
      glow(g, 56, 56, 22, LIGHT, .5 * P.L);
      g.beginPath(); ln(g, 80, 64, 90, 64); g.moveTo(85, 64); g.lineTo(78, 40); g.lineTo(66, 34); g.stroke();
      g.beginPath(); g.moveTo(58, 33); g.lineTo(69, 29); g.lineTo(72, 37); g.lineTo(62, 41); g.closePath(); g.fillStyle = rgba(P.ac, .4); g.fill(); g.stroke();
      // polish rack
      g.beginPath(); g.rect(102, 8, 32, 58); ln(g, 102, 23, 134, 23); ln(g, 102, 38, 134, 38); ln(g, 102, 53, 134, 53); g.stroke();
      for(var r = 0; r < 4; r++){
        for(var k = 0; k < 4; k++){
          var bx = 105 + k * 7.5, by = [23, 38, 53, 66][r];
          g.fillStyle = (r + k) % 2 ? rgba(P.ac, .55 + .4 * P.L) : rgba(P.wc, .45 + .4 * P.L);
          g.fillRect(bx, by - 7, 4.5, 5.5); g.fillRect(bx + 1.2, by - 10, 2.1, 3);
        }
      }
      // stool
      g.beginPath(); rr(g, 2, 72, 12, 4, 2); ln(g, 8, 76, 8, 95); ln(g, 3, 95, 13, 95); g.stroke();
    },
    function(g, P){ // gym: bench, dumbbell rack, kettlebell
      g.beginPath(); rr(g, 10, 62, 48, 7, 2.5); g.fillStyle = rgba(P.ac, .35 + .25 * P.L); g.fill(); g.stroke();
      g.beginPath(); ln(g, 18, 69, 15, 95); ln(g, 50, 69, 53, 95); ln(g, 10, 95, 22, 95); ln(g, 46, 95, 58, 95); g.stroke();
      g.beginPath(); ln(g, 74, 95, 79, 50); ln(g, 136, 95, 131, 50); ln(g, 77, 66, 133, 62); ln(g, 75.5, 82, 134.5, 78); g.stroke();
      [[66, 4], [82, 4]].forEach(function(t, ti){
        for(var i = 0; i < t[1]; i++){
          var x = 86 + i * 12.5, y = t[0] - (x - 77) / 56 * 4;
          g.fillStyle = rgba(P.ac, .5 + .4 * P.L);
          g.fillRect(x - 5, y - 8, 3, 8); g.fillRect(x + 2, y - 8, 3, 8);
          g.beginPath(); ln(g, x - 2, y - 4, x + 2, y - 4); g.stroke();
        }
      });
      g.beginPath(); g.arc(66, 89, 6, 0, TAU); g.moveTo(62, 84); g.quadraticCurveTo(66, 76, 70, 84); g.stroke();
      glow(g, 70, 20, 50, LIGHT, .2 * P.L);
      g.beginPath(); ln(g, 14, 22, 56, 22); ln(g, 22, 22, 22, 26); ln(g, 46, 22, 46, 26); g.stroke();
      [22, 46].forEach(function(x, i){ var r = i ? 7.5 : 9.5; g.beginPath(); g.arc(x, 26 + r, r, 0, TAU); g.moveTo(x + 2.2, 26 + r); g.arc(x, 26 + r, 2.2, 0, TAU); g.stroke(); });
    },
    function(g, P){ // bakery · café: counter, cake stand with dome, cup with steam, menu board
      g.beginPath(); g.rect(10, 63, 120, 33); ln(g, 5, 63, 135, 63); g.stroke();
      g.save(); g.globalAlpha *= .4; g.beginPath(); for(var x = 20; x < 130; x += 10) ln(g, x, 67, x, 92); g.stroke(); g.restore();
      glow(g, 40, 40, 30, LIGHT, .3 * P.L);
      g.beginPath(); ln(g, 25, 47, 55, 47); ln(g, 40, 47, 40, 63); ln(g, 34, 63, 46, 63); g.stroke();
      g.beginPath(); g.moveTo(31, 47); g.lineTo(31, 38); for(var i = 0; i <= 6; i++) g.lineTo(31 + i * 3, 38 + (i % 2 ? 2 : 0)); g.lineTo(49, 47); g.closePath();
      g.fillStyle = rgba(P.ac, .4 + .35 * P.L); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(40, 47, 15, 19, 0, Math.PI, TAU); g.stroke();
      g.beginPath(); g.arc(40, 27.5, 1.6, 0, TAU); g.stroke();
      // cup + saucer + steam
      g.beginPath(); g.moveTo(86, 49); g.lineTo(87.5, 60); g.lineTo(99.5, 60); g.lineTo(101, 49); g.closePath(); g.fillStyle = rgba(P.wc, .12 + .2 * P.L); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(101, 51.5); g.quadraticCurveTo(106, 52, 105, 55.5); g.quadraticCurveTo(104, 58, 100, 58); g.stroke();
      g.beginPath(); ln(g, 82, 61.5, 105, 61.5); g.stroke();
      g.save(); g.globalAlpha *= .35 + .6 * P.L; g.beginPath();
      for(var s2 = 0; s2 < 2; s2++){
        var sx = 91 + s2 * 6, ph = P.t * 3 + s2 * 2;
        g.moveTo(sx, 46);
        for(var yy = 1; yy <= 12; yy++) g.lineTo(sx + Math.sin(ph + yy * .5) * 1.6, 46 - yy * 1.2);
      }
      g.stroke(); g.restore();
      g.beginPath(); g.rect(68, 6, 58, 28); g.stroke();
      g.fillStyle = rgba(P.wc, .3 + .3 * P.L); g.fillRect(74, 12, 26, 2); g.fillRect(74, 18, 38, 1.5); g.fillRect(74, 23, 32, 1.5); g.fillRect(74, 28, 22, 1.5);
    },
    function(g, P){ // auto repair: car on a two-post lift
      g.beginPath(); g.rect(4, 8, 6, 88); g.rect(130, 8, 6, 88); ln(g, 0, 96.5, 14, 96.5); ln(g, 126, 96.5, 140, 96.5); g.stroke();
      glow(g, 70, 26, 60, LIGHT, .22 * P.L);
      var ly = 52;
      g.beginPath(); ln(g, 10, ly + 6, 36, ly + 6); ln(g, 130, ly + 6, 104, ly + 6); g.stroke();
      g.beginPath(); rr(g, 18, ly - 12, 104, 15, 6); g.fillStyle = rgba(P.ac, .3 + .25 * P.L); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(38, ly - 12); g.lineTo(52, ly - 27); g.lineTo(86, ly - 27); g.lineTo(102, ly - 12); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(43, ly - 13); g.lineTo(54, ly - 24.5); g.lineTo(68, ly - 24.5); g.lineTo(68, ly - 13); g.closePath();
      g.moveTo(71, ly - 13); g.lineTo(71, ly - 24.5); g.lineTo(84, ly - 24.5); g.lineTo(96, ly - 13); g.closePath();
      g.fillStyle = rgba(P.wc, .1 + .2 * P.L); g.fill(); g.stroke();
      [40, 100].forEach(function(x){ g.beginPath(); g.arc(x, ly + 4, 8.5, 0, TAU); g.fillStyle = '#0D1513'; g.fill(); g.stroke(); g.beginPath(); g.arc(x, ly + 4, 3, 0, TAU); g.stroke(); });
      g.save(); g.globalAlpha *= .4; g.beginPath(); ln(g, 0, 96.5, 140, 96.5); g.stroke(); g.restore();
    },
    function(g, P){ // studio: mirror wall with barre, mats
      g.beginPath(); g.rect(6, 6, 128, 60); ln(g, 48.5, 6, 48.5, 66); ln(g, 91.5, 6, 91.5, 66); g.fillStyle = rgba(P.wc, .05 + .08 * P.L); g.fill(); g.stroke();
      g.save(); g.globalAlpha *= .4; g.beginPath(); ln(g, 16, 58, 36, 14); ln(g, 24, 58, 42, 20); ln(g, 64, 58, 82, 18); ln(g, 106, 58, 124, 18); g.stroke(); g.restore();
      glow(g, 70, 34, 64, LIGHT, .22 * P.L);
      g.save(); g.lineWidth *= 1.6; g.beginPath(); ln(g, 4, 52, 136, 52); g.stroke(); g.restore();
      g.beginPath(); ln(g, 18, 52, 18, 60); ln(g, 122, 52, 122, 60); g.stroke();
      g.beginPath(); g.moveTo(16, 88); g.lineTo(74, 88); g.lineTo(82, 96); g.lineTo(8, 96); g.closePath(); g.fillStyle = rgba(P.ac, .35 + .25 * P.L); g.fill(); g.stroke();
      g.beginPath(); rr(g, 98, 86, 30, 10, 5); g.fillStyle = rgba(P.ac, .25 + .2 * P.L); g.fill(); g.stroke();
      g.beginPath(); g.arc(103, 91, 2.2, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(92, 66); g.lineTo(92, 74); g.stroke();
    }
  ];

  /* ------------------------------------------------------------ blade-sign icons (16px box) */
  function icon(g, k){
    g.beginPath();
    if(k === 0){ ln(g, -4, -7, -4, 7); ln(g, -6.5, -7, -6.5, -2.5); ln(g, -1.5, -7, -1.5, -2.5); g.moveTo(-6.5, -2.5); g.quadraticCurveTo(-4, 0, -1.5, -2.5);
      g.moveTo(4, 7); g.lineTo(4, -7); g.quadraticCurveTo(7.5, -4, 6.5, 0); g.lineTo(4, 0); }
    else if(k === 1){ g.moveTo(-1.5, 4); g.arc(-4, 4, 2.5, 0, TAU); g.moveTo(6.5, 4); g.arc(4, 4, 2.5, 0, TAU); ln(g, -2.6, 2, 4.5, -7.5); ln(g, 2.6, 2, -4.5, -7.5); }
    else if(k === 2){ rr(g, -4.5, -1, 9, 8.5, 2); g.rect(-1.5, -3.5, 3, 2.5); rr(g, -2.5, -8.5, 5, 5, 1); }
    else if(k === 3){ ln(g, -3, 0, 3, 0); g.rect(-6.5, -4.5, 3.5, 9); g.rect(3, -4.5, 3.5, 9); ln(g, -8, -2, -8, 2); ln(g, 8, -2, 8, 2); }
    else if(k === 4){ g.moveTo(-5.5, -2); g.lineTo(-4.5, 6); g.lineTo(3.5, 6); g.lineTo(4.5, -2); g.closePath(); g.moveTo(4.5, 0); g.quadraticCurveTo(8, 0, 7, 3); g.quadraticCurveTo(6, 4.5, 4, 4);
      g.moveTo(-2, -4); g.quadraticCurveTo(-3, -6, -1.5, -8); g.moveTo(1.5, -4); g.quadraticCurveTo(.5, -6, 2, -8); }
    else if(k === 5){ g.moveTo(-6, 6.5); g.lineTo(1, -.5); g.moveTo(-4.5, 7.5); g.lineTo(2, 1); g.moveTo(1, -.5); g.arc(4, -3.5, 3.6, Math.PI * .75, Math.PI * 1.95, false); g.moveTo(2, 1); g.arc(4, -3.5, 4.9, Math.PI * .6, Math.PI * 2.05, true); }
    else { g.moveTo(1.8, -6.2); g.arc(0, -6.2, 1.8, 0, TAU); ln(g, 0, -4, 0, 2); ln(g, 0, -2, -5, -6); ln(g, 0, -2, 5, -6); ln(g, 0, 2, -4, 7.5); ln(g, 0, 2, 4, 7.5); }
    g.stroke();
  }

  return {
    label: ['04', 'OPEN'],
    init: function(c){
      var w = c.w, h = c.h, dpr = c.dpr;
      var G = h - 20, s = Math.min(w / 400, (G - 38) / 176, 1.15);
      var S = c.st = { s:s, G:G, cx:Math.round(w / 2) };
      var FW = Math.round(236 * s), fx0 = Math.round(S.cx - FW / 2), fx1 = fx0 + FW, FT = Math.round(G - 176 * s);
      S.FW = FW; S.fx0 = fx0; S.fx1 = fx1; S.FT = FT;
      S.band = { x:fx0 + Math.round(16 * s), y:FT + Math.round(9 * s), w:FW - Math.round(32 * s), h:Math.round(19 * s) };
      S.AT = FT + Math.round(35 * s);                                 // awning attaches here
      S.OT = FT + Math.round(42 * s);                                 // top of the shop opening (behind the awning)
      S.ox0 = fx0 + Math.round(12 * s); S.ox1 = fx1 - Math.round(12 * s);
      var DW = Math.round(36 * s);
      S.door = { x0:S.ox1 - Math.round(5 * s) - DW, x1:S.ox1 - Math.round(5 * s), y0:S.OT + Math.round(20 * s) };
      S.win = { x0:S.ox0 + Math.round(6 * s), x1:S.door.x0 - Math.round(8 * s), y0:S.OT + Math.round(9 * s), y1:G - Math.round(26 * s) };
      // wall textures (brick, boards, grooves, ribbed metal), cached, with the shop opening cut out
      S.walls = [0, 1, 2, 3].map(function(k){
        var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
        var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.beginPath(); g.rect(fx0, FT, FW, G - FT); g.rect(S.ox1, S.OT, S.ox0 - S.ox1, G - S.OT); g.clip('evenodd');
        g.strokeStyle = rgba(PAPER, .06); g.lineWidth = 1; g.beginPath();
        var yy, xx, row = 0;
        if(k === 0){ for(yy = FT + 3; yy < G; yy += 5 * s, row++){ g.moveTo(fx0, Math.round(yy) + .5); g.lineTo(fx1, Math.round(yy) + .5); for(xx = fx0 + (row % 2) * 6 * s; xx < fx1; xx += 12 * s){ g.moveTo(Math.round(xx) + .5, yy); g.lineTo(Math.round(xx) + .5, yy + 5 * s); } } }
        else if(k === 1){ for(xx = fx0 + 6 * s; xx < fx1; xx += 7 * s){ g.moveTo(Math.round(xx) + .5, FT); g.lineTo(Math.round(xx) + .5, G); } }
        else if(k === 2){ for(yy = FT + 8 * s; yy < G; yy += 16 * s){ g.moveTo(fx0, Math.round(yy) + .5); g.lineTo(fx1, Math.round(yy) + .5); } }
        else { for(xx = fx0 + 2; xx < fx1; xx += 3.5 * s){ g.moveTo(Math.round(xx) + .5, FT); g.lineTo(Math.round(xx) + .5, G); } }
        g.stroke(); return cv;
      });
      // street: neighbours, sidewalk, paving — cached
      var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
      var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.lineWidth = 1; g.strokeStyle = rgba(PAPER, .09);
      var nb = [[-20, fx0 - 6, FT + 16 * s], [fx1 + 6, w + 20, FT + 28 * s]];
      nb.forEach(function(n, i){
        var x0 = Math.round(n[0]) + .5, x1 = Math.round(n[1]) - .5, top = Math.round(n[2]) + .5;
        g.fillStyle = 'rgba(232,237,234,.018)'; g.fillRect(x0, top, x1 - x0, G - top);
        g.beginPath(); g.moveTo(x0, top); g.lineTo(x1, top); g.moveTo(i ? x0 : x1, top); g.lineTo(i ? x0 : x1, G); g.stroke();
        var sx0 = i ? x0 + 12 * s : x0 + 14 * s, sx1 = i ? x1 - 14 * s : x1 - 12 * s, st = Math.round(G - 70 * s) + .5;
        g.beginPath(); g.rect(Math.round(sx0) + .5, st, Math.round(sx1 - sx0), G - st); g.stroke();
        g.save(); g.strokeStyle = rgba(PAPER, .045); g.beginPath(); for(var y = st + 4; y < G; y += 4 * s) { g.moveTo(sx0, Math.round(y) + .5); g.lineTo(sx1, Math.round(y) + .5); } g.stroke(); g.restore();
        for(var k = 0; k < 3; k++){ var wx = sx0 + 6 * s + k * 22 * s; if(wx + 14 * s > sx1) break; g.strokeRect(Math.round(wx) + .5, Math.round(top + 14 * s) + .5, Math.round(14 * s), Math.round(20 * s)); }
      });
      g.strokeStyle = rgba(PAPER, .2); g.beginPath(); g.moveTo(0, G + .5); g.lineTo(w, G + .5); g.stroke();
      g.strokeStyle = rgba(PAPER, .1); g.beginPath(); g.moveTo(0, h - 9.5); g.lineTo(w, h - 9.5); g.stroke();
      g.strokeStyle = rgba(PAPER, .05); g.beginPath();
      for(var x = -40; x < w + 40; x += 34 * s){ var bx = x + (x - S.cx) * .18; g.moveTo(Math.round(x) + .5, G + 1); g.lineTo(Math.round(bx) + .5, h - 10); }
      g.stroke();
      g.globalCompositeOperation = 'destination-out';
      var gr = g.createLinearGradient(0, 0, 0, FT + 40 * s); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, FT + 40 * s);
      gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(.18, 'rgba(0,0,0,0)'); gr.addColorStop(.82, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      S.street = cv;
    },
    draw: function(c, dt){
      var ctx = c.ctx, w = c.w, h = c.h, S = c.st; if(!S) return;
      var red = c.reduced, t = red ? 1 : c.t, s = S.s, G = S.G, i;
      var bi = Math.floor(t / B), u = t - bi * B, cur = ((bi % 7) + 7) % 7, nxt = (cur + 1) % 7;
      var mk = red ? 0 : sstep(HOLD, B, u), BZ = BIZ[cur], BN = BIZ[nxt];
      var L = 1, TW = .9, wc = mix(COOL, WARM, TW); curTW = TW;
      // neon: steady; one soft dip-and-return just after a new trade settles in
      var nd = red ? 0 : clamp((u - .25) / .5, 0, 1), neonSoft = 1 - .4 * Math.pow(Math.sin(Math.PI * nd), 2);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(S.street, 0, 0, w, h);
      var fx0 = S.fx0, fx1 = S.fx1, FT = S.FT, OT = S.OT, ox0 = S.ox0, ox1 = S.ox1, W = S.win, D = S.door;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';

      // ---- light spilling onto the sidewalk + the street glow of an open shop
      glow(ctx, (ox0 + ox1) / 2, G - 30 * s, 130 * s, LIGHT, .09);
      var gr = ctx.createLinearGradient(0, G, 0, h - 9);
      gr.addColorStop(0, rgba(wc, .2)); gr.addColorStop(1, rgba(wc, .02));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(W.x0, G + 1); ctx.lineTo(W.x1, G + 1); ctx.lineTo(W.x1 + 18 * s, h - 9); ctx.lineTo(W.x0 - 18 * s, h - 9); ctx.closePath(); ctx.fill();

      // ---- facade body + wall texture (cross-fades during the morph)
      ctx.fillStyle = '#0E1715'; ctx.fillRect(fx0, FT, fx1 - fx0, G - FT);
      ctx.fillStyle = rgba(JADE, .1); ctx.fillRect(fx0, FT, fx1 - fx0, G - FT);
      if(1 - mk > .01){ ctx.globalAlpha = 1 - mk; ctx.drawImage(S.walls[BZ.wall], 0, 0, w, h); }
      if(mk > .01){ ctx.globalAlpha = mk; ctx.drawImage(S.walls[BN.wall], 0, 0, w, h); }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = rgba(PAPER, .26); ctx.lineWidth = 1;
      ctx.strokeRect(fx0 + .5, FT + .5, fx1 - fx0 - 1, G - FT);
      ctx.fillStyle = '#121C19'; ctx.fillRect(fx0 - 4, FT - 3, fx1 - fx0 + 8, 4);
      ctx.strokeStyle = rgba(PAPER, .32); ctx.strokeRect(fx0 - 3.5, FT - 3.5, fx1 - fx0 + 7, 4);

      // ---- interior: the shop is always open; each trade's window (or garage bay) dissolves into the next
      ctx.fillStyle = '#0B1311'; ctx.fillRect(ox0, OT, ox1 - ox0, G - OT);
      function room(k, a, neonA, ad){
        if(a <= .005) return;
        var BI = BIZ[k], gar = BI.gar ? 1 : 0;
        var wy1 = gar ? G : W.y1, wx1 = W.x1, wy0 = gar ? OT + 6 * s : W.y0, bw = wx1 - W.x0, bh = wy1 - wy0;
        ctx.save(); ctx.globalAlpha = a;
        if(!gar){ // bulkhead panel under the window
          ctx.fillStyle = '#0E1715'; ctx.fillRect(ox0, W.y1, D.x0 - ox0 - 3 * s, G - W.y1);
          ctx.fillStyle = rgba(JADE, .1); ctx.fillRect(ox0, W.y1, D.x0 - ox0 - 3 * s, G - W.y1);
        }
        var gw = ctx.createLinearGradient(0, wy0, 0, wy1);
        gw.addColorStop(0, rgba(wc, .17)); gw.addColorStop(1, rgba(wc, .05));
        ctx.fillStyle = 'rgba(13,107,84,.12)'; ctx.fillRect(W.x0, wy0, bw, bh);
        ctx.fillStyle = gw; ctx.fillRect(W.x0, wy0, bw, bh);
        var us = Math.min(bw / 140, bh / 100);
        ctx.save(); ctx.beginPath(); ctx.rect(W.x0, wy0, bw, bh); ctx.clip(); ctx.globalAlpha = ad;
        ctx.translate(W.x0 + (bw - 140 * us) / 2, wy1 - 100 * us - (gar ? 0 : 1)); ctx.scale(us, us);
        ctx.lineWidth = 1.15 / us; ctx.strokeStyle = rgba(mix(COOL, WARM, TW * .8), .95);
        DISP[k](ctx, { L:L, t:red ? 0 : c.t, wc:wc, ac:MINT });
        ctx.restore();
        // glass sheen
        ctx.save(); ctx.beginPath(); ctx.rect(W.x0, wy0, bw, bh); ctx.clip();
        ctx.strokeStyle = rgba(PAPER, .07); ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.moveTo(W.x0 + bw * .55, wy0 - 4); ctx.lineTo(W.x0 + bw * .3, wy1 + 4); ctx.stroke();
        ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(W.x0 + bw * .68, wy0 - 4); ctx.lineTo(W.x0 + bw * .43, wy1 + 4); ctx.stroke();
        ctx.restore();
        ctx.lineWidth = 1; ctx.strokeStyle = rgba(PAPER, .5);
        ctx.strokeRect(Math.round(W.x0) + .5, Math.round(wy0) + .5, Math.round(bw) - 1, Math.round(bh) - (gar ? 0 : 1));
        if(!gar){
          ctx.strokeStyle = rgba(PAPER, .3); ctx.beginPath(); ctx.moveTo(ox0, Math.round(W.y1 + 4 * s) + .5); ctx.lineTo(D.x0 - 3 * s, Math.round(W.y1 + 4 * s) + .5);
          ctx.rect(Math.round(W.x0 + 6 * s) + .5, Math.round(W.y1 + 8 * s) + .5, Math.round(bw - 12 * s), Math.round(G - W.y1 - 12 * s)); ctx.stroke();
        } else { // the roll-up garage door, parked up in its housing
          ctx.fillStyle = '#18221F'; ctx.fillRect(W.x0, wy0, bw, 10 * s);
          ctx.strokeStyle = rgba(PAPER, .22); ctx.beginPath();
          for(var gy = wy0 + 3 * s; gy < wy0 + 10 * s; gy += 3 * s){ ctx.moveTo(W.x0, Math.round(gy) + .5); ctx.lineTo(wx1, Math.round(gy) + .5); }
          ctx.stroke();
        }
        // neon OPEN
        var nw = Math.round(32 * s), nh = Math.round(13 * s), nx = Math.round(wx1 - nw - 6 * s), ny = Math.round(gar ? wy0 + 18 * s : W.y1 - nh - 7 * s);
        ctx.globalAlpha = ad;
        glow(ctx, nx + nw / 2, ny + nh / 2, 30 * s, MINT, .42 * neonA);
        ctx.fillStyle = 'rgba(8,13,12,.7)'; ctx.beginPath(); rr(ctx, nx, ny, nw, nh, 4 * s); ctx.fill();
        ctx.strokeStyle = rgba(MINT, .35 + .6 * neonA); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.font = '800 ' + (7.6 * s).toFixed(1) + 'px ' + FAM; try{ ctx.letterSpacing = (1.2 * s).toFixed(1) + 'px'; }catch(e){}
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = rgba('236,255,247', .45 + .55 * neonA); ctx.fillText('OPEN', nx + nw / 2 + .6 * s, ny + nh / 2 + .5);
        try{ ctx.letterSpacing = '0px'; }catch(e){}
        ctx.restore();
      }
      // glass + frames cross-fade linearly; the displays hand over with less overlap so they never read as a jumble
      room(cur, 1 - mk, neonSoft, 1 - sstep(.1, .75, mk));
      room(nxt, mk, 1, sstep(.25, .9, mk));
      // the door (closed, lit glass) + transom
      var dw = D.x1 - D.x0, dh = G - D.y0;
      ctx.fillStyle = rgba(wc, .2); ctx.fillRect(D.x0, OT + 8 * s, dw, D.y0 - OT - 12 * s);
      ctx.strokeStyle = rgba(PAPER, .4); ctx.lineWidth = 1; ctx.strokeRect(D.x0 + .5, Math.round(OT + 8 * s) + .5, dw - 1, Math.round(D.y0 - OT - 12 * s));
      ctx.fillStyle = '#101A17'; ctx.fillRect(D.x0, D.y0, dw, dh);
      var gd = ctx.createLinearGradient(0, D.y0, 0, D.y0 + dh * .6); gd.addColorStop(0, rgba(wc, .2)); gd.addColorStop(1, rgba(wc, .07));
      ctx.fillStyle = rgba(JADE, .3); ctx.fillRect(D.x0 + 4 * s, D.y0 + 5 * s, dw - 8 * s, dh * .55);
      ctx.fillStyle = gd; ctx.fillRect(D.x0 + 4 * s, D.y0 + 5 * s, dw - 8 * s, dh * .55);
      ctx.strokeStyle = rgba(PAPER, .35); ctx.strokeRect(Math.round(D.x0 + 4 * s) + .5, Math.round(D.y0 + 5 * s) + .5, Math.round(dw - 8 * s) - 1, Math.round(dh * .55) - 1);
      ctx.fillStyle = rgba(PAPER, .8); ctx.fillRect(Math.round(D.x0 + 4 * s), Math.round(D.y0 + dh * .62), 2, Math.round(6 * s));
      ctx.strokeStyle = rgba(PAPER, .55); ctx.strokeRect(D.x0 + .5, D.y0 + .5, dw - 1, dh);

      // ---- awning (shape, stripes and valance morph between trades)
      var A = {}, ka;
      for(ka in BZ.aw) A[ka] = lerp(BZ.aw[ka], BN.aw[ka], mk);
      var ax0 = ox0 - 7 * s, ax1 = ox1 + 7 * s, AT = S.AT, ins = A.d * .32 * s, AF = AT + A.d * s, VB = AF + A.vh * s, aw = ax1 - ax0;
      function topY(x){ var q = (x - (ax0 + ax1) / 2) / (aw / 2); return AT - A.cu * s * (1 - q * q); }
      function scal(x, n, d){ if(n < .5 || d <= 0) return 0; var f = ((x - ax0) / aw * Math.round(n)) % 1; return Math.sin(Math.PI * f) * d * s; }
      function botY(x){ return VB + (1 - mk) * scal(x, BZ.aw.sc, BZ.aw.sd) + mk * scal(x, BN.aw.sc, BN.aw.sd); }
      var N = 48, px, py;
      function awPath(){
        ctx.beginPath();
        for(i = 0; i <= N; i++){ px = lerp(ax0 + ins, ax1 - ins, i / N); py = A.cu > .3 ? topY(px) : AT; if(i) ctx.lineTo(px, py); else ctx.moveTo(px, py); if(A.cu <= .3 && i === 0){ i = N - 1; } }
        ctx.lineTo(ax1, AF); ctx.lineTo(ax1, VB);
        for(i = N; i >= 0; i--){ px = lerp(ax0, ax1, i / N); ctx.lineTo(px, botY(px)); }
        ctx.lineTo(ax0, AF); ctx.closePath();
      }
      awPath();
      ctx.fillStyle = '#15241F'; ctx.fill(); ctx.fillStyle = rgba(JADE, .42); ctx.fill();
      ctx.save(); ctx.clip();
      [[BZ.aw.st, 1 - mk], [BN.aw.st, mk]].forEach(function(p){
        if(!p[0] || p[1] < .01) return;
        var n = p[0];
        ctx.fillStyle = rgba(MINT, .23 * p[1]); ctx.beginPath();
        for(var k2 = 0; k2 < n; k2 += 2){
          var t0 = k2 / n, t1 = (k2 + 1) / n;
          ctx.moveTo(lerp(ax0 + ins, ax1 - ins, t0), AT - A.cu * s - 2); ctx.lineTo(lerp(ax0 + ins, ax1 - ins, t1), AT - A.cu * s - 2);
          ctx.lineTo(lerp(ax0, ax1, t1), AF); ctx.lineTo(lerp(ax0, ax1, t1), VB + 8 * s); ctx.lineTo(lerp(ax0, ax1, t0), VB + 8 * s); ctx.lineTo(lerp(ax0, ax1, t0), AF); ctx.closePath();
        }
        ctx.fill();
      });
      var shade = ctx.createLinearGradient(0, AT - A.cu * s, 0, AF);
      shade.addColorStop(0, 'rgba(232,237,234,.05)'); shade.addColorStop(1, 'rgba(0,0,0,.12)');
      ctx.fillStyle = shade; ctx.fillRect(ax0, AT - A.cu * s - 2, aw, AF - AT + A.cu * s + 2);
      if(A.sl > .02){ ctx.fillStyle = rgba(MINT, .55 * A.sl); ctx.fillRect(ax0, Math.round(VB - 2.5 * s), aw, Math.max(1, Math.round(1.2 * s))); }
      ctx.restore();
      awPath(); ctx.strokeStyle = rgba(PAPER, .5); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = rgba(PAPER, .28); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax0, Math.round(AF) + .5); ctx.lineTo(ax1, Math.round(AF) + .5); ctx.stroke();

      // ---- fascia sign with the trade's name (soft cross-dissolve on change)
      var Bd = S.band;
      ctx.fillStyle = '#0C1412'; ctx.fillRect(Bd.x, Bd.y, Bd.w, Bd.h);
      glow(ctx, Bd.x + Bd.w / 2, Bd.y + Bd.h / 2, Bd.w * .45, MINT, .12);
      ctx.strokeStyle = rgba(PAPER, .55); ctx.strokeRect(Bd.x + .5, Bd.y + .5, Bd.w - 1, Bd.h - 1);
      ctx.save(); ctx.beginPath(); ctx.rect(Bd.x + 1, Bd.y + 1, Bd.w - 2, Bd.h - 2); ctx.clip();
      var fsz = Math.max(8.5, Math.min(10.5, 10.5 * s));
      ctx.font = '500 ' + fsz.toFixed(1) + 'px ' + MONO; try{ ctx.letterSpacing = (2.2 * s).toFixed(1) + 'px'; }catch(e){}
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var cyb = Bd.y + Bd.h / 2 + .5, dy = 3 * s, tx = Bd.x + Bd.w / 2 + 1;
      ctx.fillStyle = rgba('238,250,245', .95);
      if(mk > 0 && mk < 1){
        ctx.globalAlpha = 1 - sstep(0, .45, mk); ctx.fillText(BZ.name, tx, cyb - dy * sstep(0, .45, mk));
        ctx.globalAlpha = sstep(.55, 1, mk); ctx.fillText(BN.name, tx, cyb + dy * (1 - sstep(.55, 1, mk)));
        ctx.globalAlpha = 1;
      } else ctx.fillText(mk >= 1 ? BN.name : BZ.name, tx, cyb);
      try{ ctx.letterSpacing = '0px'; }catch(e){}
      ctx.restore();
      // two small square lamps lighting the sign
      [Bd.x + Bd.w * .2, Bd.x + Bd.w * .8].forEach(function(lx){
        ctx.fillStyle = rgba(PAPER, .9); ctx.fillRect(Math.round(lx) - 2, Bd.y - Math.round(5 * s), 4, 2);
        var lg = ctx.createLinearGradient(0, Bd.y - 3 * s, 0, Bd.y + Bd.h);
        lg.addColorStop(0, rgba(PAPER, .12)); lg.addColorStop(1, rgba(PAPER, 0));
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(lx - 2, Bd.y - 3 * s); ctx.lineTo(lx + 2, Bd.y - 3 * s); ctx.lineTo(lx + 22 * s, Bd.y + Bd.h); ctx.lineTo(lx - 22 * s, Bd.y + Bd.h); ctx.closePath(); ctx.fill();
      });

      // ---- barber pole beside the door (slow turn)
      var pw = (BZ.pole ? 1 - mk : 0) + (BN.pole ? mk : 0);
      if(pw > .01){
        var pxl = ox1 + 6 * s, pW = Math.round(7 * s), pT = Math.round(OT + 34 * s), pH = Math.round(36 * s);
        ctx.save(); ctx.globalAlpha = pw;
        glow(ctx, pxl + pW / 2, pT + pH / 2, 26 * s, MINT, .25);
        ctx.beginPath(); ctx.rect(pxl, pT, pW, pH); ctx.save(); ctx.clip();
        ctx.fillStyle = rgba(PAPER, .85); ctx.fillRect(pxl, pT, pW, pH);
        ctx.fillStyle = rgba(JB, 1); var off = ((red ? 0 : c.t) * 5 * s) % (9 * s);
        ctx.beginPath(); for(var yy4 = pT - 12 * s + off; yy4 < pT + pH + 12 * s; yy4 += 9 * s){ ctx.moveTo(pxl, yy4); ctx.lineTo(pxl + pW, yy4 - 6 * s); ctx.lineTo(pxl + pW, yy4 - 2.5 * s); ctx.lineTo(pxl, yy4 + 3.5 * s); ctx.closePath(); }
        ctx.fill(); ctx.restore();
        ctx.strokeStyle = rgba(PAPER, .7); ctx.lineWidth = 1; ctx.strokeRect(pxl + .5, pT + .5, pW - 1, pH - 1);
        ctx.fillStyle = '#24302C'; ctx.beginPath(); rr(ctx, pxl - 1.5, pT - 4 * s, pW + 3, 4 * s, 2); rr(ctx, pxl - 1.5, pT + pH, pW + 3, 4 * s, 2); ctx.fill();
        ctx.strokeStyle = rgba(PAPER, .6); ctx.stroke();
        ctx.restore();
      }

      // ---- blade sign: turns to the next trade's icon during the morph, then settles with a small sway
      var brY = Math.round(OT + 2 * s) + .5, brX0 = fx0, brX1 = fx0 - 32 * s, pvX = fx0 - 20 * s, sz = Math.round(26 * s);
      ctx.strokeStyle = rgba(PAPER, .5); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(brX0, brY); ctx.lineTo(brX1, brY); ctx.moveTo(brX0, brY + 7 * s); ctx.lineTo(brX0 - 9 * s, brY); ctx.stroke();
      var sw2 = red ? .02 : .07 * Math.exp(-u * 1.7) * Math.sin(u * 5) + .015 * Math.sin(c.t * 1.1);
      var flip = Math.cos(Math.PI * mk), iconK = mk < .5 ? BZ.icon : BN.icon;
      ctx.save(); ctx.translate(pvX, brY); ctx.rotate(sw2);
      ctx.strokeStyle = rgba(PAPER, .45); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-sz * .32 * Math.abs(flip), 0); ctx.lineTo(-sz * .32 * Math.abs(flip), 5 * s); ctx.moveTo(sz * .32 * Math.abs(flip), 0); ctx.lineTo(sz * .32 * Math.abs(flip), 5 * s); ctx.stroke();
      ctx.translate(0, 5 * s + sz / 2); ctx.scale(Math.max(.04, Math.abs(flip)), 1);
      glow(ctx, 0, 0, sz * 1.1, MINT, .18);
      ctx.beginPath(); rr(ctx, -sz / 2, -sz / 2, sz, sz, 3 * s); ctx.fillStyle = '#0F1A17'; ctx.fill();
      ctx.strokeStyle = rgba(MINT, .9); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.scale(s * .95, s * .95); ctx.lineWidth = 1.3 / s; ctx.strokeStyle = rgba(PAPER, 1);
      icon(ctx, iconK);
      ctx.restore();
    }
  };
})());
/* Concept 6 · Productivity — Who we help
   Four dark product cards on a light ground, each with its own live canvas:
   launch curve · daily order bars + moving average · referral network · local radar.
   One rAF loop for the section; each card only draws while on screen; hover/focus speeds a card up.
   Reduced motion: one meaningful static frame per card, no loop. */
NVV.reg('who', 6, function(root){
  var sec = root;
  var win = window, doc = document, reduced = !!NVV.reduced, TAU = Math.PI * 2;
  var MINT = '139,224,192', JB = '61,170,136', PAPER = '232,237,234';
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function sstep(a, b, x){ var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function hash(n){ var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  var NZ = new Float32Array(256); for(var q = 0; q < 256; q++) NZ[q] = hash(q + 7) * 2 - 1;
  function vn(x){ var i = Math.floor(x), f = x - i, a = NZ[i & 255], b = NZ[(i + 1) & 255], u = f * f * (3 - 2 * f); return a + (b - a) * u; }
  function rgba(c, a){ return 'rgba(' + c + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; }
  function mono(ctx, txt, x, y, align, col){
    ctx.font = '500 9.5px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
    try{ ctx.letterSpacing = '1.3px'; }catch(e){}
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(txt, x, y);
    try{ ctx.letterSpacing = '0px'; }catch(e){}
  }
  function glowDot(ctx, x, y, r, a){
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(MINT, .55 * a)); g.addColorStop(.35, rgba(JB, .22 * a)); g.addColorStop(1, rgba(JB, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function sq(ctx, x, y, s, col){ ctx.fillStyle = col; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
  function dashH(ctx, x0, x1, y, col){ ctx.save(); ctx.setLineDash([2, 4]); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y + .5); ctx.lineTo(x1, y + .5); ctx.stroke(); ctx.restore(); }
  function dashV(ctx, x, y0, y1, col){ ctx.save(); ctx.setLineDash([2, 4]); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + .5, y0); ctx.lineTo(x + .5, y1); ctx.stroke(); ctx.restore(); }
  function fadeEdges(ctx, w, h, l, r){ // soften the left/right ends of a plot (destination-out)
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    var g;
    if(l){ g = ctx.createLinearGradient(0, 0, l, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, l, h); }
    if(r){ g = ctx.createLinearGradient(w - r, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); ctx.fillStyle = g; ctx.fillRect(w - r, 0, r, h); }
    ctx.restore();
  }

  /* ================================================================ 1 · launch curve */
  var Launch = {
    P: 7.2,
    f: function(x){
      var u = clamp((x - .32) / .68, 0, 1), k = 3.7;
      return .07 + .02 * vn(x * 15 + 3) + .88 * (Math.exp(k * u) - 1) / (Math.exp(k) - 1) + .012 * Math.sin(x * 38) * u;
    },
    init: function(c){ c.st = c.st || { ps:[], acc:0 }; },
    draw: function(c, dt){
      var ctx = c.ctx, w = c.w, h = c.h, S = c.st;
      var pl = 24, pr = 30, pt = 50, pb = 34, pw = w - pl - pr, ph = h - pt - pb, by = pt + ph;
      var cyc = reduced ? .78 : (c.t % this.P) / this.P;
      var prog = clamp(cyc / .72, 0, 1), fade = 1 - sstep(.88, 1, cyc), fin = sstep(0, .04, cyc);
      var A = reduced ? 1 : fade * Math.max(fin, prog > 0 ? 1 : 0);
      ctx.clearRect(0, 0, w, h);
      // grid
      ctx.fillStyle = rgba(PAPER, .05);
      for(var gy = 0; gy < 4; gy++){ var yy = Math.round(pt + ph * gy / 4); for(var gx = pl; gx < pl + pw; gx += 6) ctx.fillRect(gx, yy, 1.4, 1); }
      ctx.fillStyle = rgba(PAPER, .18); ctx.fillRect(pl, by, pw, 1);
      for(var tx = 0, n = 0; tx <= pw; tx += 14, n++){ ctx.fillStyle = rgba(PAPER, n % 5 ? .1 : .22); ctx.fillRect(Math.round(pl + tx), by + 1, 1, n % 5 ? 3 : 6); }
      var x0 = pl + pw * .32;
      dashV(ctx, x0, pt - 8, by, rgba(MINT, .22));
      mono(ctx, 'T0', x0, by + 18, 'center', rgba(PAPER, .42));
      // projected path (faint)
      ctx.save(); ctx.setLineDash([1, 5]); ctx.strokeStyle = rgba(PAPER, .13); ctx.lineWidth = 1; ctx.beginPath();
      for(var px = 0; px <= pw; px += 3){ var X = pl + px, Y = by - this.f(px / pw) * ph; if(px) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.restore();
      // revealed curve
      var xe = pw * prog, hx = pl + xe, hy = by - this.f(prog) * ph;
      if(prog > 0){
        ctx.globalAlpha = A;
        var pts = [];
        for(px = 0; px < xe; px += 2) pts.push(pl + px, by - this.f(px / pw) * ph);
        pts.push(hx, hy);
        // area
        var ga = ctx.createLinearGradient(0, pt, 0, by); ga.addColorStop(0, rgba(JB, .30)); ga.addColorStop(1, rgba(JB, 0));
        ctx.beginPath(); ctx.moveTo(pl, by);
        for(var i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
        ctx.lineTo(hx, by); ctx.closePath(); ctx.fillStyle = ga; ctx.fill();
        // glow + core
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); for(i = 0; i < pts.length; i += 2){ if(i) ctx.lineTo(pts[i], pts[i + 1]); else ctx.moveTo(pts[i], pts[i + 1]); }
        ctx.strokeStyle = rgba(MINT, .12); ctx.lineWidth = 7; ctx.stroke();
        var gl = ctx.createLinearGradient(pl, 0, hx, 0); gl.addColorStop(0, rgba(JB, .55)); gl.addColorStop(1, rgba(MINT, 1));
        ctx.strokeStyle = gl; ctx.lineWidth = 1.9; ctx.stroke();
        // sparks trailing the head
        if(!reduced && prog < 1 && prog > .32){
          S.acc += dt * 60 * (.6 + prog);
          while(S.acc > 1 && S.ps.length < 90){
            S.acc -= 1; var an = Math.PI * .78 + (Math.random() - .5) * .9;
            S.ps.push({ x:hx, y:hy, vx:Math.cos(an) * (30 + Math.random() * 60), vy:-Math.sin(an) * (20 + Math.random() * 50) + 40, l:0, L:.45 + Math.random() * .5 });
          }
        }
        // guide + head
        dashH(ctx, hx + 10, pl + pw + 18, hy, rgba(MINT, .25));
        sq(ctx, pl + pw + 18, hy, 4, rgba(MINT, .7));
        glowDot(ctx, hx, hy, 34, 1);
        var pulse = reduced ? .5 : .5 + .5 * Math.sin(c.t * 6);
        ctx.strokeStyle = rgba(MINT, .35 + .3 * pulse); ctx.lineWidth = 1;
        var rs = 11 + 3 * pulse; ctx.strokeRect(Math.round(hx - rs / 2) + .5, Math.round(hy - rs / 2) + .5, rs, rs);
        sq(ctx, hx, hy, 6, '#EFFFF8');
        ctx.globalAlpha = 1;
      }
      // particles
      for(i = S.ps.length - 1; i >= 0; i--){
        var p = S.ps[i]; p.l += dt; if(p.l > p.L){ S.ps.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt;
        ctx.fillStyle = rgba(MINT, (1 - p.l / p.L) * .8 * A); ctx.fillRect(p.x, p.y, 1.6, 1.6);
      }
      fadeEdges(ctx, w, h, 22, 0);
    }
  };

  /* ================================================================ 2 · daily order bars + 7-day average */
  var Orders = {
    v: function(i){
      var wk = [.84, .9, .95, 1, 1.08, 1.24, 1.13][((i % 7) + 7) % 7];
      var base = .5 + .15 * Math.sin(i * .052) + .07 * Math.sin(i * .15 + 1);
      var v = base * wk * (.8 + .32 * hash(i * 1.3));
      if(hash(i * 3.7 + 1) > .945) v *= 1.38;
      return clamp(v, .12, .97);
    },
    ma: function(i){ var s = 0; for(var k = 0; k < 7; k++) s += this.v(i - k); return s / 7; },
    init: function(c){ c.st = c.st || { pos: 240.35 }; },
    draw: function(c, dt){
      var ctx = c.ctx, w = c.w, h = c.h, S = c.st;
      if(!reduced) S.pos += dt * 1.5;
      var pl = 24, pr = 24, pt = 58, pb = 30, pw = w - pl - pr, ph = h - pt - pb, by = pt + ph, xr = pl + pw;
      var pitch = w > 620 ? 15 : 13, bw = Math.round(pitch * .56), N = Math.floor(S.pos), f = S.pos - N;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = rgba(PAPER, .05);
      for(var gy = 0; gy < 4; gy++){ var yy = Math.round(pt + ph * gy / 4); for(var gx = pl; gx < xr; gx += 6) ctx.fillRect(gx, yy, 1.4, 1); }
      ctx.fillStyle = rgba(PAPER, .16); ctx.fillRect(pl, by, pw, 1);
      var gB = ctx.createLinearGradient(0, pt, 0, by); gB.addColorStop(0, rgba(JB, .78)); gB.addColorStop(1, rgba('13,107,84', .28));
      var count = Math.ceil(pw / pitch) + 2, mx = [], my = [];
      for(var j = -1; j < count; j++){
        var i = N - j, x = xr - (S.pos - i) * pitch - pitch / 2;
        if(x < pl - pitch) break;
        var v = this.v(i), grow = 1;
        if(i > N){ grow = sstep(0, 1, f); x = xr - pitch / 2; } // today's bar fills in place
        if(x > xr) continue;
        var bh = v * ph * grow, bx = Math.round(x - bw / 2);
        ctx.fillStyle = i > N ? rgba(MINT, .5) : gB; ctx.fillRect(bx, by - bh, bw, bh);
        ctx.fillStyle = i > N ? rgba(MINT, .95) : rgba(MINT, .55); ctx.fillRect(bx, Math.round(by - bh), bw, 2);
        if(((i % 7) + 7) % 7 === 0){ ctx.fillStyle = rgba(PAPER, .2); ctx.fillRect(Math.round(x), by + 1, 1, 6); }
        else { ctx.fillStyle = rgba(PAPER, .08); ctx.fillRect(Math.round(x), by + 1, 1, 3); }
        if(i <= N){ mx.push(x); my.push(by - this.ma(i) * ph); }
      }
      // moving average (smooth through bar centres)
      if(mx.length > 2){
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(mx[0], my[0]);
        for(var k = 1; k < mx.length - 1; k++){ ctx.quadraticCurveTo(mx[k], my[k], (mx[k] + mx[k + 1]) / 2, (my[k] + my[k + 1]) / 2); }
        ctx.lineTo(mx[mx.length - 1], my[my.length - 1]);
        ctx.strokeStyle = rgba(MINT, .13); ctx.lineWidth = 7; ctx.stroke();
        ctx.strokeStyle = rgba(MINT, .95); ctx.lineWidth = 2; ctx.stroke();
        var hx = mx[0], hy = my[0];
        dashH(ctx, hx + 8, xr + 14, hy, rgba(MINT, .3));
        glowDot(ctx, hx, hy, 24, .9);
        ctx.strokeStyle = rgba(MINT, .5); ctx.lineWidth = 1; ctx.strokeRect(Math.round(hx - 5.5) + .5, Math.round(hy - 5.5) + .5, 11, 11);
        sq(ctx, hx, hy, 5, '#EFFFF8');
      }
      fadeEdges(ctx, w, h, 70, 0);
    }
  };

  /* ================================================================ 3 · referral network */
  var Network = {
    init: function(c){
      var w = c.w, h = c.h, pl = 30, pr = 30, pt = 60, pb = 24, pw = w - pl - pr, ph = h - pt - pb;
      var cols = Math.max(4, Math.round(pw / 84)), rows = ph > 170 ? 4 : 3, nodes = [], id = 0;
      var cw = pw / cols, chh = ph / rows, lim = Math.pow(Math.max(cw, chh) * 1.9, 2);
      for(var r = 0; r < rows; r++) for(var k = 0; k < cols; k++){
        var s = r * 31 + k * 7 + 3; if(hash(s) < .14) continue;
        nodes.push({ id:id++, bx:pl + cw * (k + .5 + (hash(s + 1) - .5) * .8), by:pt + chh * (r + .5 + (hash(s + 2) - .5) * .72), ph:hash(s + 5) * TAU, lit:0, nb:[] });
      }
      var hub = 0, best = 1e9;
      nodes.forEach(function(n, i){ var d = Math.pow(n.bx - (pl + pw * .47), 2) + Math.pow(n.by - (pt + ph * .5), 2); if(d < best){ best = d; hub = i; } });
      var edges = [], seen = {};
      function link(a, b){ var key = a < b ? a + '-' + b : b + '-' + a; if(seen[key]) return; seen[key] = { a:a, b:b, heat:0 }; edges.push(seen[key]); nodes[a].nb.push(b); nodes[b].nb.push(a); }
      nodes.forEach(function(n, i){
        var ds = nodes.map(function(m, j){ return { j:j, d:Math.pow(m.bx - n.bx, 2) + Math.pow((m.by - n.by) * 1.2, 2) }; }).filter(function(o){ return o.j !== i; }).sort(function(a, b){ return a.d - b.d; });
        link(i, ds[0].j);
        if(ds[1] && ds[1].d < lim) link(i, ds[1].j);
        if(ds[2] && ds[2].d < lim && hash(i * 9.1) > .45) link(i, ds[2].j);
      });
      c.st = { nodes:nodes, edges:edges, seen:seen, hub:hub, ps:[], next:.15 };
    },
    edge: function(S, a, b){ return S.seen[a < b ? a + '-' + b : b + '-' + a]; },
    pos: function(n, t){ return { x:n.bx + 3 * Math.sin(t * .42 + n.ph), y:n.by + 2.2 * Math.cos(t * .35 + n.ph * 1.3) }; },
    step: function(S, dt, t){
      var self = this;
      S.next -= dt;
      if(S.next <= 0 && S.ps.length < 8){
        var src = hash(Math.floor(t * 3.1)) > .45 ? S.hub : Math.floor(Math.random() * S.nodes.length);
        S.nodes[src].lit = Math.max(S.nodes[src].lit, .8);
        S.nodes[src].nb.forEach(function(b){ if(Math.random() < .75) self.send(S, src, b, 0); });
        S.next = .9 + Math.random() * .6;
      }
      for(var i = S.ps.length - 1; i >= 0; i--){
        var p = S.ps[i]; p.k += dt / p.dur;
        var e = this.edge(S, p.a, p.b); if(e) e.heat = Math.max(e.heat, .9);
        if(p.k >= 1){
          S.ps.splice(i, 1); var nb = S.nodes[p.b]; nb.lit = 1;
          if(p.g < 4) nb.nb.forEach(function(b){ if(b !== p.a && Math.random() < .55 && S.ps.length < 18) self.send(S, p.b, b, p.g + 1); });
        }
      }
      S.nodes.forEach(function(n){ n.lit = Math.max(0, n.lit - dt * .5); });
      S.edges.forEach(function(e){ e.heat = Math.max(0, e.heat - dt * .45); });
    },
    send: function(S, a, b, g){
      var A = S.nodes[a], B = S.nodes[b], d = Math.sqrt(Math.pow(A.bx - B.bx, 2) + Math.pow(A.by - B.by, 2));
      S.ps.push({ a:a, b:b, k:0, dur:Math.max(.45, d / 120), g:g });
    },
    draw: function(c, dt){
      var ctx = c.ctx, w = c.w, h = c.h, S = c.st, t = c.t, self = this;
      if(!S) return;
      if(!reduced) this.step(S, dt, t);
      ctx.clearRect(0, 0, w, h);
      var P = S.nodes.map(function(n){ return self.pos(n, t); });
      // edges
      ctx.lineWidth = 1;
      S.edges.forEach(function(e){
        var a = P[e.a], b = P[e.b];
        ctx.strokeStyle = rgba(MINT, .13 + e.heat * .34);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      // pulses
      S.ps.forEach(function(p){
        var a = P[p.a], b = P[p.b], k = p.k, k0 = Math.max(0, k - .22);
        var x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k, x0 = a.x + (b.x - a.x) * k0, y0 = a.y + (b.y - a.y) * k0;
        var g = ctx.createLinearGradient(x0, y0, x, y); g.addColorStop(0, rgba(MINT, 0)); g.addColorStop(1, rgba(MINT, .95));
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
        glowDot(ctx, x, y, 12, .9); sq(ctx, x, y, 3, '#F2FFF9');
      });
      // nodes
      S.nodes.forEach(function(n, i){
        var p = P[i], L = n.lit, hub = i === S.hub, s = hub ? 9 : 5;
        if(L > .02) glowDot(ctx, p.x, p.y, 26 * (.6 + L * .5), L);
        if(L > .02 && L < 1){ var rr = s + (1 - L) * 22; ctx.strokeStyle = rgba(MINT, L * .55); ctx.lineWidth = 1; ctx.strokeRect(Math.round(p.x - rr / 2) + .5, Math.round(p.y - rr / 2) + .5, Math.round(rr), Math.round(rr)); }
        if(hub){ ctx.strokeStyle = rgba(MINT, .45); ctx.lineWidth = 1; ctx.strokeRect(Math.round(p.x - 8) + .5, Math.round(p.y - 8) + .5, 16, 16); }
        sq(ctx, p.x, p.y, s, hub ? rgba(MINT, .8 + L * .2) : rgba(L > .1 ? MINT : PAPER, .36 + L * .64));
      });
    }
  };

  /* ================================================================ 4 · local radar */
  var Radar = {
    PER: 4.4,
    init: function(c){
      var w = c.w, h = c.h, cx = w * .5, cy = h * .6, R = Math.max(h * .78, Math.min(w * .44, h * 1.05));
      // static street map, prerendered and faded toward the edges
      var m = doc.createElement('canvas'); m.width = Math.max(1, Math.round(w * c.dpr)); m.height = Math.max(1, Math.round(h * c.dpr));
      var g = m.getContext('2d'); g.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
      g.save(); g.translate(cx, cy); g.rotate(-.21);
      var D = Math.max(w, h) * 1.2;
      g.strokeStyle = rgba(MINT, .06); g.lineWidth = 1;
      for(var s = -D; s <= D; s += 24){ g.beginPath(); g.moveTo(s, -D); g.lineTo(s + (hash(s) - .5) * 8, D); g.stroke(); }
      for(s = -D; s <= D; s += 30){ g.beginPath(); g.moveTo(-D, s); g.lineTo(D, s + (hash(s + 3) - .5) * 8); g.stroke(); }
      g.fillStyle = rgba(MINT, .035);
      for(var b = 0; b < 9; b++){ var bx = (hash(b * 5.3) - .5) * w * 1.1, byy = (hash(b * 7.7) - .5) * h * 1.2; g.fillRect(Math.round(bx / 24) * 24 + 2, Math.round(byy / 30) * 30 + 2, 22 + 24 * Math.floor(hash(b) * 2), 26); }
      g.restore();
      g.strokeStyle = rgba(MINT, .13); g.lineWidth = 2;
      g.beginPath(); g.moveTo(-10, h * .22); g.bezierCurveTo(w * .3, h * .38, w * .55, h * .1, w + 10, h * .34); g.stroke();
      g.lineWidth = 1.5; g.beginPath(); g.moveTo(w * .18, h + 10); g.lineTo(w * .62, -10); g.stroke();
      g.beginPath(); g.moveTo(-10, h * .86); g.lineTo(w + 10, h * .7); g.stroke();
      g.globalCompositeOperation = 'destination-in';
      var rg = g.createRadialGradient(cx, cy, R * .15, cx, cy, R * 1.05); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(.7, 'rgba(0,0,0,.75)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(0, 0, w, h);
      // pings: fixed spots inside the visible part of the scope
      var pings = [], tries = 0;
      while(pings.length < 10 && tries < 200){
        tries++; var an = hash(tries * 2.31) * TAU, rr = R * (.2 + .76 * Math.sqrt(hash(tries * 4.7)));
        var px = cx + Math.cos(an) * rr, py = cy + Math.sin(an) * rr;
        if(px < 26 || px > w - 26 || py < 52 || py > h - 16) continue;
        pings.push({ x:px, y:py, a:(an + TAU) % TAU, id:tries });
      }
      c.st = { map:m, cx:cx, cy:cy, R:R, pings:pings };
    },
    draw: function(c){
      var ctx = c.ctx, w = c.w, h = c.h, S = c.st; if(!S) return;
      var cx = S.cx, cy = S.cy, R = S.R, om = TAU / this.PER, sw = reduced ? 2 * TAU - 2.25 : c.t * om, a = sw % TAU;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(S.map, 0, 0, w, h);
      // rings, crosshair, bezel ticks
      ctx.lineWidth = 1;
      for(var r = 1; r <= 4; r++){ ctx.strokeStyle = rgba(MINT, r === 4 ? .2 : .09); ctx.beginPath(); ctx.arc(cx, cy, R * r / 4, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = rgba(MINT, .08);
      ctx.beginPath(); ctx.moveTo(cx - R, cy + .5); ctx.lineTo(cx + R, cy + .5); ctx.moveTo(cx + .5, cy - R); ctx.lineTo(cx + .5, cy + R); ctx.stroke();
      for(var pass = 0; pass < 2; pass++){
        ctx.strokeStyle = rgba(MINT, pass ? .3 : .14); ctx.beginPath();
        for(var d = 0; d < 72; d++){
          if((d % 6 === 0) !== !!pass) continue;
          var ang = d / 72 * TAU, l = pass ? 9 : 4, ca = Math.cos(ang), sa = Math.sin(ang);
          ctx.moveTo(cx + ca * R, cy + sa * R); ctx.lineTo(cx + ca * (R - l), cy + sa * (R - l));
        }
        ctx.stroke();
      }
      // sweep wedge
      var W = 1.15;
      if(ctx.createConicGradient){
        var cg = ctx.createConicGradient(a - W, cx, cy);
        cg.addColorStop(0, rgba(JB, 0)); cg.addColorStop(W / TAU * .7, rgba(JB, .1)); cg.addColorStop(W / TAU, rgba(MINT, .3));
        cg.addColorStop(W / TAU + .0005, rgba(JB, 0)); cg.addColorStop(1, rgba(JB, 0));
        ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a - W, a); ctx.closePath(); ctx.fill();
      } else {
        for(var k = 0; k < 18; k++){ ctx.fillStyle = rgba(JB, .016 * k); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a - W + W * k / 18, a - W + W * (k + 1) / 18); ctx.closePath(); ctx.fill(); }
      }
      var ex = cx + Math.cos(a) * R, ey = cy + Math.sin(a) * R;
      var gl = ctx.createLinearGradient(cx, cy, ex, ey); gl.addColorStop(0, rgba(MINT, .2)); gl.addColorStop(1, rgba(MINT, .85));
      ctx.strokeStyle = gl; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      // pings light as the sweep passes, then fade around the dial
      S.pings.forEach(function(p){
        var dd = ((sw - p.a) % TAU + TAU) % TAU, rev = Math.floor((sw - p.a) / TAU);
        if(hash(rev * 13.7 + p.id) < .3) { sq(ctx, p.x, p.y, 3, rgba(PAPER, .16)); return; }
        var age = dd / om, L = Math.exp(-age * .55);
        if(age < 1.4){ var rr = 5 + age * 22; ctx.strokeStyle = rgba(MINT, (1 - age / 1.4) * .7); ctx.lineWidth = 1; ctx.strokeRect(Math.round(p.x - rr / 2) + .5, Math.round(p.y - rr / 2) + .5, Math.round(rr), Math.round(rr)); }
        if(L > .05) glowDot(ctx, p.x, p.y, 18, L);
        sq(ctx, p.x, p.y, 4, rgba(MINT, .28 + .72 * L));
      });
      // centre: "you are here"
      glowDot(ctx, cx, cy, 22, .7);
      ctx.strokeStyle = rgba(MINT, .55); ctx.strokeRect(Math.round(cx - 6) + .5, Math.round(cy - 6) + .5, 12, 12);
      sq(ctx, cx, cy, 5, '#EFFFF8');
    }
  };

  var KINDS = { launch:Launch, orders:Orders, network:Network, radar:Radar };
  Launch.label = Launch.label || ['01', 'LAUNCH'];
  var SLOT = { launch:'tech', network:'pro', radar:'local' };          // data-kind -> picker slot
  var NVK = window.NVK || { defs:{}, sel:{} };
  function defFor(slot, n){ if(slot === 'tech' && +n === 1) return Launch; return NVK.defs[slot + n] || null; }
  function pickK(el){
    var slot = SLOT[el.getAttribute('data-kind')]; if(!slot) return KINDS[el.getAttribute('data-kind')];
    return defFor(slot, NVK.sel[slot] || 1) || KINDS[el.getAttribute('data-kind')];
  }
  function setLabel(c){
    var L = c.K && c.K.label; if(!L) return;
    var lbl = c.el.querySelector('.w6-lbl'); if(lbl){ lbl.setAttribute('data-a', L[0]); lbl.setAttribute('data-b', L[1]); }
  }

  /* ================================================================ cards, sizing, loop */
  var cards = Array.prototype.map.call(document.querySelectorAll('.w6-card[data-kind], .vis-card[data-kind]'), function(el, i){
    var vis = el.querySelector('.w6-vis'), cv = el.querySelector('.w6-cv');
    var ov = document.createElement('div'); ov.className = 'w6-ov'; vis.insertBefore(ov, cv.nextSibling);
    var c = { el:el, vis:vis, cv:cv, ov:ov, ctx:cv.getContext('2d'), K:pickK(el), slot:SLOT[el.getAttribute('data-kind')] || null,
              w:0, h:0, dpr:1, on:false, sp:1, tg:1, t:3 + i * 1.7, st:null, reduced:reduced, hot:false };
    setLabel(c); return c;
  });

  function size(c){
    var w = c.vis.clientWidth, h = c.vis.clientHeight; if(!w || !h) return;
    if(w === c.w && h === c.h) return;
    c.w = w; c.h = h; c.dpr = Math.min(2, win.devicePixelRatio || 1);
    c.cv.width = Math.round(w * c.dpr); c.cv.height = Math.round(h * c.dpr);
    if(c.K === Network || c.K === Radar || !(c.K === Launch || c.K === Orders)) c.st = null;
    c.K.init(c);
    if(reduced && c.K === Network) for(var k = 0; k < 220; k++){ Network.step(c.st, 1 / 30, k / 30); }
    paint(c, 0);
  }
  function paint(c, dt){
    if(!c.w) return;
    c.ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
    c.K.draw(c, dt);
  }

  var raf = 0, last = 0, docHidden = false;
  function anyOn(){ for(var i = 0; i < cards.length; i++) if(cards[i].on) return true; return false; }
  function frame(ts){
    raf = 0;
    if(!NVV.visible(root) || docHidden || !anyOn()){ last = 0; return; }
    var dt = last ? Math.min(.05, (ts - last) / 1000) : 1 / 60; last = ts;
    cards.forEach(function(c){
      if(!c.on) return;
      c.sp += (c.tg - c.sp) * Math.min(1, dt * 3.2);
      var d = dt * c.sp; c.t += d;
      paint(c, d);
    });
    raf = requestAnimationFrame(frame);
  }
  function kick(){ if(reduced || raf) return; if(NVV.visible(root) && !docHidden && anyOn()){ last = 0; raf = requestAnimationFrame(frame); } }

  NVK.apply = function(slot, n){
    var K = defFor(slot, n); if(!K) return false;
    NVK.sel[slot] = +n;
    cards.forEach(function(c){
      if(c.slot !== slot) return;
      if(c.K && c.K.destroy) try{ c.K.destroy(c); }catch(e){}
      c.K = K; c.st = null; c.ov.innerHTML = ''; c.ov.className = 'w6-ov'; c.t = 0.0001; c.w = 0; c.h = 0;
      setLabel(c); size(c);
    });
    kick(); return true;
  };
  window.NVK = NVK;

  if('ResizeObserver' in win){
    var ro = new ResizeObserver(function(){ cards.forEach(size); });
    cards.forEach(function(c){ ro.observe(c.vis); });
  } else { win.addEventListener('resize', function(){ cards.forEach(size); }); }
  cards.forEach(size);

  if('IntersectionObserver' in win){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ cards.forEach(function(c){ if(c.el === e.target) c.on = e.isIntersecting; }); });
      kick();
    }, { rootMargin:'80px 0px' });
    cards.forEach(function(c){ io.observe(c.el); });
  } else { cards.forEach(function(c){ c.on = true; }); kick(); }

  doc.addEventListener('visibilitychange', function(){ docHidden = doc.hidden; if(!docHidden) kick(); });
  win.addEventListener('resize', function(){ cards.forEach(size); kick(); });
  if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function(){ cards.forEach(function(c){ paint(c, 0); }); });

  // hover / keyboard focus: lift + speed the visual
  cards.forEach(function(c){
    var link = c.el.querySelector('.w6-link');
    function hot(on){ c.hot = !!on; c.tg = 1; kick(); }   // steady pace: hover lifts the card but never speeds the visual up
    c.el.addEventListener('pointerenter', function(e){ if(e.pointerType !== 'touch') hot(true); });
    c.el.addEventListener('pointerleave', function(){ if(!c.el.classList.contains('w6-hot')) hot(false); });
    if(link){
      link.addEventListener('focus', function(){
        var kb = true; try{ kb = link.matches(':focus-visible'); }catch(e){}
        if(kb){ c.el.classList.add('w6-hot'); hot(true); }
      });
      link.addEventListener('blur', function(){ c.el.classList.remove('w6-hot'); hot(false); });
    }
  });
});
}catch(e){ if(window.console) console.warn('[who-we-help]', e); }
})();
