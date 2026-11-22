/* ===== Glow Bliss — cookie consent =====
   Google Analytics is NOT loaded until the visitor clicks "Accept".
   The choice is remembered in the browser (localStorage) and can be changed
   at any time with any link that has the attribute data-cookie-settings.
*/
(function () {
  var GA_ID = "G-P7H3CM96P1";
  var KEY = "gb_cookie_consent";       // stores {"value":"accepted"|"rejected","date":"YYYY-MM-DD"}
  var gaLoaded = false;

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

  // ---- Styles (kept here so the banner works on every page) ----
  var css = "" +
    ".cc-banner{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:70;max-width:560px;margin:0 auto;" +
    "background:var(--card,#fff);color:var(--ink,#2d1f1f);border:1px solid var(--line,#e8d0d0);border-radius:18px;" +
    "padding:1.2rem 1.4rem;box-shadow:0 20px 60px -20px rgba(0,0,0,.55);font-family:var(--sans,sans-serif);" +
    "font-size:.92rem;line-height:1.55;animation:ccUp .35s ease}" +
    ".cc-banner[hidden]{display:none}" +
    ".cc-banner h2{font-family:var(--serif,serif);font-size:1.35rem;margin:0 0 .4rem}" +
    ".cc-banner p{margin:0 0 1rem;color:var(--ink-soft,#7a5858)}" +
    ".cc-banner a{color:var(--accent,#c97b7b);text-decoration:underline}" +
    ".cc-actions{display:flex;gap:.6rem;flex-wrap:wrap}" +
    ".cc-btn{flex:1 1 140px;cursor:pointer;border-radius:100px;padding:.75rem 1.2rem;font-family:inherit;font-size:.82rem;" +
    "letter-spacing:.1em;text-transform:uppercase;font-weight:600;border:2px solid var(--accent,#c97b7b);transition:.2s}" +
    ".cc-accept{background:var(--accent,#c97b7b);color:#fff}" +
    ".cc-reject{background:transparent;color:var(--accent,#c97b7b)}" +
    ".cc-btn:hover{transform:translateY(-1px)}" +
    ".cc-btn:focus-visible{outline:2px solid var(--ink,#000);outline-offset:2px}" +
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
    banner.setAttribute("aria-label", "Cookie choice");
    banner.hidden = true;
    banner.innerHTML =
      '<h2>Cookies</h2>' +
      '<p>We would like to use Google Analytics cookies to see how visitors use our website, so we can improve it. ' +
      'We only do this if you agree. You can change your choice at any time via “Cookie settings” at the bottom of the page. ' +
      '<a href="privacy.html#cookies">Read more</a></p>' +
      '<div class="cc-actions">' +
      '<button type="button" class="cc-btn cc-reject">Reject</button>' +
      '<button type="button" class="cc-btn cc-accept">Accept</button>' +
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
