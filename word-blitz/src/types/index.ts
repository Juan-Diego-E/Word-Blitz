// Tipos compartidos — espejo del modelo de DATA.md

export type Dificultad = 'facil' | 'intermedio' | 'dificil';
export type Idioma = 'es' | 'en' | 'fr';
export type OrigenCategoria = 'base' | 'custom';

export interface Categoria {
  id: string;
  slug: string;
  nombre: string;
  descripcion?: string;
  dificultad: Dificultad;
  idioma: Idioma;
  activo: boolean;
  icono?: string;
  origen: OrigenCategoria;
}

export interface Letra {
  id: string;
  slug: string;
  caracter: string;
  peso: number;
  activa: boolean;
}

export type ModoSlug =
  | 'clasico'
  | 'palabra-diaria'
  | 'infinito'
  | 'multijugador'
  | 'contrarreloj';

export interface Modo {
  id: string;
  slug: ModoSlug;
  nombre: string;
  descripcion: string;
  habilitado: boolean;
  icono?: string;
  reglas: Record<string, unknown>;
}

export interface GameDefaults {
  defaultTimerSeconds: number;
  minTimerSeconds: number;
  maxTimerSeconds: number;
  defaultLetterLimit: number | null;
  minPlayers: number;
  maxPlayers: number;
}

export interface AppMeta {
  title: string;
  tagline: string;
  defaultLanguage: Idioma;
}

// ---- Estado de partida ----

export interface Player {
  id: string;
  nombre: string;
  puntaje: number;
}

export type RoundPhase =
  | 'idle'      // esperando voltear la carta
  | 'spinning'  // ruleta girando / carta volteando
  | 'revealed'  // categoría visible, temporizador corriendo
  | 'timeout'   // se acabó el tiempo (transición breve)
  | 'finished'; // partida terminada

/** Snapshot serializable de la partida: persistencia + sync a la TV. */
export interface GameSnapshot {
  players: Player[];
  turnIndex: number;
  cardOwnerIndex: number;
  activeLetter: string | null;
  usedLetters: string[];
  currentCategory: Pick<Categoria, 'id' | 'nombre' | 'icono'> | null;
  phase: RoundPhase;
  timerSeconds: number;
  letterLimit: number | null;
  cardsResolved: number;
  deadline: number | null; // epoch ms
  startedAt: number;
}

// ---- Sala TV ----

export type RoomRole = 'host' | 'tv';
export type RoomStatus = 'idle' | 'waiting' | 'connected' | 'error';

export type RoomMessage =
  | { type: 'hello-host'; code: string }
  | { type: 'hello-tv'; code: string }
  | { type: 'state'; code: string; state: GameSnapshot }
  | { type: 'bye'; code: string; from: RoomRole };
