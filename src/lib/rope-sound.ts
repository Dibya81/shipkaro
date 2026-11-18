/**
 * Tiny synthesized sound kit for the theme rope. Web Audio only, no files.
 * Muting is stored in localStorage("rope-sound") and exposed as an external
 * store so the footer toggle can render its label.
 */

const KEY = "rope-sound";
const listeners = new Set<() => void>();

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function readMuted() {
  try {
    return localStorage.getItem(KEY) === "off";
  } catch {
    return false;
  }
}

let muted: boolean | null = null;

export function isMuted() {
  if (muted === null) muted = readMuted();
  return muted;
}

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(KEY, next ? "off" : "on");
  } catch {
    /* ignore */
  }
  if (next && ctx) void ctx.suspend();
  listeners.forEach((l) => l());
}

export function subscribeSound(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function audio(): AudioContext | null {
  if (isMuted() || typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 1);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function envelope(g: GainNode, t: number, peak: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

type NoiseOpts = { type: BiquadFilterType; freq: number; freqEnd?: number; q?: number; gain: number };

function noise(dur: number, o: NoiseOpts) {
  const a = audio();
  if (!a || !noiseBuf || !master) return;
  const t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = a.createBiquadFilter();
  f.type = o.type;
  f.Q.value = o.q ?? 0.8;
  f.frequency.setValueAtTime(o.freq, t);
  if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + dur);
  const g = a.createGain();
  envelope(g, t, o.gain, dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

function tone(freq: number, freqEnd: number, dur: number, gain: number, type: OscillatorType = "sine", lowpass?: number) {
  const a = audio();
  if (!a || !master) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
  const g = a.createGain();
  envelope(g, t, gain, dur);
  if (lowpass) {
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lowpass;
    osc.connect(f).connect(g).connect(master);
  } else {
    osc.connect(g).connect(master);
  }
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const ropeSound = {
  grab() {
    noise(0.04, { type: "bandpass", freq: 2600, q: 2.5, gain: 0.18 });
    tone(240, 190, 0.05, 0.05, "triangle");
  },
  /** Creak that rises with the pull (px). */
  creak(pull: number) {
    tone(110 + pull * 3.2, 95 + pull * 3.2, 0.07, 0.035, "sawtooth", 900 + pull * 12);
  },
  snap() {
    noise(0.05, { type: "highpass", freq: 3200, gain: 0.26 });
    tone(150, 55, 0.14, 0.22, "sine");
  },
  letGo() {
    tone(330, 210, 0.09, 0.05, "triangle");
  },
  swing() {
    noise(0.24, { type: "bandpass", freq: 420, freqEnd: 1300, q: 1.1, gain: 0.04 });
  },
  /** The ink landing. Light is bright and airy, dark is low and heavy. */
  splash(to: "light" | "dark") {
    if (to === "light") {
      noise(0.7, { type: "lowpass", freq: 3600, freqEnd: 600, gain: 0.16 });
      tone(880, 1320, 0.32, 0.03, "sine");
    } else {
      noise(0.85, { type: "lowpass", freq: 1300, freqEnd: 160, gain: 0.22 });
      tone(118, 62, 0.55, 0.12, "sine");
    }
  },
};
