// ÚNICO punto de contacto con la API de Cerebro.
//
// Ningún otro archivo arma URLs ni headers: todo pasa por acá. El cliente
// habla siempre con `/api/cerebro/...` (mismo origen), nunca con Cerebro
// directo — la API key vive en la función serverless de `api/cerebro/`, no
// en el bundle.
//
// REGLA DE DEGRADACIÓN: Cerebro es un complemento, no un requisito. Si el
// proxy no está configurado, o la red falla, o la key está revocada, cada
// función devuelve null/[] y el juego sigue andando con sus datos locales.
// Ninguna de estas funciones lanza hacia afuera.
import type {
  BoardLayoutDef,
  BoardSnapshot,
  Categoria,
  GameSnapshot,
  Letra,
  Modo,
} from '../types';
import type { Prefs } from './persistence';

const BASE = '/api/cerebro';

/** Colecciones que el proxy tiene en whitelist. */
type Coleccion =
  | 'categorias'
  | 'letras'
  | 'modos'
  | 'layouts_tablero'
  | 'partidas'
  | 'preferencias';

export interface RegistroCerebro<T> {
  id: string;
  external_id: string | null;
  data: T;
  created_at: string;
  updated_at: string;
}

interface RespuestaLista<T> {
  total: number;
  limit: number;
  offset: number;
  records: RegistroCerebro<T>[];
}

export type MotivoFallo =
  | 'no-configurado'    // 503: faltan las env vars del proxy
  | 'auth'              // 401: key inválida o revocada
  | 'permiso'           // 403: sin scope, o el proxy bloqueó la ruta
  | 'no-encontrado'     // 404
  | 'demasiado-grande'  // 413: el registro supera 100 KB
  | 'sin-respuesta'     // 502: Cerebro no contesta
  | 'red'               // fetch falló (offline)
  | 'desconocido';

function motivoDe(status: number): MotivoFallo {
  switch (status) {
    case 401: return 'auth';
    case 403: return 'permiso';
    case 404: return 'no-encontrado';
    case 413: return 'demasiado-grande';
    case 502: return 'sin-respuesta';
    case 503: return 'no-configurado';
    default: return 'desconocido';
  }
}

/** Último motivo de fallo, por si la UI necesita avisar. */
let ultimoFallo: MotivoFallo | null = null;
export const getUltimoFallo = (): MotivoFallo | null => ultimoFallo;

/** `false` cuando ya sabemos que no vale la pena seguir intentando. */
let disponible = true;
export const cerebroDisponible = (): boolean => disponible;

function registrarFallo(motivo: MotivoFallo, ctx: string) {
  ultimoFallo = motivo;
  // Proxy sin configurar o key revocada: reintentar no va a cambiar nada
  // hasta el próximo deploy. Cortamos para no gastar requests ni ruido.
  if (motivo === 'no-configurado' || motivo === 'auth') disponible = false;
  // Un proxy sin configurar es el caso normal en desarrollo local.
  if (motivo !== 'no-configurado') console.warn(`[cerebro] ${ctx}: ${motivo}`);
}

type Resultado<T> = { ok: true; data: T } | { ok: false; motivo: MotivoFallo };

