// IndexedDB (categorías custom, partida en curso) + localStorage (preferencias).
import type { Categoria, GameSnapshot } from '../types';

const DB_NAME = 'word-blitz';
const DB_VERSION = 1;
const STORE_CATS = 'categoriasCustom';
const STORE_GAME = 'partida';

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
