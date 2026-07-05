/* REJUVENATE — lightweight site interactions (no dependencies) */
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var body = document.body;

  /* Scroll-progress bar attached to the bottom of the navbar */
  var progressFill = null;
  if (header) {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    progressFill = document.createElement("i");
    bar.appendChild(progressFill);
    header.appendChild(bar);
  }

  /* Sticky header: solid once the user scrolls past the hero top,
     plus update the scroll-progress bar */
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    if (progressFill) {
      var st = window.scrollY || document.documentElement.scrollTop;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var p = docH > 0 ? Math.min(1, Math.max(0, st / docH)) : 0;
      progressFill.style.transform = "scaleX(" + p + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    /* Close the menu after tapping a link */
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    /* Esc closes it */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && body.classList.contains("nav-open")) {
        body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Reveal-on-scroll */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