async function pedir<T>(ruta: string, init?: RequestInit): Promise<Resultado<T>> {
  try {
    const res = await fetch(`${BASE}/${ruta}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const motivo = motivoDe(res.status);
      registrarFallo(motivo, ruta);
      return { ok: false, motivo };
    }
    // Si no hay funcion serverless (dev con `vite`, o un deploy sin `api/`),
    // el fallback SPA responde 200 con el index.html. Sin este chequeo
    // intentariamos parsear HTML como JSON en cada llamada.
    const tipo = res.headers.get('content-type') ?? '';
    if (!tipo.includes('application/json')) {
      registrarFallo('no-configurado', ruta);
      return { ok: false, motivo: 'no-configurado' };
    }
    ultimoFallo = null;
    return { ok: true, data: (await res.json()) as T };
  } catch {
    registrarFallo('red', ruta);
    return { ok: false, motivo: 'red' };
  }
}

/** Lista una colección entera, paginando (Cerebro corta en 200 por página). */
async function listar<T>(coleccion: Coleccion): Promise<RegistroCerebro<T>[]> {
  const out: RegistroCerebro<T>[] = [];
  const limit = 200;
  let offset = 0;
  // Tope de seguridad: 10 páginas = 2000 registros. Ninguna colección de esta
  // app se acerca; el límite evita un bucle infinito si `total` miente.
  for (let pagina = 0; pagina < 10; pagina++) {
    const r = await pedir<RespuestaLista<T>>(`${coleccion}?limit=${limit}&offset=${offset}`);
    if (!r.ok) return out;
    out.push(...r.data.records);
    offset += limit;
    if (out.length >= r.data.total || r.data.records.length === 0) break;
  }
  return out;
}

async function obtener<T>(coleccion: Coleccion, externalId: string): Promise<T | null> {
  const r = await pedir<RegistroCerebro<T>>(`${coleccion}/${encodeURIComponent(externalId)}`);
  return r.ok ? r.data.data : null;
}

/** Upsert por `external_id`: reenviar lo mismo actualiza, no duplica. */
async function guardar(coleccion: Coleccion, externalId: string, data: unknown): Promise<boolean> {
  const r = await pedir<unknown>(coleccion, {
    method: 'POST',
    body: JSON.stringify({ external_id: externalId, data }),
  });
  return r.ok;
}

/** Quita las claves undefined: Cerebro valida opcionalidad por presencia. */
function limpiar<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

// ---------------------------------------------------------------------------
// Contenido de referencia (solo lectura)
//
// Cerebro es la fuente preferida; `src/data/` queda como respaldo. Eso permite
// rebalancear dificultad o corregir textos sin redeploy, sin que la app
// dependa de la red para arrancar.
// ---------------------------------------------------------------------------

/** En Cerebro el `id` de la app vive en `external_id`, no dentro de `data`. */
function conId<T extends { id: string }>(regs: RegistroCerebro<Omit<T, 'id'>>[]): T[] {
  return regs
    .filter((r) => r.external_id)
    .map((r) => ({ ...r.data, id: r.external_id! }) as T);
}

export async function traerCategorias(): Promise<Categoria[] | null> {
  if (!disponible) return null;
  const regs = await listar<Omit<Categoria, 'id'>>('categorias');
  return regs.length ? conId<Categoria>(regs) : null;
}

export async function traerLetras(): Promise<Letra[] | null> {
  if (!disponible) return null;
  const regs = await listar<Omit<Letra, 'id'>>('letras');
  return regs.length ? conId<Letra>(regs) : null;
}

export async function traerModos(): Promise<Modo[] | null> {
  if (!disponible) return null;
  const regs = await listar<Omit<Modo, 'id'>>('modos');
  return regs.length ? conId<Modo>(regs) : null;
}

export async function traerLayouts(): Promise<BoardLayoutDef[] | null> {
  if (!disponible) return null;
  const regs = await listar<Omit<BoardLayoutDef, 'id'>>('layouts_tablero');
  return regs.length ? conId<BoardLayoutDef>(regs) : null;
}

// ---------------------------------------------------------------------------
// Partidas (solo escritura desde el juego; el historial se lee en Cerebro)
// ---------------------------------------------------------------------------

/** Campos de `partidas` tal como los define la colección en Cerebro. */
interface PartidaRemota {
  modo_slug: string;
  jugadores: unknown;
  fase: string;
  turno_indice: number;
  timer_segundos: number;
  iniciada_en: string;
  finalizada_en?: string;
  categoria_actual_id?: string;
  letra_activa?: string;
  letras_usadas?: string[];
  limite_cartas?: number;
  cartas_resueltas?: number;
  layout_id?: string;
  casillas?: string[];
  ganador_nombre?: string;
}

const iso = (ms: number) => new Date(ms).toISOString();

function mapearClasico(s: GameSnapshot, finalizada: boolean): PartidaRemota {
  const ganador = finalizada
    ? [...s.players].sort((a, b) => b.puntaje - a.puntaje)[0]
    : undefined;
  return limpiar({
    modo_slug: 'clasico',
    jugadores: s.players.map((p) => ({ nombre: p.nombre, puntaje: p.puntaje })),
    fase: s.phase,
    turno_indice: s.turnIndex,
    timer_segundos: s.timerSeconds,
    iniciada_en: iso(s.startedAt),
    finalizada_en: finalizada ? iso(Date.now()) : undefined,
    categoria_actual_id: s.currentCategory?.id,
    letra_activa: s.activeLetter ?? undefined,
    letras_usadas: s.usedLetters.length ? s.usedLetters : undefined,
    limite_cartas: s.letterLimit ?? undefined,
    cartas_resueltas: s.cardsResolved,
    ganador_nombre: ganador?.nombre,
  });
}

function mapearTablero(s: BoardSnapshot, finalizada: boolean): PartidaRemota {
  const ganador = s.winnerId ? s.players.find((p) => p.id === s.winnerId) : undefined;
  return limpiar({
    modo_slug: '1000-nombres',
    jugadores: s.players.map((p) => ({
      nombre: p.nombre,
      puntaje: p.puntaje,
      color: p.color,
      position: p.position,
    })),
    fase: s.phase,
    turno_indice: s.turnIndex,
    timer_segundos: s.timerSeconds,
    iniciada_en: iso(s.startedAt),
    finalizada_en: finalizada ? iso(Date.now()) : undefined,
    categoria_actual_id: s.currentCategory?.id,
    layout_id: s.layoutId,
    // El layout `aleatorio` sortea sus letras al empezar: sin guardar el
    // tablero concreto, la partida no se puede reconstruir después.
    casillas: s.boardLetters,
    ganador_nombre: ganador?.nombre,
  });
}

/**
 * Sube una partida. `gameId` es el external_id: reenviar la misma partida
 * actualiza el registro en vez de duplicarlo.
 *
 * PRIVACIDAD: `jugadores` incluye los nombres que la gente escribió, que hoy
 * no salen del dispositivo. Quien llama decide si esto corre — ver
 * `sincronizarPartidas` en las preferencias.
 */
export async function subirPartidaClasico(
  gameId: string,
  snap: GameSnapshot,
  finalizada: boolean,
): Promise<boolean> {
  if (!disponible) return false;
  return guardar('partidas', gameId, mapearClasico(snap, finalizada));
}

export async function subirPartidaTablero(
  gameId: string,
  snap: BoardSnapshot,
  finalizada: boolean,
): Promise<boolean> {
  if (!disponible) return false;
  return guardar('partidas', gameId, mapearTablero(snap, finalizada));
}

// ---------------------------------------------------------------------------
// Preferencias
// ---------------------------------------------------------------------------

interface PreferenciasRemotas {
  sonido: boolean;
  vibracion: boolean;
  reducir_movimiento?: boolean;
}

export async function traerPreferencias(instalacionId: string): Promise<Partial<Prefs> | null> {
  if (!disponible) return null;
  const d = await obtener<PreferenciasRemotas>('preferencias', instalacionId);
  if (!d) return null;
  return {
    sonido: d.sonido,
    vibracion: d.vibracion,
    reducirMovimiento: d.reducir_movimiento ?? null,
  };
}

export async function subirPreferencias(instalacionId: string, prefs: Prefs): Promise<boolean> {
  if (!disponible) return false;
  // Solo los tres campos que existen en la colección. `sincronizarPartidas`
  // es una decisión local del dispositivo y no se sube.
  return guardar(
    'preferencias',
    instalacionId,
    limpiar({
      sonido: prefs.sonido,
      vibracion: prefs.vibracion,
      reducir_movimiento: prefs.reducirMovimiento ?? undefined,
    }),
  );
}
