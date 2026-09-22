// ===== Translations for Echo-Eye =====
// Object class names (from COCO-SSD) + phrase templates, in each supported language.
// Add more languages here later by copying a block and translating.

const TRANSLATIONS = {
  en: {
    langName: 'English',
    speechLang: 'en-IN', // falls back to en-US if not available on device
    objects: {
      person: 'person', bicycle: 'bicycle', car: 'car', motorcycle: 'motorcycle',
      airplane: 'airplane', bus: 'bus', train: 'train', truck: 'truck', boat: 'boat',
      'traffic light': 'traffic light', 'fire hydrant': 'fire hydrant', 'stop sign': 'stop sign',
      'parking meter': 'parking meter', bench: 'bench', bird: 'bird', cat: 'cat', dog: 'dog',
      horse: 'horse', sheep: 'sheep', cow: 'cow', elephant: 'elephant', bear: 'bear',
      zebra: 'zebra', giraffe: 'giraffe', backpack: 'backpack', umbrella: 'umbrella',
      handbag: 'handbag', tie: 'tie', suitcase: 'suitcase', frisbee: 'frisbee', skis: 'skis',
      snowboard: 'snowboard', 'sports ball': 'ball', kite: 'kite', 'baseball bat': 'baseball bat',
      'baseball glove': 'baseball glove', skateboard: 'skateboard', surfboard: 'surfboard',
      'tennis racket': 'tennis racket', bottle: 'bottle', 'wine glass': 'glass', cup: 'cup',
      fork: 'fork', knife: 'knife', spoon: 'spoon', bowl: 'bowl', banana: 'banana',
      apple: 'apple', sandwich: 'sandwich', orange: 'orange', broccoli: 'broccoli',
      carrot: 'carrot', 'hot dog': 'hot dog', pizza: 'pizza', donut: 'donut', cake: 'cake',
      chair: 'chair', couch: 'sofa', 'potted plant': 'plant', bed: 'bed',
      'dining table': 'table', toilet: 'toilet', tv: 'television', laptop: 'laptop',
      mouse: 'mouse', remote: 'remote', keyboard: 'keyboard', 'cell phone': 'phone',
      microwave: 'microwave', oven: 'oven', toaster: 'toaster', sink: 'sink',
      refrigerator: 'refrigerator', book: 'book', clock: 'clock', vase: 'vase',
      scissors: 'scissors', 'teddy bear': 'teddy bear', 'hair drier': 'hair dryer',
      toothbrush: 'toothbrush'
    },
    phrases: {
      left: 'on your left', right: 'on your right', ahead: 'ahead',
      close: 'close', veryClose: 'very close',
      loading: 'Loading. Please wait.',
      ready: 'Ready. Detection started.',
      stopped: 'Detection stopped.',
      needCamera: 'Camera access is needed for this app to work. Please allow camera permission.',
      tapToStart: 'Tap anywhere to start',
      detectingTapToStop: 'Detecting - tap to stop'
    }
  },

  hi: {
    langName: 'हिन्दी (Hindi)',
    speechLang: 'hi-IN',
    objects: {
      person: 'व्यक्ति', bicycle: 'साइकिल', car: 'कार', motorcycle: 'मोटरसाइकिल',
      airplane: 'हवाई जहाज़', bus: 'बस', train: 'ट्रेन', truck: 'ट्रक', boat: 'नाव',
      'traffic light': 'ट्रैफिक लाइट', 'fire hydrant': 'फायर हाइड्रेंट', 'stop sign': 'स्टॉप साइन',
      'parking meter': 'पार्किंग मीटर', bench: 'बेंच', bird: 'पक्षी', cat: 'बिल्ली', dog: 'कुत्ता',
      horse: 'घोड़ा', sheep: 'भेड़', cow: 'गाय', elephant: 'हाथी', bear: 'भालू',
      zebra: 'ज़ेबरा', giraffe: 'जिराफ़', backpack: 'बैकपैक', umbrella: 'छाता',
      handbag: 'हैंडबैग', tie: 'टाई', suitcase: 'सूटकेस', frisbee: 'फ्रिसबी', skis: 'स्की',
      snowboard: 'स्नोबोर्ड', 'sports ball': 'गेंद', kite: 'पतंग', 'baseball bat': 'बैट',
      'baseball glove': 'दस्ताना', skateboard: 'स्केटबोर्ड', surfboard: 'सर्फबोर्ड',
      'tennis racket': 'रैकेट', bottle: 'बोतल', 'wine glass': 'गिलास', cup: 'कप',
      fork: 'कांटा', knife: 'चाकू', spoon: 'चम्मच', bowl: 'कटोरा', banana: 'केला',
      apple: 'सेब', sandwich: 'सैंडविच', orange: 'संतरा', broccoli: 'ब्रोकोली',
      carrot: 'गाजर', 'hot dog': 'हॉट डॉग', pizza: 'पिज़्ज़ा', donut: 'डोनट', cake: 'केक',
      chair: 'कुर्सी', couch: 'सोफा', 'potted plant': 'गमला', bed: 'बिस्तर',
      'dining table': 'मेज़', toilet: 'शौचालय', tv: 'टीवी', laptop: 'लैपटॉप',
      mouse: 'माउस', remote: 'रिमोट', keyboard: 'कीबोर्ड', 'cell phone': 'फ़ोन',
      microwave: 'माइक्रोवेव', oven: 'ओवन', toaster: 'टोस्टर', sink: 'सिंक',
      refrigerator: 'फ्रिज', book: 'किताब', clock: 'घड़ी', vase: 'फूलदान',
      scissors: 'कैंची', 'teddy bear': 'टेडी बियर', 'hair drier': 'हेयर ड्रायर',
      toothbrush: 'टूथब्रश'
    },
    phrases: {
      left: 'आपके बाईं ओर', right: 'आपके दाईं ओर', ahead: 'सामने',
      close: 'पास में', veryClose: 'बहुत पास',
      loading: 'लोड हो रहा है। कृपया प्रतीक्षा करें।',
      ready: 'तैयार। पहचान शुरू।',
      stopped: 'पहचान बंद हुई।',
      needCamera: 'इस ऐप को काम करने के लिए कैमरे की अनुमति चाहिए। कृपया अनुमति दें।',
      tapToStart: 'शुरू करने के लिए कहीं भी टैप करें',
      detectingTapToStop: 'पहचान जारी है - रोकने के लिए टैप करें'
    }
  },

  kn: {
    langName: 'ಕನ್ನಡ (Kannada)',
    speechLang: 'kn-IN',
    objects: {
      person: 'ವ್ಯಕ್ತಿ', bicycle: 'ಸೈಕಲ್', car: 'ಕಾರು', motorcycle: 'ಮೋಟಾರ್‌ಸೈಕಲ್',
      airplane: 'ವಿಮಾನ', bus: 'ಬಸ್', train: 'ರೈಲು', truck: 'ಟ್ರಕ್', boat: 'ದೋಣಿ',
      'traffic light': 'ಟ್ರಾಫಿಕ್ ಲೈಟ್', 'fire hydrant': 'ಫೈರ್ ಹೈಡ್ರಂಟ್', 'stop sign': 'ನಿಲ್ಲಿಸಿ ಚಿಹ್ನೆ',
      'parking meter': 'ಪಾರ್ಕಿಂಗ್ ಮೀಟರ್', bench: 'ಬೆಂಚ್', bird: 'ಹಕ್ಕಿ', cat: 'ಬೆಕ್ಕು', dog: 'ನಾಯಿ',
      horse: 'ಕುದುರೆ', sheep: 'ಕುರಿ', cow: 'ಹಸು', elephant: 'ಆನೆ', bear: 'ಕರಡಿ',
      zebra: 'ಜೀಬ್ರಾ', giraffe: 'ಜಿರಾಫೆ', backpack: 'ಬ್ಯಾಗ್', umbrella: 'ಛತ್ರಿ',
      handbag: 'ಕೈಚೀಲ', tie: 'ಟೈ', suitcase: 'ಸೂಟ್‌ಕೇಸ್', frisbee: 'ಫ್ರಿಸ್ಬಿ', skis: 'ಸ್ಕೀ',
      snowboard: 'ಸ್ನೋಬೋರ್ಡ್', 'sports ball': 'ಚೆಂಡು', kite: 'ಗಾಳಿಪಟ', 'baseball bat': 'ಬ್ಯಾಟ್',
      'baseball glove': 'ಕೈಗವಸು', skateboard: 'ಸ್ಕೇಟ್‌ಬೋರ್ಡ್', surfboard: 'ಸರ್ಫ್‌ಬೋರ್ಡ್',
      'tennis racket': 'ರಾಕೆಟ್', bottle: 'ಬಾಟಲಿ', 'wine glass': 'ಗ್ಲಾಸ್', cup: 'ಕಪ್',
      fork: 'ಫೋರ್ಕ್', knife: 'ಚಾಕು', spoon: 'ಚಮಚ', bowl: 'ಬೌಲ್', banana: 'ಬಾಳೆಹಣ್ಣು',
      apple: 'ಸೇಬು', sandwich: 'ಸ್ಯಾಂಡ್‌ವಿಚ್', orange: 'ಕಿತ್ತಳೆ', broccoli: 'ಬ್ರೊಕೊಲಿ',
      carrot: 'ಕ್ಯಾರೆಟ್', 'hot dog': 'ಹಾಟ್ ಡಾಗ್', pizza: 'ಪಿಜ್ಜಾ', donut: 'ಡೋನಟ್', cake: 'ಕೇಕ್',
      chair: 'ಕುರ್ಚಿ', couch: 'ಸೋಫಾ', 'potted plant': 'ಕುಂಡ ಗಿಡ', bed: 'ಹಾಸಿಗೆ',
      'dining table': 'ಮೇಜು', toilet: 'ಶೌಚಾಲಯ', tv: 'ಟಿವಿ', laptop: 'ಲ್ಯಾಪ್‌ಟಾಪ್',
      mouse: 'ಮೌಸ್', remote: 'ರಿಮೋಟ್', keyboard: 'ಕೀಬೋರ್ಡ್', 'cell phone': 'ಫೋನ್',
      microwave: 'ಮೈಕ್ರೋವೇವ್', oven: 'ಓವನ್', toaster: 'ಟೋಸ್ಟರ್', sink: 'ಸಿಂಕ್',
      refrigerator: 'ಫ್ರಿಜ್', book: 'ಪುಸ್ತಕ', clock: 'ಗಡಿಯಾರ', vase: 'ಹೂದಾನಿ',
      scissors: 'ಕತ್ತರಿ', 'teddy bear': 'ಟೆಡ್ಡಿ ಬೇರ್', 'hair drier': 'ಹೇರ್ ಡ್ರೈಯರ್',
      toothbrush: 'ಟೂತ್ ಬ್ರಷ್'
    },
    phrases: {
      left: 'ನಿಮ್ಮ ಎಡಭಾಗದಲ್ಲಿ', right: 'ನಿಮ್ಮ ಬಲಭಾಗದಲ್ಲಿ', ahead: 'ಮುಂದೆ',
      close: 'ಹತ್ತಿರದಲ್ಲಿ', veryClose: 'ತುಂಬಾ ಹತ್ತಿರದಲ್ಲಿ',
      loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಕಾಯಿರಿ.',
      ready: 'ಸಿದ್ಧ. ಪತ್ತೆ ಪ್ರಾರಂಭವಾಗಿದೆ.',
      stopped: 'ಪತ್ತೆ ನಿಲ್ಲಿಸಲಾಗಿದೆ.',
      needCamera: 'ಈ ಆ್ಯಪ್ ಕೆಲಸ ಮಾಡಲು ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ಬೇಕು. ದಯವಿಟ್ಟು ಅನುಮತಿ ನೀಡಿ.',
      tapToStart: 'ಪ್ರಾರಂಭಿಸಲು ಎಲ್ಲಿಯಾದರೂ ಟ್ಯಾಪ್ ಮಾಡಿ',
      detectingTapToStop: 'ಪತ್ತೆ ನಡೆಯುತ್ತಿದೆ - ನಿಲ್ಲಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ'
    }
  }
};

// Helper: build the spoken phrase for a detected object in the current language
function buildPhrase(lang, objectClass, position, proximity) {
  const t = TRANSLATIONS[lang];
  const objectName = t.objects[objectClass] || objectClass;
  const positionPhrase = t.phrases[position]; // 'left' | 'right' | 'ahead'
  const proximityPhrase = proximity ? t.phrases[proximity] : ''; // 'close' | 'veryClose'

  return proximityPhrase
    ? `${objectName} ${proximityPhrase}, ${positionPhrase}`
    : `${objectName} ${positionPhrase}`;
}
