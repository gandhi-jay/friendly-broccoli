import * as THREE from "three";

// ============================================================
// Helpers
// ============================================================
function getAccentColor(): THREE.Color {
  const style = getComputedStyle(document.documentElement);
  return new THREE.Color((style.getPropertyValue("--accent").trim() || "#7ecf7e"));
}

function getSpread() {
  return {
    x: Math.max(window.innerWidth * 0.6, 300),
    y: Math.max(window.innerHeight * 0.6, 200),
    z: 200,
  };
}

// ============================================================
// Blocked page logic (from blocked.js)
// ============================================================
(function () {
  var EMBED_BASE = "https://www.gandhijay.com/yt-embed.html?id=";
  var QUOTE_API_URLS = [
    "https://type.fit/api/quotes",
    "https://zenquotes.io/api/quotes",
  ];

  var params = new URLSearchParams(location.search);
  var blockedUrl = params.get("url") || "Unknown";
  document.getElementById("blockedUrl")!.textContent = "Blocked: " + blockedUrl;

  chrome.storage.sync.get("extensionData", function (result) {
    var data = result.extensionData || {};

    var theme = data.theme || "terminal";
    document.documentElement.setAttribute("data-theme", theme);

    var videoIds =
      data.youtubeVideoIds?.length ? data.youtubeVideoIds : ["dQw4w9WgXcQ"];

    var videoId = videoIds[Math.floor(Math.random() * videoIds.length)];

    document.getElementById("videoWrapper")!.innerHTML =
      '<iframe src="' + EMBED_BASE + videoId +
      '" title="Blocked page video" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

    var quotes = data.quotes?.length ? data.quotes : ["In moments of crisis, panic does nothing. Harness it. Let it serve you."];

    function showLocalQuote() {
      var quote = quotes[Math.floor(Math.random() * quotes.length)];
      document.getElementById("quoteText")!.textContent = quote;
    }

    if (!data.disableApiQuotes) {
      var QUOTE_CACHE_KEY = "quoteCache";

      chrome.storage.local.get(QUOTE_CACHE_KEY, function (result) {
        var cache = { quotes: [], fetchedAt: 0 };
        if (result[QUOTE_CACHE_KEY]) {
          var raw = result[QUOTE_CACHE_KEY];
          if (raw.quotes) cache.quotes = raw.quotes;
          if (raw.fetchedAt) cache.fetchedAt = raw.fetchedAt;
        }
        var fetchedThisPage = false;

        function sameDay(a: number, b: number) {
          var da = new Date(a);
          var db = new Date(b);
          return (
            da.getFullYear() === db.getFullYear() &&
            da.getMonth() === db.getMonth() &&
            da.getDate() === db.getDate()
          );
        }

        function pickRandom(arr: any[]) {
          return arr[Math.floor(Math.random() * arr.length)];
        }

        function normalizeQuotes(list: any[]) {
          var out: { text: string; author: string }[] = [];
          for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var text = item.text || item.q;
            var author = item.author || item.a || "";
            if (text) out.push({ text: text, author: author });
          }
          return out;
        }

        function fetchFresh(callback?: () => void) {
          if (fetchedThisPage) {
            if (callback) callback();
            return;
          }
          fetchedThisPage = true;

          cache.fetchedAt = Date.now();
          chrome.storage.local.set({ [QUOTE_CACHE_KEY]: cache });

          var promises = QUOTE_API_URLS.map(function (url) {
            return fetch(url)
              .then(function (res) {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
              })
              .catch(function () {
                return [];
              });
          });

          Promise.allSettled(promises).then(function (results) {
            var allQuotes: { text: string; author: string }[] = [];
            for (var i = 0; i < results.length; i++) {
              if (results[i].status === "fulfilled" && results[i].value.length) {
                allQuotes = allQuotes.concat(
                  normalizeQuotes(results[i].value)
                );
              }
            }

            if (allQuotes.length > 0) {
              for (var i = allQuotes.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = allQuotes[i];
                allQuotes[i] = allQuotes[j];
                allQuotes[j] = tmp;
              }
              cache.quotes = allQuotes;
            }
            cache.fetchedAt = Date.now();
            chrome.storage.local.set({ [QUOTE_CACHE_KEY]: cache });
            if (callback) callback();
          });
        }

        function showQuote() {
          if (cache.quotes.length > 0) {
            var q = pickRandom(cache.quotes);
            var text = q.text || "Stay focused.";
            var author = q.author ? " \u2014 " + q.author : "";
            document.getElementById("quoteText")!.textContent = text + author;
          } else {
            showLocalQuote();
          }
        }

        if (!sameDay(cache.fetchedAt, Date.now())) {
          fetchFresh(showQuote);
        } else if (cache.quotes.length > 0) {
          showQuote();
        } else {
          showLocalQuote();
        }
      });
    } else {
      showLocalQuote();
    }
  });
})();

// ============================================================
// Three.js 3D Particle System
// ============================================================
const container = document.getElementById("particles-container");
if (!container) throw new Error("Missing #particles-container");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

