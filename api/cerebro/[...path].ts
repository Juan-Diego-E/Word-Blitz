// Proxy server-to-server hacia Cerebro.
//
// POR QUE EXISTE: Word Blitz es una SPA de Vite sin backend. La API key de
// Cerebro es server-to-server; si el cliente la usara directamente quedaria
// embebida en el bundle y seria legible desde DevTools. Esta funcion corre en
// el servidor de Vercel, guarda la key y reenvia.
//
// La whitelist NO es decorativa: sin ella, cualquiera que descubra
// /api/cerebro/ puede usar la key para lo que quiera. Solo estan las
// colecciones y los metodos que la app realmente ejerce.
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CEREBRO_URL = process.env.CEREBRO_URL;
const CEREBRO_API_KEY = process.env.CEREBRO_API_KEY; // sin prefijo de build
const APP_SLUG = process.env.CEREBRO_APP_SLUG ?? 'word-blitz';

// Derivada del uso real del repo, no del estado de las colecciones:
//
// - categorias/letras/modos/layouts_tablero: contenido de referencia que la
//   app solo lee al arrancar. `addCategoriaCustom()` existe en content.ts
//   pero ninguna vista la llama, asi que NO se abre POST.
// - partidas: la app solo escribe historial (POST hace upsert por
//   external_id, con lo cual PUT es redundante). Leerlas es tarea del
//   dashboard de Cerebro, no del juego.
// - preferencias: se leen para restaurar ajustes en un dispositivo nuevo y
//   se escriben cuando cambian.
const ALLOW: Record<string, readonly string[]> = {
  categorias: ['GET'],
  layouts_tablero: ['GET'],
  letras: ['GET'],
  modos: ['GET'],
  partidas: ['POST'],
  preferencias: ['GET', 'POST'],
};

/** Cerebro corta en 100 KB por registro; cortamos antes para no gastar la llamada. */
const MAX_BODY_BYTES = 100 * 1024;

export interface Veredicto {
  ok: boolean;
  /** Status a devolver cuando `ok` es false. */
  status: number;
  /** Mensaje para el cliente cuando `ok` es false. */
  error?: string;
  /** Ruta ya codificada para pegarle a Cerebro, cuando `ok` es true. */
  ruta?: string;
}

/**
 * Decide si una ruta+metodo pueden pasar. Pura y exportada a proposito: es la
 * parte que hace que el proxy proteja algo, asi que tiene tests propios
 * (src/__tests__/proxyCerebro.test.ts).
 */
export function evaluarRuta(segments: string[], method: string): Veredicto {
  const [collection, ...rest] = segments;
  const m = method.toUpperCase();

  const allowed = collection ? ALLOW[collection] : undefined;
  if (!allowed) return { ok: false, status: 403, error: 'Coleccion no permitida' };
  if (!allowed.includes(m)) return { ok: false, status: 405, error: m + ' no permitido aca' };
  // Como maximo /{coleccion}/{external_id}.
  if (rest.length > 1) return { ok: false, status: 400, error: 'Ruta invalida' };

  return {
    ok: true,
    status: 200,
    ruta: [collection, ...rest].map(encodeURIComponent).join('/'),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!CEREBRO_URL || !CEREBRO_API_KEY) {
    // Sin configurar no es un error del cliente: la app degrada a datos locales.
    return res.status(503).json({ error: 'Proxy sin configurar' });
  }
  if (req.method === 'OPTIONS') return res.status(204).end();

  const segments = ([] as string[]).concat((req.query.path as string[]) ?? []);
  const method = (req.method ?? 'GET').toUpperCase();

  const veredicto = evaluarRuta(segments, method);
  if (!veredicto.ok) {
    return res.status(veredicto.status).json({ error: veredicto.error ?? 'Rechazado' });
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    body = JSON.stringify(req.body ?? {});
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Registro demasiado grande' });
    }
  }

  const qs = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = `${CEREBRO_URL}/api/apps/${APP_SLUG}/${veredicto.ruta ?? ''}${qs}`;

  try {
    const upstream = await fetch(target, {
      method,
      headers: {
        Authorization: `Bearer ${CEREBRO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Nunca cachear: la respuesta se obtuvo con una credencial compartida.
    res.setHeader('Cache-Control', 'no-store, private');
    return res.send(text);
  } catch (e) {
    // El detalle queda en el log del servidor; al cliente solo el 502.
    console.error('[proxy cerebro]', e);
    return res.status(502).json({ error: 'Cerebro no responde' });
  }
}
