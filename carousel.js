/* Glow Bliss — homepage photo carousel
   Crossfade, auto-rotates every 5 s. Pauses on hover, keyboard focus, hidden tab
   and when the visitor presses pause. No autoplay with prefers-reduced-motion. */
(function () {
  var root = document.querySelector('.carousel');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('.car-slide'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.car-dot'));
  var track = root.querySelector('.car-track');
  var pauseBtn = root.querySelector('.car-pause');
  var n = slides.length;
  if (n < 2) return;

  var DELAY = 5000;
  var current = 0;
  var timer = null;
  var hovering = false, focused = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var userPaused = reduce;

  function load(i) {
    var img = slides[i].querySelector('img');
    if (img && img.dataset.src) {
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    }
  }

  function show(i) {
    i = (i + n) % n;
    load(i);
    load((i + 1) % n);
    slides[current].classList.remove('is-active');
    slides[current].setAttribute('aria-hidden', 'true');
    dots[current].removeAttribute('aria-current');
    current = i;
    slides[current].classList.add('is-active');
    slides[current].removeAttribute('aria-hidden');
    dots[current].setAttribute('aria-current', 'true');
  }

  function running() { return !userPaused && !hovering && !focused && !document.hidden; }

  function schedule() {
    clearTimeout(timer);
    if (running()) timer = setTimeout(function () { show(current + 1); schedule(); }, DELAY);
  }

  function updatePauseBtn() {
    root.classList.toggle('is-paused', userPaused);
    pauseBtn.setAttribute('aria-label', userPaused ? root.dataset.lPlay : root.dataset.lPause);
    // Announce slide changes to screen readers only when not rotating by itself
    track.setAttribute('aria-live', userPaused ? 'polite' : 'off');
  }

  root.querySelector('.car-prev').addEventListener('click', function () { show(current - 1); schedule(); });
  root.querySelector('.car-next').addEventListener('click', function () { show(current + 1); schedule(); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); schedule(); }); });
  pauseBtn.addEventListener('click', function () { userPaused = !userPaused; updatePauseBtn(); schedule(); });

  root.addEventListener('mouseenter', function () { hovering = true; schedule(); });
  root.addEventListener('mouseleave', function () { hovering = false; schedule(); });
  root.addEventListener('focusin', function (e) {
    // Pause for keyboard users only; a mouse click should not stop the slideshow
    var kb = true;
    try { kb = e.target.matches(':focus-visible'); } catch (err) {}
    if (kb) { focused = true; schedule(); }
  });
  root.addEventListener('focusout', function (e) {
    if (!root.contains(e.relatedTarget)) { focused = false; schedule(); }
  });
  document.addEventListener('visibilitychange', schedule);

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { show(current - 1); schedule(); }
    else if (e.key === 'ArrowRight') { show(current + 1); schedule(); }
  });

  // Swipe on touch screens
  var x0 = null, y0 = null;
  root.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  root.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { show(current + (dx < 0 ? 1 : -1)); schedule(); }
    x0 = y0 = null;
  }, { passive: true });

  // Fetch the second photo once the page has loaded, so the first paint stays fast
  function start() { load(1); schedule(); }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);

  updatePauseBtn();
})();
