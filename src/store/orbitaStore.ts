// Estado del Modo Órbita. Loop del turno:
// - Cada turno el jugador tiene una carta boca abajo. "Descubrí" la voltea:
//   aparece una afirmación Verdadero/Falso y arranca el timer.
// - Responde V o F: si acierta, COLECCIONA la carta (+1). Si falla o se acaba
//   el tiempo, la carta se descarta.
// - Siempre pasa al siguiente jugador y se reparte la próxima carta.
// - Gana quien primero junte `metaCartas`; si el mazo se agota antes, gana
//   quien tenga más cartas.
import { create } from 'zustand';
import { getOrbitaCards, getGameDefaults } from '../lib/content';
import type { OrbitaCard, OrbitaPhase, OrbitaPlayer, OrbitaSnapshot } from '../types';

interface OrbitaState {
  gameId: string;
  players: OrbitaPlayer[];
  turnIndex: number;
  mazo: string[];
  cartaActual: string | null;
  afirmacionIndex: number;
  phase: OrbitaPhase;
  timerSeconds: number;
  metaCartas: number;
  deadline: number | null;
  startedAt: number;
  winnerId: string | null;
  inProgress: boolean;

  startGame(nombres: string[], timerSeconds: number, metaCartas: number): void;
  reveal(): void;
  answer(vf: boolean): void;
  handleTimeout(): void;
  next(): void;
  endGame(): void;
  resetGame(): void;
  restore(snap: OrbitaSnapshot): void;
  snapshot(): OrbitaSnapshot;
}

const defaults = getGameDefaults();

/** Baraja de Fisher–Yates sobre una copia. */
function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cartaPorId(id: string | null): OrbitaCard | null {
  if (!id) return null;
  return getOrbitaCards().find((c) => c.id === id) ?? null;
}

function afirmacionAlAzar(id: string): number {
  const carta = cartaPorId(id);
  if (!carta || carta.afirmaciones.length === 0) return 0;
  return Math.floor(Math.random() * carta.afirmaciones.length);
}

function nextIndex(i: number, n: number) {
  return (i + 1) % n;
}

export const useOrbitaStore = create<OrbitaState>((set, get) => ({
  gameId: '',
  players: [],
  turnIndex: 0,
  mazo: [],
  cartaActual: null,
  afirmacionIndex: 0,
  phase: 'idle',
  timerSeconds: defaults.defaultTimerSeconds,
  metaCartas: 4,
  deadline: null,
  startedAt: Date.now(),
  winnerId: null,
  inProgress: false,

  startGame: (nombres, timerSeconds, metaCartas) => {
    const mazo = barajar(getOrbitaCards().map((c) => c.id));
    const primera = mazo[0] ?? null;
    set({
      gameId: crypto.randomUUID(),
      players: nombres.map((nombre, i) => ({ id: `p${i}`, nombre, puntaje: 0, coleccion: [] })),
      turnIndex: 0,
      mazo: mazo.slice(1),
      cartaActual: primera,
      afirmacionIndex: primera ? afirmacionAlAzar(primera) : 0,
      phase: 'idle',
      timerSeconds,
      metaCartas,
      deadline: null,
      startedAt: Date.now(),
      winnerId: null,
      inProgress: true,
    });
  },

  reveal: () => {
    const s = get();
    if (s.phase !== 'idle' || !s.cartaActual) return;
    set({ phase: 'revealed', deadline: Date.now() + s.timerSeconds * 1000 });
  },

  answer: (vf) => {
    const s = get();
    if (s.phase !== 'revealed' || !s.cartaActual) return;
    const carta = cartaPorId(s.cartaActual);
    const correcto = !!carta && carta.afirmaciones[s.afirmacionIndex]?.esVerdad === vf;
    if (!correcto) {
      set({ phase: 'wrong', deadline: null });
      return;
    }
    const players = s.players.map((p, i) =>
      i === s.turnIndex
        ? { ...p, puntaje: p.puntaje + 1, coleccion: [...p.coleccion, s.cartaActual!] }
        : p,
    );
    const gano = players[s.turnIndex].coleccion.length >= s.metaCartas;
    set({
      players,
      phase: 'correct',
      deadline: null,
      winnerId: gano ? players[s.turnIndex].id : null,
    });
  },

  handleTimeout: () => {
    const s = get();
    if (s.phase !== 'revealed') return;
    set({ phase: 'wrong', deadline: null });
  },

  // Después de la transición correct/wrong: reparte la próxima carta o termina.
  next: () => {
    const s = get();
    if (s.phase !== 'correct' && s.phase !== 'wrong') return;

    if (s.winnerId) {
      set({ phase: 'finished', deadline: null });
      return;
    }
    if (s.mazo.length === 0) {
      // Mazo agotado: gana quien tenga más cartas (empate → el primero).
      const top = [...s.players].sort((a, b) => b.coleccion.length - a.coleccion.length)[0];
      set({ phase: 'finished', winnerId: top?.id ?? null, deadline: null });
      return;
    }
    const [siguiente, ...resto] = s.mazo;
    set({
      turnIndex: nextIndex(s.turnIndex, s.players.length),
      cartaActual: siguiente,
      afirmacionIndex: afirmacionAlAzar(siguiente),
      mazo: resto,
      phase: 'idle',
      deadline: null,
    });
  },

  endGame: () => {
    const s = get();
    const top = [...s.players].sort((a, b) => b.coleccion.length - a.coleccion.length)[0];
    set({ phase: 'finished', winnerId: s.winnerId ?? top?.id ?? null, deadline: null });
  },

  resetGame: () =>
    set({ inProgress: false, players: [], phase: 'idle', cartaActual: null, deadline: null, winnerId: null }),

  restore: (snap) =>
    set({
      ...snap,
      gameId: snap.gameId || crypto.randomUUID(),
      // No reanudar a mitad de una carta revelada: volver a estado estable.
      phase: snap.phase === 'revealed' || snap.phase === 'correct' || snap.phase === 'wrong' ? 'idle' : snap.phase,
      deadline: null,
      inProgress: snap.phase !== 'finished',
    }),

  snapshot: () => {
    const s = get();
    return {
      gameId: s.gameId,
      players: s.players,
      turnIndex: s.turnIndex,
      mazo: s.mazo,
      cartaActual: s.cartaActual,
      afirmacionIndex: s.afirmacionIndex,
      phase: s.phase,
      timerSeconds: s.timerSeconds,
      metaCartas: s.metaCartas,
      deadline: s.deadline,
      startedAt: s.startedAt,
      winnerId: s.winnerId,
    };
  },
}));
