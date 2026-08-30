/**
 * Contour field background.
 *
 *   <div id="hero" style="position:relative">…your hero content…</div>
 *   <script src="contour-background.js"></script>
 *   <script>contourBackground(document.getElementById('hero'));</script>
 *
 * Inserts a canvas as the first child of the target, absolutely positioned and
 * behind everything else. The target needs `position: relative` (or absolute/fixed).
 * Returns a stop() function.
 *
 * Options: { color, lines, speed, opacity, grain }
 */
function contourBackground(target, options) {
  var o = Object.assign({
    color: '#625b51',   // page ground — the ridges are drawn as tints of this
    lines: 44,
    speed: 1,
    opacity: 1,
    grain: true   // film-grain overlay, same texture as the static page background
  }, options || {});

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;display:block;z-index:-1;pointer-events:none;opacity:' + o.opacity;
  target.insertBefore(canvas, target.firstChild);
  if (getComputedStyle(target).position === 'static') target.style.position = 'relative';

  var ctx = canvas.getContext('2d');

  var s = o.color.replace('#', '');
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  var n = parseInt(s, 16);
  var base = [(n >> 16) & 255, (n >> 8) & 255, n & 255];

  function tint(d, a) {
    function c(v) { return Math.max(0, Math.min(255, Math.round(v + d))); }
    return 'rgba(' + c(base[0]) + ',' + c(base[1]) + ',' + c(base[2]) + ',' + (a === undefined ? 1 : a) + ')';
  }

  // Same SVG-turbulence grain as the static CSS background, drawn into the
  // canvas so the animated hero and the rest of the page read as one texture.
  var grainPattern = null;
  if (o.grain) {
    var grainImg = new Image();
    grainImg.onload = function () { grainPattern = ctx.createPattern(grainImg, 'repeat'); };
    grainImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>";
  }

  var raf, t0 = performance.now();

  function frame(now) {
    var w = canvas.offsetWidth, h = canvas.offsetHeight;
    if (w && h) {
      var d = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * d) || canvas.height !== Math.round(h * d)) {
        canvas.width = Math.round(w * d);
        canvas.height = Math.round(h * d);
      }
      ctx.setTransform(d, 0, 0, d, 0, 0);

      var t = ((now - t0) / 1000) * o.speed;

      ctx.fillStyle = tint(0);
      ctx.fillRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w / 2, h * 0.42, w * 0.06, w / 2, h * 0.5, w * 0.72);
      g.addColorStop(0, tint(16, 0.55));
      g.addColorStop(1, tint(0, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      var step = 6, gap = h / (o.lines - 1);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      for (var i = 0; i < o.lines; i++) {
        var y0 = i * gap;
        var bias = Math.sin((i / (o.lines - 1)) * Math.PI);
        var edge = 1 - 0.55 * bias;
        var amp = 12 + 40 * bias;
        var drift = t * 26 * (0.4 + 0.6 * bias);
        ctx.beginPath();
        for (var x = -step; x <= w + step; x += step) {
          var u = (x + drift) / w;
          var dy =
            Math.sin(u * 2.6 + t * 0.26 + i * 0.28) * amp +
            Math.sin(u * 6.1 - t * 0.17 + i * 0.16) * amp * 0.44 +
            Math.sin(u * 11.7 + t * 0.11 + i * 0.49) * amp * 0.18;
          var y = y0 + dy;
          if (x <= 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = tint(85, 0.05 + 0.12 * edge);
        ctx.stroke();
      }

      if (grainPattern) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  return function stop() { cancelAnimationFrame(raf); canvas.remove(); };
}

if (typeof module !== 'undefined') module.exports = { contourBackground: contourBackground };
