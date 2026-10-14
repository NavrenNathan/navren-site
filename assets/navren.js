/* ============================================================
   NAVREN, shared site script (Signal Room)
   Mega menu, mobile drawer, section reveals, page transition,
   newsletter, blog search/filter + featured slider (all as before),
   plus the Signal Room details: header state, grid + grain,
   card spotlight, terminal lines, animated FAQ, reading progress.
   Loaded on every page.
   ============================================================ */
(function(){
  "use strict";

  var nav       = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navPanel  = document.getElementById("navPanel");
  var megas     = Array.prototype.slice.call(document.querySelectorAll("[data-mega]"));
  var DESKTOP   = window.matchMedia("(min-width: 901px) and (hover: hover)");
  var root      = document.documentElement;

  /* ---------- mega menus ----------
     Hover on desktop with an intent delay so the menu doesn't snap shut
     when the pointer cuts a corner on its way to a link. Tap everywhere,
     since hover doesn't exist on touch. Keyboard opens on focus, Escape
     closes. */
  var OPEN_DELAY = 90, CLOSE_DELAY = 220;
  var timer = null;

  function setOpen(item, open){
    item.classList.toggle("open", open);
    var trigger = item.querySelector(".menu-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open){
      /* Read a layout property to force the style recalculation now. The
         panel is visibility:hidden until the class lands, and until the
         browser has recalculated, a Tab pressed in the same moment steps
         straight over every link inside it. */
      var panel = item.querySelector(".mega");
      if (panel) void panel.offsetHeight;
    }
  }
  function closeAll(except){
    megas.forEach(function(m){ if (m !== except) setOpen(m, false); });
  }
  function clearTimer(){ if (timer){ clearTimeout(timer); timer = null; } }
  function closeNav(){
    if (navPanel) navPanel.classList.remove("open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    root.classList.remove("nav-open");
  }

  megas.forEach(function(item){
    var trigger = item.querySelector(".menu-trigger");
    if (!trigger) return;

    /* A mouse click on an unfocused trigger fires focusin first, which
       opens the menu, and the click handler then read that fresh state
       and toggled it straight back shut. Take the state at mousedown,
       before focus moves, and toggle from that instead. */
    var stateAtPress = null;
    trigger.addEventListener("mousedown", function(){
      stateAtPress = item.classList.contains("open");
    });

    trigger.addEventListener("click", function(e){
      e.preventDefault();
      var wasOpen = stateAtPress === null ? item.classList.contains("open") : stateAtPress;
      stateAtPress = null;
      clearTimer();
      closeAll(item);
      setOpen(item, !wasOpen);
    });

    item.addEventListener("mouseenter", function(){
      if (!DESKTOP.matches) return;
      clearTimer();
      timer = setTimeout(function(){ closeAll(item); setOpen(item, true); }, OPEN_DELAY);
    });
    item.addEventListener("mouseleave", function(){
      if (!DESKTOP.matches) return;
      clearTimer();
      timer = setTimeout(function(){ setOpen(item, false); }, CLOSE_DELAY);
    });

    item.addEventListener("focusin", function(){
      if (!DESKTOP.matches) return;
      clearTimer();
      closeAll(item);
      setOpen(item, true);
    });
    item.addEventListener("focusout", function(e){
      if (!DESKTOP.matches) return;
      if (!item.contains(e.relatedTarget)) setOpen(item, false);
    });

    item.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ setOpen(item, false); closeNav(); });
    });
  });

  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    /* Escape inside an open menu hands focus back to the control that
       opened it, rather than leaving it on a link that has just been
       hidden. */
    var openMega = null;
    for (var m = 0; m < megas.length; m++){
      if (megas[m].classList.contains("open") && megas[m].contains(document.activeElement)){
        openMega = megas[m]; break;
      }
    }
    var panelHadFocus = navPanel && navPanel.classList.contains("open") &&
                        navPanel.contains(document.activeElement);
    clearTimer(); closeAll(null); closeNav();
    if (openMega){
      var t = openMega.querySelector(".menu-trigger");
      if (t) t.focus();
    } else if (panelHadFocus && navToggle){
      navToggle.focus();
    }
  });
  document.addEventListener("click", function(e){
    if (nav && !nav.contains(e.target)){ clearTimer(); closeAll(null); closeNav(); }
  });

  if (navToggle && navPanel){
    navToggle.addEventListener("click", function(){
      var open = navPanel.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      root.classList.toggle("nav-open", open);
      if (!open) closeAll(null);
    });
  }

  /* crossing the desktop/mobile boundary with the drawer open would
     strand it, reset whenever the breakpoint changes */
  if (DESKTOP.addEventListener){
    DESKTOP.addEventListener("change", function(){ clearTimer(); closeAll(null); closeNav(); });
  }

  /* header gets a firmer ground once the page has moved */
  if (nav){
    var onScroll = function(){ nav.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive:true });
    onScroll();
  }

  /* ---------- section reveals ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (REDUCED || !("IntersectionObserver" in window)){
    for (var i = 0; i < reveals.length; i++) reveals[i].classList.add("in");
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin:"0px 0px -12% 0px", threshold:0.15 });

    /* Stagger by position within the element's own group, so a row of
       four cards arrives 1-2-3-4. */
    var groups = {};
    var gid = 0;
    for (var k = 0; k < reveals.length; k++){
      var parent = reveals[k].parentNode;
      if (!parent.__navrenGroup) parent.__navrenGroup = ++gid;
      var key = parent.__navrenGroup;
      if (groups[key] === undefined) groups[key] = 0;
      reveals[k].style.setProperty("--i", groups[key]);
      groups[key]++;
      io.observe(reveals[k]);
    }
    /* Safety net: if anything above the fold hasn't shown itself in two
       seconds, assume the observer isn't working and show everything. */
    setTimeout(function(){
      var stuck = document.querySelectorAll(".reveal:not(.in)");
      for (var s = 0; s < stuck.length; s++){
        var box = stuck[s].getBoundingClientRect();
        if (box.top < window.innerHeight){
          for (var j = 0; j < reveals.length; j++) reveals[j].classList.add("in");
          break;
        }
      }
    }, 2000);
  }

  /* ---------- page transition ----------
     Arriving is handled in CSS. This half covers leaving: hold the click,
     sweep the panel in, then navigate. Every case this skips just
     navigates the ordinary way. */
  function samePath(a, b){
    return a.replace(/\/index\.html$/, "/") === b.replace(/\/index\.html$/, "/");
  }

  document.addEventListener("click", function(e){
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   /* new tab/window */

    var link = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!link || link.hasAttribute("download")) return;
    if (link.target && link.target !== "_self") return;

    var href = link.getAttribute("href") || "";
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;

    var url;
    try { url = new URL(link.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;

    /* an anchor inside the page we're already on is a jump, not a navigation */
    if (samePath(url.pathname, location.pathname) && url.search === location.search) return;

    e.preventDefault();
    root.classList.add("is-leaving");
    if (REDUCED){ location.href = url.href; return; }
    setTimeout(function(){ location.href = url.href; }, 220);
  });

  /* Back and forward can hand this page back from bfcache with the panel
     still down. Lift it on the way in. */
  window.addEventListener("pageshow", function(e){
    if (e.persisted) root.classList.remove("is-leaving");
  });
})();

