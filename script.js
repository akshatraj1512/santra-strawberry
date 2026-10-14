/*
  Put your files here:
  assets/photos/1.png ... 50.png
  assets/gifs/cat-01.gif ... kuromi-01.gif
  Change the names in PHOTO_FILES and GIF_FILES if yours differ.
*/
const PHOTO_FILES = Array.from({ length: 50 }, (_, i) =>
  `assets/photos/${i + 1}.png`
);

// Replace these example filenames with the exact names of your 5–7 GIFs.
const GIF_FILES = [
  "assets/gifs/1.gif",
  "assets/gifs/2.gif",
  "assets/gifs/3.gif",
  "assets/gifs/4.gif",
  "assets/gifs/5.gif",
  "assets/gifs/6.gif",
  "assets/gifs/7.gif"
];

const intro = document.querySelector("#intro");
const rain = document.querySelector("#rain");
const finale = document.querySelector("#finale");
const photoField = document.querySelector("#photoField");
const startBtn = document.querySelector("#startBtn");
const blastBtn = document.querySelector("#blastBtn");
const replayBtn = document.querySelector("#replayBtn");
const statusText = document.querySelector("#statusText");
const gifGallery = document.querySelector("#gifGallery");
const finalMessage = document.querySelector("#finalMessage");

let dropTimers = [];
let blastStarted = false;
let audioContext = null;
let fallThemeTimer = null;
let rainLoopTimer = null;
let activeDropXs = [];

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtor();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function playTone({ freq = 440, duration = 0.12, type = "square", volume = 0.05, slide = 0, delay = 0 }) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, start);
  if (slide) {
    oscillator.frequency.linearRampToValueAtTime(freq + slide, start + duration);
  }

  gainNode.gain.setValueAtTime(volume, start);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playNoiseBurst({ duration = 0.18, volume = 0.08, low = 250, high = 1800 }) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < channelData.length; i++) {
    const t = i / channelData.length;
    channelData[i] = (Math.random() * 2 - 1) * (1 - t);
  }

  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(high, start);
  filter.Q.value = 0.5;

  gainNode.gain.setValueAtTime(volume, start);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start(start);
  source.stop(start + duration);

  playTone({ freq: low, duration: duration * 0.8, type: "sawtooth", volume: volume * 1.5, slide: -60, delay: 0 });
}

function playCoinSound() {
  playTone({ freq: 880, duration: 0.12, type: "square", volume: 0.06, slide: 200 });
  playTone({ freq: 1320, duration: 0.12, type: "triangle", volume: 0.05, slide: 240, delay: 0.08 });
}

function playFallSound(index = 0) {
  const variation = index % 6;
  const notes = [220, 260, 330, 390, 440, 520];
  playTone({
    freq: notes[variation],
    duration: 0.06,
    type: "triangle",
    volume: 0.02,
    slide: 30
  });
}

function playExplosionSound() {
  playNoiseBurst({ duration: 0.32, volume: 0.09, low: 140, high: 900 });
  playTone({ freq: 140, duration: 0.28, type: "sawtooth", volume: 0.07, slide: -90 });
  playTone({ freq: 90, duration: 0.38, type: "square", volume: 0.06, slide: -40, delay: 0.04 });
}

function playMarioVictory() {
  const notes = [
    [659, 0.18], [659, 0.18], [659, 0.22], [523, 0.18], [659, 0.18], [784, 0.22],
    [392, 0.26], [523, 0.18], [392, 0.18], [330, 0.22], [440, 0.18], [494, 0.18],
    [466, 0.18], [440, 0.2], [392, 0.26], [659, 0.18], [784, 0.18], [880, 0.24],
    [698, 0.24], [784, 0.18], [659, 0.18], [587, 0.18], [659, 0.18]
  ];

  notes.forEach(([freq, duration], index) => {
    const delay = index * 0.1;
    playTone({ freq, duration, type: index % 2 === 0 ? "square" : "triangle", volume: 0.05, slide: 60, delay });
  });
}

function startRainMusic() {
  stopRainMusic();

  const melody = [659, 659, 659, 523, 659, 784, 392, 523, 392, 330, 440, 494, 466, 440, 392];
  let step = 0;

  fallThemeTimer = setInterval(() => {
    const freq = melody[step % melody.length];
    const duration = step % 2 === 0 ? 0.12 : 0.1;
    playTone({ freq, duration, type: "square", volume: 0.025, slide: 40 });
    step += 1;
  }, 170);
}

function stopRainMusic() {
  if (fallThemeTimer) {
    clearInterval(fallThemeTimer);
    fallThemeTimer = null;
  }
}

