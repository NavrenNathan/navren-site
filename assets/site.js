/* ============================================================
   NAVREN, shared site script
   Mega menu + section reveals. Loaded on every page.
   ============================================================ */
(function(){
  "use strict";

  var nav       = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navPanel  = document.getElementById("navPanel");
  var megas     = Array.prototype.slice.call(document.querySelectorAll("[data-mega]"));
  var DESKTOP   = window.matchMedia("(min-width: 901px) and (hover: hover)");

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
  }
  function closeAll(except){
    megas.forEach(function(m){ if (m !== except) setOpen(m, false); });
  }
  function clearTimer(){ if (timer){ clearTimeout(timer); timer = null; } }
  function closeNav(){
    if (navPanel) navPanel.classList.remove("open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }

  megas.forEach(function(item){
    var trigger = item.querySelector(".menu-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function(e){
      e.preventDefault();
      var willOpen = !item.classList.contains("open");
      clearTimer();
      closeAll(item);
      setOpen(item, willOpen);
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
    if (e.key === "Escape"){ clearTimer(); closeAll(null); closeNav(); }
  });
  document.addEventListener("click", function(e){
    if (nav && !nav.contains(e.target)){ clearTimer(); closeAll(null); closeNav(); }
  });

  if (navToggle && navPanel){
    navToggle.addEventListener("click", function(){
      var open = navPanel.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open) closeAll(null);
    });
  }

  /* crossing the desktop/mobile boundary with the drawer open would
     strand it, reset whenever the breakpoint changes */
  if (DESKTOP.addEventListener){
    DESKTOP.addEventListener("change", function(){ clearTimer(); closeAll(null); closeNav(); });
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

    /* Stagger by position within the element's own group, not by
       position in the document. A row of four cards then arrives
       1-2-3-4 instead of inheriting arbitrary delays, which was
       what made the old version look like everything fired at once. */
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
    /* Safety net. A reveal that never fires leaves a whole section
       invisible, which is a far worse failure than losing the animation.
       If anything above the fold hasn't shown itself in two seconds,
       assume the observer isn't working and show everything. */
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
     Arriving is handled entirely in CSS. This half only covers leaving:
     hold the click, fade the panel in, then navigate. Every case this
     deliberately skips just navigates the ordinary way, which is the
     failure mode we want. */
  var root = document.documentElement;

  /* "/index.html" and "/" are the same document; Netlify serves both */
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
     still down, which would strand the visitor on a blank porcelain
     screen. Lift it on the way in. */
  window.addEventListener("pageshow", function(e){
    if (e.persisted) root.classList.remove("is-leaving");
  });
})();

/* ============================================================
   Footer newsletter
   Netlify captures the form from the static markup. We intercept the
   submit so a subscriber is not thrown to a success page from the
   bottom of whatever they were reading; if fetch is unavailable or
   the request fails, the native POST still goes through.
   ============================================================ */
(function(){
  "use strict";

  var form = document.querySelector(".foot-news form");
  if (!form || !window.fetch) return;

  var email = form.querySelector('input[type="email"]');
  var honey = form.querySelector('input[name="company_url"]');
  var state = form.querySelector(".news-state");
  var btn   = form.querySelector("button");

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
      /* A shared machine can have a second person waiting to sign up, so
         the field goes back to being usable rather than staying spent. */
      btn.disabled = false;
    }).catch(function(){
      btn.disabled = false;
      state.className = "news-state fail";
      state.textContent = "Did not send. Email hello@navrenagency.com";
    });
  });
})();
