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

  /* Mobile menu (full-width dropdown) */
  if (toggle) {
    function closeNav() {
      body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    /* Close after tapping a link */
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    /* Close when tapping anywhere outside the header */
    document.addEventListener("click", function (e) {
      if (body.classList.contains("nav-open") && header && !header.contains(e.target)) {
        closeNav();
      }
    });
    /* Esc closes it */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && body.classList.contains("nav-open")) closeNav();
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

  /* Contact form: send to Web3Forms in the background and report inline */
  var contactForm = document.getElementById("contact-form");
  if (contactForm && window.fetch) {
    var status = contactForm.querySelector(".form__status");
    var submitBtn = contactForm.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : "";
    var phoneInput = document.getElementById("phone");

    /* Message box grows to fit what's typed instead of scrolling */
    var textareas = contactForm.querySelectorAll("textarea");
    var autoResize = function (t) {
      t.style.height = "auto";
      t.style.height = t.scrollHeight + 2 + "px";   // +2 for the top/bottom border
    };
    Array.prototype.forEach.call(textareas, function (t) {
      autoResize(t);
      t.addEventListener("input", function () { autoResize(t); });
    });
    var phoneMessage = "Enter a complete mobile number in the format shown for this country.";

    /* Country dial-code picker, same setup as buildyourweb.ae (intl-tel-input) */
    var iti = phoneInput && window.intlTelInput
      ? window.intlTelInput(phoneInput, {
          initialCountry: "ae",
          countryOrder: ["ae"],
          separateDialCode: true,
          nationalMode: true,
          loadUtils: function () { return import("https://cdn.jsdelivr.net/npm/intl-tel-input@27.0.0/dist/js/utils.js"); },
          autoPlaceholder: "aggressive",
          placeholderNumberType: "MOBILE",
          formatAsYouType: true,
          formatOnDisplay: true,
          strictMode: true,
          allowedNumberTypes: ["MOBILE"],
          countrySearch: false,
          useFullscreenPopup: false
        })
      : null;

    var phoneIsValid = function () {
      if (!iti || !window.intlTelInput.utils) return phoneInput.value.trim().length > 0;
      return iti.isValidNumber() === true;
    };
    var phoneE164 = function () {
      if (!iti) return phoneInput.value.trim();
      var utils = window.intlTelInput.utils;
      return utils ? iti.getNumber(utils.numberFormat.E164) : "+" + iti.getSelectedCountryData().dialCode + phoneInput.value.replace(/\D/g, "");
    };

    if (iti) {
      /* Keep the UAE first in the country list, with no divider */
      var pinUaeToTop = function () {
        var list = phoneInput.closest(".iti").querySelector(".iti__country-list");
        var uae = list && list.querySelector('.iti__country[data-country-code="ae"]');
        if (!uae) return;
        var divider = list.querySelector(".iti__divider");
        if (divider) divider.remove();
        if (list.firstElementChild !== uae) list.insertBefore(uae, list.firstChild);
      };
      /* Pad the number so it starts after the flag + dial code, whatever its width */
      var updatePhoneOffset = function () {
        var wrap = phoneInput.closest(".iti");
        var selected = wrap && wrap.querySelector(".iti__selected-country");
        if (selected) wrap.style.setProperty("--phone-input-offset", Math.ceil(selected.getBoundingClientRect().width) + 14 + "px");
      };
      pinUaeToTop();
      updatePhoneOffset();
      iti.promise.then(updatePhoneOffset);
      window.addEventListener("resize", updatePhoneOffset);
      phoneInput.addEventListener("countrychange", function () { pinUaeToTop(); updatePhoneOffset(); });
      phoneInput.addEventListener("open:countrydropdown", pinUaeToTop);
      phoneInput.addEventListener("input", function () { phoneInput.setCustomValidity(""); });
      phoneInput.addEventListener("blur", function () {
        var value = phoneInput.value.trim();
        if (!value || !window.intlTelInput.utils) return;
        if (phoneIsValid()) iti.setNumber(phoneE164());   // tidy to national format
        else phoneInput.setCustomValidity(phoneMessage);
      });
    }

    /* Every field is required; whitespace-only answers are rejected on submit */
    var textFields = contactForm.querySelectorAll('input[required]:not([type="tel"]), textarea[required]');
    Array.prototype.forEach.call(textFields, function (f) {
      f.addEventListener("input", function () { f.setCustomValidity(""); });
    });

    /* Confirmation dialog shown after a successful send */
    var confirmEl = document.getElementById("enquiryConfirm");
    var lastFocus = null;
    var showConfirm = function (fullName) {
      if (!confirmEl) return;
      var first = String(fullName || "").trim().split(/\s+/)[0];
      confirmEl.querySelector("[data-confirm-name]").textContent = first ? ", " + first : "";
      lastFocus = document.activeElement;
      confirmEl.classList.add("is-visible");
      confirmEl.setAttribute("aria-hidden", "false");
      confirmEl.querySelector(".confirm__actions .btn").focus();
    };
    var hideConfirm = function () {
      if (!confirmEl || !confirmEl.classList.contains("is-visible")) return;
      confirmEl.classList.remove("is-visible");
      confirmEl.setAttribute("aria-hidden", "true");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    if (confirmEl) {
      Array.prototype.forEach.call(confirmEl.querySelectorAll("[data-confirm-close]"), function (btn) {
        btn.addEventListener("click", hideConfirm);
      });
      confirmEl.addEventListener("click", function (e) { if (e.target === confirmEl) hideConfirm(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideConfirm(); });
    }

    /* Test button: localhost, or add ?test to the URL on the live site */
    var testBtn = document.getElementById("testConfirmBtn");
    if (testBtn && (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /[?&]test\b/.test(location.search))) {
      testBtn.hidden = false;
      testBtn.addEventListener("click", function () {
        showConfirm(document.getElementById("name").value || "Sarah");
      });
    }

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (phoneInput) phoneInput.setCustomValidity(phoneInput.value.trim() && !phoneIsValid() ? phoneMessage : "");
      Array.prototype.forEach.call(textFields, function (f) {
        f.setCustomValidity(f.value.trim() ? "" : "Please fill in this field.");   // spaces alone don't count
      });
      if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }

      var data = new FormData(contactForm);
      data.delete("phone_raw");
      data.set("phone", phoneE164());
      data.set("subject", "New enquiry: " + (data.get("treatment") || "Rejuvenate website"));

      status.textContent = "";
      status.className = "form__status";
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(contactForm.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (!result.success) throw new Error(result.message);
          showConfirm(data.get("name"));
          contactForm.reset();
          if (iti) iti.setCountry("ae");
          Array.prototype.forEach.call(textareas, autoResize);
        })
        .catch(function () {
          status.textContent = "Sorry, something went wrong. Please try again or message us on WhatsApp.";
          status.className = "form__status is-error";
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        });
    });
  }

  /* Floating WhatsApp button (bottom-right, every page) */
  var wa = document.createElement("a");
  wa.href = "https://wa.me/971585747641?text=" +
    encodeURIComponent("Hi Rejuvenate! I'm interested in your services and would love to know more.");
  wa.target = "_blank";
  wa.rel = "noopener noreferrer";
  wa.className = "wa-float-btn";
  wa.setAttribute("aria-label", "Chat with us on WhatsApp");
  wa.innerHTML =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#fff" d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.657 4.522 1.796 6.382L4 29l7.82-1.75A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.978 16.47c-.29.816-1.44 1.5-2.36 1.696-.63.132-1.452.238-4.22-.906-3.542-1.464-5.82-5.05-6-5.286-.176-.236-1.432-1.906-1.432-3.636s.91-2.578 1.234-2.932c.29-.316.63-.396.842-.396.212 0 .424.002.61.012.196.01.46-.074.72.55.29.686.982 2.416 1.068 2.592.086.176.144.382.028.618-.116.236-.174.382-.34.588-.176.204-.36.454-.514.61-.176.176-.36.366-.154.72.206.354.914 1.51 1.964 2.446 1.35 1.204 2.49 1.578 2.844 1.754.354.176.562.146.77-.088.206-.236.884-1.032 1.12-1.386.236-.354.472-.294.796-.176.324.118 2.058.972 2.41 1.148.354.176.588.264.674.412.088.148.088.858-.202 1.672Z"/></svg>';
  body.appendChild(wa);
})();
