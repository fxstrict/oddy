// Read-aloud with the browser's speech synthesis. Voice quality and availability differ between devices, so every
// call degrades gracefully: `available()` / `hasVoice()` tell the UI whether to offer the button or explain.

/** Text that is read for a round question (choice letters are spoken as "A", "B" ... to keep it short). */
export function speakableText(q, lang) {
  const sep = lang === 'ar' ? '،' : ',';
  const parts = [q.q[lang]];
  if (q.options?.length) parts.push(q.options.map((o) => o.text[lang]).join(`${sep} `));
  else if (q.items?.length) parts.push(q.items.map((it) => it.text[lang]).join(`${sep} `));
  else if (q.left?.length) parts.push(`${q.left.map((l) => l[lang]).join(`${sep} `)}. ${q.right.map((r) => r.text[lang]).join(`${sep} `)}`);
  return parts.filter(Boolean).join('. ');
}

export function createSpeech(win) {
  const synth = win.speechSynthesis;
  const supported = !!synth && typeof win.SpeechSynthesisUtterance === 'function';
  let voices = [];
  const load = () => {
    try {
      voices = synth.getVoices() || [];
    } catch {
      voices = [];
    }
  };
  if (supported) {
    load();
    synth.addEventListener?.('voiceschanged', load);
  }
  const prefix = (lang) => (lang === 'ar' ? 'ar' : 'en');
  const voiceFor = (lang) => voices.find((v) => (v.lang || '').toLowerCase().startsWith(prefix(lang))) || null;

  return {
    available: () => supported,
    /** false only when the device told us it has voices and none matches (an empty list may just not be loaded yet). */
    hasVoice: (lang) => supported && (voices.length === 0 || !!voiceFor(lang)),
    speak(text, lang) {
      if (!supported || !text) return false;
      synth.cancel();
      const u = new win.SpeechSynthesisUtterance(text);
      u.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      const v = voiceFor(lang);
      if (v) u.voice = v;
      u.rate = 0.9;
      synth.speak(u);
      return true;
    },
    stop() {
      if (supported) synth.cancel();
    },
  };
}
