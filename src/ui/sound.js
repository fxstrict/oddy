// Tiny WebAudio synth: no audio files needed. Silent when muted or unsupported.
let ac = null;
const SONGS = {
  click: [[520, 0.05]],
  correct: [[660, 0.09], [880, 0.14]],
  wrong: [[260, 0.12], [190, 0.2]],
  win: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]],
  lose: [[330, 0.14], [262, 0.14], [196, 0.3]],
};

export function playSound(kind, muted) {
  if (muted) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ac ||= new Ctx();
    if (ac.state === 'suspended') ac.resume();
    let t = ac.currentTime;
    for (const [freq, dur] of SONGS[kind] || []) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur;
    }
  } catch {
    /* audio is optional */
  }
}
