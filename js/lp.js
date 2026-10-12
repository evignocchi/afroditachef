(function () {
  "use strict";

  var form = document.querySelector("[data-lead-form]");
  if (!form) return;

  var FALLBACK_URL = "https://www.aiclo.io/#contatti";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var steps = form.querySelectorAll("[data-step]");
  var progress = form.querySelectorAll("[data-progress]");
  var booking = form.querySelector("[data-booking]");
  var success = form.querySelector("[data-success]");
  var errorBox = form.querySelector("[data-form-error]");
  var submitBtn = form.querySelector("[data-submit]");
  var bookingUrl = form.getAttribute("data-booking-url") || "";
  var bookingReady = bookingUrl && bookingUrl.indexOf("PLACEHOLDER") === -1;
  var started = false;

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
      if (typeof window.fbq === "function") window.fbq("track", "Lead");
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

  /* Validation */
  var setError = function (field, msg) {
    var wrap = field.closest(".field");
    var err = wrap ? wrap.querySelector(".field-error") : null;
    if (msg) {
      field.setAttribute("aria-invalid", "true");
      if (err) { err.textContent = msg; err.hidden = false; if (err.id) field.setAttribute("aria-describedby", err.id); }
    } else {
      field.removeAttribute("aria-invalid");
      if (err) { err.hidden = true; err.textContent = ""; }
    }
    return !msg;
  };

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var teamErr = document.getElementById("f-team-err");
  var privErr = document.getElementById("f-privacy-err");
  var chips = form.querySelector(".chips");

  var validateTeam = function () {
    if (form.querySelector('input[name="team_size"]:checked')) {
      chips.removeAttribute("aria-invalid"); teamErr.hidden = true; return true;
    }
    chips.setAttribute("aria-invalid", "true");
    teamErr.textContent = "Scegli la dimensione del team: ci serve per preparare la demo giusta.";
    teamErr.hidden = false;
    chips.querySelector("input").focus();
    return false;
  };

  var validateContacts = function () {
    var ok = true, first = null;
    var mark = function (el, msg) { if (!setError(el, msg)) { ok = false; first = first || el; } };
    var v = form.elements.email.value.trim();
    mark(form.elements.email, !v ? "Inserisci la tua email aziendale." : !emailRe.test(v) ? "Controlla l’email: sembra incompleta (es. nome@azienda.it)." : "");
    mark(form.elements.name, form.elements.name.value.trim().length < 2 ? "Inserisci nome e cognome." : "");
    mark(form.elements.company, !form.elements.company.value.trim() ? "Inserisci il nome dell’azienda." : "");
    mark(form.elements.role, !form.elements.role.value ? "Seleziona il tuo ruolo." : "");
    if (!form.elements.privacy.checked) {
      ok = false; first = first || form.elements.privacy;
      privErr.textContent = "Per fissare la demo serve il consenso al contatto.";
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

  var setProgress = function (n) {
    progress.forEach(function (p) {
      var i = parseInt(p.getAttribute("data-progress"), 10);
      p.classList.toggle("is-current", i === n);
      p.classList.toggle("is-done", i < n);
    });
  };

  var goTo = function (n) {
    steps.forEach(function (s) { s.hidden = s.getAttribute("data-step") !== String(n); });
    setProgress(n);
    var firstInput = form.querySelector('[data-step="' + n + '"] input:not([type=radio]), [data-step="' + n + '"] select');
    if (firstInput) firstInput.focus({ preventScroll: true });
  };

  /* Step 1 is a single tap: picking a team size moves on */
  var advanceTimer = null;
  form.querySelectorAll('input[name="team_size"]').forEach(function (r) {
    r.addEventListener("change", function () {
      validateTeam();
      clearTimeout(advanceTimer);
      advanceTimer = setTimeout(function () {
        track("lead_form_step", { step: 2, team_size: r.value });
        goTo(2);
      }, reduce ? 0 : 280);
    });
  });
  form.querySelector("[data-back]").addEventListener("click", function () { goTo(1); });

  var showFormError = function () {
    errorBox.textContent = "Non siamo riusciti a inviare la richiesta. Riprova tra un momento oppure ";
    var a = document.createElement("a");
    a.href = FALLBACK_URL; a.textContent = "richiedi la demo dal sito Aiclo"; a.target = "_blank"; a.rel = "noopener";
    errorBox.append(a, ".");
    errorBox.hidden = false;
  };

  /* Step 3: booking calendar, prefilled with what the visitor already typed */
  var showBooking = function (data) {
    steps.forEach(function (s) { s.hidden = true; });
    form.classList.add("is-booking");
    setProgress(3);
    form.querySelector("[data-success-email]").textContent = data.email;
    var cal = form.querySelector("[data-cal]");
    var link = form.querySelector("[data-cal-link]");
    if (bookingReady) {
      var u = new URL(bookingUrl);
      u.searchParams.set("name", data.name);
      u.searchParams.set("email", data.email);
      Object.keys(attribution).forEach(function (k) { if (k.indexOf("utm_") === 0) u.searchParams.set(k, attribution[k]); });
      var embed = new URL(u.toString());
      embed.searchParams.set("embed_domain", window.location.hostname);
      embed.searchParams.set("embed_type", "Inline");
      embed.searchParams.set("hide_gdpr_banner", "1");
      var frame = document.createElement("iframe");
      frame.src = embed.toString();
      frame.title = "Calendario per prenotare la demo";
      frame.loading = "lazy";
      cal.appendChild(frame);
      link.href = u.toString();
    } else {
      cal.classList.add("is-placeholder");
      cal.innerHTML = "<div><b>Qui apparirà il calendario per prenotare</b>Calendly, HubSpot Meetings o Google Calendar, già compilato con nome ed email.</div>";
      var tag = document.createElement("span");
      tag.className = "ph-tag"; tag.textContent = "Segnaposto";
      cal.appendChild(tag);
      link.hidden = true;
    }
    booking.hidden = false;
    booking.focus({ preventScroll: true });
    booking.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  };

  /* Calendly reports a confirmed booking via postMessage */
  window.addEventListener("message", function (e) {
    if (!/calendly\.com$/.test(new URL(e.origin, location.href).hostname)) return;
    if (e.data && e.data.event === "calendly.event_scheduled") {
      track("demo_scheduled");
      booking.hidden = true;
      form.classList.add("is-sent");
      success.hidden = false;
      success.focus();
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!steps[0].hidden) { validateTeam(); return; }
    if (!validateContacts()) return;
    errorBox.hidden = true;

    var data = {
      email: form.elements.email.value.trim(),
      team_size: form.querySelector('input[name="team_size"]:checked').value,
      name: form.elements.name.value.trim(),
      company: form.elements.company.value.trim(),
      role: form.elements.role.value,
      phone: form.elements.phone.value.trim(),
      privacy_consent: true,
      company_website: form.elements.company_website.value,
      page: window.location.pathname,
      referrer: document.referrer || "",
      submitted_at: new Date().toISOString()
    };
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
      /* 503 = CRM not connected yet: the calendar still captures the booking */
      if (!res.ok && res.status !== 503) throw new Error("HTTP " + res.status);
      track("generate_lead", { team_size: data.team_size, role: data.role });
      showBooking(data);
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
      var target = form.querySelector(".lp-step:not([hidden]) input, .lp-step:not([hidden]) select");
      if (target) setTimeout(function () { target.focus({ preventScroll: true }); }, 450);
    });
  });

  /* Mobile sticky CTA: shown once the form is out of view, hidden near the closing CTA */
  var sticky = document.querySelector("[data-sticky]");
  var closing = document.querySelector("[data-closing]");
  if (sticky && "IntersectionObserver" in window) {
    var formVisible = true, closingVisible = false;
    var update = function () {
      var show = !formVisible && !closingVisible && !form.classList.contains("is-sent") && !form.classList.contains("is-booking");
      sticky.classList.toggle("show", show);
      sticky.setAttribute("aria-hidden", String(!show));
      sticky.querySelector("a").tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; update(); }).observe(form);
    if (closing) new IntersectionObserver(function (en) { closingVisible = en[0].isIntersecting; update(); }).observe(closing);
  }
})();
