// IndexedDB (categorías custom, partida en curso) + localStorage (preferencias).
import type { BoardSnapshot, Categoria, GameSnapshot, TemaId } from '../types';

const DB_NAME = 'word-blitz';
// v2 agrega el store `tablero` para el Modo 1000 Nombres.
const DB_VERSION = 2;
const STORE_CATS = 'categoriasCustom';
const STORE_GAME = 'partida';
const STORE_BOARD = 'tablero';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CATS)) {
        db.createObjectStore(STORE_CATS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_GAME)) {
        db.createObjectStore(STORE_GAME);
      }
      if (!db.objectStoreNames.contains(STORE_BOARD)) {
        db.createObjectStore(STORE_BOARD);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

// --- Categorías custom ---
export const getCategoriasCustom = (): Promise<Categoria[]> =>
  tx(STORE_CATS, 'readonly', (s) => s.getAll() as IDBRequest<Categoria[]>).catch(() => []);

export const saveCategoriaCustom = (c: Categoria): Promise<unknown> =>
  tx(STORE_CATS, 'readwrite', (s) => s.put(c));

export const deleteCategoriaCustom = (id: string): Promise<unknown> =>
  tx(STORE_CATS, 'readwrite', (s) => s.delete(id));

// --- Partida en curso ---
const GAME_KEY = 'actual';

export const saveGameSnapshot = (snap: GameSnapshot): Promise<unknown> =>
  tx(STORE_GAME, 'readwrite', (s) => s.put(snap, GAME_KEY)).catch(() => undefined);

export const loadGameSnapshot = (): Promise<GameSnapshot | undefined> =>
  tx(STORE_GAME, 'readonly', (s) => s.get(GAME_KEY) as IDBRequest<GameSnapshot | undefined>).catch(
    () => undefined,
  );

export const clearGameSnapshot = (): Promise<unknown> =>
  tx(STORE_GAME, 'readwrite', (s) => s.delete(GAME_KEY)).catch(() => undefined);

// --- Partida en curso del Modo 1000 Nombres ---
const BOARD_KEY = 'actual';

export const saveBoardSnapshot = (snap: BoardSnapshot): Promise<unknown> =>
  tx(STORE_BOARD, 'readwrite', (s) => s.put(snap, BOARD_KEY)).catch(() => undefined);

export const loadBoardSnapshot = (): Promise<BoardSnapshot | undefined> =>
  tx(STORE_BOARD, 'readonly', (s) => s.get(BOARD_KEY) as IDBRequest<BoardSnapshot | undefined>).catch(
    () => undefined,
  );

export const clearBoardSnapshot = (): Promise<unknown> =>
  tx(STORE_BOARD, 'readwrite', (s) => s.delete(BOARD_KEY)).catch(() => undefined);

// --- Preferencias (localStorage) ---
const PREFS_KEY = 'wb-prefs';
const INSTALL_KEY = 'wb-instalacion';

export interface Prefs {
  sonido: boolean;
  vibracion: boolean;
  reducirMovimiento: boolean | null; // null = seguir al sistema
  /**
   * Subir el historial de partidas a Cerebro. Arranca APAGADO a propósito:
   * el array de jugadores lleva los nombres que la gente escribió, y hoy esos
   * nombres no salen del dispositivo. Encenderlo es un cambio de
   * comportamiento del producto, así que lo decide la persona, no el deploy.
   * Vive solo acá: no existe como campo en la colección `preferencias`.
   */
  sincronizarPartidas: boolean;
  /**
   * Tema visual. Vive solo acá, como `sincronizarPartidas`: no existe como
   * campo en la colección `preferencias` de Cerebro y no se manda al proxy,
   * porque agregar campos a un esquema remoto no es algo que decida el
   * cliente. Se sincroniza con la TV por el canal de sala, que es donde hace
   * falta.
   */
  tema: TemaId;
}

const DEFAULTS: Prefs = {
  sonido: true,
  vibracion: true,
  reducirMovimiento: null,
  sincronizarPartidas: false,
  tema: 'claro',
};

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const guardado = JSON.parse(raw) as Partial<Prefs>;
      return {
        ...DEFAULTS,
        // Solo se aceptan claves conocidas y del tipo correcto: lo que hay en
        // localStorage lo puede editar cualquiera desde DevTools.
        sonido: typeof guardado.sonido === 'boolean' ? guardado.sonido : DEFAULTS.sonido,
        vibracion:
          typeof guardado.vibracion === 'boolean' ? guardado.vibracion : DEFAULTS.vibracion,
        reducirMovimiento:
          typeof guardado.reducirMovimiento === 'boolean' ? guardado.reducirMovimiento : null,
        sincronizarPartidas: guardado.sincronizarPartidas === true,
        tema: guardado.tema === 'oscuro' ? 'oscuro' : DEFAULTS.tema,
      };
    }
  } catch {
    /* noop */
  }
  return { ...DEFAULTS };
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* noop */
  }
}

/**
 * ID de esta instalación: es el external_id con el que se guardan las
 * preferencias en Cerebro. No identifica a una persona, solo a un navegador,
 * y se genera al primer uso.
 */
export function getInstalacionId(): string {
  try {
    const guardado = localStorage.getItem(INSTALL_KEY);
    if (guardado) return guardado;
    const nuevo = crypto.randomUUID();
    localStorage.setItem(INSTALL_KEY, nuevo);
    return nuevo;
  } catch {
    // Modo privado sin storage: un id efímero es mejor que romper.
    return crypto.randomUUID();
  }
}
