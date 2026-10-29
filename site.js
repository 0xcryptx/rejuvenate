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

  /* Opening-list sign-up pop-up (every page).
     Opens once on the first visit; closing it minimises it to a tab beside the
     WhatsApp button so it can be reopened. Sign-ups go to the same Mailchimp
     audience as the landing page. Add ?signup to the URL to force it open. */
  var MC_ACTION = "https://rejuvenatedubai.us15.list-manage.com/subscribe/post?u=8a2bebb624728ae501601b12b&id=796b919c5e&f_id=00fd9de1f0";
  var SIGNUP_KEY = "rj_signup";   // "minimized" once closed, "joined" once signed up
  var signupState = null;
  try { signupState = localStorage.getItem(SIGNUP_KEY); } catch (e) {}
  var forceSignup = /[?&]signup\b/.test(location.search);
  var saveSignupState = function (v) { try { localStorage.setItem(SIGNUP_KEY, v); } catch (e) {} };

  if (signupState !== "joined" || forceSignup) {
    var closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    var pop = document.createElement("div");
    pop.className = "confirm signup-pop";
    pop.setAttribute("aria-hidden", "true");
    pop.innerHTML =
      '<div class="confirm__card" role="dialog" aria-modal="true" aria-labelledby="signupTitle">' +
        '<div class="signup-pop__timer" aria-hidden="true"><i></i></div>' +
        '<button type="button" class="confirm__close" aria-label="Minimise" data-signup-close>' + closeIcon + '</button>' +
        '<div class="signup-pop__body" data-signup-view="form">' +
          '<div class="signup-pop__intro">' +
            '<img class="confirm__mark" src="/assets/logo/r_logo_transparent.png" alt="" aria-hidden="true" />' +
            '<p class="eyebrow">Opening list</p>' +
            '<h2 class="display confirm__title" id="signupTitle">A gift for your first visit</h2>' +
            '<p class="confirm__text"><strong>AED 100 off your first treatment</strong> and a complimentary skin consultation when you join our opening list.</p>' +
          '</div>' +
          '<form class="signup-pop__form" novalidate>' +
            '<div class="signup-pop__row">' +
              '<div class="field"><label for="su-first">First name</label><input id="su-first" name="firstName" type="text" autocomplete="given-name" required /></div>' +
              '<div class="field"><label for="su-last">Last name</label><input id="su-last" name="lastName" type="text" autocomplete="family-name" required /></div>' +
            '</div>' +
            '<div class="field"><label for="su-email">Email</label><input id="su-email" name="email" type="email" autocomplete="email" inputmode="email" required /></div>' +
            '<div class="field"><label for="su-phone">Mobile number</label><input id="su-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+971 50 123 4567" required /></div>' +
            '<label class="signup-pop__consent"><input name="consent" type="checkbox" required /><span>I’d like to hear from Rejuvenate about the opening and offers by email, SMS or WhatsApp.</span></label>' +
            '<button type="submit" class="btn btn--dark">Claim my gift</button>' +
            '<p class="form__status" role="status" aria-live="polite"></p>' +
            '<p class="signup-pop__note">Your details are used only by Rejuvenate to contact you about the opening and offers.</p>' +
          '</form>' +
        '</div>' +
        '<div data-signup-view="thanks" hidden>' +
          '<img class="confirm__mark" src="/assets/logo/r_logo_transparent.png" alt="" aria-hidden="true" />' +
          '<p class="eyebrow">You’re on the list</p>' +
          '<h2 class="display confirm__title">Thank you<span data-signup-name></span></h2>' +
          '<p class="confirm__text">Your AED 100 welcome gift and complimentary skin consultation will be waiting for your first visit.</p>' +
          '<div class="confirm__actions"><button type="button" class="btn btn--dark" data-signup-close>Done</button></div>' +
        '</div>' +
      '</div>';
    body.appendChild(pop);

    var tab = document.createElement("button");
    tab.type = "button";
    tab.className = "signup-tab";
    tab.setAttribute("aria-label", "Open the opening list sign-up: AED 100 off your first treatment");
    tab.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-5-3.5-5-1.25C7 8 9.5 8 12 8Zm0 0c1.5-3 5-3.5 5-1.25C17 8 14.5 8 12 8Z"/></svg>' +
      '<span>AED 100 off</span>';
    body.appendChild(tab);

    var suForm = pop.querySelector("form");
    var suStatus = suForm.querySelector(".form__status");
    var suBtn = suForm.querySelector('button[type="submit"]');
    var suLabel = suBtn.textContent;
    var suPhone = suForm.querySelector('[name="phone"]');
    var suLastFocus = null;
    var joined = false;

    var showTab = function (on) { tab.classList.toggle("is-visible", on); };

    /* When it opens by itself, a bar counts down and then minimises it.
       Any interaction with the card stops the countdown; opening it from the tab has none. */
    var AUTO_CLOSE_MS = 5000;
    var autoCloseTimer = null;
    var timerFill = pop.querySelector(".signup-pop__timer i");
    var stopAutoClose = function () {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
      pop.classList.remove("is-counting");
    };
    var startAutoClose = function () {
      timerFill.style.transition = "none";
      timerFill.style.transform = "scaleX(1)";
      pop.classList.add("is-counting");
      timerFill.getBoundingClientRect();   // apply the full bar before animating it down
      timerFill.style.transition = "transform " + AUTO_CLOSE_MS + "ms linear";
      timerFill.style.transform = "scaleX(0)";
      autoCloseTimer = setTimeout(function () { stopAutoClose(); closeSignup(); }, AUTO_CLOSE_MS);
    };
    ["pointerdown", "keydown", "input"].forEach(function (type) {
      pop.querySelector(".confirm__card").addEventListener(type, function () { if (autoCloseTimer) stopAutoClose(); });
    });

    var openSignup = function (auto) {
      suLastFocus = document.activeElement;
      if (!joined && signupState !== "joined") saveSignupState("minimized");   // only auto-open once, even if they navigate away
      showTab(false);
      document.documentElement.classList.add("signup-lock");   // no page scrolling behind it
      pop.classList.add("is-visible");
      pop.setAttribute("aria-hidden", "false");
      if (auto === true) {
        pop.querySelector(".confirm__close").focus({ preventScroll: true });
        startAutoClose();
      } else {
        pop.querySelector(joined ? '[data-signup-view="thanks"] .btn' : "#su-first").focus({ preventScroll: true });
      }
    };
    var minimizing = false;
    var hidePop = function () {
      pop.classList.remove("is-visible");
      pop.setAttribute("aria-hidden", "true");
    };
    /* Show the tab at once, with no slide-in, so it can take over from the morphing shape */
    var snapTabIn = function () {
      tab.style.transition = "none";
      showTab(true);
      tab.getBoundingClientRect();
      tab.style.transition = "";
    };
    /* Minimise in two beats: the card's content fades out, then an identical empty
       card (the ghost) takes its place and glides into the tab's spot beside WhatsApp,
       blending its corners, border and shadow into the tab's before handing over to it.
       Morphing a separate empty shape keeps text from ever being squashed. */
    var minimizeToTab = function () {
      var card = pop.querySelector(".confirm__card");
      var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion || !card.animate) { hidePop(); showTab(true); return; }
      minimizing = true;
      pop.classList.add("is-emptying");

      setTimeout(function () {
        var c = card.getBoundingClientRect();
        tab.style.transform = "none";   // measure where the tab rests, not its hidden offset
        var t = tab.getBoundingClientRect();
        tab.style.transform = "";

        var ghost = document.createElement("div");
        ghost.className = "signup-ghost";
        ghost.style.cssText = "left:" + c.left + "px;top:" + c.top + "px;width:" + c.width + "px;height:" + c.height + "px";
        body.appendChild(ghost);
        card.style.visibility = "hidden";   // the ghost now stands in for the card
        hidePop();                          // backdrop fades out underneath

        var morph = ghost.animate([
          { left: c.left + "px", top: c.top + "px", width: c.width + "px", height: c.height + "px",
            borderRadius: "26px", borderColor: "rgba(58, 27, 20, 0.14)", boxShadow: "0 18px 50px -24px rgba(37, 36, 32, 0.45)" },
          { left: t.left + "px", top: t.top + "px", width: t.width + "px", height: t.height + "px",
            borderRadius: "22px", borderColor: "rgba(190, 149, 90, 1)", boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)" }
        ], { duration: 560, easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "forwards" });

        morph.onfinish = function () {
          snapTabIn();   // the real tab sits exactly under the ghost
          card.style.visibility = "";
          pop.classList.remove("is-emptying");
          ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-out", fill: "forwards" })
            .onfinish = function () { ghost.remove(); minimizing = false; };
        };
      }, 160);
    };
    var closeSignup = function () {
      if (!pop.classList.contains("is-visible") || minimizing) return;
      stopAutoClose();
      document.documentElement.classList.remove("signup-lock");
      if (joined) {
        hidePop();
        tab.remove();
      } else {
        saveSignupState("minimized");
        minimizeToTab();
      }
      if (suLastFocus && suLastFocus.focus) suLastFocus.focus({ preventScroll: true });
    };

    Array.prototype.forEach.call(pop.querySelectorAll("[data-signup-close]"), function (btn) {
      btn.addEventListener("click", closeSignup);
    });
    pop.addEventListener("click", function (e) { if (e.target === pop) closeSignup(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSignup(); });
    tab.addEventListener("click", function () { openSignup(false); });

    /* Mailchimp's embedded form posts cross-site, so use its JSONP endpoint to get a real reply */
    var mailchimpSubscribe = function (entry) {
      return new Promise(function (resolve, reject) {
        var cb = "mc_cb_" + Date.now();
        var params = { EMAIL: entry.email, FNAME: entry.firstName, LNAME: entry.lastName, PHONE: entry.phone, c: cb };
        var qs = Object.keys(params).map(function (k) { return "&" + k + "=" + encodeURIComponent(params[k]); }).join("");
        var script = document.createElement("script");
        var cleanup = function () { delete window[cb]; script.remove(); clearTimeout(timer); };
        var timer = setTimeout(function () { cleanup(); reject(new Error("network")); }, 10000);
        window[cb] = function (res) {
          cleanup();
          if (res.result === "success" || /already subscribed/i.test(res.msg || "")) resolve();
          else reject(new Error(res.msg || "rejected"));
        };
        script.onerror = function () { cleanup(); reject(new Error("network")); };
        script.src = MC_ACTION.replace("/subscribe/post?", "/subscribe/post-json?") + qs;
        body.appendChild(script);
      });
    };

    Array.prototype.forEach.call(suForm.querySelectorAll("input"), function (f) {
      f.addEventListener("input", function () { f.setCustomValidity(""); });
    });

    suForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var get = function (n) { return suForm.elements[n].value.trim(); };
      ["firstName", "lastName"].forEach(function (n) {
        suForm.elements[n].setCustomValidity(get(n) ? "" : "Please fill in this field.");
      });
      var digits = get("phone").replace(/\D/g, "");
      suPhone.setCustomValidity(/^[+\d\s()-]+$/.test(get("phone")) && digits.length >= 8 && digits.length <= 15
        ? "" : "Please enter a mobile number, like +971 50 123 4567.");
      suForm.elements.consent.setCustomValidity(suForm.elements.consent.checked
        ? "" : "Please tick the box so we can send you your welcome gift.");
      if (!suForm.checkValidity()) { suForm.reportValidity(); return; }

      var entry = { firstName: get("firstName"), lastName: get("lastName"), email: get("email").toLowerCase(), phone: get("phone") };
      suStatus.textContent = "";
      suStatus.className = "form__status";
      suBtn.disabled = true;
      suBtn.textContent = "Joining…";

      mailchimpSubscribe(entry)
        .then(function () {
          joined = true;
          saveSignupState("joined");
          pop.querySelector("[data-signup-name]").textContent = ", " + entry.firstName;
          pop.classList.add("is-joined");
          pop.querySelector('[data-signup-view="form"]').hidden = true;
          pop.querySelector('[data-signup-view="thanks"]').hidden = false;
          pop.querySelector('[data-signup-view="thanks"] .btn').focus({ preventScroll: true });
        })
        .catch(function (err) {
          suStatus.textContent = err.message === "network"
            ? "We couldn’t save your details just now. Please check your connection and try again."
            : "We couldn’t add you to the list. Please check your email and mobile number and try again.";
          suStatus.className = "form__status is-error";
        })
        .then(function () {
          suBtn.disabled = false;
          suBtn.textContent = suLabel;
        });
    });

    /* First visit: open after a short pause (remembered from then on, so it only ever
       auto-opens once). Later visits: just the tab. Nothing shows on the booking pages
       until the pop-up has been seen elsewhere, so it can't interrupt a booking. */
    /* While the launch countdown covers the site, wait until it has been revealed */
    var whenLaunched = function (fn) {
      if (document.documentElement.classList.contains("launch-locked")) document.addEventListener("rj:launched", fn, { once: true });
      else fn();
    };
    if (forceSignup || (!signupState && !/^\/book\//.test(location.pathname))) {
      whenLaunched(function () { setTimeout(function () { openSignup(true); }, forceSignup ? 0 : 3000); });
    } else if (signupState === "minimized") {
      whenLaunched(function () { showTab(true); });
    }
  }
})();
