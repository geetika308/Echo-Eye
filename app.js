// ===== Echo-Eye: Voice-guided object detection =====
// Language is chosen by voice: app asks "Say English for English, हिंदी के लिए हिंदी कहें",
// listens via microphone, and picks the language you spoke.
// If voice recognition is not supported or keeps failing, it falls back to
// tap-anywhere-to-cycle, so it never leaves anyone stuck.

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
let voiceFailCount = 0;
let voiceFallbackActive = false;

const SPEAK_COOLDOWN_MS = 2500;
const AUTO_START_DELAY_MS = 3000;

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const VOICE_INPUT_SUPPORTED = !!SpeechRecognitionAPI;

// ---- Speech output ----
function speak(text, lang, onDone) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const speechLang = TRANSLATIONS[lang || currentLang].speechLang;
  utterance.lang = speechLang;
  utterance.rate = 1.0;
  utterance.pitch = 1;

  // Try to pick a matching installed voice (helps for Hindi)
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === speechLang) ||
                voices.find(v => v.lang.startsWith(speechLang.slice(0, 2)));
  if (voice) utterance.voice = voice;

  if (onDone) utterance.onend = onDone;
  window.speechSynthesis.speak(utterance);

  liveAnnouncer.textContent = text;
  detectionText.textContent = text;
  lastDetectionBox.classList.remove('hidden');
}

// Voices load late in some browsers - touch the list early
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
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
const MIN_CONFIDENCE = 0.6; // only announce things the model is fairly sure about
const HAND_CHECK_EVERY_N_FRAMES = 6; // hand model is heavy - do not run it every frame

let frameCount = 0;
let lastKnownHandBox = null; // { bbox, expiresAt }

// How much of box "a" is covered by box "b" (0 to 1)
function overlapRatio(a, b) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;
  const ix = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx));
  const iy = Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by));
  const areaA = aw * ah;
  return areaA > 0 ? (ix * iy) / areaA : 0;
}

async function detectFrame() {
  if (!running) return;
  frameCount++;

  // Check for a hand only every few frames (expensive model)
  if (frameCount % HAND_CHECK_EVERY_N_FRAMES === 0) {
    try {
      const handPredictions = await handModel.estimateHands(video);
      if (handPredictions.length > 0) {
        const { topLeft, bottomRight } = handPredictions[0].boundingBox;
        lastKnownHandBox = {
          bbox: [topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]],
          expiresAt: Date.now() + 1200 // treat as "still visible" for a short window
        };
      }
    } catch (e) {
      // hand model hiccup - ignore, object detection still works
    }
  }
  if (lastKnownHandBox && Date.now() > lastKnownHandBox.expiresAt) {
    lastKnownHandBox = null;
  }

  // Normal object detection runs every frame
  const predictions = await model.detect(video);
  const confidentPredictions = predictions.filter(p => p.score >= MIN_CONFIDENCE);

  drawDetections(confidentPredictions);

  if (confidentPredictions.length > 0) {
    const best = confidentPredictions.reduce((a, b) => (a.score > b.score ? a : b));
    let announceClass = best.class;

    // If top guess is "person" but the hand box covers most of that same area,
    // it is very likely just a hand, not a whole person. (Stricter than before:
    // a real person with a hand in frame will still be called "person".)
    if (best.class === 'person' && lastKnownHandBox) {
      const personBoxCoveredByHand = overlapRatio(best.bbox, lastKnownHandBox.bbox);
      if (personBoxCoveredByHand > 0.6) {
        announceClass = 'hand';
      }
    }

    const position = getPosition(best.bbox, video.videoWidth);
    const proximity = getProximity(best.bbox, video.videoWidth, video.videoHeight);

    const now = Date.now();
    const sameAsLast = announceClass === lastSpokenLabel;
    const cooldownPassed = now - lastSpokenAt > SPEAK_COOLDOWN_MS;

    if (!sameAsLast || cooldownPassed) {
      speak(buildPhrase(currentLang, announceClass, position, proximity));
      lastSpokenAt = now;
      lastSpokenLabel = announceClass;
    }
  }

  requestAnimationFrame(detectFrame);
}

