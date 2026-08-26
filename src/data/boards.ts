// Layouts del tablero del Modo 1000 Nombres. Cada layout define las letras
// que van a rodear el tablero (perímetro). La posición 0 es la casilla
// START (siempre vacía) y la última es la META.
import type { BoardLayoutDef } from '../types';

// Abecedario en español sin Ñ (para no forzar palabras con Ñ) — 26 letras.
const ABECEDARIO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const FACIL = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'L', 'M', 'N',
  'O', 'P', 'R', 'S', 'T', 'A', 'E', 'O', 'M', 'S',
];

const INTERMEDIO = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'A', 'E', 'O',
];

const DIFICIL = [
  'B', 'C', 'D', 'F', 'G', 'H', 'I', 'J', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z',
  'H', 'J', 'Q', 'Y',
];

const EXTREMO = [
  'H', 'J', 'K', 'Q', 'W', 'X', 'Y', 'Z', 'H', 'J',
  'Q', 'V', 'W', 'X', 'Y', 'Z', 'F', 'K', 'Z', 'Q',
];

export const layoutsBase: BoardLayoutDef[] = [
  {
    id: 'abecedario',
    nombre: 'Abecedario (A–Z)',
    descripcion: '26 casillas con todas las letras en orden.',
    letras: ABECEDARIO,
  },
  {
    id: 'facil',
    nombre: 'Fácil',
    descripcion: '20 casillas con las letras más comunes.',
    letras: FACIL,
  },
  {
    id: 'intermedio',
    nombre: 'Intermedio',
    descripcion: '24 casillas con mezcla equilibrada.',
    letras: INTERMEDIO,
  },
  {
    id: 'dificil',
    nombre: 'Difícil',
    descripcion: '24 casillas con letras poco comunes.',
    letras: DIFICIL,
  },
  {
    id: 'extremo',
    nombre: 'Extremo',
    descripcion: '20 casillas con las letras más duras.',
    letras: EXTREMO,
  },
  {
    id: 'aleatorio',
    nombre: 'Aleatorio',
    descripcion: '24 casillas sorteadas al iniciar la partida.',
    tamano: 24,
  },
];

/**
 * Devuelve las letras para el layout indicado, aleatorizando si corresponde.
 * Recibe la lista de layouts para poder trabajar con los que vienen de
 * Cerebro; sin argumento cae a los que trae el repo.
 */
export function buildBoardLetters(id: string, layouts: BoardLayoutDef[] = layoutsBase): string[] {
  const layout = layouts.find((l) => l.id === id) ?? layouts[0] ?? layoutsBase[0];
  if (layout.letras) return [...layout.letras];
  // Aleatorio: mezcla del abecedario, con repeticiones si `tamano` > 26.
  const size = layout.tamano ?? 24;
  const out: string[] = [];
  const pool = [...ABECEDARIO];
  while (out.length < size) {
    // Fisher–Yates parcial: barajar y consumir.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (const ch of pool) {
      if (out.length >= size) break;
      out.push(ch);
    }
  }
  return out;
}
