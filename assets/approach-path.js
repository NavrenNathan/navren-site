/* NAVREN — homepage approach: the signal path that draws itself down the four steps */
/* APPROACH — Segments: scroll-drawn signal path */
(function(){
var NVV={
  reduced:(function(){ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })(),
  visible:function(r){ return !!(r && r.offsetParent!==null); },
  reg:function(slot,v,fn){ var a=document.querySelector('.a9'); if(a) fn(a.parentNode); }
};
try{
/* Concept 9 · Segments — Approach · "Signal path" */
NVV.reg('ap', 9, function(root){
  var sec = root.querySelector('.a9'); if(!sec) return;
  var win = window, doc = document, R = !!NVV.reduced, NS = 'http://www.w3.org/2000/svg';
  var area = sec.querySelector('.a9-path'), svg = sec.querySelector('.a9-svg'), list = sec.querySelector('.a9-steps');
  var track = svg.querySelector('.a9-track'), glow = svg.querySelector('.a9-glow'), line = svg.querySelector('.a9-line');
  var gConn = svg.querySelector('.a9-conns'), gTick = svg.querySelector('.a9-ticks'), gFan = svg.querySelector('.a9-fan');
  var CH = ['SEO', 'GOOGLE ADS', 'LINKEDIN', 'COLD EMAIL', 'EMAIL & SMS', 'CONTENT'];
  var grads = [].slice.call(svg.querySelectorAll('linearGradient'));
  var steps = [].slice.call(sec.querySelectorAll('.a9-step'));
  var cards = steps.map(function(s){ return s.querySelector('.a9-card'); });
  var nodes = steps.map(function(s){ return s.querySelector('.a9-node'); });
  var ports = steps.map(function(s){ return s.querySelector('.a9-port'); });
  var startEl = sec.querySelector('.a9-start'), endEl = sec.querySelector('.a9-end'), sig = sec.querySelector('.a9-sig');
  var mq = win.matchMedia ? win.matchMedia('(max-width: 760px)') : { matches:false };

  var W = 0, DY = 3, xs = [], lens = [], total = 0, yEnd = 0, nodeY = [], conns = [], ticks = [], tickY = [];
  var cur = 0, tgt = 0, raf = 0, last = 0, inView = false, ok = false, lit = [], endLit = null, done = null;

  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function sharp(u, p){ var a = Math.pow(u, p), b = Math.pow(1 - u, p); return a / (a + b); }
  function el(tag, attrs){ var e = doc.createElementNS(NS, tag); for(var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function place(e, x, y){ e.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; }

  /* ---------------- geometry: build the path from where the cards actually sit ---------------- */
  function geom(){
    if(!NVV.visible(root)) return false;
    W = area.clientWidth; var H = area.clientHeight;
    if(!W || !H) return false;
    var mob = mq.matches, cx = W / 2, i;
    var ox = list.offsetLeft, oy = list.offsetTop;
    var K = [], edges = [];
    var cw = cards[0].offsetWidth, laneHalf = Math.max(40, (W - 2 * cw) / 2);
    var AMP = [.16, .4, .66, .86];
    cards.forEach(function(cd, k){
      var top = oy + cd.offsetTop, left = ox + cd.offsetLeft, w = cd.offsetWidth;
      var y = top + (mob ? 31 : 35), x, edge;
      if(mob){ x = 13; edge = left; }
      else {
        var L = k % 2 === 0;
        x = cx + (L ? -1 : 1) * AMP[k] * laneHalf;
        edge = L ? left + w : left;
      }
      K.push([x, y]); edges.push(edge);
    });
    nodeY = K.map(function(p){ return p[1]; });
    var x0 = mob ? 13 : cx;
    yEnd = H - (mob ? 54 : 74);
    var pts = [[x0, 0]].concat(K, [[x0, yEnd]]);
    var PW = [1.4, 2.1, 2.6, 3.1, 2.4];

    // sample x(y)
    xs = []; var n = Math.ceil(yEnd / DY), seg = 0;
    for(i = 0; i <= n; i++){
      var y = Math.min(yEnd, i * DY);
      while(seg < pts.length - 2 && y > pts[seg + 1][1]) seg++;
      var a = pts[seg], b = pts[seg + 1], u = clamp((y - a[1]) / Math.max(1, b[1] - a[1]), 0, 1);
      var x = a[0] + (b[0] - a[0]) * sharp(u, PW[seg] || 2);
      // noise: loud at the top, settling before step two
      var env = Math.pow(clamp(1 - y / (nodeY[1] || 1), 0, 1), 1.4) * (mob ? 3.2 : 6.5);
      x += env * (Math.sin(y * .11) * .55 + Math.sin(y * .29 + 1.3) * .3 + Math.sin(y * .63 + 2.1) * .15);
      // tests: a few clean oscillations between step one and step two
      if(seg === 1) x += Math.sin(Math.PI * u) * Math.sin(u * Math.PI * 6) * (mob ? 4 : 9);
      xs.push(x);
    }
    // lengths
    lens = [0]; total = 0;
    for(i = 1; i < xs.length; i++){ var dy = Math.min(yEnd, i * DY) - Math.min(yEnd, (i - 1) * DY), dx = xs[i] - xs[i - 1]; total += Math.sqrt(dx * dx + dy * dy); lens.push(total); }
    var d = 'M' + xs[0].toFixed(1) + ' 0';
    for(i = 1; i < xs.length; i++) d += 'L' + xs[i].toFixed(1) + ' ' + Math.min(yEnd, i * DY);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    [track, glow, line].forEach(function(p){ p.setAttribute('d', d); });
    grads.forEach(function(g){ g.setAttribute('y2', yEnd); });
    line.style.strokeDasharray = glow.style.strokeDasharray = total.toFixed(1) + ' ' + (total + 20).toFixed(1);

    // snap nodes onto the sampled path
    K.forEach(function(p){ p[0] = xs[Math.min(xs.length - 1, Math.round(p[1] / DY))]; });
    // channel fan: six sources converge into the start of the path (desktop)
    while(gFan.firstChild) gFan.removeChild(gFan.firstChild);
    if(!mob){
      var spread = Math.min(W * .4, 300), fy = -58;
      CH.forEach(function(name, k){
        var fx = cx + (k / (CH.length - 1) * 2 - 1) * spread;
        var fd = 'M' + fx.toFixed(1) + ' ' + fy + ' C' + fx.toFixed(1) + ' ' + (fy + 34) + ' ' + xs[0].toFixed(1) + ' -30 ' + xs[0].toFixed(1) + ' 0';
        gFan.appendChild(el('path', { d:fd, 'class':'a9-fb' }));
        gFan.appendChild(el('path', { d:fd, 'class':'a9-ff', style:'animation-delay:' + (-k * .37).toFixed(2) + 's' }));
        gFan.appendChild(el('rect', { x:(fx - 2.5).toFixed(1), y:fy - 2.5, width:5, height:5, 'class':'a9-fs' }));
      });
    }
    // connectors node -> card edge
    while(gConn.firstChild) gConn.removeChild(gConn.firstChild);
    conns = K.map(function(p, k){
      var e = el('line', { x1:p[0].toFixed(1), y1:p[1].toFixed(1), x2:edges[k].toFixed(1), y2:p[1].toFixed(1) });
      gConn.appendChild(e); return e;
    });
    // monitor ticks along the tail
    while(gTick.firstChild) gTick.removeChild(gTick.firstChild);
    ticks = []; tickY = [];
    var t0 = nodeY[3] + (mob ? 40 : 60);
    for(var ty = t0; ty < yEnd - 18; ty += 16){
      var tx = xs[Math.round(ty / DY)];
      var tk = el('line', { x1:(tx - 5).toFixed(1), y1:ty, x2:(tx + 5).toFixed(1), y2:ty });
      gTick.appendChild(tk); ticks.push(tk); tickY.push(ty);
    }
    K.forEach(function(p, k){ place(nodes[k], p[0] - ox, p[1] - oy); place(ports[k], edges[k] - ox, p[1] - oy); });
    place(startEl, xs[0], 0);
    place(endEl, xs[xs.length - 1], yEnd);
    lit = []; endLit = null; done = null;
    ok = true;
    return true;
  }

  /* ---------------- render the drawn state at head y ---------------- */
  function render(){
    if(!ok) return;
    var y = clamp(cur, 0, yEnd), f = y / DY, i = Math.min(xs.length - 2, Math.floor(f)), t = f - i;
    var L = lens[i] + (lens[i + 1] - lens[i]) * t, x = xs[i] + (xs[i + 1] - xs[i]) * t;
    var off = (total - L).toFixed(1);
    line.style.strokeDashoffset = off; glow.style.strokeDashoffset = off;
    place(sig, x, y);
    steps.forEach(function(s, k){
      var on = y >= nodeY[k] - 1;
      if(on !== lit[k]){ lit[k] = on; s.classList.toggle('a9-lit', on); if(conns[k]) conns[k].classList.toggle('a9-lit', on); }
    });
    ticks.forEach(function(tk, k){ var on = y >= tickY[k]; if(tk._on !== on){ tk._on = on; tk.classList.toggle('a9-lit', on); } });
    var e = y >= yEnd - 1;
    if(e !== endLit){ endLit = e; endEl.classList.toggle('a9-lit', e); }
    if(e !== done){ done = e; sec.classList.toggle('a9-done', e); }
  }

  function target(){
    var top = area.getBoundingClientRect().top, vh = win.innerHeight || 800;
    return clamp(vh * (mq.matches ? .68 : .6) - top, 0, yEnd);
  }

  /* ---------------- one rAF loop, only while the head is catching up ---------------- */
  function frame(t){
    raf = 0;
    if(!ok || !NVV.visible(root)) return;
    tgt = target();
    var dt = last ? Math.min(50, t - last) : 16; last = t;
    cur += (tgt - cur) * (1 - Math.exp(-dt / 120));
    if(Math.abs(tgt - cur) < .35) cur = tgt;
    render();
    if(cur !== tgt) raf = requestAnimationFrame(frame); else last = 0;
  }
  function kick(){ if(R || raf || !inView || !NVV.visible(root)) return; raf = requestAnimationFrame(frame); }

  function relayout(){
    if(!geom()) return;
    if(R){ cur = tgt = yEnd; render(); return; }
    cur = tgt = target(); render();
    sec.classList.add('a9-ready');
  }

  win.addEventListener('scroll', function(){ if(!NVV.visible(root)) return; kick(); }, { passive:true });
  if('ResizeObserver' in win){
    var pend = 0, ro = new ResizeObserver(function(){ if(!pend) pend = requestAnimationFrame(function(){ pend = 0; relayout(); }); });
    ro.observe(area); ro.observe(list);
  } else win.addEventListener('resize', relayout);
  if('IntersectionObserver' in win){
    new IntersectionObserver(function(es){ es.forEach(function(e){ inView = e.isIntersecting; if(inView) kick(); }); }, { rootMargin:'120px 0px' }).observe(area);
  } else inView = true;
  if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayout);
  relayout();
});
}catch(e){ if(window.console) console.warn('[approach]', e); }
})();
