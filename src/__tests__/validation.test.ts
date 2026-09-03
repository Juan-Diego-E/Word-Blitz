// Regresión de seguridad: el canal realtime es un relay SIN autenticación.
// Estos tests fijan que ningún payload hostil llegue al estado de la app.
// El PoC original (`{type:'state', state:{players:null}}`) desmontaba React
// y dejaba la TV en blanco.
import { describe, expect, it } from 'vitest';
import {
  isValidRoomCode,
  normalizeRoomCode,
  parseRoomMessage,
} from '../lib/validation';

const CODE = 'ABCD';

const snapshotClasico = () => ({
  gameId: '11111111-2222-3333-4444-555555555555',
  players: [
    { id: 'p0', nombre: 'Ana', puntaje: 2 },
    { id: 'p1', nombre: 'Beto', puntaje: 1 },
  ],
  turnIndex: 0,
  cardOwnerIndex: 0,
  activeLetter: 'M',
  usedLetters: ['A', 'B'],
  currentCategory: { id: 'cat-paises', nombre: 'País', icono: 'globe' },
  phase: 'revealed',
  timerSeconds: 30,
  letterLimit: 10,
  cardsResolved: 3,
  deadline: Date.now() + 30000,
  startedAt: Date.now() - 60000,
});

const snapshotTablero = () => ({
  gameId: '66666666-7777-8888-9999-000000000000',
  players: [
    { id: 'p0', nombre: 'Ana', puntaje: 3, color: '#f5550e', position: 3 },
    { id: 'p1', nombre: 'Beto', puntaje: 1, color: '#0d5189', position: 0 },
  ],
  turnIndex: 0,
  boardLetters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  layoutId: 'abecedario',
  currentCategory: { id: 'cat-animales', nombre: 'Animal', icono: 'paw-print' },
  phase: 'revealed',
  timerSeconds: 30,
  deadline: Date.now() + 30000,
  startedAt: Date.now() - 60000,
  winnerId: null,
});

describe('códigos de sala', () => {
  it('acepta solo 4 letras del alfabeto sin I/O', () => {
    expect(isValidRoomCode('ABCD')).toBe(true);
    expect(isValidRoomCode('ABCI')).toBe(false); // I excluida
    expect(isValidRoomCode('ABCO')).toBe(false); // O excluida
    expect(isValidRoomCode('abcd')).toBe(false); // minúsculas
    expect(isValidRoomCode('ABC')).toBe(false);
    expect(isValidRoomCode('ABCDE')).toBe(false);
    expect(isValidRoomCode('AB1D')).toBe(false);
    expect(isValidRoomCode(null)).toBe(false);
  });

  it('normaliza entrada del usuario y rechaza basura', () => {
    expect(normalizeRoomCode('  abcd ')).toBe('ABCD');
    expect(normalizeRoomCode('../../etc')).toBeNull();
    expect(normalizeRoomCode('<script>')).toBeNull();
  });
});

describe('parseRoomMessage — acepta lo legítimo', () => {
  it('pasa handshakes y bye', () => {
    expect(parseRoomMessage({ type: 'hello-host', code: CODE })).toEqual({
      type: 'hello-host',
      code: CODE,
    });
    expect(parseRoomMessage({ type: 'hello-tv', code: CODE })).toEqual({
      type: 'hello-tv',
      code: CODE,
    });
    expect(parseRoomMessage({ type: 'bye', code: CODE, from: 'tv' })).toEqual({
      type: 'bye',
      code: CODE,
      from: 'tv',
    });
  });

  it('pasa un snapshot real del Clásico', () => {
    const msg = parseRoomMessage({ type: 'state', code: CODE, state: snapshotClasico() });
    expect(msg).not.toBeNull();
    expect(msg?.type).toBe('state');
  });

  it('pasa el tema publicado por el control', () => {
    expect(parseRoomMessage({ type: 'theme', code: CODE, tema: 'oscuro' })).toEqual({
      type: 'theme',
      code: CODE,
      tema: 'oscuro',
    });
    expect(parseRoomMessage({ type: 'theme', code: CODE, tema: 'claro' })).not.toBeNull();
  });

  it('pasa un snapshot real del tablero', () => {
    const msg = parseRoomMessage({ type: 'board-state', code: CODE, state: snapshotTablero() });
    expect(msg).not.toBeNull();
    expect(msg?.type).toBe('board-state');
  });
});

describe('parseRoomMessage — rechaza lo hostil', () => {
  it('descarta el PoC que blanqueaba la TV (players null)', () => {
    expect(parseRoomMessage({ type: 'state', code: CODE, state: { players: null } })).toBeNull();
  });

  it('descarta turnIndex fuera de rango', () => {
    const s = { ...snapshotClasico(), turnIndex: 99 };
    expect(parseRoomMessage({ type: 'state', code: CODE, state: s })).toBeNull();
  });

  it('descarta un peón en una casilla inexistente', () => {
    const s = snapshotTablero();
    s.players[0].position = 999;
    expect(parseRoomMessage({ type: 'board-state', code: CODE, state: s })).toBeNull();
  });

  it('descarta nombres desmedidos (defacement / layout bomb)', () => {
    const s = snapshotClasico();
    s.players[0].nombre = 'Z'.repeat(50_000);
    expect(parseRoomMessage({ type: 'state', code: CODE, state: s })).toBeNull();
  });

  it('descarta un snapshot sin gameId (no se puede identificar la partida)', () => {
    const s = snapshotClasico() as Record<string, unknown>;
    delete s.gameId;
    expect(parseRoomMessage({ type: 'state', code: CODE, state: s })).toBeNull();
  });

  it('descarta fases inventadas', () => {
    const s = { ...snapshotClasico(), phase: 'pwned' };
    expect(parseRoomMessage({ type: 'state', code: CODE, state: s })).toBeNull();
  });

  it('descarta timers absurdos', () => {
    const s = { ...snapshotClasico(), timerSeconds: 1e9 };
    expect(parseRoomMessage({ type: 'state', code: CODE, state: s })).toBeNull();
  });

  it('descarta NaN/Infinity en deadline', () => {
    const s = { ...snapshotClasico(), deadline: Number.POSITIVE_INFINITY };
    expect(parseRoomMessage({ type: 'state', code: CODE, state: s })).toBeNull();
  });

  it('descarta mensajes de otra sala o sin código válido', () => {
    expect(parseRoomMessage({ type: 'hello-tv', code: 'nope' })).toBeNull();
    expect(parseRoomMessage({ type: 'hello-tv' })).toBeNull();
  });

  it('descarta temas inventados (el atributo va al DOM sin escapar)', () => {
    for (const tema of ['dark', '', null, 42, { toString: () => 'claro' }, 'claro; drop']) {
      expect(parseRoomMessage({ type: 'theme', code: CODE, tema })).toBeNull();
    }
  });

  it('descarta tipos desconocidos y primitivos', () => {
    expect(parseRoomMessage({ type: 'exec', code: CODE })).toBeNull();
    expect(parseRoomMessage('hola')).toBeNull();
    expect(parseRoomMessage(null)).toBeNull();
    expect(parseRoomMessage([1, 2, 3])).toBeNull();
  });
});
