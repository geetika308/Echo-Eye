# Echo-Eye — Voice-Guided Object Detection for the Visually Impaired

A browser-based, installable web app that helps visually impaired users understand their surroundings by speaking out loud what the camera sees — including roughly *where* it is and *how close*.

## How it works

1. Choose a language — English, Hindi, or Kannada.
2. Tap anywhere on the screen to start (the entire screen is one giant tap target — no fiddly buttons).
3. The app asks for camera access and starts the rear camera.
4. A pre-trained AI model ([COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd), running fully in-browser via TensorFlow.js — no server, no data leaves the device) detects common objects in the live video: people, chairs, cars, dogs, and 75+ other categories.
5. The app announces detections out loud, in the chosen language, using the browser's built-in text-to-speech — including position (left / ahead / right) and proximity (close / very close) based on where the object's bounding box falls in frame.
6. Tap again to stop.

## Language support

Language is chosen IVR-style, entirely by voice — like pressing "1" for English on a phone call, but spoken instead of pressed:
1. Tap the screen once to begin
2. The app asks: *"Say one for English. Say two for Hindi."*
3. The device's microphone listens and picks the language you said
4. If it doesn't understand, it asks again
5. If voice recognition isn't supported on that device/browser (varies by phone), it automatically falls back to tap-anywhere-to-cycle instead, so nobody gets stuck

Object names and spoken phrases are translated into English and Hindi (`translations.js`). The device's built-in text-to-speech voice for that language is used automatically. Adding another language is just a matter of adding a new translation block — no retraining or new models needed.

## Why these design choices

- **No native app needed.** Runs in any mobile browser, and can be added to the home screen (PWA) so it opens fullscreen like a real app — no app store approval needed.
- **No custom-trained model.** Uses an existing, well-tested pre-trained model instead of reinventing object detection — smart scoping for a solo/beginner project, not a shortcut that hurts quality.
- **Voice-first, not screen-first.** The entire UI is a single full-screen tap target with large text and an ARIA live region, so it also works cleanly with VoiceOver/TalkBack screen readers.
- **All in-browser, no backend.** Nothing to host beyond static files, no API costs, and no camera data ever leaves the user's device — good for privacy.

## Tech stack

- Vanilla HTML/CSS/JS (no framework needed for this scope)
- [TensorFlow.js](https://www.tensorflow.org/js) + COCO-SSD pre-trained model (general objects)
- [Handpose](https://github.com/tensorflow/tfjs-models/tree/master/handpose) pre-trained model (detects hands specifically, so a hand isn't misread as "person")
- Web Speech API (`speechSynthesis`) for voice output, and the SpeechRecognition API for voice-based language selection
- Web App Manifest for PWA installability

## Running it locally

Because camera access requires a secure context, you need to serve the files (opening `index.html` directly via `file://` won't get camera permission).

```bash
# from inside the project folder
python3 -m http.server 8000
# then open http://localhost:8000 on your phone (same wifi network)
# or use a tool like ngrok to get an https:// URL for testing on a real device
```

For a permanent link, deploy the folder as-is to any static host (GitHub Pages, Netlify, Vercel) — it needs no backend.

## Known limitations / next steps

- Loading two AI models (COCO-SSD + handpose) means a slightly longer startup and slightly more battery/CPU use — fine on most modern phones, may feel slow on older/budget devices.
- Currently announces only the single most confident detection at a time, to avoid overwhelming the user with audio — a future version could prioritize by proximity/urgency across multiple objects.
- Position/proximity are estimated from the 2D bounding box, not true depth — good enough for general awareness, not precise obstacle avoidance.
- Object recognition accuracy is only as good as the pre-trained models it uses — expect occasional wrong guesses on unusual objects, close-up items, or poor lighting. This is a real limitation of using free pre-trained models rather than a custom-trained one.
- Not yet tested with real visually-impaired users — this is the most important next step before calling this "done." Feedback from actual users would meaningfully change priorities here.
- App icons (`icon-192.png`, `icon-512.png` referenced in `manifest.json`) still need to be added for full installability polish.

## Disclaimer

This is a portfolio/learning project and **not a substitute for a mobility aid, cane, guide dog, or professional orientation & mobility training.** It's meant to add situational awareness, not replace established accessibility tools.