// ---- Start detection (after language is confirmed) ----
async function startDetection() {
  if (recognition) { try { recognition.abort(); } catch (e) {} }
  clearTimeout(autoStartTimer);
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
    // mobilenet_v2 is more accurate than the default lite model (a bit slower)
    model = await cocoSsd.load({ base: 'mobilenet_v2' });
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
  voiceFailCount = 0;
  voiceFallbackActive = false;
  const t = TRANSLATIONS[currentLang].phrases;
  statusText.textContent = t.tapToStart;
  startOverlay.classList.remove('hidden');
  window.speechSynthesis.cancel();
  speak(t.stopped, currentLang, () => {
    setTimeout(() => askForLanguage(), 400);
  });
}

// ---- Voice language selection ----
function setLanguage(lang) {
  currentLang = lang;
  statusText.textContent = TRANSLATIONS[currentLang].langName;
}

// Look at what was heard and decide the language (or null if unclear).
// Uses simple "includes" instead of regex because \b does not work with Hindi letters.
function detectLanguage(heard) {
  const t = heard.toLowerCase().trim();
  const hindiWords = ['hindi', 'hindee', 'hindhi', 'हिंदी', 'हिन्दी', 'हिंदि'];
  const englishWords = ['english', 'inglish', 'इंग्लिश', 'अंग्रेजी', 'अंग्रेज़ी'];
  if (hindiWords.some(w => t.includes(w))) return 'hi';
  if (englishWords.some(w => t.includes(w))) return 'en';
  return null;
}

function askForLanguage() {
  if (!VOICE_INPUT_SUPPORTED) {
    announceLanguageTapFallback();
    return;
  }

  // English option in English, then Hindi option in Hindi,
  // so someone who only understands Hindi still knows what to say.
  speak('Say English for English.', 'en', () => {
    speak('हिंदी के लिए, हिंदी कहें।', 'hi', () => {
      listenForLanguageChoice();
    });
  });
}

function listenForLanguageChoice() {
  if (listening) return;
  listening = true;

  recognition = new SpeechRecognitionAPI();
  recognition.lang = 'en-IN'; // Indian English hears both "English" and "Hindi" well
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  recognition.onresult = (event) => {
    listening = false;
    let chosen = null;

    // Check every guess from the recognizer, not only the first one
    for (let i = 0; i < event.results[0].length; i++) {
      const heard = event.results[0][i].transcript;
      statusText.textContent = 'Heard: ' + heard;
      chosen = detectLanguage(heard);
      if (chosen) break;
    }

    if (chosen === 'en') {
      voiceFailCount = 0;
      setLanguage('en');
      speak('English selected.', 'en', () => setTimeout(startDetection, 300));
    } else if (chosen === 'hi') {
      voiceFailCount = 0;
      setLanguage('hi');
      speak('हिंदी चुनी गई।', 'hi', () => setTimeout(startDetection, 300));
    } else {
      // Did not understand - ask again
      speak("Sorry, I didn't catch that. Say English.", 'en', () => {
        speak('या हिंदी कहें।', 'hi', () => {
          listenForLanguageChoice();
        });
      });
    }
  };

  recognition.onerror = (e) => {
    listening = false;
    if (e.error === 'aborted') return;          // we stopped it on purpose
    if (phase !== 'choosingLanguage') return;

    voiceFailCount++;
    const blocked = e.error === 'not-allowed' || e.error === 'service-not-allowed';
    if (blocked || voiceFailCount >= 3) {
      announceLanguageTapFallback();            // give up on voice, use tap
    } else {
      setTimeout(askForLanguage, 500);          // no-speech etc: ask again
    }
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
  voiceFallbackActive = true;
  speak(
    'Voice selection is not available. Tap anywhere to choose a language. Currently ' +
    TRANSLATIONS[currentLang].langName + '.',
    'en'
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
      askForLanguage(); // first tap: unlocks audio + mic permission, begins the prompt
    } else if (!VOICE_INPUT_SUPPORTED || voiceFallbackActive) {
      cycleLanguageFallback();
    }
  } else if (running) {
    stopDetection();
  }
});
