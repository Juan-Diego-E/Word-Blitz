// Motor de sonido del juego. Sin archivos de audio: cada efecto se sintetiza
// con Web Audio API (osciladores + envolventes). Son sonidos cortos y simples,
// así que no vale la pena el peso de una librería ni de assets.
//
// El AudioContext arranca suspendido por política de los navegadores; se
// "despierta" en el primer gesto del usuario (tocar la carta, tocar un botón).
// Como los efectos se disparan siempre a partir de una interacción, para
// cuando suena el primer tick el contexto ya está corriendo.
//
// Respeta la preferencia `sonido`: si está apagada, ni siquiera crea el
// contexto.
import { useSettingsStore } from '../store/settingsStore';

export type Efecto = 'flip' | 'acierto' | 'error' | 'tick' | 'chicharra' | 'victoria';

let ctx: AudioContext | null = null;

/** Master gain: un solo lugar para el volumen general y para silenciar. */
let master: GainNode | null = null;

function asegurarContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null; // navegador sin Web Audio: el juego sigue, mudo.
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.22; // headroom: varios tonos a la vez sin clipear
    master.connect(ctx.destination);
  }
  // Puede quedar suspendido tras perder foco; resume() dentro de un gesto lo revive.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Un tono con envolvente ADSR simple. `type` da el timbre. */
function tono(
  freq: number,
  start: number,
  dur: number,
  {
    type = 'sine',
    gain = 1,
    attack = 0.005,
    release = 0.08,
    sweepTo,
  }: { type?: OscillatorType; gain?: number; attack?: number; release?: number; sweepTo?: number } = {},
) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo != null) osc.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);

  // Envolvente: sube en `attack`, se sostiene, cae en `release`.
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + attack);
  g.gain.setValueAtTime(gain, start + dur - release);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(g);
  g.connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Ráfaga de ruido blanco corta, para golpes secos (flip, chicharra). */
function ruido(start: number, dur: number, gain = 0.5, filtroHz = 2000) {
  if (!ctx || !master) return;
  const frames = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = filtroHz;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filtro);
  filtro.connect(g);
  g.connect(master);
  src.start(start);
  src.stop(start + dur);
}

const receta: Record<Efecto, (t: number) => void> = {
  // Voltear la carta: golpe corto + subidita, como una carta que da vuelta.
  flip: (t) => {
    ruido(t, 0.09, 0.35, 3200);
    tono(320, t, 0.14, { type: 'triangle', gain: 0.5, sweepTo: 560 });
  },
  // Acierto: dos notas ascendentes alegres (quinta justa).
  acierto: (t) => {
    tono(660, t, 0.12, { type: 'triangle', gain: 0.8 });
    tono(990, t + 0.1, 0.18, { type: 'triangle', gain: 0.8 });
  },
  // Error: dos notas descendentes, timbre más áspero.
  error: (t) => {
    tono(300, t, 0.14, { type: 'sawtooth', gain: 0.5 });
    tono(200, t + 0.12, 0.22, { type: 'sawtooth', gain: 0.5 });
  },
  // Tic del reloj en los últimos segundos: click seco y agudo.
  tick: (t) => {
    tono(1400, t, 0.05, { type: 'square', gain: 0.5, release: 0.03 });
  },
  // Chicharra de fin de tiempo: zumbido áspero y sostenido.
  chicharra: (t) => {
    tono(180, t, 0.5, { type: 'sawtooth', gain: 0.7 });
    tono(184, t, 0.5, { type: 'square', gain: 0.5 });
    ruido(t, 0.5, 0.25, 1200);
  },
  // Victoria: arpegio mayor ascendente (do–mi–sol–do).
  victoria: (t) => {
    const notas = [523.25, 659.25, 783.99, 1046.5];
    notas.forEach((f, i) => tono(f, t + i * 0.12, 0.32, { type: 'triangle', gain: 0.7 }));
  },
};

/**
 * Dispara un efecto. No-op si el usuario apagó el sonido o si el navegador
 * no soporta Web Audio. Nunca lanza: un fallo de audio jamás corta el juego.
 */
export function play(efecto: Efecto) {
  try {
    if (!useSettingsStore.getState().sonido) return;
    const c = asegurarContexto();
    if (!c) return;
    receta[efecto](c.currentTime);
  } catch {
    /* el audio es accesorio: si falla, el juego sigue mudo */
  }
}
