// Estado de la partida del Modo 1000 Nombres. Reglas del loop:
// - Cada jugador tiene un peón en una casilla del tablero (perímetro con
//   letras). La casilla 0 es START y la última es META.
// - En su turno se voltea una carta (categoría aleatoria) y arranca el timer;
//   la letra objetivo es la de la casilla SIGUIENTE a la del peón.
// - SÍ: el peón avanza 1 casilla. Si llega a la última → gana.
// - NO o tiempo agotado: el peón se queda en su lugar y pasa el turno.
import { create } from 'zustand';
import {
  getBoardLetters,
  getCategoriaAleatoria,
  getGameDefaults,
} from '../lib/content';
import { clearBoardSnapshot, saveBoardSnapshot } from '../lib/persistence';
import {
  PAWN_COLORS,
  type BoardLayoutId,
  type BoardPhase,
  type BoardPlayer,
  type BoardSnapshot,
  type Categoria,
} from '../types';

interface BoardGameState {
  players: BoardPlayer[];
  turnIndex: number;
  boardLetters: string[];
  layoutId: BoardLayoutId;
  currentCategory: Categoria | null;
  phase: BoardPhase;
  timerSeconds: number;
  deadline: number | null;
  startedAt: number;
  winnerId: string | null;
  inProgress: boolean;

  startGame(nombres: string[], layoutId: BoardLayoutId, timerSeconds: number): void;
  drawCard(): void;
  startRound(): void;
  judge(acierto: boolean): void;
  handleTimeout(): void;
  passTurn(): void;
  setTimerSeconds(s: number): void;
  endGame(): void;
  resetGame(): void;
  restore(snap: BoardSnapshot): void;
  snapshot(): BoardSnapshot;
}

const defaults = getGameDefaults();

function nextIndex(i: number, n: number) {
  return (i + 1) % n;
}

/** Casilla objetivo (a la que se movería si acierta). */
function nextCell(pos: number, total: number) {
  // Si ya está en META, se queda ahí (partida ganada).
  return Math.min(pos + 1, total - 1);
}

export const useBoardGameStore = create<BoardGameState>((set, get) => ({
  players: [],
  turnIndex: 0,
  boardLetters: [],
  layoutId: 'abecedario',
  currentCategory: null,
  phase: 'idle',
  timerSeconds: defaults.defaultTimerSeconds,
  deadline: null,
  startedAt: Date.now(),
  winnerId: null,
  inProgress: false,

  startGame: (nombres, layoutId, timerSeconds) => {
    const letters = getBoardLetters(layoutId);
    set({
      players: nombres.map((nombre, i) => ({
        id: `p${i}`,
        nombre,
        puntaje: 0,
        color: PAWN_COLORS[i % PAWN_COLORS.length],
        position: 0,
      })),
      turnIndex: 0,
      boardLetters: letters,
      layoutId,
      currentCategory: null,
      phase: 'idle',
      timerSeconds,
      deadline: null,
      startedAt: Date.now(),
      winnerId: null,
      inProgress: true,
    });
  },

  drawCard: () => {
    const s = get();
    if (s.phase !== 'idle') return;
    const category = getCategoriaAleatoria(s.currentCategory?.id);
    set({
      currentCategory: category,
      phase: 'spinning',
      deadline: null,
    });
  },

  startRound: () => {
    const s = get();
    if (s.phase !== 'spinning') return;
    set({ phase: 'revealed', deadline: Date.now() + s.timerSeconds * 1000 });
  },

  judge: (acierto) => {
    const s = get();
    if (s.phase !== 'revealed') return;
    if (acierto) {
      advance(set, s, s.turnIndex);
    } else {
      passToNext(set, s);
    }
  },

  handleTimeout: () => {
    const s = get();
    if (s.phase !== 'revealed') return;
    set({ phase: 'timeout', deadline: null });
  },

  passTurn: () => {
    const s = get();
    if (s.phase !== 'timeout') return;
    passToNext(set, s);
  },

  setTimerSeconds: (sec) => {
    const clamped = Math.min(defaults.maxTimerSeconds, Math.max(defaults.minTimerSeconds, sec));
    const s = get();
    if (s.phase === 'revealed' && s.deadline) {
      const elapsed = s.timerSeconds * 1000 - (s.deadline - Date.now());
      set({ timerSeconds: clamped, deadline: Date.now() + Math.max(0, clamped * 1000 - elapsed) });
    } else {
      set({ timerSeconds: clamped });
    }
  },

  endGame: () => {
    set({ phase: 'finished', deadline: null });
    void clearBoardSnapshot();
  },

  resetGame: () => {
    set({ inProgress: false, players: [], phase: 'idle', deadline: null, winnerId: null });
    void clearBoardSnapshot();
  },

  restore: (snap) =>
    set({
      ...snap,
      currentCategory: snap.currentCategory
        ? { ...(snap.currentCategory as Categoria) }
        : null,
      phase:
        snap.phase === 'revealed' || snap.phase === 'spinning' || snap.phase === 'timeout'
          ? 'idle'
          : snap.phase,
      deadline: null,
      inProgress: snap.phase !== 'finished',
    }),

  snapshot: () => {
    const s = get();
    return {
      players: s.players,
      turnIndex: s.turnIndex,
      boardLetters: s.boardLetters,
      layoutId: s.layoutId,
      currentCategory: s.currentCategory
        ? { id: s.currentCategory.id, nombre: s.currentCategory.nombre, icono: s.currentCategory.icono }
        : null,
      phase: s.phase,
      timerSeconds: s.timerSeconds,
      deadline: s.deadline,
      startedAt: s.startedAt,
      winnerId: s.winnerId,
    };
  },
}));

type SetFn = (partial: Partial<BoardGameState>) => void;

/** El jugador acertó: peón avanza; si llegó a la META, se acaba la partida. */
function advance(set: SetFn, s: BoardGameState, playerIndex: number) {
  const total = s.boardLetters.length;
  const players = s.players.map((p, i) => {
    if (i !== playerIndex) return p;
    const nextPos = nextCell(p.position, total);
    return { ...p, position: nextPos, puntaje: p.puntaje + 1 };
  });
  const jugador = players[playerIndex];
  const gano = jugador.position === total - 1;
  if (gano) {
    set({
      players,
      phase: 'finished',
      deadline: null,
      winnerId: jugador.id,
      currentCategory: s.currentCategory,
    });
    void clearBoardSnapshot();
    return;
  }
  set({
    players,
    turnIndex: nextIndex(playerIndex, players.length),
    currentCategory: null,
    deadline: null,
    phase: 'idle',
  });
}

/** Pasa el turno al siguiente sin mover peón. */
function passToNext(set: SetFn, s: BoardGameState) {
  set({
    turnIndex: nextIndex(s.turnIndex, s.players.length),
    currentCategory: null,
    deadline: null,
    phase: 'idle',
  });
}

// Persistencia con throttle simple.
let saveTimer: number | undefined;
useBoardGameStore.subscribe((s) => {
  if (!s.inProgress) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void saveBoardSnapshot(useBoardGameStore.getState().snapshot());
  }, 300);
});
