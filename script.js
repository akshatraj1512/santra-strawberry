/*
  Put your files here:
  assets/photos/santra-01.png ... santra-50.png
  assets/gifs/cat-01.gif ... kuromi-01.gif
  Change the names in PHOTO_FILES and GIF_FILES if yours differ.
*/
const PHOTO_FILES = Array.from({ length: 50 }, (_, i) =>
  `assets/photos/santra-${String(i + 1).padStart(2, "0")}.png`
);

// Replace these example filenames with the exact names of your 5–7 GIFs.
const GIF_FILES = [
  "assets/gifs/cat-01.gif",
  "assets/gifs/cat-02.gif",
  "assets/gifs/kuromi-01.gif",
  "assets/gifs/cat-03.gif",
  "assets/gifs/kuromi-02.gif",
  "assets/gifs/cat-04.gif"
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

function showScreen(screen) {
  [intro, rain, finale].forEach(section => section.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function clearRain() {
  dropTimers.forEach(clearTimeout);
  dropTimers = [];
  photoField.replaceChildren();
  blastStarted = false;
  blastBtn.disabled = true;
}

function createPhotoDrop(src, index, total) {
  const img = document.createElement("img");
  img.className = "photo-drop";
  img.src = src;
  img.alt = "";
  img.draggable = false;

  const width = random(68, 118);
  const left = random(-2, 84);
  const tilt = random(-28, 28);
  const duration = random(2.4, 5.4);
  const settleY = random(15, Math.max(25, window.innerHeight - 120));
  const settleX = random(-4, Math.max(5, window.innerWidth - width));

  img.style.left = `${left}%`;
  img.style.setProperty("--photo-width", `${width}px`);
  img.style.setProperty("--duration", `${duration}s`);
  img.style.setProperty("--settle-y", `${settleY}px`);
  img.style.setProperty("--settle-x", `${settleX}px`);
  img.style.setProperty("--tilt", `${tilt}deg`);
  img.style.setProperty("--drift", `${random(-45, 45)}px`);

  // The image settles into a scattered pile. Once the pile is dense enough,
  // the page looks intentionally overrun with photos rather than freezing.
  const settleTimer = setTimeout(() => {
    if (blastStarted || !img.isConnected) return;
    img.classList.add("settled");
    img.style.top = `${settleY}px`;
    img.style.left = `${settleX}px`;
  }, duration * 1000);

  dropTimers.push(settleTimer);
  photoField.appendChild(img);
  return img;
}

function startRain() {
  clearRain();
  showScreen(rain);
  statusText.textContent = "DEPLOYING 50 (FIFTY!!) SANTRAS...";
  const files = shuffle(PHOTO_FILES);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const interval = reducedMotion ? 40 : 95;

  files.forEach((file, index) => {
    const timer = setTimeout(() => {
      if (blastStarted) return;
      createPhotoDrop(file, index, files.length);
      if (index === files.length - 1) {
        statusText.textContent = "THE SANTRA SITUATION IS OUT OF CONTROL";
        blastBtn.disabled = false;
      }
    }, index * interval);
    dropTimers.push(timer);
  });

  // Allow the escape button after a short beat, even if some image files fail.
  dropTimers.push(setTimeout(() => { blastBtn.disabled = false; }, 1800));
}

function blastPhotos() {
  if (blastStarted) return;
  blastStarted = true;
  dropTimers.forEach(clearTimeout);
  blastBtn.disabled = true;

  const images = [...photoField.querySelectorAll(".photo-drop")];
  images.forEach(img => {
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

  // A tiny pause lets the photos visibly explode before the finale arrives.
  setTimeout(() => {
    photoField.replaceChildren();
    showFinale();
  }, 780);
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

  typeMessage("that time of the year when we both the same age, cheers!");
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

startBtn.addEventListener("click", startRain);
blastBtn.addEventListener("click", blastPhotos);
replayBtn.addEventListener("click", () => {
  clearRain();
  showScreen(intro);
});

// Friendly fallback if the browser doesn't have the online pixel font cached.
document.fonts?.ready?.catch?.(() => {});
