// Inviti e recupero password del pannello redazionale arrivano sulla homepage:
// li inoltra a /admin/ senza caricare script esterni sul sito pubblico.
if (/(invite|recovery|confirmation|email_change)_token=/.test(location.hash)) {
  location.replace("/admin/" + location.hash);
}

// La testata mostra il filetto quando la pagina scorre.
(function () {
  var h = document.querySelector(".site-header");
  if (!h) return;
  var on = false;
  function check() {
    var s = window.scrollY > 8;
    if (s !== on) { on = s; h.classList.toggle("is-scrolled", s); }
  }
  window.addEventListener("scroll", check, { passive: true });
  check();
})();

// Indirizzi delle sezioni: festadelporcino.it/esperienze, /programma, /informazioni
// mostrano la stessa pagina e la fanno scorrere alla sezione giusta.
(function () {
  var MAP = { "/esperienze": "esperienze", "/programma": "programma", "/informazioni": "info", "/musica": "musica", "/espositori": "espositori" };
  var PATH = { esperienze: "/esperienze/", programma: "/programma/", info: "/informazioni/", musica: "/musica/", espositori: "/espositori/" };
  function go(id, smooth) {
    var el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    return true;
  }
  var p = location.pathname.replace(/\/+$/, "");
  var hashId = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
  var target0 = hashId && document.getElementById(hashId) ? hashId : (!location.hash && MAP[p]) || "";
  if (target0) {
    // Apre la pagina già sulla sezione (o sulla scheda indicata dopo #) e la tiene ferma lì
    // mentre immagini e caratteri finiscono di caricarsi, così il contenuto non la spinge più giù.
    var target = target0, pinned = true;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    var jump = function () { if (pinned) go(target, false); };
    var stop = function () { pinned = false; };
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) { window.addEventListener(ev, stop, { passive: true, once: true }); });
    jump();
    document.addEventListener("DOMContentLoaded", jump);
    window.addEventListener("load", function () { jump(); setTimeout(jump, 300); setTimeout(stop, 1500); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jump);
    if (window.ResizeObserver) new ResizeObserver(jump).observe(document.body);
    Array.prototype.forEach.call(document.images, function (im) { if (!im.complete) im.addEventListener("load", jump); });
  }
  var onHome = !!document.getElementById("programma");
  if (!onHome || !window.history || !history.pushState || location.protocol === "file:") return;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-sec]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var id = a.getAttribute("data-sec");
    if (!PATH[id] || !document.getElementById(id)) return;
    e.preventDefault();
    history.pushState({ sec: id }, "", PATH[id]);
    go(id, true);
  });
  window.addEventListener("popstate", function () {
    var q = location.pathname.replace(/\/+$/, "");
    if (MAP[q]) go(MAP[q], true); else if (!location.hash) window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// Musica: schede per giorno. Espositori: filtro per categoria e ricerca per nome.
(function () {
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var tabs = box.querySelectorAll("[role=tab]"), panels = box.querySelectorAll("[role=tabpanel]");
    box.classList.add("is-js");
    function show(i) {
      tabs.forEach(function (t, j) { t.setAttribute("aria-selected", j === i ? "true" : "false"); t.tabIndex = j === i ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i); });
      t.addEventListener("keydown", function (e) {
        var k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (k) { var n = (i + k + tabs.length) % tabs.length; show(n); tabs[n].focus(); }
      });
    });
    var today = new Date().toISOString().slice(0, 10), start = 0;
    tabs.forEach(function (t, i) { if (t.getAttribute("data-day") === today) start = i; });
    show(start);
  });
  var ex = document.querySelector("[data-espositori]");
  if (!ex) return;
  ex.classList.add("is-js");
  var cards = ex.querySelectorAll(".expo"), chips = ex.querySelectorAll("[data-filtro]"), q = ex.querySelector("input[type=search]"), empty = ex.querySelector(".expo-empty"), cur = "";
  function apply() {
    var term = (q && q.value || "").trim().toLowerCase(), n = 0;
    cards.forEach(function (c) {
      var ok = (!cur || c.getAttribute("data-f") === cur) && (!term || c.getAttribute("data-s").indexOf(term) > -1);
      c.hidden = !ok; if (ok) n++;
    });
    if (empty) empty.hidden = n > 0;
  }
  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      cur = b.getAttribute("data-filtro");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      apply();
    });
  });
  if (q) q.addEventListener("input", apply);
})();
