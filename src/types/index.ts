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
  | '1000-nombres'
  | 'orbita'
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
  /** UUID estable de la partida: es el external_id en Cerebro. */
  gameId: string;
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

// ---- Modo 1000 Nombres (tablero con peones) ----

export type BoardLayoutId = 'abecedario' | 'facil' | 'intermedio' | 'dificil' | 'extremo' | 'aleatorio';

export interface BoardLayoutDef {
  id: BoardLayoutId;
  nombre: string;
  descripcion: string;
  /** Letras fijas para este layout. Ignorado si `aleatorio`. */
  letras?: string[];
  /** Tamaño usado cuando el layout es aleatorio. */
  tamano?: number;
}

/** Colores de peón asignados por orden de jugador. */
export const PAWN_COLORS = [
  '#f5550e', // tangelo
  '#0d5189', // blue-yinmn
  '#00aa00', // green
  '#ffcf3f', // amarillo
  '#c02cff', // violeta
  '#00c9c9', // cian
  '#ff2b8f', // rosa
  '#7a5230', // marrón
] as const;

export interface BoardPlayer extends Player {
  color: string;
  /** Índice de la casilla actual en el tablero (0 = START, `boardLetters.length-1` = META). */
  position: number;
}

export type BoardPhase =
  | 'idle'      // esperando voltear la carta / pedir palabra
  | 'spinning'  // carta volteando
  | 'revealed'  // categoría visible, timer corriendo
  | 'timeout'
  | 'finished';

/** Snapshot serializable para persistencia y TV. */
export interface BoardSnapshot {
  /** UUID estable de la partida: es el external_id en Cerebro. */
  gameId: string;
  players: BoardPlayer[];
  turnIndex: number;
  boardLetters: string[];
  layoutId: BoardLayoutId;
  currentCategory: Pick<Categoria, 'id' | 'nombre' | 'icono'> | null;
  phase: BoardPhase;
  timerSeconds: number;
  deadline: number | null;
  startedAt: number;
  winnerId: string | null;
}

// ---- Sala TV ----

export type RoomRole = 'host' | 'tv';
export type RoomStatus = 'idle' | 'waiting' | 'connected' | 'error';

export type RoomMessage =
  | { type: 'hello-host'; code: string }
  | { type: 'hello-tv'; code: string }
  | { type: 'state'; code: string; state: GameSnapshot }
  | { type: 'board-state'; code: string; state: BoardSnapshot }
  | { type: 'bye'; code: string; from: RoomRole };

// ---- Modo Órbita (cartas del cosmos) ----

/** Tipo de objeto celeste = categoría; su color viene de la paleta Órbita. */
export type OrbitaTipo = 'estrella' | 'planeta' | 'satelite' | 'menor';
export type OrbitaRareza = 'comun' | 'rara' | 'epica' | 'legendaria';

/** Afirmación Verdadero/Falso que la carta plantea al voltearse. */
export interface OrbitaAfirmacionDef {
  texto: string;
  esVerdad: boolean;
}

export interface OrbitaAtributo {
  label: string;   // "Tamaño", "Distancia", "Temp"
  valor: string;   // "109×", "1 UA", "15°"
}

/** Una carta del mazo. `variante` mapea a una ilustración CSS. */
export interface OrbitaCard {
  id: string;
  nombre: string;
  tipo: OrbitaTipo;
  tipoLabel: string;      // "Estrella · centro del sistema"
  rareza: OrbitaRareza;
  variante: string;       // clave de CelestialBody (sol, tierra, ...)
  atributos: [OrbitaAtributo, OrbitaAtributo, OrbitaAtributo];
  afirmaciones: OrbitaAfirmacionDef[];
  curiosidad: string;     // dato que se revela al resolver
}

export interface OrbitaPlayer extends Player {
  /** Cartas coleccionadas (ids), en orden de captura. */
  coleccion: string[];
}

export type OrbitaPhase =
  | 'idle'      // carta boca abajo, esperando "Descubrí"
  | 'revealed'  // afirmación visible, timer corriendo, V/F disponible
  | 'correct'   // resolvió bien (transición breve)
  | 'wrong'     // resolvió mal o se acabó el tiempo (transición breve)
  | 'finished';

/** Snapshot serializable del Modo Órbita. */
export interface OrbitaSnapshot {
  gameId: string;
  players: OrbitaPlayer[];
  turnIndex: number;
  /** Ids del mazo restante, en orden. */
  mazo: string[];
  /** Carta actual sobre la mesa (id). */
  cartaActual: string | null;
  /** Índice de la afirmación elegida para la carta actual. */
  afirmacionIndex: number;
  phase: OrbitaPhase;
  timerSeconds: number;
  metaCartas: number;   // cuántas cartas para ganar (o mazo agotado)
  deadline: number | null;
  startedAt: number;
  winnerId: string | null;
}
