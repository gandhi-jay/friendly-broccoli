(function () {
  var canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var particles = [];
  var mouseX, mouseY;
  var animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener("mouseleave", function () {
    mouseX = undefined;
    mouseY = undefined;
  });

  var COUNT = 80;

  function initParticles() {
    particles = [];
    for (var i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.4 + 0.15,
      });
    }
  }
  initParticles();

  function getColor() {
    var style = getComputedStyle(document.documentElement);
    return style.getPropertyValue("--accent").trim() || "#7ecf7e";
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return r + "," + g + "," + b;
  }

  function animate() {
    var accent = getColor();
    var rgb = hexToRgb(accent);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      p.x += p.speedX;
      p.y += p.speedY;

      if (mouseX !== undefined && mouseY !== undefined) {
        var dx = p.x - mouseX;
        var dy = p.y - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          var force = (150 - dist) / 150;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }
      }

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      for (var j = i + 1; j < particles.length; j++) {
        var p2 = particles[j];
        var dx2 = p.x - p2.x;
        var dy2 = p.y - p2.y;
        var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (dist2 < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = "rgba(" + rgb + "," + (0.08 * (1 - dist2 / 120)) + ")";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + rgb + "," + p.opacity + ")";
      ctx.fill();
    }

    animId = requestAnimationFrame(animate);
  }

  initParticles();
  animate();

  window.__reinitParticles = function () {
    cancelAnimationFrame(animId);
    initParticles();
    animate();
  };
})();