/* ============================================================
   Footer newsletter
   Netlify captures the form from the static markup. We intercept the
   submit so a subscriber is not thrown to a success page; if fetch is
   unavailable or the request fails, the native POST still goes through.
   ============================================================ */
(function(){
  "use strict";

  var form = document.querySelector(".foot-news form");
  if (!form || !window.fetch) return;

  var email = form.querySelector('input[type="email"]');
  var honey = form.querySelector('input[name="company_url"]');
  var state = form.querySelector(".news-state");
  var btn   = form.querySelector("button");
  if (!email || !state || !btn) return;

  function encode(data){
    return Object.keys(data).map(function(k){
      return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
    }).join("&");
  }

  form.addEventListener("submit", function(e){
    /* Let the browser show its own message on an empty or malformed
       address rather than posting a blank subscription. */
    if (!form.checkValidity()) return;
    e.preventDefault();

    btn.disabled = true;
    state.className = "news-state";
    state.textContent = "Sending…";

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode({
        "form-name": "newsletter",
        email: email.value.trim(),
        company_url: honey ? honey.value : ""
      })
    }).then(function(r){
      if (!r.ok) throw new Error("HTTP " + r.status);
      state.className = "news-state ok";
      state.textContent = "Subscribed. Thank you.";
      email.value = "";
      btn.disabled = false;
    }).catch(function(){
      btn.disabled = false;
      state.className = "news-state fail";
      state.textContent = "Did not send. Email hello@navrenagency.com";
    });
  });
})();

