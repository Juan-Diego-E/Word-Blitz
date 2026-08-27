// ÚNICO punto de acceso al contenido del juego (regla de oro de DATA.md).
// Los componentes consumen estas accesoras; nunca importan `data/` directo.
//
// FUENTES, en orden de preferencia:
//   1. Cerebro, si el proxy está configurado y responde (permite rebalancear
//      dificultad o corregir textos sin redeploy).
//   2. `src/data/`, que viaja en el bundle.
//
// Las accesoras siguen siendo SÍNCRONAS: la hidratación llena un caché al
// arrancar y las vistas leen de ahí. Volverlas async obligaría a tocar todos
// los componentes y dejaría el juego dependiendo de la red para arrancar.

import { categoriasBase } from '../data/categorias';
import { letrasBase } from '../data/letras';
import { modosBase } from '../data/modos';
import { layoutsBase, buildBoardLetters } from '../data/boards';
import { orbitaCards } from '../data/orbita';
import { appMeta, gameDefaults } from '../data/defaults';
import type { BoardLayoutDef, Categoria, Dificultad, Idioma, Letra, Modo, OrbitaCard } from '../types';
import { traerCategorias, traerLayouts, traerLetras, traerModos } from './cerebro';
import { getCategoriasCustom, saveCategoriaCustom } from './persistence';

export const getAppMeta = () => appMeta;
export const getGameDefaults = () => gameDefaults;

// --- Caché de contenido remoto (null = todavía no llegó, usar el del bundle) ---
let categoriasRemotas: Categoria[] | null = null;
let letrasRemotas: Letra[] | null = null;
let modosRemotos: Modo[] | null = null;
let layoutsRemotos: BoardLayoutDef[] | null = null;

/** Categorías creadas por el usuario, desde IndexedDB. */
let customCache: Categoria[] = [];

const categorias = (): Categoria[] => categoriasRemotas ?? categoriasBase;
const letras = (): Letra[] => letrasRemotas ?? letrasBase;
const layouts = (): BoardLayoutDef[] => layoutsRemotos ?? layoutsBase;

export const getModos = (): Modo[] => modosRemotos ?? modosBase;
export const getBoardLayouts = (): BoardLayoutDef[] => layouts();
export const getBoardLetters = (id: string): string[] => buildBoardLetters(id, layouts());
export const getOrbitaCards = (): OrbitaCard[] => orbitaCards;

/**
 * Carga el contenido: primero lo local (rápido y siempre disponible), después
 * lo de Cerebro si está. Llamar una vez al iniciar la app.
 *
 * Nunca lanza: si Cerebro falla, el juego queda con el contenido del bundle.
 */
export async function hydrateContenido(): Promise<void> {
  customCache = await getCategoriasCustom();

  // En paralelo: son cuatro colecciones chicas e independientes.
  const [cats, lets, mods, lays] = await Promise.all([
    traerCategorias(),
    traerLetras(),
    traerModos(),
    traerLayouts(),
  ]);

  // Solo se pisa el default si vino algo con contenido: una colección vacía
  // en Cerebro no debe dejar al juego sin letras ni sin categorías.
  if (cats?.length) categoriasRemotas = cats;
  if (lets?.length) letrasRemotas = lets;
  if (mods?.length) modosRemotos = mods;
  if (lays?.length) layoutsRemotos = lays;
}

/** @deprecated Usar `hydrateContenido()`, que además trae el contenido remoto. */
export async function hydrateCustomCategorias(): Promise<void> {
  customCache = await getCategoriasCustom();
}

export function getCategoriasActivas(idioma: Idioma = 'es', dificultad?: Dificultad): Categoria[] {
  return [...categorias(), ...customCache].filter(
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
  // Solo local: la colección `categorias` de Cerebro está en whitelist de
  // lectura. Si algún día la app deja crear categorías desde la UI, hay que
  // habilitar POST en el proxy y subirlas acá.
  await saveCategoriaCustom(c);
  customCache = [...customCache, c];
  return c;
}

export const getLetras = (): Letra[] => letras().filter((l) => l.activa && l.peso > 0);

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