function getEvenPhotoLayout(total) {
  const width = window.innerWidth;
  const columns = Math.min(10, Math.max(6, Math.round(width / 140)));
  const segmentWidth = width / columns;
  const positions = [];

  for (let i = 0; i < total; i++) {
    const column = i % columns;
    const minX = column * segmentWidth + 24;
    const maxX = (column + 1) * segmentWidth - 24;

    positions.push({
      x: random(minX, maxX),
      drift: random(-18, 18),
      duration: random(4.8, 8.2),
      delay: random(0, 0.9)
    });
  }

  return shuffle(positions);
}

function showScreen(screen) {
  [intro, rain, finale].forEach(section => section.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function clearRain() {
  stopRainMusic();
  if (rainLoopTimer) {
    clearInterval(rainLoopTimer);
    rainLoopTimer = null;
  }
  dropTimers.forEach(clearTimeout);
  dropTimers = [];
  activeDropXs = [];
  photoField.replaceChildren();
  blastStarted = false;
  blastBtn.disabled = true;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getRandomDropPlacement() {
  const margin = 28;
  const minGap = 110;
  const maxX = Math.max(margin + 60, window.innerWidth - margin - 120);
  let x = random(margin, maxX);

  for (let tries = 0; tries < 500; tries++) {
    x = random(margin, maxX);
    if (!activeDropXs.some(existing => Math.abs(existing - x) < minGap)) {
      activeDropXs.push(x);
      return {
        x,
        drift: random(-18, 18),
        duration: random(5.8, 9.4),
        delay: random(0, 0.8)
      };
    }
  }

  activeDropXs.push(x);
  return {
    x,
    drift: random(-18, 18),
    duration: random(5.8, 9.4),
    delay: random(0, 0.8)
  };
}

function createPhotoDrop(src, index, total, placement = {}) {
  const img = document.createElement("img");
  img.className = "photo-drop";
  img.src = src;
  img.alt = "";
  img.draggable = false;

  const width = random(92, 168);
  const centerX = placement.x ?? random(30, Math.max(40, window.innerWidth - 120));
  const left = centerX - width / 2;
  const sway = placement.drift ?? random(-22, 22);
  const duration = placement.duration ?? random(4.4, 7.6);

  img.style.left = `${left}px`;
  img.style.animationDelay = `${placement.delay ?? 0}s`;
  img.style.setProperty("--photo-width", `${width}px`);
  img.style.setProperty("--duration", `${duration}s`);
  img.style.setProperty("--sway", `${sway}px`);
  img.style.setProperty("--left", `${left}px`);

  photoField.appendChild(img);
  playFallSound(index);

  const removeTimer = setTimeout(() => {
    if (img.isConnected) img.remove();
    activeDropXs = activeDropXs.filter(existing => Math.abs(existing - centerX) > 80);
  }, (duration + 1.5) * 1000);

  dropTimers.push(removeTimer);
  return img;
}

function startRain() {
  clearRain();
  showScreen(rain);

  statusText.textContent = "WORLD DOMINATION ACTIVATED";
  blastBtn.disabled = true;
  blastStarted = false;

  const files = shuffle([...PHOTO_FILES]);
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Rough landing zones, not rigid photo boundaries.
  const cols = Math.max(4, Math.min(8, Math.round(W / 80)));
  const rows = Math.ceil(files.length / cols);
  const cellW = W / cols;
  const cellH = H / rows;

  startRainMusic();

  files.forEach((src, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.draggable = false;
    img.className = "photo-drop organic-photo";

    // Randomise the landing position around each loose zone.
    const width = cellW * random(1.12, 1.5);
    const height = cellH * random(1.15, 1.45);

    const centreX = col * cellW + cellW / 2;
    const centreY = row * cellH + cellH / 2;

    const x = centreX - width / 2
      + random(-cellW * 0.10, cellW * 0.10);
    const y = centreY - height / 2
      + random(-cellH * 0.08, cellH * 0.08);

    // Every picture gets its own wobble, timing and final angle.
    const duration = random(1.3, 2.2);
    const delay = i * random(0.055, 0.095);

    img.style.left = `${x}px`;
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    img.style.zIndex = Math.floor(random(1, 50));

    img.style.setProperty("--target-y", `${y}px`);
    img.style.setProperty("--fall-duration", `${duration}s`);
    img.style.setProperty("--fall-delay", `${delay}s`);
    img.style.setProperty("--tilt", `${random(-24, 24)}deg`);
    img.style.setProperty("--sway", `${random(-35, 35)}px`);
    img.style.setProperty("--sway2", `${random(-20, 20)}px`);

    img.addEventListener("animationend", (event) => {
      if (event.animationName !== "organicPhotoFall") return;

      img.classList.add("landed");
      img.style.animation = "none";
      img.style.top = `${y}px`;
      img.style.transform = `rotate(${img.style.getPropertyValue("--tilt")})`;
    }, { once: true });

    photoField.appendChild(img);
    playFallSound(i);
  });

  // Enable the button after the last photo should have landed.
  const totalTime = files.length * 0.095 * 1000 + 2600;

  dropTimers.push(setTimeout(() => {
    if (blastStarted) return;

    statusText.textContent = "IMMEDIATE ACTION REQUIRED";
    blastBtn.disabled = false;
  }, totalTime));
}

function blastPhotos() {
  if (blastStarted) return;
  blastStarted = true;
  stopRainMusic();
  if (rainLoopTimer) {
    clearInterval(rainLoopTimer);
    rainLoopTimer = null;
  }
  dropTimers.forEach(clearTimeout);
  blastBtn.disabled = true;
  playExplosionSound();

  const images = [...photoField.querySelectorAll(".photo-drop")];
  images.forEach((img) => {
    const rect = img.getBoundingClientRect();
    img.classList.remove("settled");
    img.classList.add("blast-particle");
    img.style.left = `${rect.left}px`;
    img.style.top = `${rect.top}px`;
    img.style.width = `${rect.width}px`;
    img.style.setProperty("--blast-x", `${random(-window.innerWidth, window.innerWidth)}px`);
    img.style.setProperty("--blast-y", `${random(-window.innerHeight, window.innerHeight)}px`);
    img.style.setProperty("--blast-rotate", `${random(-720, 720)}deg`);
  });

  setTimeout(() => {
    photoField.replaceChildren();
    showFinale();
  }, 780);
}

function setupGifMotion() {
  const gifs = [...gifGallery.querySelectorAll(".gif-sticker")];
  if (!gifs.length) return;

  const areaWidth = gifGallery.clientWidth || window.innerWidth;
  const areaHeight = gifGallery.clientHeight || window.innerHeight;

  const particles = gifs.map((img, index) => {
    const size = Math.max(60, Math.min(110, img.naturalWidth || 100));
    const x = random(10, Math.max(10, areaWidth - size - 20));
    const y = random(10, Math.max(10, areaHeight - size - 20));
    const vx = random(-0.7, 0.7);
    const vy = random(-0.7, 0.7);

    img.style.position = "absolute";
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.zIndex = String(index + 1);
    img.style.transform = "rotate(0deg)";

    return { img, x, y, vx, vy, size };
  });

  function frame() {
    const width = gifGallery.clientWidth || window.innerWidth;
    const height = gifGallery.clientHeight || window.innerHeight;

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x <= 5) {
        particle.x = 5;
        particle.vx *= -1;
      }
      if (particle.x + particle.size >= width - 5) {
        particle.x = width - particle.size - 5;
        particle.vx *= -1;
      }
      if (particle.y <= 5) {
        particle.y = 5;
        particle.vy *= -1;
      }
      if (particle.y + particle.size >= height - 5) {
        particle.y = height - particle.size - 5;
        particle.vy *= -1;
      }

      particle.img.style.left = `${particle.x}px`;
      particle.img.style.top = `${particle.y}px`;
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const minDistance = (a.size + b.size) / 2;

        if (distance < minDistance) {
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minDistance - distance;

          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            const impulse = -(0.9 * velAlongNormal);
            a.vx -= impulse * nx;
            a.vy -= impulse * ny;
            b.vx += impulse * nx;
            b.vy += impulse * ny;
          }
        }
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function showFinale() {
  showScreen(finale);
  gifGallery.replaceChildren();

  GIF_FILES.forEach((file, index) => {
    const img = document.createElement("img");
    img.className = "gif-sticker";
    img.src = file;
    img.alt = index % 2 === 0 ? "Silly cat GIF" : "Kuromi or birthday GIF";
    img.loading = "eager";
    img.onerror = () => {
      img.alt = "GIF missing — check its filename in script.js";
      img.style.border = "2px dashed #8d2452";
      img.style.padding = "6px";
    };
    gifGallery.appendChild(img);
  });

  setupGifMotion();
  typeMessage("that time of the year when we both the same age, cheers!");
  playMarioVictory();
}

function typeMessage(message) {
  finalMessage.textContent = "";
  let i = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    finalMessage.textContent = message;
    return;
  }
  const interval = setInterval(() => {
    finalMessage.textContent += message[i] || "";
    i++;
    if (i >= message.length) clearInterval(interval);
  }, 48);
}

function bindControls() {
  const startButton = document.querySelector("#startBtn");
  const blastButton = document.querySelector("#blastBtn");
  const replayButton = document.querySelector("#replayBtn");

  if (!startButton || !blastButton || !replayButton) return;

  startButton.addEventListener("click", () => {
    getAudioContext();
    playCoinSound();
    startRain();
  });

  blastButton.addEventListener("click", () => {
    getAudioContext();
    blastPhotos();
  });

  replayButton.addEventListener("click", () => {
    getAudioContext();
    playCoinSound();
    clearRain();
    showScreen(intro);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindControls);
} else {
  bindControls();
}

// Friendly fallback if the browser doesn't have the online pixel font cached.
document.fonts?.ready?.catch?.(() => {});
