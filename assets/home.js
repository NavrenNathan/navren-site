/* ============================================================
   NAVREN — homepage visuals (Signal Room)
   Hero "Demand Field", intro loader, services circuit board,
   about globe. Everything here draws; nothing adds page text.
   ============================================================ */
(function(){
'use strict';
var doc=document, root=doc.documentElement, win=window;
var reduced=false;
try{ reduced=win.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
var hasIO=('IntersectionObserver' in win);
var hasRO=('ResizeObserver' in win);
function $(s,c){ return (c||doc).querySelector(s); }
function $$(s,c){ return Array.prototype.slice.call((c||doc).querySelectorAll(s)); }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function lerp(a,b,t){ return a+(b-a)*t; }
function sstep(a,b,x){ var t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); }
function smoother(t){ t=clamp(t,0,1); return t*t*t*(t*(t*6-15)+10); }
function easeOutCubic(t){ t=clamp(t,0,1); return 1-Math.pow(1-t,3); }
function easeInCubic(t){ t=clamp(t,0,1); return t*t*t; }
function easeInOutCubic(t){ t=clamp(t,0,1); return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
function DPR(){ return Math.min(2, win.devicePixelRatio||1); }
function safe(name,fn){ try{ return fn(); }catch(err){ if(win.console&&console.warn) console.warn('[navren] '+name, err); return null; } }
function watch(el, cb, opts){
  if(!hasIO){ cb(true); return null; }
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ cb(e.isIntersecting, e); }); }, opts||{threshold:0});
  io.observe(el); return io;
}
function onResize(el, fn){
  var pending=0;
  function run(){ pending=0; fn(); }
  function sched(){ if(!pending) pending=requestAnimationFrame(run); }
  if(hasRO && el){ new ResizeObserver(sched).observe(el); } else { win.addEventListener('resize', sched); }
  if(doc.fonts && doc.fonts.ready){ doc.fonts.ready.then(sched).catch(function(){}); }
}
function headerH(){ var h=$('#nav'); return h? h.getBoundingClientRect().height : 72; }
var TAU=Math.PI*2;

/* =======================================================================
   HERO — "Demand Field"
   Six channel sources stream particles along bezier paths into a core;
   the core emits one luminous line that climbs on a compounding curve.
   ======================================================================= */
