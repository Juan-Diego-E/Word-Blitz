// Estado de la partida (Modo Clásico). Reglas del loop:
// - SÍ: +1 punto, la carta se resuelve → nueva letra + nueva categoría, turno siguiente.
// - NO o tiempo agotado: rebote → el siguiente jugador intenta la MISMA
//   categoría+letra con el timer reiniciado. Si la carta vuelve al jugador que
//   la abrió (fallaron todos), se quema: nueva carta para el siguiente turno.
// - Fin de partida: al resolverse `letterLimit` cartas (si hay límite), o
//   manualmente desde ajustes. Sin límite, las letras usadas se reciclan.
import { create } from 'zustand';
import { getCategoriaAleatoria, getGameDefaults, getLetraAleatoria } from '../lib/content';
import { clearGameSnapshot, saveGameSnapshot } from '../lib/persistence';
import type { Categoria, GameSnapshot, Player, RoundPhase } from '../types';

interface GameState {
  players: Player[];
  turnIndex: number;
  cardOwnerIndex: number;
  activeLetter: string | null;
  usedLetters: string[];
  currentCategory: Categoria | null;
  phase: RoundPhase;
  timerSeconds: number;
  letterLimit: number | null;
  cardsResolved: number;
  deadline: number | null;
  startedAt: number;
  inProgress: boolean;

  startGame(nombres: string[], timerSeconds: number, letterLimit: number | null): void;
  drawCard(): void;
  startRound(): void;
  judge(acierto: boolean): void;
  handleTimeout(): void;
  passTurn(): void;
  setTimerSeconds(s: number): void;
  endGame(): void;
  resetGame(): void;
  restore(snap: GameSnapshot): void;
  snapshot(): GameSnapshot;
}

const defaults = getGameDefaults();

