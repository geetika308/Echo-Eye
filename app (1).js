// ===== Echo-Eye: Voice-guided object detection =====
// Whole screen = one tap target, always. Language is chosen by
// tapping repeatedly to cycle through options (announced out loud),
// then it auto-starts after a short pause. No precise buttons anywhere.

const appButton = document.getElementById('app-button');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status-text');
const startOverlay = document.getElementById('start-overlay');
const lastDetectionBox = document.getElementById('last-detection');
const detectionText = document.getElementById('detection-text');
const liveAnnouncer = document.getElementById('live-announcer');

const LANG_ORDER = ['en', 'hi']; // order languages cycle through on tap

let model = null;
let running = false;
let lastSpokenAt = 0;
let lastSpokenLabel = '';
let currentLang = 'en';
let phase = 'choosingLanguage'; // 'choosingLanguage' -> 'running'
let autoStartTimer = null;
const SPEAK_COOLDOWN_MS = 2500;
const AUTO_START_DELAY_MS = 3000; // how long to wait after last tap before auto-starting

// ---- Speech ----
function speak(text, lang) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = TRANSLATIONS[lang || currentLang].speechLang;
  utterance.rate = 1.0;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);

  liveAnnouncer.textContent = text;
  detectionText.textContent = text;
  lastDetectionBox.classList.remove('hidden');
}

// ---- Position / proximity logic ----
function getPosition(bbox, videoWidth) {
  const [x, , boxWidth] = bbox;
  const centerX = x + boxWidth / 2;
  const third = videoWidth / 3;
  if (centerX < third) return 'left';
  if (centerX > third * 2) return 'right';
  return 'ahead';
}

function getProximity(bbox, videoWidth, videoHeight) {
  const [, , boxWidth, boxHeight] = bbox;
  const areaRatio = (boxWidth * boxHeight) / (videoWidth * videoHeight);
  if (areaRatio > 0.35) return 'veryClose';
  if (areaRatio > 0.15) return 'close';
  return '';
}

// ---- Camera ----
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

// ---- Detection loop ----
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
      speak(buildPhrase(currentLang, best.class, position, proximity));
      lastSpokenAt = now;
      lastSpokenLabel = best.class;
    }
  }

  requestAnimationFrame(detectFrame);
}

// ---- Start detection (after language is confirmed) ----
async function startDetection() {
  phase = 'running';
  const t = TRANSLATIONS[currentLang].phrases;
  statusText.textContent = 'Starting camera...';

  try {
    await startCamera();
  } catch (err) {
    statusText.textContent = 'Camera access denied or unavailable.';
    speak(t.needCamera);
    phase = 'choosingLanguage'; // let them try again
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

function stopDetection() {
  running = false;
  phase = 'choosingLanguage';
  const t = TRANSLATIONS[currentLang].phrases;
  statusText.textContent = t.tapToStart;
  startOverlay.classList.remove('hidden');
  window.speechSynthesis.cancel();
  speak(t.stopped);

  // Re-announce current language so they know where they're starting from
  setTimeout(() => announceLanguage(), 1400);
  scheduleAutoStart();
}

// ---- Language selection: tap cycles language, auto-starts after a pause ----
function announceLanguage() {
  speak(TRANSLATIONS[currentLang].langName, currentLang);
  statusText.textContent = TRANSLATIONS[currentLang].langName;
}

function scheduleAutoStart() {
  clearTimeout(autoStartTimer);
  autoStartTimer = setTimeout(() => {
    if (phase === 'choosingLanguage') {
      startDetection();
    }
  }, AUTO_START_DELAY_MS);
}

function cycleLanguage() {
  const idx = LANG_ORDER.indexOf(currentLang);
  currentLang = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
  announceLanguage();
  scheduleAutoStart();
}

// ---- Single tap handler for the whole screen ----
let hasGreeted = false;

appButton.addEventListener('click', () => {
  if (phase === 'choosingLanguage') {
    if (!hasGreeted) {
      hasGreeted = true;
      speak('Echo Eye. Language: ' + TRANSLATIONS[currentLang].langName + '. Tap again to change. Wait to start.', currentLang);
      statusText.textContent = TRANSLATIONS[currentLang].langName;
      scheduleAutoStart();
    } else {
      cycleLanguage();
    }
  } else if (running) {
    stopDetection();
  }
});