function DemandField(hero){
  var cv=$('.hero-canvas',hero); if(!cv || !cv.getContext) return null;
  var ctx=cv.getContext('2d');
  var copy=$('.hero-copy',hero), h1=$('h1',hero), lede=$('.hero-lede',hero), rail=$('.hero-rail',hero);
  var srcEls=$$('.src',hero);
  var W=1,H=1,dpr=1,mobile=false;
  var M=160, KEXP=2.6;
  var streams=[], exitL=null, core={x:0,y:0}, E={x:0,y:0};
  var mask={x:0,y:0,rx:1,ry:1}, maskGrad=null, coreGrad=null, portGrad=null, exitGrad=null, headGrad=null;
  var N=0, st, tt, sp, of, ph, md, bk;
  var BK=[
    {c:'rgba(61,170,136,.40)', w:1},
    {c:'rgba(61,170,136,.82)', w:1.2},
    {c:'rgba(139,224,192,.78)', w:1.35},
    {c:'rgba(240,252,247,.92)', w:1.5},
    {c:'rgba(61,170,136,.17)', w:1}
  ];
  var bx=[], bn=[0,0,0,0,0];
  var running=false, inView=true, raf=0, last=0, clock=0, started=false, eProg=0, front=[1,1,1,1,1,1];
  var ptr={x:0,y:0,tx:0,ty:0,s:0,ts:0};
  var tmp=new Float32Array(4);

  function bez(a,b,c,d,t){ var u=1-t; return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d; }
  function resample(xs,ys,K){
    var cl=new Float32Array(K+1), k;
    for(k=1;k<=K;k++) cl[k]=cl[k-1]+Math.hypot(xs[k]-xs[k-1], ys[k]-ys[k-1]);
    var L=cl[K]||1, lut=new Float32Array(M*4), j=0, m;
    for(m=0;m<M;m++){
      var tg=m/(M-1)*L;
      while(j<K-1 && cl[j+1]<tg) j++;
      var seg=(cl[j+1]-cl[j])||1, f=clamp((tg-cl[j])/seg,0,1);
      lut[m*4]=xs[j]+(xs[j+1]-xs[j])*f; lut[m*4+1]=ys[j]+(ys[j+1]-ys[j])*f;
    }
    for(m=0;m<M;m++){
      var a=Math.max(0,m-1), b=Math.min(M-1,m+1);
      var dx=lut[b*4]-lut[a*4], dy=lut[b*4+1]-lut[a*4+1], dl=Math.hypot(dx,dy)||1;
      lut[m*4+2]=-dy/dl; lut[m*4+3]=dx/dl;
    }
    return {lut:lut, len:L};
  }
  function bezPath(p0,p1,p2,p3){
    var K=220, xs=new Float32Array(K+1), ys=new Float32Array(K+1);
    for(var k=0;k<=K;k++){ var t=k/K; xs[k]=bez(p0.x,p1.x,p2.x,p3.x,t); ys[k]=bez(p0.y,p1.y,p2.y,p3.y,t); }
    return resample(xs,ys,K);
  }
  function expPath(){
    var K=220, xs=new Float32Array(K+1), ys=new Float32Array(K+1);
    var dx=E.x-core.x, dy=core.y-E.y, den=Math.exp(KEXP)-1;
    for(var k=0;k<=K;k++){ var u=k/K; xs[k]=core.x+dx*u; ys[k]=core.y-dy*(Math.exp(KEXP*u)-1)/den; }
    return resample(xs,ys,K);
  }
  function at(lut,t,out){
    var f=clamp(t,0,1)*(M-1), i=f|0; if(i>=M-1) i=M-2;
    var r=f-i, a=i*4, b=a+4;
    out[0]=lut[a]+(lut[b]-lut[a])*r; out[1]=lut[a+1]+(lut[b+1]-lut[a+1])*r;
    out[2]=lut[a+2]; out[3]=lut[a+3];
  }
  function textRect(el){
    try{ var rg=doc.createRange(); rg.selectNodeContents(el); var r=rg.getBoundingClientRect(); if(r.width>0) return r; }catch(e){}
    return el.getBoundingClientRect();
  }
  function spawn(i, initial){
    st[i]=(Math.random()*streams.length)|0;
    md[i]=0;
    if(initial){
      tt[i]=Math.random();
      if(Math.random()<.24){ md[i]=1; tt[i]=Math.random()*.92; }
    } else tt[i]=-Math.random()*0.12;
    sp[i]=80+Math.random()*100;
    of[i]=(Math.random()+Math.random()+Math.random()-1.5)/1.5;
    ph[i]=Math.random()*TAU;
    var r=Math.random(); bk[i]= r<.54?0 : r<.86?1 : r<.97?2 : 3;
  }
  function alloc(n){
    N=n; st=new Uint8Array(N); tt=new Float32Array(N); sp=new Float32Array(N); of=new Float32Array(N);
    ph=new Float32Array(N); md=new Uint8Array(N); bk=new Uint8Array(N);
    for(var k=0;k<5;k++) bx[k]=new Float32Array(N*4);
    for(var i=0;i<N;i++) spawn(i,true);
  }

  function layout(){
    var r=hero.getBoundingClientRect();
    W=Math.max(1,r.width); H=Math.max(1,r.height); dpr=DPR();
    if(W*H*dpr*dpr>3.4e6) dpr=Math.max(1, Math.sqrt(3.4e6/(W*H)));   // pixel budget for huge retina canvases
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    mobile=W<900;
    var rr=rail.getBoundingClientRect(), railTop=rr.top-r.top, railH=rr.height;
    var cr=copy.getBoundingClientRect(), hr=textRect(h1), lr=textRect(lede);
    var textLeft=cr.left-r.left, textRight=Math.max(hr.right, lr.right)-r.left;
    var cTop=cr.top-r.top, cBot=cr.bottom-r.top;
    if(!mobile){
      core.x=clamp(textRight+(W-textRight)*0.42, W*0.6, W*0.8);
      core.y=clamp(H*0.47, 170, railTop-170);
      E.x=W+40; E.y=Math.max(-20, H*0.015);
      mask.x=(textLeft+textRight)/2; mask.y=(cTop+cBot)/2;
      mask.rx=(textRight-textLeft)/2+110; mask.ry=(cBot-cTop)/2+80;
    } else {
      core.x=W*0.70; core.y=railTop+railH*0.47;
      E.x=W+24; E.y=railTop-30;
      mask.x=W*0.45; mask.y=(cTop+cBot)/2; mask.rx=W*0.78; mask.ry=(cBot-cTop)/2+46;
    }
    var dxE=E.x-core.x, dyE=core.y-E.y, slope=dyE*KEXP/(Math.exp(KEXP)-1)/Math.max(1,dxE);
    var al=Math.hypot(1,slope), ad={x:1/al, y:-slope/al};
    streams=srcEls.map(function(el,i){
      var b=el.getBoundingClientRect(), p0;
      if(!mobile) p0={x:b.left-r.left+2.5, y:b.top-r.top+b.height/2};
      else p0={x:b.right-r.left-2.5, y:b.top-r.top+b.height/2};
      var dist=Math.hypot(core.x-p0.x, core.y-p0.y), p1, p2;
      if(!mobile){
        var rise=Math.min(110, (p0.y-core.y)*0.3);
        p1={x:p0.x+dist*0.12, y:p0.y-rise};
        p2={x:core.x-ad.x*dist*0.32, y:core.y+dist*0.09};
      } else {
        p1={x:p0.x+dist*0.36, y:p0.y};
        p2={x:core.x-ad.x*dist*0.42, y:core.y-ad.y*dist*0.42};
      }
      var P=bezPath(p0,p1,p2,core);
      P.p0=p0; P.spread=(mobile?8:13)+((i*37)%7); P.ph=i*1.9;
      return P;
    });
    exitL=expPath();
    exitGrad=ctx.createLinearGradient(core.x, core.y, E.x, E.y);
    exitGrad.addColorStop(0,'rgba(139,224,192,.85)'); exitGrad.addColorStop(.55,'rgba(170,238,212,.95)'); exitGrad.addColorStop(1,'rgba(245,255,251,1)');
    coreGrad=ctx.createRadialGradient(0,0,0,0,0,120);
    coreGrad.addColorStop(0,'rgba(210,255,238,.6)'); coreGrad.addColorStop(.07,'rgba(139,224,192,.45)');
    coreGrad.addColorStop(.28,'rgba(61,170,136,.15)'); coreGrad.addColorStop(.6,'rgba(61,170,136,.04)'); coreGrad.addColorStop(1,'rgba(61,170,136,0)');
    portGrad=ctx.createRadialGradient(0,0,0,0,0,14);
    portGrad.addColorStop(0,'rgba(139,224,192,.55)'); portGrad.addColorStop(1,'rgba(61,170,136,0)');
    headGrad=ctx.createRadialGradient(0,0,0,0,0,22);
    headGrad.addColorStop(0,'rgba(240,255,250,.9)'); headGrad.addColorStop(.25,'rgba(139,224,192,.45)'); headGrad.addColorStop(1,'rgba(61,170,136,0)');
    maskGrad=ctx.createRadialGradient(0,0,0,0,0,1);
    maskGrad.addColorStop(0,'rgba(0,0,0,.9)'); maskGrad.addColorStop(.62,'rgba(0,0,0,.78)'); maskGrad.addColorStop(1,'rgba(0,0,0,0)');
    var want=mobile?680:(W<1200?1150:1500);
    if(want!==N) alloc(want);
    if(started && !running) render(0);
  }

  function polyline(lut, every, upto){
    var end=(upto==null?M-1:upto);
    ctx.moveTo(lut[0],lut[1]);
    for(var m=every;m<=end;m+=every) ctx.lineTo(lut[m*4],lut[m*4+1]);
    if((end%every)!==0) ctx.lineTo(lut[end*4],lut[end*4+1]);
  }

  function particles(dt){
    var t=clock, i, k;
    for(k=0;k<5;k++) bn[k]=0;
    var R=120, R2=R*R, ps=ptr.s, px=ptr.x, py=ptr.y;
    var exLen=exitL.len;
    for(i=0;i<N;i++){
      var b=bk[i], x, y, fx, fy, spd;
      if(md[i]===0){
        var T=tt[i];
        if(T<0){ tt[i]=T+dt; continue; }
        var S=streams[st[i]];
        spd=sp[i]*(0.72+0.62*T);
        T+=spd*dt/S.len;
        if(T>=1){
          if(Math.random()<0.4){ md[i]=1; tt[i]=0; } else spawn(i,false);
          continue;
        }
        tt[i]=T;
        if(T>front[st[i]]) continue;
        at(S.lut,T,tmp);
        var e=1-T, spread=S.spread*(1-sstep(0.12,1,T))+0.4;
        var lat=of[i]*spread + Math.sin(T*10+ph[i]+t*1.4)*2.2*e + Math.sin(t*0.55+S.ph+T*3.2)*8*Math.sin(Math.PI*T);
        x=tmp[0]+tmp[2]*lat; y=tmp[1]+tmp[3]*lat; fx=tmp[3]; fy=-tmp[2];
        if(T<0.045) b=4;
      } else {
        var U=tt[i], v=150*(1+3.4*U*U);
        U+=v*dt/exLen;
        if(U>=1){ spawn(i,false); continue; }
        tt[i]=U;
        if(U>eProg) continue;
        at(exitL.lut,U,tmp);
        var lat2=of[i]*2.4*(1-U)+Math.sin(U*14+ph[i]+t*2)*0.8;
        x=tmp[0]+tmp[2]*lat2; y=tmp[1]+tmp[3]*lat2; fx=tmp[3]; fy=-tmp[2]; spd=v;
        b= b===0?1 : (b===1?2:b);
        if(U>0.92) b=4;
      }
      if(ps>0.01){
        var dx=x-px, dy=y-py, d2=dx*dx+dy*dy;
        if(d2<R2){ var d=Math.sqrt(d2)+0.01, f=1-d/R; f=f*f*R*0.42*ps; x+=dx/d*f; y+=dy/d*f; }
      }
      var tl=clamp(spd*0.055,2,15), arr=bx[b], o=bn[b]*4;
      arr[o]=x-fx*tl; arr[o+1]=y-fy*tl; arr[o+2]=x; arr[o+3]=y; bn[b]++;
    }
    ctx.globalCompositeOperation='lighter';
    ctx.lineCap='round';
    for(k=0;k<5;k++){
      var n=bn[k]; if(!n) continue;
      var A=bx[k]; ctx.beginPath();
      for(var j=0;j<n;j++){ var q=j*4; ctx.moveTo(A[q],A[q+1]); ctx.lineTo(A[q+2],A[q+3]); }
      ctx.strokeStyle=BK[k].c; ctx.lineWidth=BK[k].w; ctx.stroke();
    }
  }

  function render(dt){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.globalCompositeOperation='source-over';
    ctx.clearRect(0,0,W,H);
    if(!exitL) return;
    eProg = reduced?1:easeOutCubic((clock-1.0)/1.7);
    var ig = reduced?1:smoother((clock-0.7)/1.0);
    var i, s;
    for(i=0;i<streams.length;i++) front[i]= reduced?1:easeOutCubic((clock-0.05-i*0.1)/1.35);
    // channel guides
    ctx.lineWidth=1; ctx.strokeStyle='rgba(61,170,136,.085)';
    ctx.beginPath(); for(i=0;i<streams.length;i++) polyline(streams[i].lut,2); ctx.stroke();
    // exit guide (dashed, full)
    ctx.strokeStyle='rgba(232,237,234,.07)'; ctx.setLineDash([2,6]);
    ctx.beginPath(); polyline(exitL.lut,2); ctx.stroke(); ctx.setLineDash([]);
    // ports
    ctx.globalCompositeOperation='lighter';
    for(i=0;i<streams.length;i++){
      s=streams[i]; var pa=(0.5+0.5*Math.sin(clock*2.4+i*1.3))*Math.min(1, Math.max(0, clock*1.2-i*0.12));
      if(reduced) pa=.7;
      ctx.save(); ctx.translate(s.p0.x,s.p0.y); ctx.globalAlpha=pa; ctx.fillStyle=portGrad; ctx.fillRect(-14,-14,28,28); ctx.restore();
    }
    particles(dt);
    // ignition heads racing toward the core
    for(i=0;i<streams.length;i++){
      if(front[i]>0.001 && front[i]<0.995){
        at(streams[i].lut, front[i], tmp);
        ctx.save(); ctx.translate(tmp[0],tmp[1]); ctx.globalAlpha=1-front[i]*0.5; ctx.fillStyle=headGrad; ctx.fillRect(-22,-22,44,44); ctx.restore();
      }
    }
    // exit line
    if(eProg>0){
      var lut=exitL.lut, end=Math.max(1, Math.round(eProg*(M-1)));
      ctx.globalCompositeOperation='lighter';
      ctx.beginPath(); polyline(lut,1,end);
      ctx.strokeStyle='rgba(61,170,136,.055)'; ctx.lineWidth=16; ctx.stroke();
      ctx.strokeStyle='rgba(61,170,136,.14)'; ctx.lineWidth=5.5; ctx.stroke();
      ctx.strokeStyle=exitGrad; ctx.lineWidth=1.7; ctx.stroke();
      var hx, hy, period=2.9;
      if(eProg<1){
        hx=lut[end*4]; hy=lut[end*4+1];
        ctx.save(); ctx.translate(hx,hy); ctx.fillStyle=headGrad; ctx.fillRect(-22,-22,44,44); ctx.restore();
      } else if(!reduced){
        var q=(clock%period)/1.8;
        if(q<=1){
          var u=Math.pow(q,1.7), ue=Math.round(u*(M-1)), us=Math.max(0, Math.round((u-0.09)*(M-1)));
          ctx.beginPath(); ctx.moveTo(lut[us*4],lut[us*4+1]);
          for(var m=us+1;m<=ue;m++) ctx.lineTo(lut[m*4],lut[m*4+1]);
          ctx.strokeStyle='rgba(245,255,251,'+(0.9-q*0.35)+')'; ctx.lineWidth=2.6; ctx.stroke();
          ctx.save(); ctx.translate(lut[ue*4],lut[ue*4+1]); ctx.globalAlpha=1-q*0.4; ctx.fillStyle=headGrad; ctx.fillRect(-22,-22,44,44); ctx.restore();
        }
      }
    }
    // core
    if(ig>0){
      var br=(0.84+0.16*Math.sin(clock*2.2))*ig;
      ctx.globalCompositeOperation='lighter';
      ctx.save(); ctx.translate(core.x,core.y);
      ctx.globalAlpha=br; ctx.fillStyle=coreGrad; ctx.fillRect(-120,-120,240,240); ctx.globalAlpha=1;
      ctx.fillStyle='rgba(240,255,250,'+(0.95*ig)+')'; ctx.beginPath(); ctx.arc(0,0,2.8,0,TAU); ctx.fill();
      if(!reduced){
        var rq=(clock%2.9)/1.1;
        if(rq<1 && eProg>=1){ ctx.strokeStyle='rgba(139,224,192,'+((1-rq)*0.45*ig)+')'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,0,10+rq*58,0,TAU); ctx.stroke(); }
      }
      ctx.globalCompositeOperation='source-over';
      ctx.rotate(clock*0.35); ctx.setLineDash([2,5]);
      ctx.strokeStyle='rgba(139,224,192,'+(0.5*ig)+')'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(0,0,22,0,TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.rotate(-clock*0.35);
      ctx.strokeStyle='rgba(232,237,234,'+(0.32*ig)+')';
      ctx.beginPath();
      ctx.moveTo(0,-30); ctx.lineTo(0,-36); ctx.moveTo(0,30); ctx.lineTo(0,36);
      ctx.moveTo(-30,0); ctx.lineTo(-36,0); ctx.moveTo(30,0); ctx.lineTo(36,0);
      ctx.stroke();
      // label
      ctx.strokeStyle='rgba(147,163,158,'+(0.5*ig)+')';
      ctx.beginPath(); ctx.moveTo(18,18); ctx.lineTo(34,34); ctx.lineTo(46,34); ctx.stroke();
      ctx.fillStyle='rgba(176,192,187,'+(0.95*ig)+')';
      ctx.font='500 10px "IBM Plex Mono", ui-monospace, Menlo, monospace';
      try{ ctx.letterSpacing='2px'; }catch(e){}
      ctx.textBaseline='middle'; ctx.fillText('DEMAND', 52, 34.5);
      try{ ctx.letterSpacing='0px'; }catch(e){}
      ctx.restore();
    }
    // calm the headline area
    ctx.globalCompositeOperation='destination-out';
    ctx.save(); ctx.translate(mask.x,mask.y); ctx.scale(mask.rx,mask.ry);
    ctx.fillStyle=maskGrad; ctx.beginPath(); ctx.arc(0,0,1,0,TAU); ctx.fill(); ctx.restore();
    ctx.globalCompositeOperation='source-over';
  }

  function frame(ts){
    raf=0; if(!running) return;
    var dt=last?Math.min(0.05,(ts-last)/1000):0.016; last=ts; clock+=dt;
    ptr.x+=(ptr.tx-ptr.x)*0.22; ptr.y+=(ptr.ty-ptr.y)*0.22; ptr.s+=(ptr.ts-ptr.s)*0.07;
    render(dt);
    raf=requestAnimationFrame(frame);
  }
  function play(){ if(running||reduced||!started||!inView||doc.hidden) return; running=true; last=0; raf=requestAnimationFrame(frame); }
  function pause(){ running=false; if(raf) cancelAnimationFrame(raf); raf=0; }

  hero.addEventListener('pointermove', function(e){
    var r=hero.getBoundingClientRect(); ptr.tx=e.clientX-r.left; ptr.ty=e.clientY-r.top;
    if(ptr.s<0.02){ ptr.x=ptr.tx; ptr.y=ptr.ty; } ptr.ts=1;
  }, {passive:true});
  hero.addEventListener('pointerleave', function(){ ptr.ts=0; });
  hero.addEventListener('pointercancel', function(){ ptr.ts=0; });
  watch(hero, function(v){ inView=v; if(v) play(); else pause(); });
  doc.addEventListener('visibilitychange', function(){ if(doc.hidden) pause(); else play(); });
  layout();
  onResize(hero, layout);

  return {
    start:function(){ if(started) return; started=true; clock=0; layout(); if(reduced) render(0); else play(); }
  };
}

