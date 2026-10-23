// Sound (Web Audio synth) and haptics, both silenced by the mute toggle.
import { $ } from "./util.js";
import { save, persist } from "./save.js";

let audioCtx = null;

function tone(freq, dur, type = "sine", vol = 0.06, delay = 0) {
  if (save.muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  } catch (e) { /* audio unavailable */ }
}

function buzz(pattern) {
  if (save.muted || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
}

export const fx = {
  tap() { tone(660, 0.05, "triangle", 0.03); buzz(8); },
  place() { tone(520, 0.07, "triangle"); tone(780, 0.09, "triangle", 0.05, 0.05); buzz(15); },
  error() { tone(150, 0.16, "sawtooth", 0.035); buzz([30, 40, 30]); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, "triangle", 0.06, i * 0.09)); buzz([20, 30, 20, 30, 60]); },
  coin() { tone(988, 0.06, "square", 0.022, 0.05); tone(1319, 0.12, "square", 0.022, 0.11); }
};

export function toggleSound() {
  save.muted = !save.muted;
  persist();
  updateSoundIcon();
  if (!save.muted) fx.tap();
}

export function updateSoundIcon() {
  $("btnSound").textContent = save.muted ? "🔇" : "🔊";
}
