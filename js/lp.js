(function () {
  "use strict";

  var form = document.querySelector("[data-lead-form]");
  if (!form) return;

  var FALLBACK_URL = "https://www.aiclo.io/#contatti";
  var steps = form.querySelectorAll("[data-step]");
  var progress = form.querySelectorAll("[data-progress]");
  var errorBox = form.querySelector("[data-form-error]");
  var submitBtn = form.querySelector("[data-submit]");
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

  /* Analytics: works with GTM dataLayer, gtag, Meta pixel and LinkedIn if present */
  var track = function (event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
    if (event === "generate_lead") {
      if (typeof window.gtag === "function") window.gtag("event", "generate_lead", data || {});
      if (typeof window.fbq === "function") window.fbq("track", "Lead");
      if (window.lintrk) window.lintrk("track");
    }
  };

  form.addEventListener("focusin", function () {
    if (!started) { started = true; track("lead_form_start"); }
  });

  /* Validation */
  var setError = function (field, msg) {
    var wrap = field.closest(".field") || field.parentElement;
    var err = wrap ? wrap.querySelector(".field-error") : null;
    var target = field.matches(".chips") ? field : field;
    if (msg) {
      target.setAttribute("aria-invalid", "true");
      if (err) { err.textContent = msg; err.hidden = false; if (err.id) target.setAttribute("aria-describedby", err.id); }
    } else {
      target.removeAttribute("aria-invalid");
      if (err) { err.hidden = true; err.textContent = ""; }
    }
    return !msg;
  };

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var validateStep = function (n) {
    var ok = true, first = null;
    var mark = function (el, msg) { if (!setError(el, msg)) { ok = false; first = first || el; } };
    if (n === 1) {
      var email = form.elements.email;
      var v = email.value.trim();
      mark(email, !v ? "Inserisci la tua email aziendale." : !emailRe.test(v) ? "Controlla l’email: sembra incompleta (es. nome@azienda.it)." : "");
      var chips = form.querySelector(".chips");
      var picked = form.querySelector('input[name="team_size"]:checked');
      var teamErr = document.getElementById("f-team-err");
      if (!picked) {
        ok = false; first = first || chips.querySelector("input");
        chips.setAttribute("aria-invalid", "true");
        teamErr.textContent = "Scegli la dimensione del team: ci serve per preparare la demo giusta.";
        teamErr.hidden = false;
      } else { chips.removeAttribute("aria-invalid"); teamErr.hidden = true; }
    } else {
      mark(form.elements.name, form.elements.name.value.trim().length < 2 ? "Inserisci nome e cognome." : "");
      mark(form.elements.company, !form.elements.company.value.trim() ? "Inserisci il nome dell’azienda." : "");
      mark(form.elements.role, !form.elements.role.value ? "Seleziona il tuo ruolo." : "");
      var priv = form.elements.privacy;
      var privErr = document.getElementById("f-privacy-err");
      if (!priv.checked) {
        ok = false; first = first || priv;
        privErr.textContent = "Per fissare la demo serve il consenso al contatto.";
        privErr.hidden = false;
      } else { privErr.hidden = true; }
    }
    if (first) first.focus();
    return ok;
  };

  /* Live clear errors as the user fixes them */
  form.addEventListener("input", function (e) {
    var t = e.target;
    if (t.getAttribute("aria-invalid") === "true") setError(t, "");
    if (t.name === "team_size") { form.querySelector(".chips").removeAttribute("aria-invalid"); document.getElementById("f-team-err").hidden = true; }
    if (t.name === "privacy" && t.checked) document.getElementById("f-privacy-err").hidden = true;
  });

  var goTo = function (n) {
    steps.forEach(function (s) { s.hidden = s.getAttribute("data-step") !== String(n); });
    progress.forEach(function (p) {
      var i = parseInt(p.getAttribute("data-progress"), 10);
      p.classList.toggle("is-current", i === n);
      p.classList.toggle("is-done", i < n);
    });
    var firstInput = form.querySelector('[data-step="' + n + '"] input, [data-step="' + n + '"] select');
    if (firstInput) firstInput.focus({ preventScroll: true });
  };

  form.querySelector("[data-next]").addEventListener("click", function () {
    if (!validateStep(1)) return;
    track("lead_form_step", { step: 2, team_size: form.querySelector('input[name="team_size"]:checked').value });
    goTo(2);
  });
  form.querySelector("[data-back]").addEventListener("click", function () { goTo(1); });

  /* Enter on step 1 moves forward instead of submitting */
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !steps[0].hidden && e.target.tagName === "INPUT") {
      e.preventDefault();
      form.querySelector("[data-next]").click();
    }
  });

  var showFormError = function () {
    errorBox.innerHTML = "";
    errorBox.append("Non siamo riusciti a inviare la richiesta. Riprova tra un momento oppure ");
    var a = document.createElement("a");
    a.href = FALLBACK_URL; a.textContent = "richiedi la demo dal sito Aiclo"; a.target = "_blank"; a.rel = "noopener";
    errorBox.append(a, ".");
    errorBox.hidden = false;
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!steps[0].hidden) { form.querySelector("[data-next]").click(); return; }
    if (!validateStep(1)) { goTo(1); validateStep(1); return; }
    if (!validateStep(2)) return;
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
    submitBtn.querySelector("span").textContent = "Invio in corso…";

    fetch(form.getAttribute("data-endpoint"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      track("generate_lead", { team_size: data.team_size, role: data.role });
      form.classList.add("is-sent");
      steps.forEach(function (s) { s.hidden = true; });
      var ok = form.querySelector("[data-success]");
      form.querySelector("[data-success-email]").textContent = data.email;
      ok.hidden = false;
      ok.focus();
    }).catch(function () {
      showFormError();
      track("lead_form_error");
    }).then(function () {
      submitBtn.removeAttribute("aria-busy");
      submitBtn.disabled = false;
      submitBtn.querySelector("span").textContent = "Prenota la mia demo gratuita";
    });
  });

  /* Every CTA lands on the form with the first empty field focused */
  document.querySelectorAll("[data-focus-form]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      track("cta_click", { location: a.closest("section, header, .lp-sticky") ? (a.closest("section, header, .lp-sticky").className.split(" ")[0]) : "" });
      form.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      var target = form.classList.contains("is-sent") ? null : form.querySelector(".lp-step:not([hidden]) input:not([type=radio]), .lp-step:not([hidden]) select");
      if (target) setTimeout(function () { target.focus({ preventScroll: true }); }, 450);
    });
  });

  /* Mobile sticky CTA: visible once the form is out of view, hidden near the closing CTA */
  var sticky = document.querySelector("[data-sticky]");
  var closing = document.querySelector("[data-closing]");
  if (sticky && "IntersectionObserver" in window) {
    var formVisible = true, closingVisible = false;
    var update = function () {
      var show = !formVisible && !closingVisible && !form.classList.contains("is-sent");
      sticky.classList.toggle("show", show);
      sticky.setAttribute("aria-hidden", String(!show));
      sticky.querySelector("a").tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; update(); }).observe(form);
    if (closing) new IntersectionObserver(function (en) { closingVisible = en[0].isIntersecting; update(); }).observe(closing);
  }
})();
