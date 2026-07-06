// ÚNICO punto de acceso al contenido del juego (regla de oro de DATA.md).
// Los componentes consumen estas accesoras; nunca importan `data/` directo.
// Si algún día hay packs remotos/CMS, se cambia esta implementación, no los componentes.

import { categoriasBase } from '../data/categorias';
import { letrasBase } from '../data/letras';
import { modosBase } from '../data/modos';
import { appMeta, gameDefaults } from '../data/defaults';
import type { Categoria, Dificultad, Idioma, Letra, Modo } from '../types';
import { getCategoriasCustom, saveCategoriaCustom } from './persistence';

export const getAppMeta = () => appMeta;
export const getGameDefaults = () => gameDefaults;
export const getModos = (): Modo[] => modosBase;

let customCache: Categoria[] = [];

/** Cargar categorías custom desde IndexedDB (llamar una vez al iniciar). */
export async function hydrateCustomCategorias(): Promise<void> {
  customCache = await getCategoriasCustom();
}

export function getCategoriasActivas(idioma: Idioma = 'es', dificultad?: Dificultad): Categoria[] {
  return [...categoriasBase, ...customCache].filter(
    (c) => c.activo && c.idioma === idioma && (!dificultad || c.dificultad === dificultad),
  );
}

export async function addCategoriaCustom(nombre: string, icono = 'message-circle'): Promise<Categoria> {
  const slug = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const c: Categoria = {
    id: `custom-${slug}-${Date.now().toString(36)}`,
    slug,
    nombre,
    dificultad: 'intermedio',
    idioma: 'es',
    activo: true,
    icono,
    origen: 'custom',
  };
  await saveCategoriaCustom(c);
  customCache = [...customCache, c];
  return c;
}

export const getLetras = (): Letra[] => letrasBase.filter((l) => l.activa && l.peso > 0);

/** Sorteo ponderado de letra, evitando las ya usadas mientras queden disponibles. */
export function getLetraAleatoria(usadas: string[] = []): string {
  const pool0 = getLetras();
  const restantes = pool0.filter((l) => !usadas.includes(l.caracter));
  const pool = restantes.length > 0 ? restantes : pool0;
  const total = pool.reduce((acc, l) => acc + l.peso, 0);
  let r = Math.random() * total;
  for (const l of pool) {
    r -= l.peso;
    if (r <= 0) return l.caracter;
  }
  return pool[pool.length - 1].caracter;
}

export function getCategoriaAleatoria(excluirId?: string): Categoria {
  const pool = getCategoriasActivas();
  const filtrado = pool.length > 1 && excluirId ? pool.filter((c) => c.id !== excluirId) : pool;
  return filtrado[Math.floor(Math.random() * filtrado.length)];
}
