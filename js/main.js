/* Afrodita Chef — language switch, booking → WhatsApp, small motion. */
(function () {
  "use strict";

  // ---- Config: replace with the restaurant's real WhatsApp number (country code, digits only).
  var WHATSAPP_NUMBER = "390000000000";
  var MAX_GUESTS = 12;

  document.documentElement.classList.add("js");

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  // ---------------------------------------------------------------- language
  var TITLES = {
    it: "Afrodita Chef · Ristorante a Bologna",
    en: "Afrodita Chef · Restaurant in Bologna"
  };
  var DESCS = {
    it: "Afrodita Chef, ristorante in Via Rialto 1b a Bologna. Cibo per passione. Prenota il tuo tavolo su WhatsApp.",
    en: "Afrodita Chef, a restaurant at Via Rialto 1b in Bologna. Food made with passion. Book your table on WhatsApp."
  };
  var lang = "it";

  function initialLang() {
    var q = /[?&]lang=(it|en)\b/.exec(location.search);
    if (q) return q[1];
    var saved = store("lang");
    if (saved === "it" || saved === "en") return saved;
    return /^it/i.test(navigator.language || "it") ? "it" : "en";
  }

  function setLang(next, persist) {
    lang = next;
    root.lang = next;
    document.title = TITLES[next];
    var meta = $('meta[name="description"]'); if (meta) meta.content = DESCS[next];
    $$("[data-set-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setLang === next)); });
    $$("[data-it]").forEach(function (el) {
      var txt = el.getAttribute("data-" + next);
      if (el.tagName === "OPTION") el.textContent = txt; else el.setAttribute("label", txt);
    });
    if (persist) store("lang", next);
    renderPreview();
  }

  $$("[data-set-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.setLang, true); });
  });

  // ---------------------------------------------------------------- mobile nav
  var burger = $("#burger"), nav = $("#nav");
  function closeNav() { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", closeNav); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  // ---------------------------------------------------------------- reveal on scroll
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 90 + "ms"; io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  // ---------------------------------------------------------------- booking form
  var form = $("#book-form");
  var fName = $("#f-name"), fPhone = $("#f-phone"), fDate = $("#f-date"), fTime = $("#f-time"), fNotes = $("#f-notes");
  var gOut = $("#g-out"), gMinus = $("#g-minus"), gPlus = $("#g-plus");
  var preview = $("#preview"), status = $("#form-status"), lampBox = $(".book-lamp");
  var guests = 2;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var now = new Date();
  var todayStr = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  fDate.min = todayStr;

  function setGuests(n) {
    guests = Math.max(1, Math.min(MAX_GUESTS, n));
    gOut.textContent = guests;
    gMinus.disabled = guests <= 1;
    gPlus.disabled = guests >= MAX_GUESTS;
    renderPreview();
  }
  gMinus.addEventListener("click", function () { setGuests(guests - 1); });
  gPlus.addEventListener("click", function () { setGuests(guests + 1); });

  function fmtDate(v) {
    if (!v) return "";
    var p = v.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", { weekday: "long", day: "numeric", month: "long" });
  }

  function buildMessage() {
    var it = lang === "it";
    var L = it
      ? { hi: "Ciao Afrodita Chef! Vorrei prenotare un tavolo.", n: "Nome", d: "Data", t: "Orario", g: "Persone", p: "Telefono", no: "Note", ph: "…" }
      : { hi: "Hi Afrodita Chef! I'd like to book a table.", n: "Name", d: "Date", t: "Time", g: "Guests", p: "Phone", no: "Notes", ph: "…" };
    var lines = [L.hi, ""];
    lines.push(L.n + ": " + (fName.value.trim() || L.ph));
    lines.push(L.d + ": " + (fmtDate(fDate.value) || L.ph));
    lines.push(L.t + ": " + (fTime.value || L.ph));
    lines.push(L.g + ": " + guests);
    if (fPhone.value.trim()) lines.push(L.p + ": " + fPhone.value.trim());
    if (fNotes.value.trim()) lines.push(L.no + ": " + fNotes.value.trim());
    lines.push("", it ? "Grazie!" : "Thank you!");
    return lines.join("\n");
  }

  function renderPreview() { if (preview) preview.textContent = buildMessage(); updateLamp(); }

  // The lamp over the form lights up as the booking is filled in.
  function updateLamp() {
    var done = 0;
    if (fName.value.trim()) done++;
    if (fDate.value) done++;
    if (fTime.value) done++;
    var amt = 0.1 + (done / 3) * 0.9;
    if (lampBox) lampBox.style.setProperty("--glow-amt", amt.toFixed(2));
  }

  var MSG = {
    it: { name: "Scrivi il tuo nome.", date: "Scegli una data.", datePast: "La data è già passata.", time: "Scegli un orario.", ok: "Si apre WhatsApp…", fallback: "Non si è aperto?", open: "Tocca qui" },
    en: { name: "Please enter your name.", date: "Pick a date.", datePast: "That date has passed.", time: "Pick a time.", ok: "Opening WhatsApp…", fallback: "Didn't open?", open: "Tap here" }
  };

  function setErr(key, el, msg) {
    var span = $('[data-err="' + key + '"]');
    if (span) span.textContent = msg || "";
    if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
  }

  function validate() {
    var m = MSG[lang], first = null;
    var okName = fName.value.trim().length > 0;
    setErr("name", fName, okName ? "" : m.name); if (!okName) first = first || fName;
    var okDate = !!fDate.value && fDate.value >= todayStr;
    setErr("date", fDate, !fDate.value ? m.date : (okDate ? "" : m.datePast)); if (!okDate) first = first || fDate;
    var okTime = !!fTime.value;
    setErr("time", fTime, okTime ? "" : m.time); if (!okTime) first = first || fTime;
    if (first) first.focus();
    return !first;
  }

  [fName, fPhone, fDate, fTime, fNotes].forEach(function (el) {
    el.addEventListener("input", function () { el.removeAttribute("aria-invalid"); var s = $('[data-err="' + (el.name) + '"]'); if (s) s.textContent = ""; renderPreview(); });
    el.addEventListener("change", renderPreview);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;
    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildMessage());
    var m = MSG[lang];
    status.innerHTML = "";
    status.appendChild(document.createTextNode(m.ok + " " + m.fallback + " "));
    var a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = m.open;
    status.appendChild(a);
    var w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
  });

  // ---------------------------------------------------------------- init
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  setGuests(2);
  setLang(initialLang(), false);
})();
