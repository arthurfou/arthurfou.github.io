/* ---------------------------------------------------------------
   The name is rendered the way an event camera sees an edge: as a
   cloud of positive and negative events that accumulate until the
   letterforms hold. Progressive enhancement — if anything here
   fails, the plain <h1> stays visible and nothing is lost.
   --------------------------------------------------------------- */

(function () {
  "use strict";

  var canvas = document.getElementById("name-canvas");
  var source = document.getElementById("name-text");
  if (!canvas || !source || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var TEXT = source.textContent.trim();
  var MAX_SIZE = 96;      // css px, matches the h1 clamp ceiling
  var DURATION = 900;     // ms for one dot to settle
  var STAGGER = 550;      // ms of left-to-right sweep across the name
  var SCATTER = 70;       // css px, how far dots start from their target
  var KEEP_COLOUR = 0.09; // fraction of dots that stay polarity-coloured

  var dots = [];
  var inkRGB = [0, 0, 0];
  var posRGB = [27, 63, 255];
  var negRGB = [216, 30, 70];
  var dpr = 1;
  var started = 0;
  var raf = null;

  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rgbOf(value, fallback) {
    var m = String(value).match(/\d+/g);
    if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
    return fallback;
  }

  function hexOf(value, fallback) {
    var h = String(value).trim();
    if (h.charAt(0) === "#" && h.length === 7) {
      return [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16)
      ];
    }
    return rgbOf(h, fallback);
  }

  function readPalette() {
    var cs = getComputedStyle(document.body);
    var rootCS = getComputedStyle(document.documentElement);
    inkRGB = rgbOf(cs.color, [0, 0, 0]);
    posRGB = hexOf(rootCS.getPropertyValue("--pos"), posRGB);
    negRGB = hexOf(rootCS.getPropertyValue("--neg"), negRGB);
  }

  /* Sample the rendered word into a list of dot targets. */
  function build() {
    var wrap = canvas.parentNode;
    var cssW = wrap.clientWidth;
    if (!cssW) return false;

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Fit the word to the available width, then cap it.
    ctx.font = '700 100px "Archivo", system-ui, sans-serif';
    var unit = ctx.measureText(TEXT).width / 100;
    var size = Math.min(MAX_SIZE, (cssW * 0.98) / unit);
    var cssH = Math.ceil(size * 1.22);

    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    var fontPx = size * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '700 ' + fontPx + 'px "Archivo", system-ui, sans-serif';
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#000";
    ctx.fillText(TEXT, 0, fontPx * 0.82);

    var img;
    try {
      img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      return false;                       // tainted canvas, bail out quietly
    }

    var step = Math.max(2, Math.round(fontPx / 42));
    var dotPx = Math.max(1.3, step * 0.74);
    var data = img.data;
    var W = canvas.width;

    dots = [];
    for (var y = 0; y < canvas.height; y += step) {
      for (var x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] < 110) continue;
        var positive = Math.random() < 0.5;
        dots.push({
          x: x,
          y: y,
          sx: x + (Math.random() - 0.5) * SCATTER * dpr,
          sy: y + (Math.random() - 0.5) * SCATTER * dpr,
          c: positive ? posRGB : negRGB,
          hold: Math.random() < KEEP_COLOUR,
          d: (x / W) * STAGGER + Math.random() * 180,
          r: dotPx
        });
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return dots.length > 0;
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function paint(now) {
    var elapsed = now - started;
    var done = true;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var t = (elapsed - d.d) / DURATION;
      if (t < 0) { t = 0; done = false; }
      else if (t < 1) { done = false; }
      else { t = 1; }

      var e = easeOutCubic(t);
      var x = d.sx + (d.x - d.sx) * e;
      var y = d.sy + (d.y - d.sy) * e;

      var target = d.hold ? d.c : inkRGB;
      var r = Math.round(d.c[0] + (target[0] - d.c[0]) * e);
      var g = Math.round(d.c[1] + (target[1] - d.c[1]) * e);
      var b = Math.round(d.c[2] + (target[2] - d.c[2]) * e);

      ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (0.35 + 0.65 * e) + ")";
      ctx.fillRect(x, y, d.r, d.r);
    }

    if (!done) raf = requestAnimationFrame(paint);
    else raf = null;
  }

  function settle() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var c = d.hold ? d.c : inkRGB;
      ctx.fillStyle = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
      ctx.fillRect(d.x, d.y, d.r, d.r);
    }
  }

  function run(animate) {
    readPalette();
    if (!build()) return false;
    document.body.classList.add("canvas-on");
    if (raf) cancelAnimationFrame(raf);
    if (animate && !reduced) {
      started = performance.now();
      raf = requestAnimationFrame(paint);
    } else {
      settle();
    }
    return true;
  }

  function start() {
    try {
      run(true);
    } catch (e) {
      document.body.classList.remove("canvas-on");
      return;
    }

    var timer = null;
    var lastW = canvas.parentNode.clientWidth;
    window.addEventListener("resize", function () {
      if (canvas.parentNode.clientWidth === lastW) return;  // ignore mobile URL-bar jitter
      lastW = canvas.parentNode.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(function () {
        try { run(false); } catch (e) { /* keep whatever is on screen */ }
      }, 180);
    });

    if (window.matchMedia) {
      var scheme = window.matchMedia("(prefers-color-scheme: dark)");
      var onScheme = function () { try { run(false); } catch (e) {} };
      if (scheme.addEventListener) scheme.addEventListener("change", onScheme);
      else if (scheme.addListener) scheme.addListener(onScheme);
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start).catch(start);
  } else {
    window.addEventListener("load", start);
  }
})();
