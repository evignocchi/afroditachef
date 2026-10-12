(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header state + mobile menu */
  var header = document.querySelector("[data-header]");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var menuBtn = document.querySelector("[data-menu]");
  var nav = document.getElementById("nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
  });

  /* Waveforms: deterministic pseudo-random bars that read like speech */
  var seed = 7;
  var rand = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  document.querySelectorAll("[data-wave]").forEach(function (el) {
    var n = parseInt(el.getAttribute("data-wave"), 10);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var phrase = Math.sin(i / 5.5) * 0.5 + 0.5;
      var h = 0.14 + phrase * 0.55 * rand() + rand() * 0.3;
      var b = document.createElement("i");
      b.style.setProperty("--h", Math.min(1, h).toFixed(3));
      b.style.setProperty("--d", (rand() * 1.1).toFixed(2));
      frag.appendChild(b);
    }
    el.appendChild(frag);
  });

  /* In-view: panels fill their bars, steps draw their rule, numbers count */
  var countUp = function (el) {
    var to = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduce) { el.textContent = to.toFixed(dec); return; }
    var t0 = null, dur = 1400;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(2, -10 * p);
      el.textContent = (to * (p === 1 ? 1 : e)).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  var watched = document.querySelectorAll(".panel, .steps, .results, [data-coverage]");
  document.querySelectorAll(".panel:not(.session)").forEach(function (p) { p.classList.add("reveal"); });

  var onEnter = function (el) {
    el.classList.add("in");
    el.querySelectorAll("[data-count]").forEach(countUp);
    if (el.hasAttribute("data-coverage")) coverageAuto(el);
  };

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { onEnter(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.25 });
    watched.forEach(function (el) { io.observe(el); });
  } else {
    watched.forEach(onEnter);
  }

  /* Hero session: live timer, playhead over the waveform, rotating transcript */
  var session = document.querySelector(".session");
  var heroWave = session.querySelector("[data-wave]");
  var bars = heroWave.children;
  var timer = session.querySelector("[data-timer]");
  var line = session.querySelector("[data-transcript]");
  var who = session.querySelector(".transcript .who");
  var lines = [
    ["Cliente", "“Il prezzo è più alto di quanto avevamo messo a budget.”"],
    ["Marco", "“Capisco. Il vero problema è la disponibilità economica o il ritorno sull’investimento?”"],
    ["Cliente", "“Più il ritorno. Dovrei vedere i numeri con il mio socio.”"],
    ["Marco", "“Allora prepariamo una proposta con il ROI a due mesi da mostrargli.”"]
  ];
  var secs = 12 * 60 + 4, head = 0, li = 0;

  for (var k = 0; k < bars.length * 0.4; k++) bars[k].classList.add("on");
  head = Math.floor(bars.length * 0.4);

  if (!reduce) {
    root.classList.add("is-playing");
    setInterval(function () {
      secs++;
      var m = Math.floor(secs / 60), s = secs % 60;
      timer.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }, 1000);
    setInterval(function () {
      if (head >= bars.length) {
        for (var j = 0; j < bars.length; j++) bars[j].classList.remove("on");
        head = 0;
      }
      bars[head++].classList.add("on");
    }, 140);
    setInterval(function () {
      li = (li + 1) % lines.length;
      line.style.opacity = "0";
      setTimeout(function () {
        who.textContent = lines[li][0];
        line.textContent = lines[li][1];
        line.style.opacity = "1";
      }, 350);
    }, 4200);
  }

  /* Coverage grid: 5 heard vs 100 analysed */
  var cov = document.querySelector("[data-coverage]");
  var grid = cov.querySelector("[data-grid]");
  var heard = { 7: 1, 23: 1, 46: 1, 68: 1, 91: 1 };
  for (var g = 0; g < 100; g++) {
    var c = document.createElement("i");
    c.style.setProperty("--i", ((g % 10) + Math.floor(g / 10)) * 4);
    if (heard[g]) c.className = "heard";
    grid.appendChild(c);
  }
  var covNum = cov.querySelector("[data-cov-num]");
  var covLabel = cov.querySelector("[data-cov-label]");
  var covBtns = cov.querySelectorAll("[data-set]");
  var covTimer = null;
  var setCoverage = function (state) {
    cov.setAttribute("data-state", state);
    covBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-set") === state)); });
    if (state === "aiclo") {
      covNum.setAttribute("data-count", "100");
      countUp(covNum);
      covLabel.textContent = "delle trattative analizzate da Aiclo";
    } else {
      covNum.textContent = "5";
      covLabel.textContent = "delle trattative ascoltate da un manager";
    }
  };
  covBtns.forEach(function (b) {
    b.addEventListener("click", function () { clearTimeout(covTimer); setCoverage(b.getAttribute("data-set")); });
  });
  function coverageAuto() {
    if (reduce) return;
    covTimer = setTimeout(function () { setCoverage("aiclo"); }, 1800);
  }

  /* Copy actions */
  var toast = document.querySelector("[data-toast]");
  var flash = function (btn, msg) {
    var label = btn.querySelector("span");
    var old = label.textContent;
    label.textContent = msg;
    setTimeout(function () { label.textContent = old; }, 1800);
  };
  var copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  };
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(btn.getAttribute("data-copy")).then(function () { flash(btn, "Copiato"); }, function () { flash(btn, "Non copiato"); });
    });
  });
  document.querySelectorAll("[data-copy-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dl = document.getElementById(btn.getAttribute("data-copy-target"));
      var text = Array.prototype.map.call(dl.children, function (row) {
        return row.querySelector("dt").textContent + ": " + row.querySelector("dd").textContent;
      }).join("\n");
      copyText(text).then(function () {
        toast.textContent = "Riepilogo copiato, pronto da incollare nel CRM";
      }, function () {
        toast.textContent = "Copia non riuscita: seleziona il testo a mano";
      }).then(function () {
        toast.classList.add("show");
        setTimeout(function () { toast.classList.remove("show"); }, 2400);
      });
    });
  });
})();
