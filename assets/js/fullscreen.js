/* ---------------------------------------------------------------
   Enlarge button on project videos: the video grows from its place
   in the page to a large centred view over the darkened page, and
   shrinks back on close (Escape, the × button or a click outside
   the video). Hidden where <dialog> is not supported.
   --------------------------------------------------------------- */

(function () {
  "use strict";

  var buttons = document.querySelectorAll(".fs-btn");
  if (!buttons.length || typeof HTMLDialogElement !== "function") return;

  var DURATION = 320;
  var EASE = "cubic-bezier(.2, .7, .2, 1)";
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");

  var box = document.createElement("dialog");
  box.className = "lightbox";
  box.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Close">×</button>' +
    '<video muted loop playsinline></video>';
  document.body.appendChild(box);

  var big = box.querySelector("video");
  var source = null;
  var closing = false;

  // Transform that puts the big video exactly over the small one.
  function fromSmall() {
    var a = source.getBoundingClientRect();
    var b = big.getBoundingClientRect();
    return "translate(" + (a.left - b.left) + "px, " + (a.top - b.top) + "px) " +
           "scale(" + (a.width / b.width) + ")";
  }

  function animated() {
    return !still.matches && typeof big.animate === "function";
  }

  function open(video) {
    source = video;
    if (big.getAttribute("src") !== video.getAttribute("src")) {
      big.src = video.getAttribute("src");
    }
    // Known aspect ratio before the file loads, so the target size is right.
    big.width = video.width;
    big.height = video.height;
    big.poster = video.poster;
    big.setAttribute("aria-label", video.getAttribute("aria-label") || "");

    box.classList.remove("closing");
    box.showModal();
    document.documentElement.style.overflow = "hidden";
    big.currentTime = video.currentTime;
    video.pause();
    big.play();

    if (animated()) {
      big.animate(
        [{ transform: fromSmall() }, { transform: "none" }],
        { duration: DURATION, easing: EASE }
      );
    }
  }

  function close() {
    if (closing || !box.open) return;
    closing = true;
    source.currentTime = big.currentTime;

    function done() {
      closing = false;
      box.classList.remove("closing");
      box.close();
    }
    if (!animated()) return done();

    box.classList.add("closing");
    big.animate(
      [{ transform: "none" }, { transform: fromSmall() }],
      { duration: DURATION * 0.8, easing: EASE, fill: "forwards" }
    ).onfinish = function (e) {
      done();
      e.target.cancel();
    };
  }

  box.querySelector(".lightbox-close").addEventListener("click", close);
  // A click on the backdrop lands on the dialog itself.
  box.addEventListener("click", function (e) {
    if (e.target === box) close();
  });
  // Escape: run the closing animation instead of closing at once.
  box.addEventListener("cancel", function (e) {
    e.preventDefault();
    close();
  });
  box.addEventListener("close", function () {
    big.pause();
    if (source) source.play();
    document.documentElement.style.overflow = "";
  });

  [].forEach.call(buttons, function (btn) {
    var video = btn.parentNode.querySelector("video");
    if (!video) return;
    btn.hidden = false;
    btn.addEventListener("click", function () { open(video); });
  });
})();
