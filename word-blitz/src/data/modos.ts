import type { Modo } from '../types';

export const modosBase: Modo[] = [
  {
    id: 'modo-clasico',
    slug: 'clasico',
    nombre: 'Clásico',
    descripcion: 'Letra, categoría y tiempo. El de siempre, para jugar en ronda.',
    habilitado: true,
    icono: '🎴',
    reglas: { usaTimer: true, usaLetra: true, puntosPorAcierto: 1, rebote: true },
  },
  {
    id: 'modo-palabra-diaria',
    slug: 'palabra-diaria',
    nombre: 'Palabra Diaria',
    descripcion: 'Un desafío nuevo cada día.',
    habilitado: false,
    icono: '📅',
    reglas: {},
  },
  {
    id: 'modo-infinito',
    slug: 'infinito',
    nombre: 'Infinito',
    descripcion: 'Sin límite de rondas: hasta que aguante la mesa.',
    habilitado: false,
    icono: '♾️',
    reglas: {},
  },
  {
    id: 'modo-multijugador',
    slug: 'multijugador',
    nombre: 'Multijugador',
    descripcion: 'Cada uno con su celu, todos contra todos.',
    habilitado: false,
    icono: '📱',
    reglas: {},
  },
  {
    id: 'modo-contrarreloj',
    slug: 'contrarreloj',
    nombre: 'Contrarreloj',
    descripcion: 'Cuántas palabras te salen antes de que suene la chicharra.',
    habilitado: false,
    icono: '⏱️',
    reglas: {},
  },
];
