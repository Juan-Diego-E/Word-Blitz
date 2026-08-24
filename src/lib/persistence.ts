// IndexedDB (categorías custom, partida en curso) + localStorage (preferencias).
import type { BoardSnapshot, Categoria, GameSnapshot } from '../types';

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

export interface Prefs {
  sonido: boolean;
  vibracion: boolean;
  reducirMovimiento: boolean | null; // null = seguir al sistema
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { sonido: true, vibracion: true, reducirMovimiento: null, ...JSON.parse(raw) };
  } catch {
    /* noop */
  }
  return { sonido: true, vibracion: true, reducirMovimiento: null };
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* noop */
  }
}
