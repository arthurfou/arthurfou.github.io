/* ---------------------------------------------------------------
   The header and footer behave like tiny event cameras. A few
   bright discs drift across the sensor; wherever an edge moves,
   pixels fire. The leading edge brightens the scene (positive
   events, blue), the trailing edge darkens it (negative, red).
   In the header, the visitor's cursor is one more moving edge.

   Decoration only. The text is plain HTML, and if anything here
   fails the page keeps its dark bands.
   --------------------------------------------------------------- */

(function () {
  "use strict";

  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var rootCS = getComputedStyle(document.documentElement);
  function token(name, fallback) {
    return rootCS.getPropertyValue(name).trim() || fallback;
  }

  // Run fn only while el is on screen and the tab is visible.
  function whileVisible(el, play, pause) {
    var onScreen = true;
    function sync() { if (onScreen && !document.hidden) play(); else pause(); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }).observe(el);
    }
    document.addEventListener("visibilitychange", sync);
    sync();
  }

  function fitCanvas(canvas, ctx, el) {
    var r = el.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  var resizers = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizers.forEach(function (fn) { fn(); });
    }, 150);
  });

  /* ---------------- sensor: header and footer ------------------ */

  function sensor(el, canvas, discs, opts) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var LIFETIME = 520, MAX_EVENTS = 9000, DOT = 1.8;
    var noise = opts.noise;
    var pal = {
      bg:  token("--ev-bg",  "#0c1426"),
      pos: token("--ev-pos", "#3cb0ff"),
      neg: token("--ev-neg", "#ff4a6b")
    };
    var W = 0, H = 0, events = [], raf = null, last = 0;
    var ptr = { x: 0, y: 0, px: 0, py: 0, on: false };

    function size() { var s = fitCanvas(canvas, ctx, el); W = s.w; H = s.h; }

    function discAt(d, t) {
      return [
        W * (d.cx + d.ax * Math.sin(t * d.fx + d.ph)),
        H * (d.cy + d.ay * Math.sin(t * d.fy + d.ph * 1.3))
      ];
    }

    // Fire events along the rim of a disc moving with velocity (vx, vy).
    // The sign of normal·velocity is the polarity; edges parallel to
    // the motion see no brightness change and stay silent.
    function emit(x, y, vx, vy, r, n, t) {
      var sp = Math.hypot(vx, vy);
      if (sp < 0.01) return;
      n = Math.min(n, ((sp * 6) | 0) + 2);
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var nx = Math.cos(a), ny = Math.sin(a);
        var dot = (nx * vx + ny * vy) / sp;
        if (Math.abs(dot) < 0.15) continue;
        events.push({
          x: x + nx * r + (Math.random() - .5) * 2,
          y: y + ny * r + (Math.random() - .5) * 2,
          p: dot > 0,
          t: t
        });
      }
    }

    function frame(t) {
      var dt = Math.max(1, t - last);
      last = t;

      for (var i = 0; i < discs.length; i++) {
        var d = discs[i], a = discAt(d, t), b = discAt(d, t - dt);
        emit(a[0], a[1], (a[0] - b[0]) / dt * 16, (a[1] - b[1]) / dt * 16, d.r, 60, t);
      }
      if (ptr.on) {
        emit(ptr.x, ptr.y, ptr.x - ptr.px, ptr.y - ptr.py, 34, 140, t);
        ptr.px = ptr.x;
        ptr.py = ptr.y;
      }
      for (var k = 0; k < noise; k++) {
        events.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() < .5, t: t });
      }
      if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);

      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);

      var keep = [];
      for (var j = 0; j < events.length; j++) {
        var e = events[j], age = (t - e.t) / LIFETIME;
        if (age > 1) continue;
        keep.push(e);
        ctx.globalAlpha = (1 - age) * 0.9;
        ctx.fillStyle = e.p ? pal.pos : pal.neg;
        ctx.fillRect(e.x, e.y, DOT, DOT);
      }
      ctx.globalAlpha = 1;
      events = keep;

      raf = requestAnimationFrame(frame);
    }

    // One frozen snapshot, for reduced motion.
    function still() {
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < discs.length; i++) {
        var d = discs[i], t = 1000 * (i + 1), a = discAt(d, t), b = discAt(d, t - 40);
        for (var s = 0; s < 260; s++) {
          var ang = Math.random() * Math.PI * 2, nx = Math.cos(ang), ny = Math.sin(ang);
          var dot = nx * (a[0] - b[0]) + ny * (a[1] - b[1]);
          if (Math.abs(dot) < .05) continue;
          ctx.fillStyle = dot > 0 ? pal.pos : pal.neg;
          ctx.fillRect(a[0] + nx * d.r, a[1] + ny * d.r, DOT, DOT);
        }
      }
    }

    size();
    resizers.push(function () { size(); if (reduced) still(); });

    if (reduced) { still(); return; }

    if (opts.interactive) el.addEventListener("pointermove", function (ev) {
      var r = el.getBoundingClientRect();
      var x = ev.clientX - r.left, y = ev.clientY - r.top;
      if (!ptr.on) { ptr.px = x; ptr.py = y; }
      ptr.x = x;
      ptr.y = y;
      ptr.on = true;
    });
    if (opts.interactive) el.addEventListener("pointerleave", function () { ptr.on = false; });

    whileVisible(el,
      function () { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } },
      function () { if (raf) cancelAnimationFrame(raf); raf = null; });
  }

  /* ---------------- wire up ------------------------------------ */

  function start() {
    var hero = document.getElementById("hero");
    var heroCanvas = document.getElementById("events");
    if (hero && heroCanvas && heroCanvas.getContext) {
      sensor(hero, heroCanvas, [
        { r: 70,  ax: .34, ay: .22, fx: .00021, fy: .00033, ph: 0, cx: .72, cy: .42 },
        { r: 40,  ax: .20, ay: .28, fx: .00037, fy: .00019, ph: 2, cx: .50, cy: .50 },
        { r: 110, ax: .10, ay: .12, fx: .00013, fy: .00027, ph: 4, cx: .85, cy: .70 }
      ], { noise: 14, interactive: true });
    }

    var foot = document.getElementById("foot");
    var footCanvas = foot && foot.querySelector(".foot-events");
    if (footCanvas && footCanvas.getContext) {
      // Quieter than the header, and it ignores the cursor: text and
      // links sit on top of it.
      sensor(foot, footCanvas, [
        { r: 46, ax: .30, ay: .25, fx: .00017, fy: .00029, ph: 1, cx: .62, cy: .45 },
        { r: 26, ax: .18, ay: .30, fx: .00031, fy: .00023, ph: 3, cx: .30, cy: .55 }
      ], { noise: 8, interactive: false });
    }
  }

  try { start(); } catch (e) { /* the page stays fully readable */ }
})();
