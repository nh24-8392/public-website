/* Slide viewer: browse a series of slide images with arrows, the keyboard, a slider or swipes.
   Used on the home page. Markup:
     <div class="slideshow" data-count="101" data-split="50" data-base="slides/" data-title="..."></div>
   Slide i is slides/part1/NNN.webp for i <= data-split, and slides/part2/NNN.webp after that (the slides
   are in two folders so that each can be uploaded to GitHub in one go). With the attribute data-flat,
   every slide is directly in the base folder: slides2/NNN.webp. */
(function () {
  "use strict";

  function pad(i) { return (i < 10 ? "00" : i < 100 ? "0" : "") + i; }

  function init(root) {
    var count = parseInt(root.getAttribute("data-count"), 10);
    var split = parseInt(root.getAttribute("data-split"), 10) || count;
    var base = root.getAttribute("data-base") || "slides/";
    var title = root.getAttribute("data-title") || "Slides";
    var current = 1;

    var flat = root.hasAttribute("data-flat");   // all slides directly in the base folder
    function src(i) { return flat ? base + pad(i) + ".webp" : base + (i <= split ? "part1/" : "part2/") + pad(i) + ".webp"; }
    // Where else a slide may be, if it was uploaded to a different folder than planned.
    function alternatives(i) {
      var f = pad(i) + ".webp";
      return flat ? [] : [base + (i <= split ? "part2/" : "part1/") + f, base + f];
    }

    root.innerHTML =
      '<div class="slideshow-stage">' +
        '<img class="slideshow-img" alt="">' +
        '<button type="button" class="slideshow-btn slideshow-prev" aria-label="Previous slide">‹</button>' +
        '<button type="button" class="slideshow-btn slideshow-next" aria-label="Next slide">›</button>' +
      '</div>' +
      '<div class="slideshow-bar">' +
        '<span class="slideshow-count" aria-live="polite"></span>' +
        '<input type="range" class="slideshow-range" min="1" max="' + count + '" value="1" aria-label="Go to slide">' +
        '<button type="button" class="slideshow-full" aria-label="Full screen">Full screen</button>' +
      '</div>';
    root.setAttribute("tabindex", "0");
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", title + ": use the left and right arrow keys to change slide");

    var img = root.querySelector(".slideshow-img");
    var prev = root.querySelector(".slideshow-prev");
    var next = root.querySelector(".slideshow-next");
    var counter = root.querySelector(".slideshow-count");
    var range = root.querySelector(".slideshow-range");
    var full = root.querySelector(".slideshow-full");

    function preload(i) {
      if (i >= 1 && i <= count) { var p = new Image(); p.src = src(i); }
    }

    function show(i) {
      current = Math.max(1, Math.min(count, i));
      var tries = alternatives(current);
      img.onerror = function () { var n = tries.shift(); if (n) img.src = n; };
      img.src = src(current);
      img.alt = title + ", slide " + current + " of " + count;
      counter.textContent = current + " / " + count;
      range.value = current;
      prev.disabled = current === 1;
      next.disabled = current === count;
      preload(current + 1); preload(current + 2); preload(current - 1);
    }

    prev.addEventListener("click", function () { show(current - 1); });
    next.addEventListener("click", function () { show(current + 1); });
    range.addEventListener("input", function () { show(parseInt(range.value, 10)); });

    // Keyboard: while the pointer is over the viewer, it has the focus, or it is full screen.
    document.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) { return; }
      var active = root.matches(":hover") || root.contains(document.activeElement) ||
                   document.fullscreenElement === root || document.webkitFullscreenElement === root;
      if (!active) { return; }
      if (e.target && e.target.tagName === "INPUT" && e.target.type === "range" &&
          (e.key === "ArrowLeft" || e.key === "ArrowRight")) { return; }  // the slider handles these itself
      var k = e.key, handled = true;
      if (k === "ArrowRight" || k === "PageDown") { show(current + 1); }
      else if (k === "ArrowLeft" || k === "PageUp") { show(current - 1); }
      else if (k === "Home") { show(1); }
      else if (k === "End") { show(count); }
      else { handled = false; }
      if (handled) { e.preventDefault(); }
    });

    // Swipe on touch screens.
    var x0 = null;
    root.addEventListener("touchstart", function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (x0 === null) { return; }
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(current + (dx < 0 ? 1 : -1)); }
    }, { passive: true });

    // Full screen, where the browser allows it.
    var canFull = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!canFull) { full.style.display = "none"; }
    full.addEventListener("click", function () {
      var on = document.fullscreenElement || document.webkitFullscreenElement;
      if (on) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
      else { (root.requestFullscreen || root.webkitRequestFullscreen).call(root); }
    });

    show(1);
  }

  function start() {
    var roots = document.querySelectorAll(".slideshow");
    for (var i = 0; i < roots.length; i++) { init(roots[i]); }
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); }
  else { start(); }
})();