/* ============================================================
   Blog search + topic filter
   Progressive: every card is in the markup and visible, so with no
   JavaScript the page is a complete list. A post matches when it
   satisfies both the topic dropdown and the free-text search.
   ============================================================ */
(function(){
  "use strict";

  var list = document.getElementById("postList");
  if (!list) return;

  var posts  = Array.prototype.slice.call(list.querySelectorAll("article"));
  var search = document.getElementById("blogSearch");
  var select = document.getElementById("blogTopic");
  var count  = document.querySelector(".topic-count");
  var empty  = document.querySelector(".topic-empty");
  var reset  = document.querySelector("[data-reset]");
  if (!posts.length) return;

  function apply(){
    var topic = select ? select.value : "all";
    var q = search ? search.value.trim().toLowerCase() : "";
    var shown = 0;
    posts.forEach(function(p){
      /* A post can carry more than one category, space-separated, so
         match if the selected topic is any one of them. */
      var postTopics = (p.getAttribute("data-topic") || "").split(/\s+/);
      var topicMatch = topic === "all" || postTopics.indexOf(topic) !== -1;
      var textMatch = !q || (p.getAttribute("data-search") || p.textContent).toLowerCase().indexOf(q) !== -1;
      var match = topicMatch && textMatch;
      /* Inline display wins regardless of which stylesheet is cached. */
      p.hidden = !match;
      p.style.display = match ? "" : "none";
      /* Anything we show is marked revealed, or a card never scrolled
         past would stay dimmed. */
      if (match){ p.classList.add("in"); shown++; }
    });
    if (empty) empty.hidden = shown !== 0;
    if (count){
      count.textContent = shown === posts.length
        ? posts.length + (posts.length === 1 ? " post" : " posts")
        : shown + " of " + posts.length;
    }
  }

  if (search) search.addEventListener("input", apply);
  if (select) select.addEventListener("change", apply);
  if (reset){
    reset.addEventListener("click", function(e){
      e.preventDefault();
      if (search) search.value = "";
      if (select) select.value = "all";
      apply();
    });
  }

  apply();
})();

/* ============================================================
   Featured-post slider (blog)
   Progressive: with no JavaScript every slide is visible. The control
   strip ships hidden and only appears when there is more than one slide.
   ============================================================ */
(function(){
  "use strict";

  var root = document.getElementById("blogSlider");
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-slide]"));
  if (!slides.length) return;

  var controls = root.querySelector(".blog-slider__controls");
  var prev = root.querySelector("[data-prev]");
  var next = root.querySelector("[data-next]");
  var dotWrap = root.querySelector(".blog-slider__dots");
  var dots = [];
  var i = 0;

  if (slides.length < 2){
    slides[0].classList.add("is-on");
    return;
  }

  if (controls) controls.hidden = false;

  function show(n){
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function(s, idx){
      var on = idx === i;
      s.classList.toggle("is-on", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      Array.prototype.forEach.call(s.querySelectorAll("a"), function(a){
        if (on) a.removeAttribute("tabindex");
        else a.setAttribute("tabindex", "-1");
      });
    });
    dots.forEach(function(d, idx){
      d.setAttribute("aria-selected", idx === i ? "true" : "false");
    });
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === slides.length - 1;
  }

  if (dotWrap){
    slides.forEach(function(s, idx){
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("role", "tab");
      d.setAttribute("aria-selected", "false");
      d.setAttribute("aria-label", "Featured post " + (idx + 1) + " of " + slides.length);
      d.addEventListener("click", function(){ show(idx); });
      dotWrap.appendChild(d);
      dots.push(d);
    });
  }

  if (prev) prev.addEventListener("click", function(){ show(i - 1); });
  if (next) next.addEventListener("click", function(){ show(i + 1); });

  root.addEventListener("keydown", function(e){
    if (e.key === "ArrowLeft"){ show(i - 1); }
    else if (e.key === "ArrowRight"){ show(i + 1); }
  });

  show(0);
})();

