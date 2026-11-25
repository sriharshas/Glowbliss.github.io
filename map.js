/* ===== Glow Bliss — load the Google Map only when the visitor asks for it ===== */
(function () {
  var btn = document.getElementById("showMapBtn");
  var box = document.getElementById("mapPlaceholder");
  if (!btn || !box) return;
  btn.addEventListener("click", function () {
    var f = document.createElement("iframe");
    f.src = box.getAttribute("data-map-src");
    f.style.border = "0";
    f.setAttribute("allowfullscreen", "");
    f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    f.title = box.getAttribute("data-map-title") || "Google Maps";
    box.replaceWith(f);
  });
})();
