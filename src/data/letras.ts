import type { Letra } from '../types';

// Peso = probabilidad relativa en la ruleta. Ñ desactivada; letras difíciles pesan menos.
const def = (caracter: string, peso: number, activa = true): Letra => ({
  id: `letra-${caracter.toLowerCase()}`,
  slug: caracter.toLowerCase(),
  caracter,
  peso,
  activa,
});

export const letrasBase: Letra[] = [
  def('A', 3), def('B', 2), def('C', 3), def('D', 2), def('E', 3),
  def('F', 2), def('G', 2), def('H', 1), def('I', 2), def('J', 1),
  def('K', 0, false), def('L', 3), def('M', 3), def('N', 2),
  def('Ñ', 0, false), def('O', 2), def('P', 3), def('Q', 1),
  def('R', 3), def('S', 3), def('T', 3), def('U', 1), def('V', 2),
  def('W', 0, false), def('X', 0, false), def('Y', 1), def('Z', 1),
];
