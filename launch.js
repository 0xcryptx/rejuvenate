/* ============================================================
   REJUVENATE — launch countdown
   Until the opening time the whole site sits behind a countdown.
   When it reaches zero (with the page open) a celebration plays,
   then curtains part to reveal the site. Visitors who arrive in the
   first hours after opening get the celebration once too.
   Loaded in <head> without defer so nothing flashes before the lock.
   Add ?launch=preview to the URL to rehearse it with a 10s countdown.
   ============================================================ */
(function () {
  var OPENING = new Date("2026-10-29T18:00:00+04:00").getTime();   // 6pm Dubai time
  var LATE_INTRO_MS = 3 * 60 * 60 * 1000;   // arrivals within 3h of opening still get the intro once
  var SEEN_KEY = "rj_launch_seen";

  var preview = /[?&]launch=preview\b/.test(location.search);
  var target = preview ? Date.now() + 10000 : OPENING;
  var seen = false;
  try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch (e) {}
  var markSeen = function () { try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) {} };

  var now = Date.now();
  var locked = now < target;
  var lateIntro = !locked && !seen && now - target < LATE_INTRO_MS;
  if (!locked && !lateIntro) return;

  var root = document.documentElement;
  root.classList.add("launch-locked");
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var css =
    "html.launch-locked,html.launch-locked body{overflow:hidden!important;height:100%}" +
    "html.launch-locked body>*:not(.launch){visibility:hidden}" +
    "html.launch-revealing body>*:not(.launch){visibility:visible;animation:launch-site 1.6s cubic-bezier(.22,1,.36,1) both}" +
    "@keyframes launch-site{from{transform:scale(1.06);filter:blur(8px)}to{transform:none;filter:none}}" +

    ".launch{position:fixed;inset:0;z-index:100000;color:#E3D7C9;font-family:'Montserrat',Arial,sans-serif;display:grid;place-items:center;overflow:hidden}" +
    ".launch__panel{position:absolute;top:0;bottom:0;width:50.5%;background:radial-gradient(120% 90% at 50% 40%,#430F11 0%,#2a0b0d 45%,#1E080A 100%);background-size:200% 100%;transition:transform 1.5s cubic-bezier(.76,0,.24,1)}" +
    ".launch__panel--l{left:0;background-position:0 0}" +
    ".launch__panel--r{right:0;background-position:100% 0}" +
    ".launch.is-opening .launch__panel--l{transform:translateX(-101%)}" +
    ".launch.is-opening .launch__panel--r{transform:translateX(101%)}" +

    ".launch__glow{position:absolute;inset:-20%;background:radial-gradient(40% 35% at 50% 45%,rgba(190,149,90,.16),transparent 70%);animation:launch-breathe 7s ease-in-out infinite;pointer-events:none}" +
    "@keyframes launch-breathe{50%{transform:scale(1.12);opacity:.7}}" +
    ".launch__motes{position:absolute;inset:0;pointer-events:none}" +
    ".launch__motes i{position:absolute;bottom:-10px;width:var(--s);height:var(--s);border-radius:50%;background:#BE955A;opacity:0;box-shadow:0 0 8px rgba(190,149,90,.8);animation:launch-mote var(--d) linear var(--delay) infinite}" +
    "@keyframes launch-mote{10%{opacity:.7}90%{opacity:.5}to{transform:translate(var(--x),-110vh);opacity:0}}" +

    ".launch__stage{position:relative;text-align:center;padding:0 16px;width:100%;max-width:46rem;transition:opacity .7s ease,transform .9s cubic-bezier(.22,1,.36,1),filter .7s ease}" +
    ".launch.is-celebrating .launch__stage--count{opacity:0;transform:scale(.92);filter:blur(6px);pointer-events:none}" +
    ".launch__mark{display:block;aspect-ratio:1040/960;background:linear-gradient(160deg,#e9cf9f,#BE955A 55%,#9c7440);-webkit-mask:url(/assets/logo/r_logo_transparent.png) center/contain no-repeat;mask:url(/assets/logo/r_logo_transparent.png) center/contain no-repeat}" +
    ".launch__logo{width:clamp(64px,12vw,92px);margin:0 auto 1.6rem;filter:drop-shadow(0 6px 24px rgba(190,149,90,.35));animation:launch-rise 1.2s cubic-bezier(.22,1,.36,1) both}" +
    ".launch__eyebrow{font-size:.72rem;letter-spacing:.42em;text-transform:uppercase;color:#BE955A;margin:0 0 1rem;padding-left:.42em;animation:launch-rise 1.2s .15s cubic-bezier(.22,1,.36,1) both}" +
    ".launch__title{font-family:'Kelvinch','Cormorant Garamond','Playfair Display',Georgia,serif;font-weight:400;font-size:clamp(2.1rem,6.4vw,3.9rem);line-height:1.08;margin:0 0 .9rem;color:#F5F0E8;animation:launch-rise 1.2s .3s cubic-bezier(.22,1,.36,1) both}" +
    ".launch__title em{font-style:italic;color:#BE955A}" +
    ".launch__sub{font-size:clamp(.85rem,2.4vw,.98rem);font-weight:300;line-height:1.7;color:rgba(227,215,201,.75);max-width:30rem;margin:0 auto 2.6rem;animation:launch-rise 1.2s .45s cubic-bezier(.22,1,.36,1) both}" +
    "@keyframes launch-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}" +

    ".launch__clock{display:flex;justify-content:center;align-items:flex-start;gap:clamp(.4rem,2.5vw,1.4rem);animation:launch-rise 1.2s .6s cubic-bezier(.22,1,.36,1) both}" +
    ".launch__unit{min-width:clamp(4.6rem,20vw,7.4rem);padding:clamp(.9rem,3vw,1.4rem) .4rem clamp(.7rem,2.4vw,1rem);border:1px solid rgba(190,149,90,.32);border-radius:18px;background:linear-gradient(180deg,rgba(227,215,201,.07),rgba(227,215,201,.02));box-shadow:0 18px 50px -24px rgba(0,0,0,.7),inset 0 1px 0 rgba(227,215,201,.08);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}" +
    ".launch__num{display:block;height:1em;overflow:hidden;font-family:'Kelvinch','Cormorant Garamond',Georgia,serif;font-size:clamp(2.4rem,9vw,4.2rem);line-height:1;color:#F5F0E8;font-variant-numeric:tabular-nums}" +
    ".launch__num span{display:block}" +
    ".launch__num span.is-new{animation:launch-tick .55s cubic-bezier(.22,1,.36,1)}" +
    "@keyframes launch-tick{from{transform:translateY(-70%);opacity:0;filter:blur(3px)}to{transform:none;opacity:1;filter:none}}" +
    ".launch__label{display:block;margin-top:.55rem;font-size:.62rem;letter-spacing:.3em;text-transform:uppercase;color:#AD9D8E;padding-left:.3em}" +
    ".launch__sep{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(1.8rem,6vw,3rem);color:rgba(190,149,90,.6);padding-top:clamp(.9rem,3vw,1.5rem);animation:launch-blink 2s ease-in-out infinite}" +
    "@keyframes launch-blink{50%{opacity:.25}}" +
    "@media (max-width:520px){.launch__sep{display:none}.launch__clock{gap:.6rem}}" +
    ".launch__when{margin-top:2.2rem;font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:rgba(227,215,201,.5);animation:launch-rise 1.2s .75s cubic-bezier(.22,1,.36,1) both}" +
    ".launch.is-final .launch__unit{border-color:rgba(190,149,90,.75);box-shadow:0 0 40px -6px rgba(190,149,90,.45)}" +

    ".launch__stage--open{position:absolute;opacity:0;pointer-events:none;transform:scale(.9)}" +
    ".launch.is-celebrating .launch__stage--open{opacity:1;transform:none;transition-delay:.35s}" +
    ".launch.is-opening .launch__stage--open{opacity:0;transform:scale(1.15);filter:blur(10px);transition-delay:0s}" +
    ".launch__ring{position:relative;width:clamp(120px,30vw,170px);height:clamp(120px,30vw,170px);margin:0 auto 1.8rem;display:grid;place-items:center}" +
    ".launch__ring::before,.launch__ring::after{content:'';position:absolute;inset:0;border-radius:50%;border:1px solid #BE955A;opacity:0}" +
    ".launch.is-celebrating .launch__ring::before{animation:launch-pulse 2.4s .4s ease-out infinite}" +
    ".launch.is-celebrating .launch__ring::after{animation:launch-pulse 2.4s 1.6s ease-out infinite}" +
    "@keyframes launch-pulse{from{transform:scale(.7);opacity:.9}to{transform:scale(1.9);opacity:0}}" +
    ".launch__ring .launch__mark{width:62%;filter:drop-shadow(0 0 30px rgba(190,149,90,.55))}" +
    ".launch.is-celebrating .launch__ring .launch__mark{animation:launch-pop 1.1s .35s cubic-bezier(.34,1.56,.64,1) both}" +
    "@keyframes launch-pop{from{transform:scale(0) rotate(-25deg);opacity:0}to{transform:none;opacity:1}}" +
    ".launch__open-title{font-family:'Kelvinch','Cormorant Garamond','Playfair Display',Georgia,serif;font-weight:400;font-size:clamp(2.6rem,9vw,5rem);line-height:1;color:#F5F0E8;margin:0 0 1rem}" +
    ".launch__open-title span{display:inline-block;opacity:0}" +
    ".launch.is-celebrating .launch__open-title span{animation:launch-letter .8s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(.7s + var(--i) * .06s)}" +
    "@keyframes launch-letter{from{opacity:0;transform:translateY(.5em) rotate(8deg);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}" +
    ".launch__open-sub{font-size:.75rem;letter-spacing:.4em;text-transform:uppercase;color:#BE955A;padding-left:.4em;opacity:0}" +
    ".launch.is-celebrating .launch__open-sub{animation:launch-rise 1s 1.5s cubic-bezier(.22,1,.36,1) both}" +
    ".launch__confetti{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}" +
    ".launch__glow,.launch__motes,.launch__confetti{transition:opacity .9s ease}" +
    ".launch.is-opening .launch__glow,.launch.is-opening .launch__motes,.launch.is-opening .launch__confetti{opacity:0}" +
    ".launch.is-opening{pointer-events:none}" +

    "@media (prefers-reduced-motion:reduce){.launch *,.launch *::before,.launch *::after{animation:none!important;transition-duration:.01s!important}.launch__open-title span{opacity:1}.launch__open-sub{opacity:1}html.launch-revealing body>*:not(.launch){animation:none}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var pad = function (n) { return n < 10 ? "0" + n : String(n); };

  function build() {
    var el = document.createElement("div");
    el.className = "launch";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Rejuvenate opens soon");

    var motes = "";
    for (var i = 0; i < 26; i++) {
      motes += '<i style="left:' + (Math.random() * 100).toFixed(1) + "%;--s:" + (1.5 + Math.random() * 3).toFixed(1) +
        "px;--d:" + (12 + Math.random() * 14).toFixed(1) + "s;--delay:-" + (Math.random() * 20).toFixed(1) +
        "s;--x:" + (Math.random() * 120 - 60).toFixed(0) + 'px"></i>';
    }
    var unit = function (key, label) {
      return '<div class="launch__unit"><span class="launch__num" data-' + key + '><span>00</span></span><span class="launch__label">' + label + "</span></div>";
    };
    var sep = '<span class="launch__sep" aria-hidden="true">:</span>';
    var letters = "Now Open".split("").map(function (ch, i) {
      return '<span style="--i:' + i + '">' + (ch === " " ? "&nbsp;" : ch) + "</span>";
    }).join("");

    el.innerHTML =
      '<div class="launch__panel launch__panel--l"></div>' +
      '<div class="launch__panel launch__panel--r"></div>' +
      '<div class="launch__glow"></div>' +
      '<div class="launch__motes" aria-hidden="true">' + motes + "</div>" +
      '<canvas class="launch__confetti" aria-hidden="true"></canvas>' +
      '<div class="launch__stage launch__stage--count">' +
        '<span class="launch__mark launch__logo" role="img" aria-label="Rejuvenate"></span>' +
        '<p class="launch__eyebrow">Grand Opening</p>' +
        '<h1 class="launch__title">Something <em>beautiful</em><br />is almost here</h1>' +
        '<p class="launch__sub">Dubai Sports City’s new ladies-only sanctuary for glowing skin is moments away. Get ready to be pampered.</p>' +
        '<div class="launch__clock" role="timer" aria-live="off">' +
          unit("h", "Hours") + sep + unit("m", "Minutes") + sep + unit("s", "Seconds") +
        "</div>" +
        '<p class="launch__when">Opening at 6 PM</p>' +
      "</div>" +
      '<div class="launch__stage launch__stage--open" aria-live="polite">' +
        '<div class="launch__ring"><span class="launch__mark"></span></div>' +
        '<h2 class="launch__open-title" aria-label="Now Open">' + letters + "</h2>" +
        '<p class="launch__open-sub">Welcome to Rejuvenate</p>' +
      "</div>";
    document.body.appendChild(el);
    return el;
  }

  /* Brand-coloured confetti: two cannons from the lower corners, then a gentle shower */
  function confetti(canvas, duration) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H;
    var resize = function () {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    var colors = ["#BE955A", "#E3D7C9", "#AD9D8E", "#F5F0E8", "#d9b77f", "#8a2a2e"];
    var parts = [];
    var spawn = function (x, y, angle, spread, speed, count) {
      for (var i = 0; i < count; i++) {
        var a = angle + (Math.random() - 0.5) * spread;
        var v = speed * (0.55 + Math.random() * 0.6);
        parts.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          w: 5 + Math.random() * 7, h: 3 + Math.random() * 5,
          r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
          tilt: Math.random() * Math.PI, vt: 0.05 + Math.random() * 0.1,
          c: colors[(Math.random() * colors.length) | 0],
          round: Math.random() < 0.3, life: 1
        });
      }
    };
    var burst = function () {
      var s = Math.max(W, H) / 55;
      spawn(0, H, -Math.PI / 3, 0.7, s, 110);
      spawn(W, H, -Math.PI * 2 / 3, 0.7, s, 110);
    };
    burst();
    setTimeout(burst, 650);
    setTimeout(function () { spawn(W / 2, H * 0.42, -Math.PI / 2, Math.PI * 2, Math.max(W, H) / 90, 140); }, 1100);
    var start = performance.now();
    var showerUntil = start + duration - 900;

    (function frame(t) {
      if (t < showerUntil && Math.random() < 0.5) {
        parts.push({ x: Math.random() * W, y: -10, vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 2,
          w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, r: 0, vr: (Math.random() - 0.5) * 0.2,
          tilt: 0, vt: 0.08, c: colors[(Math.random() * colors.length) | 0], round: false, life: 1 });
      }
      ctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.22;
        p.x += p.vx + Math.sin(p.tilt) * 0.6; p.y += p.vy;
        p.r += p.vr; p.tilt += p.vt;
        if (t - start > duration - 700) p.life -= 0.03;
        if (p.y > H + 20 || p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.scale(1, Math.cos(p.tilt));   // flutter
        ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t - start < duration || parts.length) requestAnimationFrame(frame);
      else window.removeEventListener("resize", resize);
    })(start);
  }

  function celebrate(el) {
    markSeen();
    el.classList.remove("is-final");
    el.classList.add("is-celebrating");
    var stay = reduceMotion ? 1500 : 4200;
    if (!reduceMotion) confetti(el.querySelector(".launch__confetti"), stay + 1200);
    setTimeout(function () {
      el.classList.add("is-opening");
      root.classList.add("launch-revealing");
      root.classList.remove("launch-locked");
      setTimeout(function () {
        el.remove();
        style.remove();
        root.classList.remove("launch-revealing");
        document.dispatchEvent(new CustomEvent("rj:launched"));
      }, reduceMotion ? 50 : 1700);
    }, stay);
  }

  function start() {
    var el = build();
    if (!locked) { setTimeout(function () { celebrate(el); }, 150); return; }

    var nodes = { h: el.querySelector("[data-h]"), m: el.querySelector("[data-m]"), s: el.querySelector("[data-s]") };
    var last = {};
    var set = function (key, val) {
      if (last[key] === val) return;
      last[key] = val;
      nodes[key].innerHTML = '<span class="is-new">' + val + "</span>";
    };
    var done = false;
    var tick = function () {
      if (done) return;
      var left = Math.max(0, target - Date.now());
      var secs = Math.ceil(left / 1000);
      set("h", pad(Math.floor(secs / 3600)));
      set("m", pad(Math.floor(secs % 3600 / 60)));
      set("s", pad(secs % 60));
      el.classList.toggle("is-final", secs <= 10 && secs > 0);
      if (left <= 0) { done = true; setTimeout(function () { celebrate(el); }, 600); return; }
      setTimeout(tick, (left % 1000) || 1000);   // land on each whole second
    };
    tick();
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
