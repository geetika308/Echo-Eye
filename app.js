// ===== Echo-Eye: Voice-guided object detection =====
// Language is chosen IVR-style: app asks "say one for English, two for Hindi",
// listens via microphone, picks the language you spoke.
// If voice recognition isn't supported on this device/browser, it falls back
// to tap-anywhere-to-cycle instead - so it never leaves anyone stuck.

const appButton = document.getElementById('app-button');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status-text');
const startOverlay = document.getElementById('start-overlay');
const lastDetectionBox = document.getElementById('last-detection');
const detectionText = document.getElementById('detection-text');
const liveAnnouncer = document.getElementById('live-announcer');

const LANG_ORDER = ['en', 'hi']; // fallback tap-cycle order

let model = null;
let handModel = null;
let running = false;
let lastSpokenAt = 0;
let lastSpokenLabel = '';
let currentLang = 'en';
let phase = 'choosingLanguage'; // 'choosingLanguage' -> 'running'
let autoStartTimer = null;
let recognition = null;
let listening = false;
const SPEAK_COOLDOWN_MS = 2500;
const AUTO_START_DELAY_MS = 3000;

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const VOICE_INPUT_SUPPORTED = !!SpeechRecognitionAPI;

// ---- Speech output ----
function speak(text, lang, onDone) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = TRANSLATIONS[lang || currentLang].speechLang;
  utterance.rate = 1.0;
  utterance.pitch = 1;
  if (onDone) utterance.onend = onDone;
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
const MIN_CONFIDENCE = 0.55; // only announce things the model is fairly sure about

async function detectFrame() {
  if (!running) return;

  // Check for a hand first - COCO-SSD alone often mislabels a hand as "person"
  const handPredictions = await handModel.estimateHands(video);

  if (handPredictions.length > 0) {
    const hand = handPredictions[0];
    const { topLeft, bottomRight } = hand.boundingBox;
    const bbox = [topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]];

    drawDetections([{ bbox, class: 'hand' }]);

    const position = getPosition(bbox, video.videoWidth);
    const proximity = getProximity(bbox, video.videoWidth, video.videoHeight);

    const now = Date.now();
    const sameAsLast = 'hand' === lastSpokenLabel;
    const cooldownPassed = now - lastSpokenAt > SPEAK_COOLDOWN_MS;

    if (!sameAsLast || cooldownPassed) {
      speak(buildPhrase(currentLang, 'hand', position, proximity));
      lastSpokenAt = now;
      lastSpokenLabel = 'hand';
    }

    requestAnimationFrame(detectFrame);
    return;
  }

  // No hand in view - fall back to general object detection
  const predictions = await model.detect(video);
  drawDetections(predictions);

  const confidentPredictions = predictions.filter(p => p.score >= MIN_CONFIDENCE);

  if (confidentPredictions.length > 0) {
    const best = confidentPredictions.reduce((a, b) => (a.score > b.score ? a : b));
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
  if (recognition) { try { recognition.abort(); } catch (e) {} }
  phase = 'running';
  const t = TRANSLATIONS[currentLang].phrases;
  statusText.textContent = 'Starting camera...';

  try {
    await startCamera();
  } catch (err) {
    statusText.textContent = 'Camera access denied or unavailable.';
    speak(t.needCamera);
    phase = 'choosingLanguage';
    return;
  }

  statusText.textContent = t.loading;
  speak(t.loading);

  if (!model) {
    model = await cocoSsd.load();
  }
  if (!handModel) {
    handModel = await handpose.load();
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
  speak(t.stopped, currentLang, () => {
    setTimeout(() => askForLanguage(), 400);
  });
}

// ---- IVR-style voice language selection ----
function setLanguage(lang) {
  currentLang = lang;
  statusText.textContent = TRANSLATIONS[currentLang].langName;
}

function askForLanguage() {
  if (!VOICE_INPUT_SUPPORTED) {
    // No mic recognition on this device/browser - fall back to tap-to-cycle
    announceLanguageTapFallback();
    return;
  }

  speak('Say one for English. Say two for Hindi.', 'en', () => {
    listenForLanguageChoice();
  });
}

function listenForLanguageChoice() {
  if (listening) return;
  listening = true;

  recognition = new SpeechRecognitionAPI();
  recognition.lang = 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event) => {
    listening = false;
    const heard = event.results[0][0].transcript.toLowerCase().trim();
    statusText.textContent = 'Heard: ' + heard;

    if (/\b(1|one|english)\b/.test(heard)) {
      setLanguage('en');
      speak('English selected.', 'en', () => setTimeout(startDetection, 300));
    } else if (/\b(2|two|hindi|do)\b/.test(heard)) {
      setLanguage('hi');
      speak('हिंदी चुनी गई।', 'hi', () => setTimeout(startDetection, 300));
    } else {
      // Didn't understand - ask again
      speak("Sorry, I didn't catch that. Say one for English, or two for Hindi.", 'en', () => {
        listenForLanguageChoice();
      });
    }
  };

  recognition.onerror = () => {
    listening = false;
    // Mic blocked, no speech heard, or other error - fall back to tap-cycle
    announceLanguageTapFallback();
  };

  recognition.onend = () => {
    listening = false;
  };

  try {
    recognition.start();
  } catch (e) {
    listening = false;
    announceLanguageTapFallback();
  }
}

// ---- Fallback: tap-anywhere-to-cycle (used if voice recognition unavailable/fails) ----
function announceLanguageTapFallback() {
  speak(
    'Voice selection is not available on this device. Tap anywhere to choose a language. Currently ' +
    TRANSLATIONS[currentLang].langName + '.',
    currentLang
  );
  scheduleAutoStart();
}

function scheduleAutoStart() {
  clearTimeout(autoStartTimer);
  autoStartTimer = setTimeout(() => {
    if (phase === 'choosingLanguage') {
      startDetection();
    }
  }, AUTO_START_DELAY_MS);
}

function cycleLanguageFallback() {
  const idx = LANG_ORDER.indexOf(currentLang);
  setLanguage(LANG_ORDER[(idx + 1) % LANG_ORDER.length]);
  speak(TRANSLATIONS[currentLang].langName, currentLang);
  scheduleAutoStart();
}

// ---- Single tap handler for the whole screen ----
let hasStarted = false;

appButton.addEventListener('click', () => {
  if (phase === 'choosingLanguage') {
    if (!hasStarted) {
      hasStarted = true;
      askForLanguage(); // first tap: unlocks audio + mic permission, begins the IVR prompt
    } else if (!VOICE_INPUT_SUPPORTED || listening === false) {
      // Only used as the fallback path when voice recognition isn't available
      if (!VOICE_INPUT_SUPPORTED) cycleLanguageFallback();
    }
  } else if (running) {
    stopDetection();
  }
});
