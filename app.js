// ===== Echo-Eye: Voice-guided object detection =====
// This file handles: camera access, running the AI model,
// figuring out object position, and speaking results out loud
// in the user's chosen language.

const appButton = document.getElementById('app-button');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status-text');
const startOverlay = document.getElementById('start-overlay');
const lastDetectionBox = document.getElementById('last-detection');
const detectionText = document.getElementById('detection-text');
const liveAnnouncer = document.getElementById('live-announcer');
const langButtons = document.querySelectorAll('.lang-btn');

let model = null;
let running = false;
let lastSpokenAt = 0;
let lastSpokenLabel = '';
let currentLang = 'en'; // default language until the user picks one
const SPEAK_COOLDOWN_MS = 2500; // don't repeat the same object too often

// ---- Speech ----
function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = TRANSLATIONS[currentLang].speechLang;
  utterance.rate = 1.0;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);

  liveAnnouncer.textContent = text;
  detectionText.textContent = text;
  lastDetectionBox.classList.remove('hidden');
}

// ---- Position logic: left / center / right ----
function getPosition(bbox, videoWidth) {
  const [x, , boxWidth] = bbox;
  const centerX = x + boxWidth / 2;
  const third = videoWidth / 3;

  if (centerX < third) return 'left';
  if (centerX > third * 2) return 'right';
  return 'ahead';
}

// ---- Distance/urgency logic: how big is the box relative to frame ----
function getProximity(bbox, videoWidth, videoHeight) {
  const [, , boxWidth, boxHeight] = bbox;
  const areaRatio = (boxWidth * boxHeight) / (videoWidth * videoHeight);

  if (areaRatio > 0.35) return 'veryClose';
  if (areaRatio > 0.15) return 'close';
  return '';
}

// ---- Camera setup ----
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      resolve();
    };
  });
}

// ---- Draw detection boxes (visual, helps sighted testers/developers) ----
function drawDetections(predictions) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  predictions.forEach(pred => {
    const [x, y, width, height] = pred.bbox;
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = '#00ff9d';
    ctx.font = '18px sans-serif';
    ctx.fillText(pred.class, x, y > 20 ? y - 6 : y + 18);
  });
}

// ---- Main detection loop ----
async function detectFrame() {
  if (!running) return;

  const predictions = await model.detect(video);
  drawDetections(predictions);

  if (predictions.length > 0) {
    const best = predictions.reduce((a, b) => (a.score > b.score ? a : b));
    const position = getPosition(best.bbox, video.videoWidth);
    const proximity = getProximity(best.bbox, video.videoWidth, video.videoHeight);

    const now = Date.now();
    const sameAsLast = best.class === lastSpokenLabel;
    const cooldownPassed = now - lastSpokenAt > SPEAK_COOLDOWN_MS;

    if (!sameAsLast || cooldownPassed) {
      const phrase = buildPhrase(currentLang, best.class, position, proximity);
      speak(phrase);
      lastSpokenAt = now;
      lastSpokenLabel = best.class;
    }
  }

  requestAnimationFrame(detectFrame);
}

// ---- Start flow (triggered by tapping anywhere, after language is picked) ----
async function start() {
  if (running) return;

  const t = TRANSLATIONS[currentLang].phrases;
  statusText.textContent = 'Starting camera...';

  try {
    await startCamera();
  } catch (err) {
    statusText.textContent = 'Camera access denied or unavailable.';
    speak(t.needCamera);
    return;
  }

  statusText.textContent = t.loading;
  speak(t.loading);

  if (!model) {
    model = await cocoSsd.load();
  }

  startOverlay.classList.add('hidden');
  statusText.textContent = t.detectingTapToStop;
  running = true;
  speak(t.ready);

  detectFrame();
}

function stop() {
  const t = TRANSLATIONS[currentLang].phrases;
  running = false;
  statusText.textContent = t.tapToStart;
  startOverlay.classList.remove('hidden');
  window.speechSynthesis.cancel();
  speak(t.stopped);
}

// ---- Language selection ----
langButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // don't let this tap also trigger the start button
    currentLang = btn.dataset.lang;

    langButtons.forEach(b => b.classList.remove('lang-selected'));
    btn.classList.add('lang-selected');

    statusText.textContent = TRANSLATIONS[currentLang].phrases.tapToStart;
    speak(TRANSLATIONS[currentLang].langName);
  });
});

appButton.addEventListener('click', (e) => {
  // Ignore taps that landed on a language button (handled above)
  if (e.target.closest('.lang-btn')) return;

  if (running) {
    stop();
  } else {
    start();
  }
});
