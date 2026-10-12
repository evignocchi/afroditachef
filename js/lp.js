(function () {
  "use strict";

  var form = document.querySelector("[data-lead-form]");
  if (!form) return;

  var FALLBACK_URL = "https://www.aiclo.io/#contatti";
  var QUESTIONS = 4;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var steps = form.querySelectorAll("[data-step]");
  var bars = form.querySelectorAll("[data-progress]");
  var progressLabel = form.querySelector("[data-progress-label]");
  var booking = form.querySelector("[data-booking]");
  var success = form.querySelector("[data-success]");
  var errorBox = form.querySelector("[data-form-error]");
  var submitBtn = form.querySelector("[data-submit]");
  var bookingUrl = form.getAttribute("data-booking-url") || "";
  var bookingReady = /^https:\/\//.test(bookingUrl) && bookingUrl.indexOf("PLACEHOLDER") === -1;
  var readList = function (attr) { try { return JSON.parse(form.getAttribute(attr) || "[]"); } catch (e) { return []; } };
  var outRoles = readList("data-out-of-target-roles");
  var outSizes = readList("data-out-of-target-sizes");
  var started = false;
  var current = 1;
  var sticky = document.querySelector("[data-sticky]");

  /* Attribution: keep UTM and click ids from the ad, even after in-page navigation */
  var params = new URLSearchParams(window.location.search);
  var attribution = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "li_fat_id", "msclkid"].forEach(function (k) {
    var v = params.get(k);
    if (v) attribution[k] = v;
  });
  try {
    if (Object.keys(attribution).length) sessionStorage.setItem("aiclo_attr", JSON.stringify(attribution));
    else attribution = JSON.parse(sessionStorage.getItem("aiclo_attr") || "{}");
  } catch (e) { /* storage blocked: keep what the URL gave us */ }

  /* Analytics: GTM dataLayer, gtag, Meta pixel and LinkedIn when present */
  var track = function (event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
    if (event === "generate_lead") {
      if (typeof window.gtag === "function") window.gtag("event", "generate_lead", data || {});
      if (typeof window.fbq === "function") window.fbq("track", "Lead", { qualified: data && data.qualified });
      if (window.lintrk) window.lintrk("track");
    }
    if (event === "demo_scheduled") {
      if (typeof window.gtag === "function") window.gtag("event", "demo_scheduled");
      if (typeof window.fbq === "function") window.fbq("track", "Schedule");
    }
  };

  form.addEventListener("focusin", function () {
    if (!started) { started = true; track("lead_form_start"); }
  });

  var picked = function (name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  };

  /* Progress + navigation */
  var setProgress = function (n) {
    bars.forEach(function (b) {
      var i = parseInt(b.getAttribute("data-progress"), 10);
      b.classList.toggle("is-current", i === n);
      b.classList.toggle("is-done", i < n);
    });
    progressLabel.textContent = n <= QUESTIONS ? "Domanda " + n + " di " + QUESTIONS : "Ultimo passo";
  };

  var goTo = function (n) {
    current = n;
    if (sticky) sticky.classList.remove("show");
    steps.forEach(function (s) { s.hidden = s.getAttribute("data-step") !== String(n); });
    setProgress(n);
    var step = form.querySelector('[data-step="' + n + '"]');
    var first = step.querySelector("input:checked") || step.querySelector("input:not([type=radio]), select") || step.querySelector("input");
    if (first) first.focus({ preventScroll: true });
    if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  /* Steps 1-3 are one tap each */
  var fitCopy = {
    "in presenza": "Ottimo: con l’app Aiclo registri anche gli appuntamenti dal vivo, in un tap.",
    "in videocall": "Ottimo: Aiclo entra da solo nelle videocall dal tuo calendario.",
    "al telefono": "Ottimo: le telefonate passano dal VoIP integrato e vengono analizzate in automatico."
  };
  var advanceTimer = null;
  form.querySelectorAll("[data-auto] input").forEach(function (r) {
    r.addEventListener("change", function () {
      var n = parseInt(r.closest("[data-step]").getAttribute("data-step"), 10);
      if (r.name === "channel") form.querySelector("[data-fit]").textContent = fitCopy[r.value] || "";
      track("lead_form_step", { step: n + 1, field: r.name, value: r.value });
      clearTimeout(advanceTimer);
      advanceTimer = setTimeout(function () { goTo(n + 1); }, reduce ? 0 : 260);
    });
  });
  form.querySelectorAll("[data-back]").forEach(function (b) {
    b.addEventListener("click", function () { goTo(Math.max(1, current - 1)); });
  });

  /* Validation of the contact step */
  var setError = function (field, msg) {
    var wrap = field.closest(".field");
    var err = wrap ? wrap.querySelector(".field-error") : null;
    if (msg) {
      field.setAttribute("aria-invalid", "true");
      if (err) { err.textContent = msg; err.hidden = false; }
    } else {
      field.removeAttribute("aria-invalid");
      if (err) { err.hidden = true; err.textContent = ""; }
    }
    return !msg;
  };
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var privErr = document.getElementById("f-privacy-err");

  var validateContacts = function () {
    var ok = true, first = null, f = form.elements;
    var mark = function (el, msg) { if (!setError(el, msg)) { ok = false; first = first || el; } };
    mark(f.first_name, !f.first_name.value.trim() ? "Inserisci il tuo nome." : "");
    mark(f.last_name, !f.last_name.value.trim() ? "Inserisci il tuo cognome." : "");
    var v = f.email.value.trim();
    mark(f.email, !v ? "Inserisci la tua email aziendale." : !emailRe.test(v) ? "Controlla l’email: sembra incompleta (es. nome@azienda.it)." : "");
    var digits = f.phone.value.replace(/\D/g, "");
    mark(f.phone, !digits ? "Inserisci un numero di telefono: serve allo specialista se la call salta." : digits.length < 8 ? "Il numero sembra troppo corto: controllalo." : "");
    mark(f.company, !f.company.value.trim() ? "Inserisci il nome dell’azienda." : "");
    if (!f.privacy.checked) {
      ok = false; first = first || f.privacy;
      privErr.textContent = "Per inviare la richiesta serve il consenso al trattamento dei dati.";
      privErr.hidden = false;
    } else { privErr.hidden = true; }
    if (first) first.focus();
    return ok;
  };

  form.addEventListener("input", function (e) {
    var t = e.target;
    if (t.getAttribute("aria-invalid") === "true") setError(t, "");
    if (t.name === "privacy" && t.checked) privErr.hidden = true;
  });

  var showFormError = function () {
    errorBox.textContent = "Non siamo riusciti a inviare la richiesta. Riprova tra un momento oppure ";
    var a = document.createElement("a");
    a.href = FALLBACK_URL; a.textContent = "richiedi la demo dal sito Aiclo"; a.target = "_blank"; a.rel = "noopener";
    errorBox.append(a, ".");
    errorBox.hidden = false;
  };

  var finish = function (panel, data) {
    steps.forEach(function (s) { s.hidden = true; });
    form.querySelectorAll("[data-success-email]").forEach(function (el) { el.textContent = data.email; });
    panel.hidden = false;
    panel.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  };

  /* Qualified leads book straight away; the rest get a callback message */
  var showBooking = function (data) {
    form.classList.add("is-booking");
    setProgress(5);
    var cal = form.querySelector("[data-cal]");
    var link = form.querySelector("[data-cal-link]");
    if (bookingReady) {
      var u = new URL(bookingUrl);
      u.searchParams.set("first_name", data.first_name);
      u.searchParams.set("last_name", data.last_name);
      u.searchParams.set("name", data.first_name + " " + data.last_name);
      u.searchParams.set("email", data.email);
      u.searchParams.set("phone", data.phone);
      Object.keys(attribution).forEach(function (k) { if (k.indexOf("utm_") === 0) u.searchParams.set(k, attribution[k]); });
      var frame = document.createElement("iframe");
      frame.src = u.toString();
      frame.title = "Calendario per prenotare la demo";
      cal.appendChild(frame);
      link.href = u.toString();
    } else {
      cal.classList.add("is-placeholder");
      cal.innerHTML = "<div><b>Qui apparirà il calendario per prenotare</b>Già compilato con nome, email e telefono.</div>";
      link.hidden = true;
    }
    finish(booking, data);
  };

  /* Booking confirmations reported by the embedded calendar */
  window.addEventListener("message", function (e) {
    var d = e.data;
    var text = typeof d === "string" ? d : (d && (d.event || d.type || d.action)) || "";
    if (/calendly\.event_scheduled|booking[-_ ]?(complete|success|confirmed)|appointment[-_ ]?(booked|created)/i.test(String(text))) {
      track("demo_scheduled");
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (current !== QUESTIONS) return;
    if (!validateContacts()) return;
    errorBox.hidden = true;

    var f = form.elements;
    var data = {
      role: picked("role"),
      team_size: picked("team_size"),
      channel: picked("channel"),
      first_name: f.first_name.value.trim(),
      last_name: f.last_name.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      company: f.company.value.trim(),
      privacy_consent: true,
      company_website: f.company_website.value,
      page: window.location.pathname,
      referrer: document.referrer || "",
      submitted_at: new Date().toISOString()
    };
    data.name = data.first_name + " " + data.last_name;
    data.qualified = outRoles.indexOf(data.role) === -1 && outSizes.indexOf(data.team_size) === -1;
    Object.keys(attribution).forEach(function (k) { data[k] = attribution[k]; });

    submitBtn.setAttribute("aria-busy", "true");
    submitBtn.disabled = true;
    var label = submitBtn.querySelector("span");
    var labelText = label.textContent;
    label.textContent = "Un attimo…";

    fetch(form.getAttribute("data-endpoint"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      /* 503 = CRM not connected yet: the booking calendar still captures the lead */
      if (!res.ok && res.status !== 503) throw new Error("HTTP " + res.status);
      track("generate_lead", { qualified: data.qualified, role: data.role, team_size: data.team_size, channel: data.channel });
      if (data.qualified) showBooking(data);
      else { form.classList.add("is-sent"); setProgress(5); finish(success, data); }
    }).catch(function () {
      showFormError();
      track("lead_form_error");
    }).then(function () {
      submitBtn.removeAttribute("aria-busy");
      submitBtn.disabled = false;
      label.textContent = labelText;
    });
  });

  /* Every CTA lands on the form */
  document.querySelectorAll("[data-focus-form]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var host = a.closest("section, header, .lp-sticky");
      track("cta_click", { location: host ? host.className.split(" ")[0] : "" });
      form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var target = form.querySelector(".lp-step:not([hidden]) input");
      if (target) setTimeout(function () { target.focus({ preventScroll: true }); }, 450);
    });
  });

  /* Mobile sticky CTA: shown once the form is out of view, hidden near the closing CTA */
  var closing = document.querySelector("[data-closing]");
  if (sticky && "IntersectionObserver" in window) {
    var formVisible = true, closingVisible = false;
    var update = function () {
      var show = !formVisible && !closingVisible && current === 1 && !form.classList.contains("is-sent") && !form.classList.contains("is-booking");
      sticky.classList.toggle("show", show);
      sticky.setAttribute("aria-hidden", String(!show));
      sticky.querySelector("a").tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; update(); }).observe(form);
    if (closing) new IntersectionObserver(function (en) { closingVisible = en[0].isIntersecting; update(); }).observe(closing);
  }
})();