function nextIndex(i: number, n: number) {
  return (i + 1) % n;
}

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  turnIndex: 0,
  cardOwnerIndex: 0,
  activeLetter: null,
  usedLetters: [],
  currentCategory: null,
  phase: 'idle',
  timerSeconds: defaults.defaultTimerSeconds,
  letterLimit: defaults.defaultLetterLimit,
  cardsResolved: 0,
  deadline: null,
  startedAt: Date.now(),
  inProgress: false,

  startGame: (nombres, timerSeconds, letterLimit) =>
    set({
      players: nombres.map((nombre, i) => ({ id: `p${i}`, nombre, puntaje: 0 })),
      turnIndex: 0,
      cardOwnerIndex: 0,
      activeLetter: null,
      usedLetters: [],
      currentCategory: null,
      phase: 'idle',
      timerSeconds,
      letterLimit,
      cardsResolved: 0,
      deadline: null,
      startedAt: Date.now(),
      inProgress: true,
    }),

  // Voltear la carta: sortea letra + categoría y arranca la animación.
  drawCard: () => {
    const s = get();
    if (s.phase !== 'idle') return;
    const letter = getLetraAleatoria(s.usedLetters);
    const category = getCategoriaAleatoria(s.currentCategory?.id);
    set({
      activeLetter: letter,
      currentCategory: category,
      phase: 'spinning',
      cardOwnerIndex: s.turnIndex,
      deadline: null,
    });
  },

  // Fin de la animación: empieza a correr el tiempo.
  startRound: () => {
    const s = get();
    if (s.phase !== 'spinning') return;
    set({ phase: 'revealed', deadline: Date.now() + s.timerSeconds * 1000 });
  },

  judge: (acierto) => {
    const s = get();
    if (s.phase !== 'revealed') return;
    if (acierto) {
      const players = s.players.map((p, i) =>
        i === s.turnIndex ? { ...p, puntaje: p.puntaje + 1 } : p,
      );
      resolveCard(set, { ...s, players }, s.turnIndex);
    } else {
      bounce(set, s);
    }
  },

  handleTimeout: () => {
    const s = get();
    if (s.phase !== 'revealed') return;
    set({ phase: 'timeout', deadline: null });
  },

  // Después del "¡Tiempo!" (o de un NO): rebote al siguiente jugador.
  passTurn: () => {
    const s = get();
    if (s.phase !== 'timeout') return;
    bounce(set, s);
  },

  setTimerSeconds: (sec) => {
    const clamped = Math.min(defaults.maxTimerSeconds, Math.max(defaults.minTimerSeconds, sec));
    const s = get();
    // Modificable durante el juego: si hay ronda corriendo, re-basar el deadline.
    if (s.phase === 'revealed' && s.deadline) {
      const elapsed = s.timerSeconds * 1000 - (s.deadline - Date.now());
      set({ timerSeconds: clamped, deadline: Date.now() + Math.max(0, clamped * 1000 - elapsed) });
    } else {
      set({ timerSeconds: clamped });
    }
  },

  endGame: () => {
    set({ phase: 'finished', deadline: null });
    void clearGameSnapshot();
  },

  resetGame: () => {
    set({ inProgress: false, players: [], phase: 'idle', deadline: null });
    void clearGameSnapshot();
  },

  restore: (snap) =>
    set({
      ...snap,
      currentCategory: snap.currentCategory
        ? { ...(snap.currentCategory as Categoria) }
        : null,
      // Nunca restaurar con un timer corriendo a mitad: volver a estado estable.
      phase: snap.phase === 'revealed' || snap.phase === 'spinning' || snap.phase === 'timeout' ? 'idle' : snap.phase,
      activeLetter: snap.phase === 'finished' ? snap.activeLetter : null,
      deadline: null,
      inProgress: snap.phase !== 'finished',
    }),

  snapshot: () => {
    const s = get();
    return {
      players: s.players,
      turnIndex: s.turnIndex,
      cardOwnerIndex: s.cardOwnerIndex,
      activeLetter: s.activeLetter,
      usedLetters: s.usedLetters,
      currentCategory: s.currentCategory
        ? { id: s.currentCategory.id, nombre: s.currentCategory.nombre, icono: s.currentCategory.icono }
        : null,
      phase: s.phase,
      timerSeconds: s.timerSeconds,
      letterLimit: s.letterLimit,
      cardsResolved: s.cardsResolved,
      deadline: s.deadline,
      startedAt: s.startedAt,
    };
  },
}));

type SetFn = (partial: Partial<GameState>) => void;

/** La carta se resuelve (acierto o quemada): consumir letra y avanzar. */
function resolveCard(set: SetFn, s: GameState, fromIndex: number) {
  const usedLetters = s.activeLetter ? [...s.usedLetters, s.activeLetter] : s.usedLetters;
  const cardsResolved = s.cardsResolved + 1;
  const terminado = s.letterLimit != null && cardsResolved >= s.letterLimit;
  set({
    players: s.players,
    usedLetters,
    cardsResolved,
    turnIndex: nextIndex(fromIndex, s.players.length),
    activeLetter: terminado ? s.activeLetter : null,
    currentCategory: terminado ? s.currentCategory : null,
    deadline: null,
    phase: terminado ? 'finished' : 'idle',
  });
  if (terminado) void clearGameSnapshot();
}

/** Rebote: misma categoría+letra para el siguiente; si dio la vuelta, se quema. */
function bounce(set: SetFn, s: GameState) {
  const next = nextIndex(s.turnIndex, s.players.length);
  if (next === s.cardOwnerIndex) {
    // Dio la vuelta completa: la carta se quema y el turno pasa al
    // jugador siguiente al que la abrió.
    resolveCard(set, s, s.cardOwnerIndex);
    return;
  }
  set({
    turnIndex: next,
    phase: 'revealed',
    deadline: Date.now() + s.timerSeconds * 1000,
  });
}

// Persistencia de la partida en curso (IndexedDB), con throttle simple.
let saveTimer: number | undefined;
useGameStore.subscribe((s) => {
  if (!s.inProgress) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void saveGameSnapshot(useGameStore.getState().snapshot());
  }, 300);
});
