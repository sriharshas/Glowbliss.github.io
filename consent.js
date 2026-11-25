/* ===== Glow Bliss — cookie consent =====
   Google Analytics is NOT loaded until the visitor clicks "Accept".
   The choice is remembered in the browser (localStorage) and can be changed
   at any time with any link that has the attribute data-cookie-settings.
   Text follows the page language (Dutch or English).
*/
(function () {
  var GA_ID = "G-P7H3CM96P1";
  var KEY = "gb_cookie_consent";       // stores {"value":"accepted"|"rejected","date":"YYYY-MM-DD"}
  var gaLoaded = false;
  var EN = (document.documentElement.lang || "").slice(0, 2) === "en";
  var T = EN ? {
    text: "We'd like to use Google Analytics cookies to see how visitors use our website. Only if you agree.",
    more: "More info", reject: "Reject", accept: "Accept", label: "Cookie choice", privacy: "/en/privacy.html#cookies"
  } : {
    text: "We willen Google Analytics-cookies gebruiken om te zien hoe bezoekers onze website gebruiken. Alleen als jij dat goedvindt.",
    more: "Meer info", reject: "Weigeren", accept: "Accepteren", label: "Cookiekeuze", privacy: "/privacy.html#cookies"
  };

  function readChoice() {
    try { var c = JSON.parse(localStorage.getItem(KEY)); return c && c.value ? c.value : null; }
    catch (e) { return null; }
  }
  function saveChoice(value) {
    try { localStorage.setItem(KEY, JSON.stringify({ value: value, date: new Date().toISOString().slice(0, 10) })); }
    catch (e) { /* storage blocked: banner will simply show again next visit */ }
  }

  function loadAnalytics() {
    if (gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
  }

  // Remove Google Analytics cookies (used when someone withdraws consent)
  function clearAnalyticsCookies() {
    var host = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0 || name === "_gid") {
        ["", "; domain=" + host, "; domain=." + host].forEach(function (d) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
        });
      }
    });
  }

  // ---- Styles: a card on larger screens, a slim strip on phones ----
  var css = "" +
    ".cc-banner{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:70;max-width:560px;margin:0 auto;" +
    "background:var(--card,#fff);color:var(--ink,#2d1f1f);border:1px solid var(--line,#e8d0d0);border-radius:16px;" +
    "padding:1rem 1.2rem;box-shadow:0 20px 60px -20px rgba(0,0,0,.55);font-family:var(--sans,sans-serif);" +
    "font-size:.9rem;line-height:1.5;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;animation:ccUp .35s ease}" +
    ".cc-banner[hidden]{display:none}" +
    ".cc-banner p{margin:0;flex:1 1 260px;color:var(--ink-soft,#7a5858)}" +
    ".cc-banner a{color:var(--accent,#c97b7b);text-decoration:underline}" +
    ".cc-actions{display:flex;gap:.5rem;flex:0 0 auto}" +
    ".cc-btn{cursor:pointer;border-radius:100px;padding:.6rem 1.1rem;font-family:inherit;font-size:.78rem;" +
    "letter-spacing:.08em;text-transform:uppercase;font-weight:600;border:2px solid var(--accent,#c97b7b);transition:.2s;min-width:6.5rem}" +
    ".cc-accept{background:var(--accent,#c97b7b);color:#fff}" +
    ".cc-reject{background:transparent;color:var(--accent,#c97b7b)}" +
    ".cc-btn:focus-visible{outline:2px solid var(--ink,#000);outline-offset:2px}" +
    "@media (max-width:700px){.cc-banner{left:0;right:0;bottom:0;max-width:none;border-radius:14px 14px 0 0;" +
    "padding:.7rem .9rem calc(.7rem + env(safe-area-inset-bottom,0px));gap:.6rem;font-size:.8rem}" +
    ".cc-banner p{flex-basis:100%}.cc-actions{flex:1 1 100%}.cc-btn{flex:1;padding:.55rem .8rem}}" +
    "@keyframes ccUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}";

  function injectStyles() {
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
  }

  var banner;
  function buildBanner() {
    banner = document.createElement("div");
    banner.className = "cc-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", T.label);
    banner.hidden = true;
    banner.innerHTML =
      '<p>' + T.text + ' <a href="' + T.privacy + '">' + T.more + '</a></p>' +
      '<div class="cc-actions">' +
      '<button type="button" class="cc-btn cc-reject">' + T.reject + '</button>' +
      '<button type="button" class="cc-btn cc-accept">' + T.accept + '</button>' +
      '</div>';
    document.body.appendChild(banner);

    banner.querySelector(".cc-accept").addEventListener("click", function () {
      saveChoice("accepted");
      banner.hidden = true;
      loadAnalytics();
    });
    banner.querySelector(".cc-reject").addEventListener("click", function () {
      var wasLoaded = gaLoaded;
      saveChoice("rejected");
      banner.hidden = true;
      clearAnalyticsCookies();
      // If Analytics was already running on this page, reload so it stops completely
      if (wasLoaded) location.reload();
    });
  }

  function showBanner() { if (banner) banner.hidden = false; }

  function init() {
    injectStyles();
    buildBanner();

    var choice = readChoice();
    if (choice === "accepted") loadAnalytics();
    else if (choice !== "rejected") showBanner();

    // "Cookie settings" links reopen the banner
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest("[data-cookie-settings]");
      if (!link) return;
      e.preventDefault();
      showBanner();
      var first = banner.querySelector(".cc-reject");
      if (first) first.focus();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