/* ============================================================
   Signal Room details (decorative only: nothing here adds text)
   ============================================================ */
(function(){
  "use strict";
  var doc = document, win = window;
  var REDUCED = win.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* the 12-column hairline grid + film grain behind every page */
  if (!doc.querySelector(".gridlines")){
    var g = doc.createElement("div"); g.className = "gridlines"; g.setAttribute("aria-hidden", "true");
    doc.body.insertBefore(g, doc.body.firstChild);
  }
  if (!REDUCED && !doc.querySelector(".grain")){
    try {
      var S = 160, cv = doc.createElement("canvas"); cv.width = cv.height = S;
      var cx = cv.getContext("2d"), im = cx.createImageData(S, S), d = im.data;
      for (var p = 0; p < d.length; p += 4){ var v = (Math.random() * 255) | 0; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; }
      cx.putImageData(im, 0, 0);
      var gr = doc.createElement("div"); gr.className = "grain"; gr.setAttribute("aria-hidden", "true");
      gr.style.backgroundImage = "url(" + cv.toDataURL() + ")";
      doc.body.appendChild(gr);
    } catch (e){}
  }

  /* pointer spotlight on cards */
  doc.querySelectorAll(".cards > article, .cards > a.seg").forEach(function(card){
    card.addEventListener("pointermove", function(e){
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* terminal panels: each line types in after the one before */
  doc.querySelectorAll(".panel.accent .ticks").forEach(function(list){
    Array.prototype.forEach.call(list.children, function(li, n){ li.style.setProperty("--n", n); });
  });

  /* FAQ: the same smooth open/close the approach page uses, for every list
     that doesn't already run its own (#approachFaq and #sbiFaq do) */
  if (!REDUCED){
    doc.querySelectorAll(".faq details").forEach(function(details){
      var list = details.closest(".faq");
      if (list && (list.id === "approachFaq" || list.id === "sbiFaq")) return;
      var summary = details.querySelector("summary"), answer = details.querySelector(".answer");
      if (!summary || !answer) return;
      var wrap = doc.createElement("div"); wrap.className = "answer-wrap";
      answer.parentNode.insertBefore(wrap, answer); wrap.appendChild(answer);
      if (details.open) wrap.classList.add("is-open");
      var animating = false;
      summary.addEventListener("click", function(e){
        e.preventDefault();
        if (animating) return;
        if (details.open){
          animating = true; wrap.classList.remove("is-open");
          var settle = setTimeout(done, 600);
          function done(){ if (!animating) return; animating = false; clearTimeout(settle); wrap.removeEventListener("transitionend", onEnd); details.open = false; }
          function onEnd(ev){ if (ev.propertyName === "grid-template-rows") done(); }
          wrap.addEventListener("transitionend", onEnd);
        } else {
          details.open = true;
          requestAnimationFrame(function(){ wrap.classList.add("is-open"); });
        }
      });
    });
  }

  /* photo heroes ease out of a slight zoom once the picture has loaded */
  doc.querySelectorAll(".phero.imgband .shot img").forEach(function(img){
    function ok(){ img.classList.add("loaded"); }
    if (img.complete) ok(); else img.addEventListener("load", ok);
  });

  /* reading progress on articles */
  var body = doc.querySelector(".post-body");
  if (body){
    var bar = doc.createElement("div"); bar.className = "read-progress"; bar.setAttribute("aria-hidden", "true");
    doc.body.appendChild(bar);
    var tick = false;
    var upd = function(){
      tick = false;
      var r = body.getBoundingClientRect(), vh = win.innerHeight;
      var p = (vh * .35 - r.top) / Math.max(1, r.height - vh * .5);
      bar.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
    };
    win.addEventListener("scroll", function(){ if (!tick){ tick = true; requestAnimationFrame(upd); } }, { passive:true });
    win.addEventListener("resize", upd);
    upd();
  }
})();
