/* ---------------------------------------------------------------
   Highlights, in the floating nav, the section currently in view:
   the last section whose title has passed just under the nav.
   Without JavaScript the nav still works as plain anchor links.
   --------------------------------------------------------------- */

(function () {
  "use strict";

  var nav = document.querySelector(".pill-nav");
  if (!nav) return;

  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
  var targets = links.map(function (a) {
    return document.getElementById(a.getAttribute("href").slice(1));
  });
  var current = null;
  var queued = false;

  function update() {
    queued = false;
    var line = nav.getBoundingClientRect().bottom + 24;
    var active = -1;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] && targets[i].getBoundingClientRect().top <= line) active = i;
    }
    // At the very bottom, the last section wins even if its title is low.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      active = targets.length - 1;
    }
    if (active === current) return;
    current = active;
    links.forEach(function (a, i) {
      var on = i === active;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    // Keep the active link visible when the pill scrolls sideways (phones).
    if (active >= 0 && nav.scrollWidth > nav.clientWidth) {
      var a = links[active];
      nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
    }
  }

  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  update();
})();