/* =======================================================================
   INTRO LOADER — "Circuit"
   Chip at centre, 20 traces route out, pulses race back, chip charges,
   collapses to a jade square and lands on the logo's period.
   ======================================================================= */
function Loader(onReveal){
  var el=doc.createElement('div'); el.className='loader'; el.setAttribute('aria-hidden','true');
  el.innerHTML='<div class="loader-bg"></div><canvas></canvas>';
  doc.body.appendChild(el);
  root.classList.add('intro-run'); root.classList.remove('intro');
  try{ win.sessionStorage.setItem('navren-signal-intro','1'); }catch(e){}
  var cv=el.querySelector('canvas'), ctx=cv.getContext('2d');
  var W=win.innerWidth, H=win.innerHeight, dpr=DPR();
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
  var cx=W/2, cy=H/2, S=W<600?48:62, PIN=7, u=S/6;
  var TL={chip:[0,.28], draw:[.06,.62], pulse:[.5,1.42], shrink:[1.42,1.7], fly:[1.7,2.24], end:2.28};
  var sides=[{ox:0,oy:-1,lx:1,ly:0},{ox:1,oy:0,lx:0,ly:1},{ox:0,oy:1,lx:-1,ly:0},{ox:-1,oy:0,lx:0,ly:-1}];
  var traces=[], idx=0;
  sides.forEach(function(sd){
    for(var k=-2;k<=2;k++){
      var ak=Math.abs(k), sg=k<0?-1:1;
      var bx=cx+sd.ox*(S/2)+sd.lx*k*u, by=cy+sd.oy*(S/2)+sd.ly*k*u;
      var pts=[[bx+sd.ox*PIN, by+sd.oy*PIN]], c=pts[0].slice();
      var a=10+(2-ak)*16+Math.random()*6;
      c=[c[0]+sd.ox*a, c[1]+sd.oy*a]; pts.push(c);
      if(ak){
        var sh=ak*(24+Math.random()*6)+(ak===2?18:0);
        c=[c[0]+(sd.ox+sd.lx*sg)*sh, c[1]+(sd.oy+sd.ly*sg)*sh]; pts.push(c);
        var run=110-(a+sh)+(2-ak)*14+Math.random()*10; if(run<14) run=14;
        c=[c[0]+sd.ox*run, c[1]+sd.oy*run]; pts.push(c);
        var j2=ak*14;
        c=[c[0]+(sd.ox+sd.lx*sg)*j2, c[1]+(sd.oy+sd.ly*sg)*j2]; pts.push(c);
      }
      var toEdge = sd.oy<0 ? c[1]+12 : sd.oy>0 ? H-c[1]+12 : sd.ox>0 ? W-c[0]+12 : c[0]+12;
      c=[c[0]+sd.ox*toEdge, c[1]+sd.oy*toEdge]; pts.push(c);
      var cum=[0];
      for(var p=1;p<pts.length;p++) cum.push(cum[p-1]+Math.hypot(pts[p][0]-pts[p-1][0], pts[p][1]-pts[p-1][1]));
      traces.push({pts:pts, cum:cum, L:cum[cum.length-1], dDelay:Math.random()*0.12, pStart:0, arrived:false, side:sd, k:k, bx:bx, by:by});
      idx++;
    }
  });
  var order=traces.map(function(_,i){return i;}).sort(function(){ return Math.random()-.5; });
  order.forEach(function(ti,n){ traces[ti].pStart=TL.pulse[0]+n*(0.52/traces.length)+Math.random()*0.05; });
  var PD=0.4;

  function pointAt(tr,s){
    s=clamp(s,0,tr.L); var c=tr.cum, p=tr.pts;
    for(var i=1;i<c.length;i++){ if(s<=c[i]){ var f=(s-c[i-1])/((c[i]-c[i-1])||1); return [p[i-1][0]+(p[i][0]-p[i-1][0])*f, p[i-1][1]+(p[i][1]-p[i-1][1])*f]; } }
    return p[p.length-1];
  }
  function pathRange(tr,s0,s1){
    s0=clamp(s0,0,tr.L); s1=clamp(s1,0,tr.L); if(s1<=s0) return;
    var c=tr.cum, p=tr.pts, a=pointAt(tr,s0);
    ctx.moveTo(a[0],a[1]);
    for(var i=1;i<c.length;i++){ if(c[i]>s0 && c[i]<s1) ctx.lineTo(p[i][0],p[i][1]); }
    var b=pointAt(tr,s1); ctx.lineTo(b[0],b[1]);
  }
  var target=null;
  function getTarget(){
    /* the jade square at the end of the NAVREN. wordmark image */
    var d=$('#nav .word img'); var r=d?d.getBoundingClientRect():null;
    if(!r || !r.width) return {x:40,y:36,s:4};
    return {x:r.right-r.height*.13, y:r.top+r.height*.78, s:Math.max(3,r.height*.22)};
  }
  var t0=0, raf=0, done=false, revealed=false, arrivedN=0, glow=0;
  function reveal(){ if(revealed) return; revealed=true; el.classList.add('fade'); try{ onReveal(); }catch(e){} }
  function finish(){
    if(done) return; done=true; if(raf) cancelAnimationFrame(raf);
    win.removeEventListener('pointerdown', skip, true); win.removeEventListener('keydown', skip, true);
    reveal();
    root.classList.remove('intro-run'); root.classList.add('dot-land');
    setTimeout(function(){ root.classList.remove('dot-land'); }, 1000);
    if(el.parentNode) el.parentNode.removeChild(el);
  }
  function skip(){ if(done) return; reveal(); el.classList.add('out'); setTimeout(finish, 230); }
  win.addEventListener('pointerdown', skip, true);
  win.addEventListener('keydown', skip, true);

  function drawChip(x,y,size,pinLen,charge,solid,alpha){
    ctx.save(); ctx.globalAlpha=alpha;
    var h=size/2;
    // pins
    if(pinLen>0.5){
      ctx.fillStyle='rgba(232,237,234,.35)';
      for(var i=0;i<traces.length;i++){
        var tr=traces[i], sd=tr.side, px=x+sd.lx*tr.k*(size/6), py=y+sd.ly*tr.k*(size/6);
        var ex=px+sd.ox*h, ey=py+sd.oy*h;
        ctx.fillStyle=tr.arrived?'rgba(139,224,192,.95)':'rgba(232,237,234,.32)';
        var w=sd.ox?pinLen:2, hh=sd.oy?pinLen:2;
        ctx.fillRect(sd.ox<0?ex-pinLen:(sd.ox>0?ex:ex-1), sd.oy<0?ey-pinLen:(sd.oy>0?ey:ey-1), w, hh);
      }
    }
    // body
    var body=solid>0.98?'#3DAA88':'rgb('+Math.round(lerp(16,61,solid))+','+Math.round(lerp(26,170,solid))+','+Math.round(lerp(24,136,solid))+')';
    ctx.shadowColor='rgba(61,170,136,.9)'; ctx.shadowBlur=(10+charge*40)*(0.4+0.6*alpha);
    ctx.fillStyle=body; ctx.fillRect(x-h,y-h,size,size);
    ctx.shadowBlur=0;
    if(solid<0.98){
      ctx.strokeStyle='rgba(61,170,136,'+(0.45+0.55*charge)+')'; ctx.lineWidth=1;
      ctx.strokeRect(x-h+0.5,y-h+0.5,size-1,size-1);
      var dsz=size*0.5, dh=dsz/2;
      ctx.fillStyle='rgba(61,170,136,'+(0.06+0.85*charge)*(1-solid)+')';
      ctx.fillRect(x-dh,y-dh,dsz,dsz);
      ctx.strokeStyle='rgba(139,224,192,'+(0.35+0.5*charge)*(1-solid)+')';
      ctx.strokeRect(x-dh+0.5,y-dh+0.5,dsz-1,dsz-1);
      if(charge>0.02){
        ctx.globalCompositeOperation='lighter';
        var g=ctx.createRadialGradient(x,y,0,x,y,size*1.6);
        g.addColorStop(0,'rgba(139,224,192,'+(0.5*charge)+')'); g.addColorStop(1,'rgba(61,170,136,0)');
        ctx.fillStyle=g; ctx.fillRect(x-size*1.6,y-size*1.6,size*3.2,size*3.2);
        ctx.globalCompositeOperation='source-over';
      }
    }
    ctx.restore();
  }

  function frame(ts){
    raf=0; if(done) return;
    if(!t0) t0=ts;
    var t=(ts-t0)/1000;
    if(t>=TL.end){ finish(); return; }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    var shrinkP=easeInOutCubic((t-TL.shrink[0])/(TL.shrink[1]-TL.shrink[0]));
    var traceA=1-sstep(TL.shrink[0], TL.shrink[0]+0.22, t);
    // traces
    if(traceA>0){
      ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.globalAlpha=traceA;
      ctx.beginPath();
      traces.forEach(function(tr){
        var d=easeOutCubic((t-TL.draw[0]-tr.dDelay)/0.48);
        if(d>0) pathRange(tr,0,tr.L*d);
      });
      ctx.strokeStyle='rgba(232,237,234,.17)'; ctx.lineWidth=1; ctx.stroke();
      // lit portions + pulses
      ctx.globalCompositeOperation='lighter';
      traces.forEach(function(tr){
        var f=(t-tr.pStart)/PD;
        if(f<=0) return;
        var head=f>=1?0:tr.L*(1-easeInCubic(f));
        if(f>=1 && !tr.arrived){ tr.arrived=true; arrivedN++; }
        ctx.beginPath(); pathRange(tr,head,tr.L);
        ctx.strokeStyle='rgba(61,170,136,.5)'; ctx.lineWidth=1.2; ctx.stroke();
        if(f<1){
          for(var j=0;j<6;j++){
            ctx.beginPath(); pathRange(tr, head+j*12, head+(j+1)*12);
            ctx.strokeStyle='rgba(200,255,232,'+(0.95*(1-j/6))+')'; ctx.lineWidth=2.2-j*0.2; ctx.stroke();
          }
          var hp=pointAt(tr,head);
          var g=ctx.createRadialGradient(hp[0],hp[1],0,hp[0],hp[1],12);
          g.addColorStop(0,'rgba(220,255,240,.9)'); g.addColorStop(1,'rgba(61,170,136,0)');
          ctx.fillStyle=g; ctx.fillRect(hp[0]-12,hp[1]-12,24,24);
        }
      });
      ctx.globalCompositeOperation='source-over';
      ctx.globalAlpha=1;
    }
    glow+=((arrivedN/traces.length)-glow)*0.18;
    // chip
    var chipIn=easeOutCubic((t-TL.chip[0])/(TL.chip[1]-TL.chip[0]));
    if(t<TL.fly[0]){
      var size=lerp(S,16,shrinkP)*lerp(0.7,1,chipIn);
      drawChip(cx,cy,size,PIN*(1-shrinkP),Math.min(1,glow+shrinkP),shrinkP,chipIn);
    } else {
      if(!target) target=getTarget();
      reveal();
      var f=(t-TL.fly[0])/(TL.fly[1]-TL.fly[0]);
      var trail=[0,0.05,0.1,0.15,0.2];
      for(var k=trail.length-1;k>=0;k--){
        var ff=easeInOutCubic(f-trail[k]); if(f-trail[k]<0) continue;
        var ctrlx=lerp(cx,target.x,0.18), ctrly=lerp(cy,target.y,0.92)-20;
        var iu=1-ff, x=iu*iu*cx+2*iu*ff*ctrlx+ff*ff*target.x, y=iu*iu*cy+2*iu*ff*ctrly+ff*ff*target.y;
        var sz=lerp(16,target.s,easeInCubic(Math.min(1,ff*1.05)));
        ctx.save();
        ctx.globalAlpha=k===0?1:(0.32*(1-k/trail.length));
        ctx.shadowColor='rgba(61,170,136,.9)'; ctx.shadowBlur=k===0?18:0;
        ctx.fillStyle=k===0?'#3DAA88':'#8BE0C0';
        ctx.fillRect(x-sz/2,y-sz/2,sz,sz);
        ctx.restore();
      }
    }
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  // hard ceiling, even if rAF is throttled
  setTimeout(function(){ if(!done) skip(); }, 4000);
}

/* =======================================================================
   SERVICES — circuit board traces + pulses into the chip
   ======================================================================= */
function Board(){
  var board=$('.board'); if(!board) return;
  var svg=$('.traces',board), cards=$$('.svc',board), chip=$('.chip',board);
  var pinsL=$$('.chip-pins.l i',chip), pinsR=$$('.chip-pins.r i',chip), pinsT=$$('.chip-pins.t i',chip), pinsB=$$('.chip-pins.b i',chip);
  var NS='http://www.w3.org/2000/svg';
  var groups=[], active=-1, hoverLock=false, inView=false, cycleT=0, resumeT=0, desktop=false;
  var mq=null; try{ mq=win.matchMedia('(min-width: 900px)'); }catch(e){}
  function mk(tag, attrs, parent){ var n=doc.createElementNS(NS,tag); for(var k in attrs) n.setAttribute(k,attrs[k]); if(parent) parent.appendChild(n); return n; }
  function route(ax,ay,bx,by,xt){
    var dy=by-ay, s=dy<0?-1:1, dir=bx>ax?1:-1, c=Math.min(12, Math.abs(dy)/2);
    if(Math.abs(dy)<1) return 'M'+ax+','+ay+'H'+bx;
    return 'M'+ax+','+ay+' H'+(xt-dir*c)+' L'+xt+','+(ay+s*c)+' V'+(by-s*c)+' L'+(xt+dir*c)+','+by+' H'+bx;
  }
  function box(el){
    var x=0, y=0, n=el;
    while(n && n!==board){ x+=n.offsetLeft; y+=n.offsetTop; n=n.offsetParent; }
    return {left:x, top:y, width:el.offsetWidth, height:el.offsetHeight, right:x+el.offsetWidth, bottom:y+el.offsetHeight};
  }
  function build(){
    desktop=mq?mq.matches:win.innerWidth>=900;
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    groups=[];
    if(!desktop){ if(active>=0) setActive(active,false); return; }
    var br={left:0, top:0, width:board.offsetWidth, height:board.offsetHeight};
    svg.setAttribute('viewBox','0 0 '+br.width.toFixed(1)+' '+br.height.toFixed(1));
    var stubs=mk('g',{}, svg);
    pinsT.concat(pinsB).forEach(function(p,j){
      var r=box(p), top=j<5, x=(r.left+r.width/2-br.left).toFixed(1);
      var y0=top?r.top-br.top:r.bottom-br.top, len=22+((j*29)%4)*12, y1=top?y0-len:y0+len;
      mk('path',{d:'M'+x+','+y0.toFixed(1)+'V'+y1.toFixed(1), 'class':'stub'}, stubs);
      mk('circle',{cx:x, cy:y1.toFixed(1), r:2.6, 'class':'via'}, stubs);
    });
    cards.forEach(function(card,i){
      var left=i<3, k=i%3, rc=box(card);
      var pin=(left?pinsL:pinsR)[k+1]; if(!pin) return;
      var pr=box(pin);
      var ax=(left?rc.right:rc.left)-br.left, ay=rc.top+rc.height/2-br.top;
      var bx=(left?pr.left:pr.right)-br.left, by=pr.top+pr.height/2-br.top;
      var xt=ax+(bx-ax)*(k===1?0.3:0.62);
      var d=route(+ax.toFixed(1), +ay.toFixed(1), +bx.toFixed(1), +by.toFixed(1), +xt.toFixed(1));
      var g=mk('g',{'class':'trace'}, svg);
      mk('path',{d:d,'class':'t-base'}, g); mk('path',{d:d,'class':'t-glow'}, g); mk('path',{d:d,'class':'t-lit'}, g);
      var pulse=mk('path',{d:d,'class':'t-pulse'}, g);
      var L=pulse.getTotalLength();
      pulse.style.strokeDasharray='26 '+(L+80); pulse.style.strokeDashoffset='26';
      groups[i]={g:g, pulse:pulse, L:L, pin:pin};
    });
    if(active>=0) setActive(active,false);
  }
  function setActive(i, withPulse){
    active=i;
    cards.forEach(function(c,j){ c.classList.toggle('is-active', j===i); });
    pinsL.concat(pinsR).forEach(function(p){ p.classList.remove('on'); });
    groups.forEach(function(gr,j){ if(gr) gr.g.classList.toggle('on', j===i); });
    var gr=groups[i];
    if(gr) gr.pin.classList.add('on');
    if(withPulse && !reduced && gr && gr.pulse.animate){
      if(gr.anim) gr.anim.cancel();
      gr.anim=gr.pulse.animate([{strokeDashoffset:26},{strokeDashoffset:-gr.L}], {duration:Math.round(560+gr.L*1.1), easing:'cubic-bezier(.5,0,.85,.45)'});
      gr.anim.onfinish=function(){ chip.classList.remove('hit'); void chip.offsetWidth; chip.classList.add('hit'); };
    }
  }
  function next(){ if(!inView||hoverLock||doc.hidden) return; setActive((active+1)%cards.length, true); }
  function startCycle(){ if(reduced||cycleT) return; cycleT=setInterval(next, 2600); }
  function stopCycle(){ clearInterval(cycleT); cycleT=0; }
  cards.forEach(function(card,i){
    function enter(){ hoverLock=true; clearTimeout(resumeT); if(active!==i) setActive(i,true); }
    function leave(){ clearTimeout(resumeT); resumeT=setTimeout(function(){ hoverLock=false; }, 1800); }
    card.addEventListener('pointerenter', function(e){ if(e.pointerType==='mouse') enter(); });
    card.addEventListener('pointerleave', function(e){ if(e.pointerType==='mouse') leave(); });
    card.addEventListener('focusin', enter);
    card.addEventListener('focusout', leave);
  });
  build();
  onResize(board, build);
  setActive(0,false);
  watch(board, function(v){
    var was=inView; inView=v;
    if(v){ if(!was && !reduced) setActive(active<0?0:active, true); startCycle(); }
    else stopCycle();
  }, {threshold:0.15});
}

/* =======================================================================
   ABOUT — Demand Globe (ported from Grid & Globe, re-inked for the dark ground)
   Bellevue sends arcs to NYC, SF, LA, Miami and a few more hubs.
   ======================================================================= */
function AboutGlobe(){
  var canvas=$('#about-globe');if(!canvas||!canvas.getContext)return;
  var REDUCE=reduced;
  var LAND=[
  [-168,65.6,-166,68.9,-162,70.2,-156.8,71.3,-152,70.8,-146,70.2,-141,69.6,-135,69.3,-129,70,-124,69.5,-120,69.3,-114,68.5,-108,68.4,-102,67.8,-97,68,-95,69.5,-94.5,71.8,-92,70.6,-89,69,-85,69.6,-82,68.5,-81.5,67,-84,66.4,-86.5,64.5,-90.5,63.5,-93.5,61.5,-94.2,58.8,-92.5,57,-89,56.4,-85,55.2,-82.3,55,-82,53,-80,51.3,-79,52.5,-78.8,54.5,-77.3,56.5,-76.8,58.2,-78,60.3,-77.6,62.4,-74,62.3,-71,61.1,-69.7,59.2,-67.6,58.4,-65.6,59.6,-64.4,60.3,-61.8,57.2,-60,55.5,-57.3,54.2,-55.8,52.4,-57.2,51.4,-60,50.2,-64,50.2,-66.5,50.1,-68.6,49.1,-64.5,48.9,-65,47.9,-64.8,46.8,-61.6,45.9,-60.2,46.1,-61,45.3,-63.5,44.6,-65.8,43.6,-66.2,44.7,-67.5,44.4,-70,43.6,-70.7,42.7,-70,41.8,-71.5,41.4,-73.8,40.7,-74,39.6,-75,38.8,-76,37.4,-75.5,35.2,-77,34.5,-79,33.2,-81,31.7,-81.3,29.8,-80.1,26.6,-80.4,25.2,-81.2,25.2,-81.8,26.4,-82.7,27.8,-83.2,29.2,-84.3,30,-86.5,30.4,-89,30.3,-89.4,29,-90.5,29.2,-93.8,29.7,-95,29.3,-97.2,27.6,-97.4,25.9,-97.7,22.5,-96.2,19.2,-94.5,18.1,-92,18.6,-90.5,19.8,-90.3,21,-88,21.5,-86.8,21.3,-87.5,19.5,-88.3,18.3,-88.2,16,-86,15.9,-83.3,15,-83.6,12.5,-83.7,11,-82.3,9.5,-79.5,9.5,-77.7,8.7,-77.4,7.9,-78.2,7.5,-80,7.4,-80.6,8.2,-82.9,8.2,-85.7,9.9,-85.8,11.2,-87.6,13,-89.8,13.6,-91.8,14.3,-94,16,-96.5,15.7,-99,16.6,-101.6,17.7,-105.5,20.5,-105.3,22.4,-106.4,23.2,-108.9,25.4,-110.6,27.8,-112.2,29,-114.8,31.8,-114.6,30.3,-113.3,29,-112.4,27.1,-110.9,24.6,-109.9,22.9,-112.2,24.8,-114.1,27.2,-114.4,28.5,-116.1,30.6,-117.1,32.5,-118.4,33.8,-120.6,34.5,-121.9,36.6,-122.5,37.7,-123.7,39,-124.4,40.4,-124.5,42.8,-124,46.2,-124.7,48.4,-125.5,49.2,-128.3,50.8,-128,52.2,-130.3,54.4,-132.5,56,-135,58.5,-137.5,58.7,-139.8,59.6,-144,60,-147.5,61,-150.6,59.3,-152,58.8,-154.2,57.2,-156.5,56.4,-160,55.3,-163.3,54.8,-160.3,56.2,-158,58.7,-161.8,58.7,-162.3,59.8,-165.2,60.6,-164.6,63,-161,64.3,-163.5,64.6,-166.4,64.6],
  [-73,78,-66,80.5,-60,82,-45,82.8,-32,83.5,-21,82.4,-18,80,-19,77,-21.5,74,-22,71.5,-24.5,69.8,-29,68.2,-33,67.6,-38,65.6,-41,63.5,-43,60.1,-46,60.8,-48.5,61.5,-50.5,63.5,-52,65.5,-53.5,67.5,-52,69,-54.5,70.5,-55.5,72.5,-58,75.5,-62,76.2,-68,76.8,-71,77.5],
  [-80,73.6,-76,72.6,-71,71,-68,70,-66,68,-62,66.6,-64.5,65.5,-65.5,64,-64.7,63,-66.5,62.3,-69,62.8,-72,63.6,-74.5,64.5,-77.5,64.4,-78,65.5,-74,66.5,-73.5,68,-77,69.5,-81,69.8,-84.5,70.6,-89,71.3,-88,72.7,-85,73.5],
  [-92,80.5,-88,81.2,-80,82.6,-70,83,-62,82.4,-66,81,-72,79.6,-75,78.3,-78,76.4,-86,76.4,-90,77.3,-92,78.7],
  [-92,74.6,-86,74.5,-80.5,74.5,-80,75.8,-86,76.4,-92,76],
  [-118.6,71,-115,73.4,-108,73.4,-104.5,72.6,-101.5,70.3,-105,68.9,-112,68.6,-117,69.3],
  [-125.5,71.9,-124,74.2,-119,74.4,-116,72.6,-120,71.4],
  [-102,72.6,-100,73.8,-94,74.1,-90.5,73.6,-93.5,72.2,-98,71.6],
  [-117,75.4,-110,75,-104,75.6,-106,76.6,-114,76.6],
  [-87,64.6,-84,65.8,-81,64.2,-83.2,62.9,-86.5,63.6],
  [-59.4,47.7,-58,48.6,-57.2,50.6,-55.6,51.6,-55.5,49.7,-53.5,49.2,-52.8,47.6,-53.6,46.7,-55.8,47,-56.2,47.7],
  [-24,65.5,-22,66.4,-18.5,66.2,-15,66.5,-13.5,65.2,-15,64.3,-18.7,63.4,-21.5,63.8,-22.7,64.1],
  [-84.9,21.9,-83,22.9,-81,23.2,-79,22.6,-77.2,21.7,-75.5,21.1,-74.1,20.2,-77.1,19.9,-77.6,20.4,-79.3,21.5,-81.3,22.1,-83.2,22],
  [-74.4,18.5,-72.8,19.9,-70.5,19.8,-68.4,18.6,-68.7,18.2,-71.4,17.6,-72.7,18.2],
  [-78.3,18.4,-76.3,18.3,-76.8,17.9,-78.2,18.1],
  [-67.2,18.5,-65.6,18.4,-65.7,18,-67.2,17.95],
  [-156.1,20.3,-155,19.6,-155.7,18.9,-156,19.6],
  [-158.3,21.6,-157.6,21.3,-156,20.9,-156.6,20.6,-158.2,21.3],
  [-77.4,8.5,-76,9.4,-75.5,10.5,-73.4,11.3,-72,12.3,-70,11.6,-68,10.6,-66,10.6,-64,10.7,-62,10.7,-60.8,8.6,-59,8,-57.2,6,-55,5.9,-52.5,5.2,-51.1,3.8,-50,1.8,-49.8,0,-48.5,-1,-46,-1,-44,-2.5,-41.5,-2.9,-38.5,-3.7,-37,-4.8,-35.2,-5.5,-34.9,-8,-35.5,-9.8,-37,-11.3,-38.5,-13,-39,-15,-39,-17.8,-39.8,-19.8,-40.8,-21.9,-42,-22.9,-43.2,-23,-44.7,-23.4,-46.5,-24,-48.5,-26.3,-48.7,-28.5,-50,-30,-51.2,-31.5,-52.5,-32.6,-53.4,-33.7,-54.5,-34.6,-56,-34.9,-57.3,-36.2,-57.5,-38,-59,-38.7,-62.3,-38.8,-62.3,-40.5,-65,-41,-64.5,-42.5,-63.6,-42.8,-65,-43.2,-65.5,-45,-67.5,-46.4,-66,-47.5,-67.8,-49.5,-68.4,-50.2,-69.2,-51.6,-68.5,-52.3,-68.4,-53.2,-67.5,-54,-66.4,-54.9,-68.5,-55.4,-70.5,-55.1,-72.8,-53.6,-74.5,-52.3,-75.5,-50,-75.3,-48,-74.6,-46.2,-74,-44,-73.2,-42.5,-73.8,-41.5,-73.6,-39.5,-73.2,-37.3,-72.6,-35.5,-71.6,-33.4,-71.5,-30.5,-71.4,-28.5,-70.6,-25.4,-70.5,-23.6,-70.2,-21.5,-70.3,-18.4,-71.5,-17.4,-74,-16,-75.5,-14.6,-76.3,-13.4,-77.2,-12,-78.2,-10,-79.6,-7.5,-81,-6,-81.3,-4.5,-80.4,-3.4,-80,-2.2,-80.9,-1,-80.1,0.5,-79.4,1.3,-78.8,1.9,-77.4,4,-77.3,6,-77.9,7.2],
  [-5.8,35.8,-2,35.1,1.5,36.6,3,36.8,8.5,36.9,10.2,37.2,11.1,36.9,10.5,35.6,11.1,35.2,10.1,34.3,11.2,33.2,15.2,32.3,18,30.8,19.2,30.3,20.1,31.3,20,32.2,22,32.9,23.5,32.2,25,31.6,27.5,31.2,29.9,31.2,32.3,31.2,34.2,31.3,34.9,29.5,34.2,27.8,32.6,29.9,33.5,27.5,35,24.5,35.6,23,37.2,21,38.5,18,39.7,15.5,41.2,14.4,42.6,13,43.3,11.8,44.5,10.4,47,11.1,51.2,11.8,51,10.4,50.3,8.5,49,6,47.8,4.5,46,2,43,0,41.5,-1.7,39.5,-4.7,39.3,-7,39.6,-9,40.4,-10.5,40.6,-15,39.5,-16.5,36.8,-18,34.8,-19.8,35.3,-22,35.5,-24,32.9,-25.9,32.4,-28.8,31,-29.9,30,-31.3,28,-33,25.6,-34,22,-34.2,20,-34.8,18.4,-34.2,18,-32,17.3,-30,16.5,-28.6,15.2,-27,14.5,-22.9,13.2,-20.5,12,-18,11.8,-15.8,12.5,-13.5,13.7,-11.5,13.2,-8.8,12.2,-6,11.8,-4.8,10.5,-3,9.3,-1,9.4,1,9.8,3.8,8.5,4.5,6,4.3,4.5,6.4,1.2,6.1,-2,4.8,-4,5.2,-7.5,4.4,-9.5,5.5,-11.4,6.9,-13.2,8.5,-15,10.8,-16.8,12.4,-17.5,14.7,-16.5,16.5,-16.1,18.5,-16,19.5,-17,21,-16,23.7,-14.5,26,-13,27.6,-11.5,28.2,-10,29.5,-9.6,31.5,-8.6,33.3,-7.6,33.6,-6.8,34.2,-6.2,35.6],
  [49.3,-12,50.4,-15.5,49.7,-17,48.6,-20.5,47.1,-25,45,-25.5,43.7,-23.5,43.4,-21.5,44.2,-20,43.9,-17.4,46.5,-15.8,48,-13.5],
  [-5.7,50.1,-3.5,50.4,-1,50.7,1.4,51.3,1.7,52.7,0.3,53.5,-0.5,54.5,-1.5,55.4,-2.1,56.1,-1.8,57.6,-3.3,58.6,-5,58.6,-5.8,57.8,-6.2,57.2,-5.6,55.3,-4.8,54.8,-3.3,54.6,-3,53.3,-4.6,52.8,-5.2,51.7,-3.1,51.4,-4.5,51.1],
  [-6,52.2,-6.1,53.5,-6.2,54,-5.6,54.7,-7.5,55.3,-8.3,55,-10,54.2,-9.5,53,-10.3,51.8,-8.5,51.6,-6.4,52.2],
  [-5.6,36,-6.3,36.8,-7.4,37.2,-8.9,37,-8.8,38.5,-9.4,39.4,-8.8,41.5,-9.3,43,-8,43.7,-5,43.5,-1.8,43.4,-1.2,45.8,-2.2,47.1,-4.6,47.9,-4.7,48.5,-3,48.8,-1.6,48.6,-1.3,49.7,0.2,49.5,1.6,50.9,3.6,51.4,4.6,52.5,5.2,53.4,7,53.6,8.6,53.9,8.6,55.4,8.2,56.7,10.6,57.7,10.3,56.2,10.8,55.5,9.8,54.8,11,54,14,54,16.5,54.5,18.6,54.6,21.2,55.2,21,56.8,22.6,57.6,24.3,57,24.4,58.4,23.5,59.2,28,59.5,30,60,28.5,60.6,25,60.2,22.5,60.2,21.4,61.3,21.5,63.3,24.7,64.9,25.3,65.6,22.3,65.8,21.2,64.6,19.5,63.5,17.5,62.4,17.3,60.8,18.9,59.8,16.6,57.8,16.3,56.4,14.3,55.4,12.9,55.5,11.9,57.6,11.2,59.1,10.6,59.8,9.8,59,8,58.1,5.6,58.8,5,61,5.4,62.4,8,63.5,10.3,64.5,12.8,66.8,15.5,68.4,18.9,69.8,22.5,70.4,25.9,71.1,28.5,70.9,31,70.3,33.1,69.3,36,69.1,41,67.6,41,66.3,38,66.1,34.8,66.5,34.5,64.3,37,64,40.5,64.6,44,66.2,44.3,68.4,48,67.7,53.5,68.6,58,68.9,60.5,69.8,66,69.3,67.5,70.8,68.5,72.9,72.8,72.8,72.5,71,72,66.5,74,67.8,76.5,72.2,80.5,73.5,86.5,74,88,75.3,98,76.2,104.3,77.7,107.5,76.8,113,75.8,113.5,73.4,119,73,126.7,73.5,129.5,71.8,136,71.6,139.8,72.4,146.5,72.3,151,71.5,157,71,160,69.7,167,69.8,170.5,70.1,176,69.8,180,69,184,67.5,187.5,66.7,190.3,66,187.5,64.8,186,64.3,182,65.2,180,64.8,178.5,63.4,179.2,62.3,175,61.8,172,60.8,170.3,60,166,60.3,163.5,59.8,163.2,57.8,162,56.1,161.8,54.8,160,53,158.5,52.9,156.7,50.9,156,52.6,155.6,55.3,156.3,57.7,158.5,58.1,161.9,60.4,159.8,61.2,156.7,61.5,154.2,59.2,151.3,59.1,148.8,59.4,145.5,59.4,142.2,59,139,57.7,136.8,54.6,139.8,54.1,141.4,52.8,141,51.3,140.2,48.4,138.5,46.9,136,44.3,133.2,42.7,130.8,42.6,129.7,40.9,128.4,38.6,129.4,36.5,129.2,35.2,127.3,34.7,126.3,34.6,126.5,36.5,126.2,37.7,125,37.9,125.2,39.5,124.4,39.9,121.2,38.9,121.8,40.9,120,40.2,118,39.2,117.6,38.4,118.9,37.4,119.8,37.2,122.6,37.4,120.6,36.1,119.3,35,120.8,32.5,121.9,30.9,121.9,29.8,120.6,27.5,119.5,25.6,117.5,23.7,114.2,22.3,111.5,21.5,110.3,20.5,109.7,21.5,108,21.5,106.6,20.4,105.7,18.9,106.6,17.5,108.7,15.5,109.3,12.5,108.9,11.3,107,10.4,105,8.6,104.8,10.3,103,11.2,102.3,12.2,100.9,12.8,100,13.4,99.2,10.3,100.3,8.3,101.3,6.9,102.2,6.2,103.4,4.8,104.2,1.4,103.3,1.4,101.3,2.8,100.4,4.5,100.1,6.5,98.3,8.1,98.6,10,97.8,14.8,97.6,16.5,96.3,16.6,94.3,16,94.6,17.7,93.5,19.4,92.3,20.7,91.8,22.4,90.5,22.1,89,21.8,87,21.6,86.9,20.7,85.1,19.4,82.3,16.6,80.3,15.6,80.3,13.1,79.8,11,79.3,10.2,77.5,8.1,76.3,9.6,75.7,11.7,74.6,13.7,73.4,16.4,72.8,19,72.6,21.4,70.3,20.9,69,22.3,70.2,22.9,68.6,23.7,67,24.8,64.5,25.2,61.6,25.2,59.5,25.4,57.3,25.9,56.4,27.1,54.5,26.6,52.5,27.4,51,28.8,50.2,30.2,48.6,30,48,29.5,48.5,28,49.6,26.9,50.2,25.8,50.8,24.8,51.6,25.9,51.6,24.3,54.1,24.2,55.6,25.5,56.3,26.3,56.4,24.9,57.3,23.9,58.6,23.6,59.8,22.4,58.5,20.5,57.7,19,56,17.9,55,17,52.2,15.7,49,14.4,45,12.8,43.5,12.7,42.8,15.3,42.3,16.8,40.8,19.5,39.2,21.4,38.4,23.8,37.2,25.3,35.6,27.7,35,29.4,34.9,31.6,34.9,32.8,35.5,33.9,35.9,35.3,36.1,36.7,34.6,36.8,32.8,36.1,30.6,36.8,28.5,36.7,27.3,37,26.3,38.3,26.8,39.5,26.2,40.1,26,40.8,24,40.8,22.9,40.6,22.6,39.5,23,38,22.5,36.5,21.6,36.8,21.1,38.3,20.2,39.5,19.4,41.5,18.5,42.4,16.5,43.4,15,44.6,13.8,45.6,12.3,45.4,12.3,44.3,13.6,43.5,14.3,42.3,16.1,41.5,18.5,40.1,17,39.3,16.5,38.4,15.7,38,15.8,39.8,14.6,40.5,13.5,41.2,12.4,41.6,11.1,42.4,10.4,43.6,8.9,44.4,7.6,43.8,6.2,43.1,4.5,43.4,3.1,43,3.2,41.9,1.3,41.1,0,39.8,-0.3,38.4,-0.8,37.6,-2.1,36.7,-4.4,36.7],
  [130.9,34,131.5,34.7,132.6,35.5,134.5,35.7,135.8,35.6,136.8,37.3,137.4,36.9,138.5,37.8,139.6,38.8,140,40,139.9,41,141.5,41.4,141.9,40,142,39.5,141,37.8,140.9,36.8,140.8,35.7,139.8,35,138.7,34.6,137,34.6,136.8,34.3,135.7,33.4,135.1,34.3,133,34.4,131.9,33.9],
  [129.8,33.2,129.7,32.5,130.2,31.3,131.1,31.4,131.7,32.6,132,33.8,131,34,130.2,33.7],
  [132.5,33,134.7,33.8,134.6,34.2,133,34.1],
  [140,41.5,140.1,42.6,141.4,43.4,141.8,45.4,143.4,44.4,145.3,44.3,145.8,43.3,144,42.9,143.3,42,141.2,42.4,141,41.8],
  [141.9,46.1,143.6,46.6,143.1,49.1,143.2,51.7,142.8,54.3,142.3,53.4,141.8,51,142,48.5],
  [120.1,23,121,25.1,121.9,25,121.6,23.6,120.9,21.9],
  [108.6,19.2,110.5,20.1,111,19.6,109.6,18.2],
  [120,16,120.6,18.5,122.3,18.5,122.2,16.6,121.6,15.6,124,13.6,122.6,13.2,121,13.8,120.6,14.4,120,15.3],
  [122,7,123.5,8.6,125,9,126.6,8.8,126.2,6.3,125.4,5.6,124,6.4,123,7.4],
  [122,11.8,123.8,11.3,125,11.3,125.5,10,123.5,9.4,122.3,10.4],
  [95.3,5.6,97.5,5.2,98.7,3.8,100.6,2,103.5,-0.6,104.4,-1.8,106,-3.2,105.8,-5.8,104.5,-5.8,102.3,-4,100.6,-1.5,99,0.3,97.8,2,95.6,4],
  [105.2,-6.8,106.1,-5.9,108.3,-6.3,110.9,-6.4,112.7,-6.9,114.4,-7.8,114.4,-8.7,112,-8.4,110,-8.1,108,-7.8,106.4,-7.4],
  [109,0,109.6,1.9,111,1.5,113,3,115.5,5,116.8,7,117.7,6,119.2,5.2,118,4.4,117.7,1,116.5,-1.5,116.2,-3.9,114.5,-3.5,111.6,-3,110.2,-1.7,109.3,-0.9],
  [119.4,-5.5,120.4,-5.5,120.5,-2.8,121.4,-4.6,123.2,-5.4,122,-3.5,121,-1.4,123.4,-0.9,125.2,1.5,124.4,1.2,121,1,120,0.6,119.7,-0.5,119,-3],
  [131,-1.4,132.5,-0.4,134.2,-0.9,136,-1.8,138,-1.6,141,-2.6,144,-3.8,145.8,-5.1,147.6,-6.1,147.8,-8,150.2,-10.5,148,-10.2,146,-8.2,144,-7.6,142.5,-9.1,141,-9.1,139,-8.1,138,-7.4,137.8,-5.3,135.5,-4.4,133.5,-4,132,-2.8,131.2,-2],
  [113.5,-22,114,-26,115,-30,115,-34,117.8,-35,123.5,-33.9,129,-31.6,131.5,-31.5,134,-32.8,135.9,-34.8,137.7,-33,138.5,-34.8,140,-37.8,143.5,-38.8,146.3,-39.1,148.5,-37.8,150,-36.5,151.2,-33.9,153,-31,153.6,-28.2,153,-25,150.8,-22.5,149,-20.5,146.3,-19,145.5,-15,143.5,-14,142.5,-10.7,141.6,-13,141.5,-17,140,-17.7,137.7,-16,135.5,-14.8,136.8,-12.2,132.5,-11.4,130.8,-12.4,129.5,-14.9,127,-14,125,-14.6,122.3,-17.5,121,-19.6,117,-20.6,114,-21.8],
  [144.7,-40.7,148.3,-40.9,148.3,-42.2,147.8,-43.2,146.5,-43.6,145.2,-42.2],
  [172.7,-34.4,174.6,-36.2,175.9,-37.4,178.5,-37.7,177,-39.2,176.5,-40.6,175.2,-41.6,174.6,-41.3,175,-40,174,-39.2,174.6,-38,173.6,-36.4],
  [172.6,-40.5,174.2,-41.6,173.2,-43,172.8,-43.9,171.2,-44.5,170.6,-45.9,169,-46.6,166.5,-46,166.7,-45.2,168.2,-44,170.5,-42.9,171.5,-41.7],
  [79.8,9.8,81.2,8.6,81.9,7.5,81.5,6.3,80.6,5.9,79.9,6.8,79.8,8],
  [12.4,38,15.6,38.3,15.1,36.7,12.6,37.6],
  [8.4,41.1,9.8,41,9.6,39.2,8.4,38.9],
  [8.6,41.5,9.2,41.4,9.6,42.9,8.6,42.3],
  [32.3,34.8,33.6,35.4,34.6,35.7,33,34.6],
  [23.5,35.3,26.3,35.3,26,35,24,35],
  [11,78.5,16,80,22,80.4,27,80,22,78.2,18.5,76.5,14,77.2],
  [52,71,55,73.5,58,75.6,64,76.6,68.5,76.9,60,74.8,57,72.5,54,70.6],
  [-180,-90,180,-90,180,-78,165,-77,162,-72,170,-71.5,160,-70,140,-66.5,120,-66.5,100,-66,88,-66.5,75,-69.5,70,-68,60,-67,45,-67.5,30,-69.5,15,-70,0,-70.2,-10,-71,-20,-73.5,-30,-77,-40,-78,-50,-77.5,-60,-74.5,-61,-70,-62.5,-67,-57.5,-63.4,-59.5,-63.1,-64,-65.5,-67.5,-68.5,-70,-71.5,-75,-72.6,-85,-73.2,-100,-73.6,-110,-74.2,-120,-74,-135,-74.5,-145,-75.5,-155,-77.5,-160,-78.3,-170,-78.5,-180,-78]
  ];
  var WATER=[
  [27.6,42,28,43.5,29.6,45.2,30.8,46.5,32.5,45.5,33.6,44.4,35.4,45.2,36.6,45.4,38.2,47.1,39.3,47.1,37.4,45.3,38,44.4,39.8,43.4,41.6,41.6,39.5,41,37,41.2,35,42,33.3,42,31,41.2,29,41.2],
  [47,44.6,49,46.6,51.5,47,53,45.3,51.3,44.4,52.7,42,54,40.5,53.9,37.3,51,36.8,49,38,49.5,40.3,48,42]
  ];
  var ctx=canvas.getContext('2d');
  var D2R=Math.PI/180,TAU=Math.PI*2;

  /* land mask rasterised from coarse coastline polygons */
  var MW=720,MH=360,mc=doc.createElement('canvas');mc.width=MW;mc.height=MH;
  var mx=mc.getContext('2d',{willReadFrequently:true});
  function poly(p,off){mx.beginPath();for(var i=0;i<p.length;i+=2){var X=(p[i]+180+off)*2,Y=(90-p[i+1])*2;if(i)mx.lineTo(X,Y);else mx.moveTo(X,Y);}mx.closePath();mx.fill();}
  mx.fillStyle='#000';LAND.forEach(function(p){poly(p,0);poly(p,-360);});
  mx.globalCompositeOperation='destination-out';WATER.forEach(function(p){poly(p,0);});
  var md=mx.getImageData(0,0,MW,MH).data;
  function isLand(lat,lon){var X=Math.floor((lon+180)*2),Y=Math.floor((90-lat)*2);X=((X%MW)+MW)%MW;Y=Y<0?0:Y>=MH?MH-1:Y;return md[(Y*MW+X)*4+3]>127;}
  function fib(n,keep){
    var out=[],ga=Math.PI*(3-Math.sqrt(5));
    for(var i=0;i<n;i++){var y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),ph=ga*i,x=Math.cos(ph)*r,z=Math.sin(ph)*r;
      if(!keep(Math.asin(y)/D2R,Math.atan2(x,z)/D2R))continue;out.push(x,y,z);}
    return new Float32Array(out);
  }
  var LP=fib(13000,isLand);                                   /* continents */
  var OP=fib(1600,function(a,b){return !isLand(a,b);});        /* the ~1,600-point lattice, oceans only */
  var nL=LP.length/3,nO=OP.length/3;

  function v3(lat,lon){var a=lat*D2R,b=lon*D2R;return [Math.cos(a)*Math.sin(b),Math.sin(a),Math.cos(a)*Math.cos(b)];}
  function basis(v){var up=Math.abs(v[1])<.95?[0,1,0]:[1,0,0];
    var e1=[up[1]*v[2]-up[2]*v[1],up[2]*v[0]-up[0]*v[2],up[0]*v[1]-up[1]*v[0]],l=Math.hypot(e1[0],e1[1],e1[2]);e1=[e1[0]/l,e1[1]/l,e1[2]/l];
    var e2=[v[1]*e1[2]-v[2]*e1[1],v[2]*e1[0]-v[0]*e1[2],v[0]*e1[1]-v[1]*e1[0]];return [e1,e2];}
  var HOME=v3(47.61,-122.20),HOMEB=basis(HOME);
  function D(n,lat,lon,dx,dy){var v=v3(lat,lon);return {n:n,v:v,b:basis(v),dx:dx,dy:dy};}
  var DEST=[D('NYC',40.71,-74.01,1,-1),D('SF',37.77,-122.42,-1,1),D('LA',34.05,-118.24,-1,1),D('MIAMI',25.76,-80.19,1,1),
    D('',51.51,-0.13),D('',43.65,-79.38),D('',41.88,-87.63),D('',30.27,-97.74),D('',42.36,-71.06),D('',39.74,-104.99)];
  var LABELED=[0,1,3,2],EXTRA=[5,4,6,7,8,9];

  var W=0,H=0,dpr=1,R=0,cx=0,cy=0,su=1,fsu=1,haloG=null,bodyG=null;
  var ct=1,st=0,ca=1,sa=0;
  var T=0,last=0,raf=0,running=false,onScreen=true,pageVisible=!doc.hidden;
  var yawN=0,pitN=0,yawT=0,pitT=0,drag=0,dragging=false,lastX=0;
  var arcs=[],heat=[],labels=[],nextAt=1.1,li=0,lab=0,ext=0;
  var NB=6,landB=[],landC=new Int32Array(NB),heatB=[],heatC=new Int32Array(3);
  for(var b=0;b<NB;b++)landB.push(new Float32Array(nL*2));
  for(b=0;b<3;b++)heatB.push(new Float32Array(nL*2));
  var backB=new Float32Array(nL*2),ocB0=new Float32Array(nO*2),ocB1=new Float32Array(nO*2);
  var AS=48,ax=new Float32Array(AS),ay=new Float32Array(AS),av=new Uint8Array(AS);
  var MONO='"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  function resize(){
    var r=canvas.getBoundingClientRect();if(!r.width)return;
    dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    R=Math.min(W,H)*.355;cx=W/2;cy=H/2;su=clamp(R/230,.72,1.15);fsu=clamp(R/230,.88,1.08);
    haloG=ctx.createRadialGradient(cx,cy,R*.7,cx,cy,R*1.4);
    haloG.addColorStop(0,'rgba(61,170,136,.24)');haloG.addColorStop(.32,'rgba(61,170,136,.11)');haloG.addColorStop(1,'rgba(61,170,136,0)');
    bodyG=ctx.createRadialGradient(cx-R*.38,cy-R*.44,R*.05,cx,cy,R*1.04);
    bodyG.addColorStop(0,'rgba(36,58,51,.97)');bodyG.addColorStop(.55,'rgba(18,31,28,.96)');bodyG.addColorStop(1,'rgba(10,16,15,.96)');
    if(!running)render();
  }
  function setRot(lon0,lat0){var th=-lon0*D2R,al=lat0*D2R;ct=Math.cos(th);st=Math.sin(th);ca=Math.cos(al);sa=Math.sin(al);}
  var P=[0,0,0,0];
  function proj(x,y,z){var x1=x*ct+z*st,z1=z*ct-x*st,y2=y*ca-z1*sa,z2=y*sa+z1*ca;P[0]=cx+x1*R;P[1]=cy-y2*R;P[2]=z2;P[3]=x1*x1+y2*y2;return P;}
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  function easeOut(t){return 1-Math.pow(1-t,3);}

  function mkArc(d){
    var A=HOME,B=d.v,dt=A[0]*B[0]+A[1]*B[1]+A[2]*B[2],w=Math.acos(clamp(dt,-1,1)),sw=Math.sin(w)||1e-6;
    var h=.05+.3*Math.pow(w/Math.PI,.75),pts=new Float32Array(AS*3);
    for(var i=0;i<AS;i++){var u=i/(AS-1),a=Math.sin((1-u)*w)/sw,c=Math.sin(u*w)/sw,lift=1+h*Math.sin(Math.PI*u);
      pts[i*3]=(a*A[0]+c*B[0])*lift;pts[i*3+1]=(a*A[1]+c*B[1])*lift;pts[i*3+2]=(a*A[2]+c*B[2])*lift;}
    return {d:d,t0:T,dur:1.05+1.15*Math.min(1,w/1.2),pts:pts,arrived:false};
  }
  function pick(){
    for(var k=0;k<6;k++){
      var d=(li++%3===2)?DEST[EXTRA[ext++%EXTRA.length]]:DEST[LABELED[lab++%LABELED.length]];
      if(proj(d.v[0],d.v[1],d.v[2])[2]>.08)return d;
    }
    return null;
  }

  function frame(now){
    raf=0;
    var dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;T+=dt;
    var k=1-Math.exp(-dt*2.6);yawN+=(yawT-yawN)*k;pitN+=(pitT-pitN)*k;
    if(!dragging)drag*=Math.exp(-dt/2.8);
    render();
    if(running)raf=requestAnimationFrame(frame);
  }

  function rects(buf,n,s){var h=s/2;ctx.beginPath();for(var i=0;i<n;i+=2)ctx.rect(buf[i]-h,buf[i+1]-h,s,s);ctx.fill();}

  function ring(v,bs,ang,alpha,lw){
    var c=Math.cos(ang),s=Math.sin(ang),e1=bs[0],e2=bs[1],started=false;
    ctx.beginPath();
    for(var i=0;i<=40;i++){var ph=i/40*TAU,cp=Math.cos(ph),sp=Math.sin(ph);
      var x=c*v[0]+s*(cp*e1[0]+sp*e2[0]),y=c*v[1]+s*(cp*e1[1]+sp*e2[1]),z=c*v[2]+s*(cp*e1[2]+sp*e2[2]);
      proj(x,y,z);if(P[2]>0){if(started)ctx.lineTo(P[0],P[1]);else{ctx.moveTo(P[0],P[1]);started=true;}}else started=false;}
    ctx.strokeStyle='rgba(61,170,136,'+alpha.toFixed(3)+')';ctx.lineWidth=lw;ctx.stroke();
  }

  function orbit(front){
    var rx=R*1.25,ry=R*.29,rot=-15*D2R,c=Math.cos(rot),s=Math.sin(rot),a0=front?0:Math.PI;
    ctx.beginPath();
    for(var i=0;i<=64;i++){var t=a0+Math.PI*i/64,ex=rx*Math.cos(t),ey=ry*Math.sin(t),X=cx+ex*c-ey*s,Y=cy+ex*s+ey*c;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);}
    ctx.strokeStyle=front?'rgba(232,237,234,.24)':'rgba(232,237,234,.08)';ctx.lineWidth=1;ctx.stroke();
    var ts=(T*TAU/22+.6)%TAU,isF=Math.sin(ts)>0;
    if(isF===front){var ex2=rx*Math.cos(ts),ey2=ry*Math.sin(ts),sx=cx+ex2*c-ey2*s,sy=cy+ex2*s+ey2*c,z=4*su;
      ctx.fillStyle=front?'#8BE0C0':'rgba(232,237,234,.22)';ctx.fillRect(sx-z/2,sy-z/2,z,z);
      if(front){ctx.strokeStyle='rgba(139,224,192,.32)';ctx.strokeRect(sx-z*1.6,sy-z*1.6,z*3.2,z*3.2);}}
    /* tick marks on the near side */
    if(front){ctx.fillStyle='rgba(232,237,234,.32)';for(var j=1;j<12;j++){var tt=Math.PI*j/12,ex3=rx*Math.cos(tt),ey3=ry*Math.sin(tt);ctx.fillRect(cx+ex3*c-ey3*s-.75,cy+ex3*s+ey3*c-.75,1.5,1.5);}}
  }

  function tag(text,x,y,dx,dy,alpha,strong){
    if(alpha<=0.01)return;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.font='500 '+(10*fsu).toFixed(1)+'px '+MONO;
    if('letterSpacing' in ctx)ctx.letterSpacing=(1.1*fsu).toFixed(1)+'px';
    var tw=ctx.measureText(text).width,ph=7*fsu,bh=19*fsu,off=13*su;
    var lx=x+dx*off,ly=y+dy*off;
    var bx=dx>0?lx:lx-tw-ph*2,by=ly-bh/2;
    ctx.strokeStyle='rgba(61,170,136,.65)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+dx*3,y+dy*3);ctx.lineTo(lx,ly);ctx.stroke();
    ctx.fillStyle='rgba(11,17,16,.94)';ctx.fillRect(bx,by,tw+ph*2,bh);
    ctx.strokeStyle=strong?'rgba(61,170,136,.85)':'rgba(61,170,136,.42)';ctx.strokeRect(bx+.5,by+.5,tw+ph*2-1,bh-1);
    ctx.fillStyle=strong?'#8BE0C0':'#E8EDEA';ctx.textBaseline='middle';ctx.fillText(text,bx+ph,by+bh/2+.5);
    ctx.restore();
  }

  function render(){
    if(!W)return;
    var lon0=-99+30*Math.sin(T*TAU/48)+yawN+drag;
    var lat0=25+3.5*Math.sin(T*TAU/31+1)+pitN;
    setRot(lon0,lat0);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);

    /* launch arcs */
    if(!REDUCE&&T>=nextAt){var d=pick();if(d)arcs.push(mkArc(d));nextAt=T+1.2;}

    /* heat sources (in world space) */
    var hs=[],i,j;
    hs.push({v:HOME,r:0,w:1,I:0,rc:3.4*D2R,Ic:.5+.22*Math.sin(T*2.4)});
    for(i=heat.length-1;i>=0;i--){var age=T-heat[i].t0;if(age>2.4){heat.splice(i,1);continue;}
      var p=age/2.4;hs.push({v:heat[i].v,r:9*D2R*easeOut(p),w:2.6*D2R,I:Math.pow(1-p,1.3),rc:2.8*D2R,Ic:Math.max(0,1-age/1.3)});}
    for(i=0;i<hs.length;i++)hs[i].cmin=Math.cos(Math.max(hs[i].r+hs[i].w,hs[i].rc)+.01);

    /* classify dots */
    for(b=0;b<NB;b++)landC[b]=0;heatC[0]=heatC[1]=heatC[2]=0;
    var backC=0,o0=0,o1=0;
    for(i=0;i<nL;i++){
      var x=LP[i*3],y=LP[i*3+1],z=LP[i*3+2];
      var x1=x*ct+z*st,z1=z*ct-x*st,y2=y*ca-z1*sa,z2=y*sa+z1*ca,sx=cx+x1*R,sy=cy-y2*R;
      if(z2<=0){backB[backC++]=sx;backB[backC++]=sy;continue;}
      var hv=0;
      for(j=0;j<hs.length;j++){var s=hs[j],dd=x*s.v[0]+y*s.v[1]+z*s.v[2];if(dd<s.cmin)continue;
        var ang=Math.acos(dd>1?1:dd),q=0;
        if(s.I>0){q=s.I*(1-Math.abs(ang-s.r)/s.w);}
        if(ang<s.rc){var qc=s.Ic*(1-ang/s.rc);if(qc>q)q=qc;}
        if(q>hv)hv=q;}
      if(hv>.14){var hb=hv>.66?2:hv>.38?1:0;heatB[hb][heatC[hb]++]=sx;heatB[hb][heatC[hb]++]=sy;}
      else{var lb=Math.min(NB-1,(z2*NB)|0);landB[lb][landC[lb]++]=sx;landB[lb][landC[lb]++]=sy;}
    }
    for(i=0;i<nO;i++){
      var ox=OP[i*3],oy=OP[i*3+1],oz=OP[i*3+2],ox1=ox*ct+oz*st,oz1=oz*ct-ox*st,oy2=oy*ca-oz1*sa,oz2=oy*sa+oz1*ca;
      if(oz2<=0)continue;
      if(oz2>.45){ocB1[o1++]=cx+ox1*R;ocB1[o1++]=cy-oy2*R;}else{ocB0[o0++]=cx+ox1*R;ocB0[o0++]=cy-oy2*R;}
    }

    /* 1 halo, 2 far side, 3 orbit (back), 4 sphere body */
    ctx.fillStyle=haloG;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(232,237,234,.07)';rects(backB,backC,1.1*su);
    orbit(false);
    ctx.fillStyle=bodyG;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(139,224,192,.18)';ctx.lineWidth=1;ctx.stroke();

    /* 5 near side: ocean lattice, land, heat */
    ctx.fillStyle='rgba(232,237,234,.07)';rects(ocB0,o0,1.05*su);
    ctx.fillStyle='rgba(232,237,234,.12)';rects(ocB1,o1,1.15*su);
    for(b=0;b<NB;b++){ctx.fillStyle='rgba(206,232,221,'+(.16+.11*b).toFixed(3)+')';rects(landB[b],landC[b],(1.15+.17*b)*su);}
    var HA=['rgba(61,170,136,.6)','rgba(61,170,136,.92)','rgba(139,224,192,1)'];
    for(b=0;b<3;b++){ctx.fillStyle=HA[b];rects(heatB[b],heatC[b],(1.9+.25*b)*su);}

    /* 6 arrival ripples */
    for(i=0;i<heat.length;i++){var ag=T-heat[i].t0,pp=ag/1.8;if(pp<1){ring(heat[i].v,heat[i].b,(1.5+10*easeOut(pp))*D2R,.6*(1-pp),1.1);}}

    /* 7 arcs */
    var STATIC=REDUCE;
    if(STATIC&&!arcs.length){[0,1,2,3].forEach(function(n){var a=mkArc(DEST[n]);a.t0=-a.dur;a.arrived=true;arcs.push(a);});}
    for(i=arcs.length-1;i>=0;i--){
      var a=arcs[i],age2=T-a.t0,u=age2/a.dur;
      if(!STATIC&&age2>a.dur*1.45+1.4){arcs.splice(i,1);continue;}
      for(j=0;j<AS;j++){proj(a.pts[j*3],a.pts[j*3+1],a.pts[j*3+2]);ax[j]=P[0];ay[j]=P[1];av[j]=(P[2]>0||P[3]>1)?1:0;}
      var hp=STATIC?1:ease(Math.min(1,u)),tp=STATIC?0:ease(clamp((age2-a.dur*.45)/a.dur,0,1));
      var hi=hp*(AS-1),ti=tp*(AS-1);
      /* dashed trace of the full route so far */
      var trA=STATIC?.6:(age2<a.dur*1.45?.42:.42*Math.max(0,1-(age2-a.dur*1.45)/1.4));
      if(trA>0){ctx.beginPath();var pen=false;
        for(j=0;j<=Math.floor(hi);j++){if(av[j]){if(pen)ctx.lineTo(ax[j],ay[j]);else{ctx.moveTo(ax[j],ay[j]);pen=true;}}else pen=false;}
        ctx.setLineDash(STATIC?[]:[2,3.5]);ctx.strokeStyle='rgba(61,170,136,'+trA.toFixed(3)+')';ctx.lineWidth=STATIC?1.3:1;ctx.stroke();ctx.setLineDash([]);}
      /* bright comet segment */
      if(!STATIC&&hi-ti>.05){
        var j0=Math.floor(ti),j1=Math.ceil(hi);
        var tx=ax[j0]+(ax[Math.min(AS-1,j0+1)]-ax[j0])*(ti-j0),ty=ay[j0]+(ay[Math.min(AS-1,j0+1)]-ay[j0])*(ti-j0);
        var jh=Math.floor(hi),hx=ax[jh]+(ax[Math.min(AS-1,jh+1)]-ax[jh])*(hi-jh),hy=ay[jh]+(ay[Math.min(AS-1,jh+1)]-ay[jh])*(hi-jh);
        for(var pass=0;pass<2;pass++){
          var g=ctx.createLinearGradient(tx,ty,hx,hy);
          g.addColorStop(0,'rgba(61,170,136,0)');g.addColorStop(1,pass?'rgba(170,240,214,1)':'rgba(61,170,136,.38)');
          ctx.beginPath();var pen2=false;
          if(av[j0]){ctx.moveTo(tx,ty);pen2=true;}
          for(j=j0+1;j<=jh;j++){if(av[j]){if(pen2)ctx.lineTo(ax[j],ay[j]);else{ctx.moveTo(ax[j],ay[j]);pen2=true;}}else pen2=false;}
          if(pen2&&av[Math.min(AS-1,jh+1)])ctx.lineTo(hx,hy);
          ctx.strokeStyle=g;ctx.lineWidth=pass?2.1*su:7*su;ctx.lineCap='round';ctx.stroke();
        }
        if(u<1&&av[jh]){
          var hg=ctx.createRadialGradient(hx,hy,0,hx,hy,12*su);hg.addColorStop(0,'rgba(61,170,136,.55)');hg.addColorStop(1,'rgba(61,170,136,0)');
          ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hx,hy,12*su,0,TAU);ctx.fill();
          ctx.fillStyle='#3DAA88';ctx.beginPath();ctx.arc(hx,hy,3.1*su,0,TAU);ctx.fill();
          ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(hx,hy,1.1*su,0,TAU);ctx.fill();
        }
      }
      if(!STATIC&&!a.arrived&&u>=1){a.arrived=true;heat.push({v:a.d.v,b:a.d.b,t0:T});if(a.d.n)labels.push({d:a.d,t0:T});}
      /* destination marker */
      if(a.arrived||STATIC){proj(a.d.v[0],a.d.v[1],a.d.v[2]);if(P[2]>0){var mk=4*su,ma=STATIC?1:Math.max(0,1-Math.max(0,age2-a.dur-1.2)/1.2);
        if(ma>0){ctx.fillStyle='rgba(139,224,192,'+ma.toFixed(3)+')';ctx.fillRect(P[0]-mk/2,P[1]-mk/2,mk,mk);}}}
    }

    /* 8 home: Bellevue */
    proj(HOME[0],HOME[1],HOME[2]);
    if(P[2]>0){
      var hx2=P[0],hy2=P[1],hz=P[2];
      var ph2=STATIC?.4:(T%2.4)/2.4,rs=(7+26*easeOut(ph2))*su;
      ctx.strokeStyle='rgba(139,224,192,'+(.6*(1-ph2)*hz).toFixed(3)+')';ctx.lineWidth=1.2;ctx.strokeRect(hx2-rs/2,hy2-rs/2,rs,rs);
      var ph3=STATIC?.9:((T+1.2)%2.4)/2.4,rs2=(7+26*easeOut(ph3))*su;
      ctx.strokeStyle='rgba(139,224,192,'+(.45*(1-ph3)*hz).toFixed(3)+')';ctx.strokeRect(hx2-rs2/2,hy2-rs2/2,rs2,rs2);
      var hsz=8*su;ctx.fillStyle='#0B1110';ctx.fillRect(hx2-hsz/2-1.5,hy2-hsz/2-1.5,hsz+3,hsz+3);
      ctx.fillStyle='#8BE0C0';ctx.fillRect(hx2-hsz/2,hy2-hsz/2,hsz,hsz);
      tag('BELLEVUE',hx2,hy2,-1,-1,clamp((hz-.05)*6,0,1),true);
    }

    /* 9 city labels */
    if(STATIC){[0,1,2,3].forEach(function(n){var dd2=DEST[n];proj(dd2.v[0],dd2.v[1],dd2.v[2]);if(P[2]>.1)tag(dd2.n,P[0],P[1],dd2.dx,dd2.dy,1,false);});}
    else for(i=labels.length-1;i>=0;i--){
      var L=labels[i],la=T-L.t0;if(la>2.7){labels.splice(i,1);continue;}
      var al=la<.3?la/.3:la>2.0?1-(la-2.0)/.7:1;
      proj(L.d.v[0],L.d.v[1],L.d.v[2]);
      if(P[2]>.12)tag(L.d.n,P[0],P[1],L.d.dx,L.d.dy,al*clamp((P[2]-.12)*5,0,1),false);
    }

    /* 10 orbit (front) + outer dashed ring */
    orbit(true);
    ctx.setLineDash([1,5]);ctx.strokeStyle='rgba(232,237,234,.16)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,R*1.36,-.2*Math.PI+T*.02,.62*Math.PI+T*.02);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,R*1.36,.82*Math.PI+T*.02,1.62*Math.PI+T*.02);ctx.stroke();
    ctx.setLineDash([]);
  }

  /* pointer: hover nudges, drag turns (and springs home) */
  var hero=canvas.closest('.ag-panel')||canvas;
  hero.addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse'||dragging)return;
    var r=canvas.getBoundingClientRect(),nx=(e.clientX-(r.left+r.width/2))/r.width,ny=(e.clientY-(r.top+r.height/2))/r.height;
    yawT=-clamp(nx,-1,1)*10;pitT=clamp(ny,-1,1)*7;
  });
  hero.addEventListener('pointerleave',function(){yawT=0;pitT=0;});
  canvas.addEventListener('pointerdown',function(e){dragging=true;lastX=e.clientX;try{canvas.setPointerCapture(e.pointerId);}catch(err){}});
  canvas.addEventListener('pointermove',function(e){if(!dragging)return;drag=clamp(drag-(e.clientX-lastX)*.3,-80,80);lastX=e.clientX;if(REDUCE)render();});
  function endDrag(){dragging=false;}
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);

  function sync(){
    var want=onScreen&&pageVisible&&!REDUCE;
    if(want&&!running){running=true;last=performance.now();raf=requestAnimationFrame(frame);}
    else if(!want&&running){running=false;if(raf)cancelAnimationFrame(raf);raf=0;}
  }
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){onScreen=es[es.length-1].isIntersecting;sync();},{rootMargin:'80px'}).observe(canvas);}
  doc.addEventListener('visibilitychange',function(){pageVisible=!doc.hidden;sync();});
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  resize();sync();
  if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(function(){if(!running)render();});
}

/* =======================================================================
   Pause decorative CSS loops off-screen
   ======================================================================= */
function PauseOffscreen(){
  $$('.band').forEach(function(el){ watch(el, function(v){ el.classList.toggle('paused', !v); }); });
}

/* =======================================================================
   BOOT
   ======================================================================= */
var heroField=null, heroStarted=false;
function startHero(){
  if(heroStarted) return; heroStarted=true;
  root.classList.remove('pre-hero');
  if(heroField) safe('hero-start', function(){ heroField.start(); });
}
heroField=safe('hero', function(){ return DemandField($('.hero')); });
safe('board', Board);
safe('about-globe', AboutGlobe);
safe('pause', PauseOffscreen);
var loaderOn=false;
if(root.classList.contains('intro') && !reduced){
  loaderOn=!!safe('loader', function(){ Loader(startHero); return true; });
}
root.classList.remove('intro');
if(!loaderOn) startHero();
})();
