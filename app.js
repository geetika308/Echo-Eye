// ===== PathSense: Voice-guided object detection =====
// This file handles: camera access, running the AI model,
// figuring out object position, and speaking results out loud.

const appButton = document.getElementById('app-button');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status-text');
const startOverlay = document.getElementById('start-overlay');
const lastDetectionBox = document.getElementById('last-detection');
const detectionText = document.getElementById('detection-text');
const liveAnnouncer = document.getElementById('live-announcer');

let model = null;
let running = false;
let lastSpokenAt = 0;
let lastSpokenLabel = '';
const SPEAK_COOLDOWN_MS = 2500; // don't repeat the same object too often

// ---- Speech ----
function speak(text) {
  // Cancel anything currently being said so we don't queue up a backlog
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);

  // Also push to the ARIA live region for screen reader users
  liveAnnouncer.textContent = text;
  detectionText.textContent = text;
  lastDetectionBox.classList.remove('hidden');
}

// ---- Position logic: left / center / right ----
function getPosition(bbox, videoWidth) {
  const [x, , boxWidth] = bbox;
  const centerX = x + boxWidth / 2;
  const third = videoWidth / 3;

  if (centerX < third) return 'on your left';
  if (centerX > third * 2) return 'on your right';
  return 'ahead';
}

// ---- Distance/urgency logic: how big is the box relative to frame ----
function getProximity(bbox, videoWidth, videoHeight) {
  const [, , boxWidth, boxHeight] = bbox;
  const areaRatio = (boxWidth * boxHeight) / (videoWidth * videoHeight);

  if (areaRatio > 0.35) return 'very close';
  if (areaRatio > 0.15) return 'close';
  return '';
}

// ---- Camera setup ----
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }, // rear camera
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
    // Pick the most confident detection to announce
    const best = predictions.reduce((a, b) => (a.score > b.score ? a : b));
    const position = getPosition(best.bbox, video.videoWidth);
    const proximity = getProximity(best.bbox, video.videoWidth, video.videoHeight);

    const now = Date.now();
    const sameAsLast = best.class === lastSpokenLabel;
    const cooldownPassed = now - lastSpokenAt > SPEAK_COOLDOWN_MS;

    // Speak if it's a new object, or cooldown passed for a repeated one
    if (!sameAsLast || cooldownPassed) {
      const phrase = proximity
        ? `${best.class} ${proximity}, ${position}`
        : `${best.class} ${position}`;
      speak(phrase);
      lastSpokenAt = now;
      lastSpokenLabel = best.class;
    }
  }

  requestAnimationFrame(detectFrame);
}

// ---- Start flow (triggered by tapping anywhere) ----
async function start() {
  if (running) return;

  statusText.textContent = 'Starting camera...';

  try {
    await startCamera();
  } catch (err) {
    statusText.textContent = 'Camera access denied or unavailable.';
    speak('Camera access is needed for this app to work. Please allow camera permission.');
    return;
  }

  statusText.textContent = 'Loading detection model...';
  speak('Loading. Please wait.');

  if (!model) {
    model = await cocoSsd.load();
  }

  startOverlay.classList.add('hidden');
  statusText.textContent = 'Detecting - tap to stop';
  running = true;
  speak('Ready. Detection started.');

  detectFrame();
}

function stop() {
  running = false;
  statusText.textContent = 'Tap anywhere to start';
  startOverlay.classList.remove('hidden');
  window.speechSynthesis.cancel();
  speak('Detection stopped.');
}

appButton.addEventListener('click', () => {
  if (running) {
    stop();
  } else {
    start();
  }
});
