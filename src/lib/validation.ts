// Validación de mensajes que llegan por el canal realtime.
//
// REGLA DE SEGURIDAD: el canal (PartyKit o BroadcastChannel) es un relay
// SIN autenticación — cualquiera que conozca/adivine el código de sala
// (4 chars = 24^4 ≈ 331k combinaciones, fuerza-brutable) puede enviar
// cualquier payload. Por eso NADA que llegue del canal se considera
// confiable: se valida forma y contenido antes de tocar el estado.
//
// Sin esto, un `{type:'state', state:{players:null}}` desmonta React y
// deja la TV en blanco (DoS remoto verificado).
import type {
  BoardSnapshot,
  GameSnapshot,
  RoomMessage,
  RoundPhase,
  BoardPhase,
} from '../types';

/** Alfabeto de los códigos de sala (sin I/O para evitar confusión visual). */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROOM_CODE_RE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{4}$`);

/** Límites defensivos: cortan payloads absurdos antes de renderizar. */
const MAX_PLAYERS = 12;
const MAX_NOMBRE_LEN = 24;
const MAX_BOARD_CELLS = 64;
const MAX_USED_LETTERS = 64;
const MAX_TEXT_LEN = 80;

export function isValidRoomCode(v: unknown): v is string {
  return typeof v === 'string' && ROOM_CODE_RE.test(v);
}

/** Normaliza un código tipeado por el usuario; null si no es válido. */
export function normalizeRoomCode(raw: string): string | null {
  const up = raw.trim().toUpperCase();
  return ROOM_CODE_RE.test(up) ? up : null;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isFiniteNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const isIntInRange = (v: unknown, min: number, max: number): v is number =>
  isFiniteNum(v) && Number.isInteger(v) && v >= min && v <= max;

/** Texto seguro para render: string, no vacío, acotado en largo. */
const isSafeText = (v: unknown, max = MAX_TEXT_LEN): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max;

const ROUND_PHASES: RoundPhase[] = ['idle', 'spinning', 'revealed', 'timeout', 'finished'];
const BOARD_PHASES: BoardPhase[] = ['idle', 'spinning', 'revealed', 'timeout', 'finished'];

function isCategoryRef(v: unknown): boolean {
  if (v === null) return true;
  if (!isObj(v)) return false;
  return (
    isSafeText(v.id) &&
    isSafeText(v.nombre) &&
    (v.icono === undefined || isSafeText(v.icono, 40))
  );
}

function isPlayerBase(v: unknown): v is Record<string, unknown> {
  return (
    isObj(v) &&
    isSafeText(v.id, 16) &&
    isSafeText(v.nombre, MAX_NOMBRE_LEN) &&
    isIntInRange(v.puntaje, 0, 9999)
  );
}

/** Snapshot del Modo Clásico. */
export function isGameSnapshot(v: unknown): v is GameSnapshot {
  if (!isObj(v)) return false;
  // UUID de la partida: es el external_id en Cerebro y viaja en el snapshot.
  if (!isSafeText(v.gameId, 64)) return false;
  if (!Array.isArray(v.players) || v.players.length > MAX_PLAYERS) return false;
  if (!v.players.every(isPlayerBase)) return false;

  // turnIndex debe apuntar dentro del array (evita `players[i].nombre` de undefined).
  const n = v.players.length;
  if (n > 0 && !isIntInRange(v.turnIndex, 0, n - 1)) return false;
  if (n === 0 && v.turnIndex !== 0) return false;
  if (n > 0 && !isIntInRange(v.cardOwnerIndex, 0, n - 1)) return false;

  if (!(v.activeLetter === null || isSafeText(v.activeLetter, 2))) return false;
  if (!Array.isArray(v.usedLetters) || v.usedLetters.length > MAX_USED_LETTERS) return false;
  if (!v.usedLetters.every((l) => isSafeText(l, 2))) return false;
  if (!isCategoryRef(v.currentCategory)) return false;
  if (!ROUND_PHASES.includes(v.phase as RoundPhase)) return false;
  if (!isIntInRange(v.timerSeconds, 1, 600)) return false;
  if (!(v.letterLimit === null || isIntInRange(v.letterLimit, 1, 999))) return false;
  if (!isIntInRange(v.cardsResolved, 0, 9999)) return false;
  if (!(v.deadline === null || isFiniteNum(v.deadline))) return false;
  if (!isFiniteNum(v.startedAt)) return false;
  return true;
}

/** Snapshot del Modo 1000 Nombres. */
export function isBoardSnapshot(v: unknown): v is BoardSnapshot {
  if (!isObj(v)) return false;
  if (!isSafeText(v.gameId, 64)) return false;
  if (!Array.isArray(v.boardLetters)) return false;
  if (v.boardLetters.length < 4 || v.boardLetters.length > MAX_BOARD_CELLS) return false;
  if (!v.boardLetters.every((l) => isSafeText(l, 2))) return false;

  const cells = v.boardLetters.length;
  if (!Array.isArray(v.players) || v.players.length > MAX_PLAYERS) return false;
  // Cada peón debe caer en una casilla real del tablero.
  const playersOk = v.players.every(
    (p) =>
      isPlayerBase(p) &&
      isSafeText((p as Record<string, unknown>).color, 32) &&
      isIntInRange((p as Record<string, unknown>).position, 0, cells - 1),
  );
  if (!playersOk) return false;

  const n = v.players.length;
  if (n > 0 && !isIntInRange(v.turnIndex, 0, n - 1)) return false;
  if (n === 0 && v.turnIndex !== 0) return false;

  if (!isSafeText(v.layoutId, 32)) return false;
  if (!isCategoryRef(v.currentCategory)) return false;
  if (!BOARD_PHASES.includes(v.phase as BoardPhase)) return false;
  if (!isIntInRange(v.timerSeconds, 1, 600)) return false;
  if (!(v.deadline === null || isFiniteNum(v.deadline))) return false;
  if (!isFiniteNum(v.startedAt)) return false;
  if (!(v.winnerId === null || isSafeText(v.winnerId, 16))) return false;
  return true;
}

/**
 * Valida un mensaje entrante del canal. Devuelve el mensaje tipado si es
 * legítimo, o `null` para descartarlo en silencio (no confiamos en el emisor,
 * así que tampoco le devolvemos señales de error).
 */
export function parseRoomMessage(raw: unknown): RoomMessage | null {
  if (!isObj(raw)) return null;
  if (!isValidRoomCode(raw.code)) return null;
  const code = raw.code;

  switch (raw.type) {
    case 'hello-host':
      return { type: 'hello-host', code };
    case 'hello-tv':
      return { type: 'hello-tv', code };
    case 'bye':
      return raw.from === 'host' || raw.from === 'tv'
        ? { type: 'bye', code, from: raw.from }
        : null;
    case 'state':
      return isGameSnapshot(raw.state) ? { type: 'state', code, state: raw.state } : null;
    case 'board-state':
      return isBoardSnapshot(raw.state)
        ? { type: 'board-state', code, state: raw.state }
        : null;
    default:
      return null;
  }
}
