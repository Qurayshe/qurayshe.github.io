// https://gist.github.com/joelambert/1002116#gistcomment-1953925
// Drop in replace functions for setTimeout() & setInterval() that
// make use of requestAnimationFrame() for performance where available

window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      return window.setTimeout(callback, 1000 / 60);
    }
  );
})();

window.requestInterval = function (fn, delay) {
  if (
    !window.requestAnimationFrame &&
    !window.webkitRequestAnimationFrame &&
    !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) &&
    !window.oRequestAnimationFrame &&
    !window.msRequestAnimationFrame
  ) {
    return window.setInterval(fn, delay);
  }

  var start = new Date().getTime(),
    handle = new Object();

  function loop() {
    var current = new Date().getTime(),
      delta = current - start;

    if (delta >= delay) {
      fn.call();
      start = new Date().getTime();
    }

    handle.value = window.requestAnimFrame(loop);
  }

  handle.value = window.requestAnimFrame(loop);
  return handle;
};

window.clearRequestInterval = function (handle) {
  if (!handle) return;
  if (window.cancelAnimationFrame) {
    window.cancelAnimationFrame(handle.value);
  } else if (window.webkitCancelAnimationFrame) {
    window.webkitCancelAnimationFrame(handle.value);
  } else if (window.webkitCancelRequestAnimationFrame) {
    window.webkitCancelRequestAnimationFrame(handle.value);
  } else if (window.mozCancelRequestAnimationFrame) {
    window.mozCancelRequestAnimationFrame(handle.value);
  } else if (window.oCancelRequestAnimationFrame) {
    window.oCancelRequestAnimationFrame(handle.value);
  } else if (window.msCancelRequestAnimationFrame) {
    window.msCancelRequestAnimationFrame(handle.value);
  } else {
    clearInterval(handle);
  }
};

