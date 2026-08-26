// La whitelist del proxy es lo único que impide que alguien que descubra
// /api/cerebro/ use nuestra API key para lo que quiera. Estos tests fijan
// qué pasa y qué no.
import { describe, expect, it } from 'vitest';
import { evaluarRuta, filtrarQuery } from '../../api/cerebro/[...path]';

describe('proxy de Cerebro — lo que deja pasar', () => {
  it('permite leer el contenido de referencia', () => {
    for (const col of ['categorias', 'letras', 'modos', 'layouts_tablero']) {
      expect(evaluarRuta([col], 'GET').ok).toBe(true);
    }
  });

  it('permite escribir partidas y leer/escribir preferencias', () => {
    expect(evaluarRuta(['partidas'], 'POST').ok).toBe(true);
    expect(evaluarRuta(['preferencias'], 'GET').ok).toBe(true);
    expect(evaluarRuta(['preferencias'], 'POST').ok).toBe(true);
  });

  it('arma la ruta de un registro puntual desde el external_id', () => {
    const v = evaluarRuta(['preferencias'], 'GET', 'abc-123');
    expect(v.ok).toBe(true);
    expect(v.ruta).toBe('preferencias/abc-123');
  });

  it('acepta el metodo en minusculas', () => {
    expect(evaluarRuta(['categorias'], 'get').ok).toBe(true);
  });
});

describe('proxy de Cerebro — lo que bloquea', () => {
  it('no deja escribir el contenido de referencia', () => {
    // La app no crea categorias desde la UI: abrir POST seria regalar
    // capacidad de escritura sin que nadie la use.
    for (const col of ['categorias', 'letras', 'modos', 'layouts_tablero']) {
      expect(evaluarRuta([col], 'POST')).toMatchObject({ ok: false, status: 405 });
      expect(evaluarRuta([col], 'DELETE')).toMatchObject({ ok: false, status: 405 });
    }
  });

  it('no deja borrar nada, en ninguna coleccion', () => {
    for (const col of ['partidas', 'preferencias', 'categorias']) {
      expect(evaluarRuta([col], 'DELETE')).toMatchObject({ ok: false, status: 405 });
    }
  });

  it('no deja leer el historial de partidas desde el cliente', () => {
    // Se escribe desde el juego; leerlo es tarea del dashboard de Cerebro.
    expect(evaluarRuta(['partidas'], 'GET')).toMatchObject({ ok: false, status: 405 });
  });

  it('rechaza colecciones que no estan en la whitelist', () => {
    for (const col of ['usuarios', 'admin', 'cerebro', '', 'Categorias']) {
      expect(evaluarRuta([col], 'GET')).toMatchObject({ ok: false, status: 403 });
    }
  });

  it('rechaza rutas vacias o de mas de un segmento', () => {
    expect(evaluarRuta([], 'GET')).toMatchObject({ ok: false, status: 400 });
    expect(evaluarRuta(['partidas', 'x'], 'POST')).toMatchObject({ ok: false, status: 400 });
  });

  it('no permite escapar de la app via path traversal en el id', () => {
    const v = evaluarRuta(['preferencias'], 'GET', '../../otra-app/secretos');
    expect(v.ok).toBe(true);
    expect(v.ruta).not.toContain('/../');
    expect(v.ruta).toBe('preferencias/..%2F..%2Fotra-app%2Fsecretos');
  });
});

describe('proxy de Cerebro — filtrado de query', () => {
  it('deja pasar solo paginado y filtros por igualdad', () => {
    const qs = filtrarQuery({ limit: '50', offset: '0', 'where[slug]': 'animales' });
    expect(qs).toContain('limit=50');
    expect(qs).toContain('offset=0');
    expect(qs).toContain('where%5Bslug%5D=animales');
  });

  it('descarta los params internos del proxy', () => {
    // `path` lo inyecta Vercel y `external_id` ya se resolvio en la ruta:
    // reenviarlos ensuciaria la llamada upstream.
    expect(filtrarQuery({ path: ['preferencias'], external_id: 'abc' })).toBe('');
  });

  it('descarta cualquier otro param', () => {
    expect(filtrarQuery({ admin: 'true', select: '*', 'DROP TABLE': '1' })).toBe('');
  });

  it('devuelve string vacio cuando no hay nada que reenviar', () => {
    expect(filtrarQuery({})).toBe('');
  });
});