// ---- Parameters ----
const COUNT = 150;
const CONNECT_DIST = 150;
const REPEL_DIST = 160;
const REPEL_FORCE = 1.8;

let spread = getSpread();

// ---- Particle data ----
const positions = new Float32Array(COUNT * 3);
const velocities: THREE.Vector3[] = [];
const particleSizes = new Float32Array(COUNT);

for (let i = 0; i < COUNT; i++) {
  positions[i * 3] = (Math.random() - 0.5) * spread.x * 2;
  positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y * 2;
  positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z * 2;
  velocities.push(
    new THREE.Vector3(
      (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 0.3,
    ),
  );
  particleSizes[i] = Math.random() * 2.5 + 1.0;
}

// ---- Custom ShaderMaterial for per‑particle size ----
const vertexShader = `
  attribute float size;
  varying float vAlpha;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = 0.8 + 0.2 * (1.0 - clamp(-mvPosition.z / 600.0, 0.0, 1.0));
  }
`;
const fragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));

const particleMaterial = new THREE.ShaderMaterial({
  uniforms: { uColor: { value: getAccentColor() } },
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// ---- Connection lines ----
const maxLines = (COUNT * (COUNT - 1)) / 2;
const linePositions = new Float32Array(maxLines * 6);
const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
lineGeometry.setDrawRange(0, 0);

const lineMaterial = new THREE.LineBasicMaterial({
  color: getAccentColor(),
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
scene.add(lineSystem);

// ---- Mouse ----
const mouse = new THREE.Vector2();
const mouse3D = new THREE.Vector3();
let mouseActive = false;

document.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  mouseActive = true;
});

document.addEventListener("mouseleave", () => {
  mouseActive = false;
});

// ---- Resize ----
function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  spread = getSpread();
}
window.addEventListener("resize", handleResize);

// ---- Animation ----
let clock = new THREE.Timer();

function animate() {
  clock.update();
  const dt = clock.getDelta();
  const elapsed = clock.getElapsed();

  // Project mouse to z=0 plane in world space
  if (mouseActive) {
    const vec = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const t = -camera.position.z / dir.z;
    mouse3D.copy(camera.position).add(dir.multiplyScalar(t));
  }

  const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
  const array = posAttr.array as Float32Array;

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const v = velocities[i];

    // Drift
    array[i3] += v.x * dt * 60;
    array[i3 + 1] += v.y * dt * 60;
    array[i3 + 2] += v.z * dt * 60;

    // Mouse repel in 3D
    if (mouseActive) {
      const dx = array[i3] - mouse3D.x;
      const dy = array[i3 + 1] - mouse3D.y;
      const dz = array[i3 + 2] - mouse3D.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < REPEL_DIST && dist > 0.01) {
        const force = ((REPEL_DIST - dist) / REPEL_DIST) * REPEL_FORCE;
        array[i3] += (dx / dist) * force;
        array[i3 + 1] += (dy / dist) * force;
        array[i3 + 2] += (dz / dist) * force;
      }
    }

    // Wrap
    const sx = spread.x;
    const sy = spread.y;
    const sz = spread.z;
    if (array[i3] > sx) array[i3] = -sx;
    if (array[i3] < -sx) array[i3] = sx;
    if (array[i3 + 1] > sy) array[i3 + 1] = -sy;
    if (array[i3 + 1] < -sy) array[i3 + 1] = sy;
    if (array[i3 + 2] > sz) array[i3 + 2] = -sz;
    if (array[i3 + 2] < -sz) array[i3 + 2] = sz;
  }
  posAttr.needsUpdate = true;

  // Connection lines
  let lineIdx = 0;
  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    for (let j = i + 1; j < COUNT; j++) {
      const j3 = j * 3;
      const dx = array[i3] - array[j3];
      const dy = array[i3 + 1] - array[j3 + 1];
      const dz = array[i3 + 2] - array[j3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < CONNECT_DIST) {
        const li = lineIdx * 6;
        linePositions[li] = array[i3];
        linePositions[li + 1] = array[i3 + 1];
        linePositions[li + 2] = array[i3 + 2];
        linePositions[li + 3] = array[j3];
        linePositions[li + 4] = array[j3 + 1];
        linePositions[li + 5] = array[j3 + 2];
        lineIdx++;
      }
    }
  }
  lineGeometry.attributes.position.needsUpdate = true;
  lineGeometry.setDrawRange(0, lineIdx * 2);

  // Subtle camera sway for 3D parallax
  camera.position.x = Math.sin(elapsed * 0.03) * 15;
  camera.position.y = Math.cos(elapsed * 0.04) * 10;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ---- Theme change observer ----
const themeObserver = new MutationObserver(() => {
  const color = getAccentColor();
  particleMaterial.uniforms.uColor.value.copy(color);
  lineMaterial.color.copy(color);
});
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

// ---- Camera position ----
const maxDim = Math.max(spread.x, spread.y);
camera.position.set(0, 0, maxDim * 1.4);
camera.lookAt(0, 0, 0);

// ---- Go ----
animate();
