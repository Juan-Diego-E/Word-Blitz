import type { AppMeta, GameDefaults } from '../types';

export const appMeta: AppMeta = {
  title: 'Word Blitz',
  tagline:
    'Inspirado en los juegos de la infancia: reviví la nostalgia del juego en familia.',
  defaultLanguage: 'es',
};

export const gameDefaults: GameDefaults = {
  defaultTimerSeconds: 30,
  minTimerSeconds: 5,
  maxTimerSeconds: 120,
  defaultLetterLimit: 10,
  minPlayers: 2,
  maxPlayers: 8,
};
