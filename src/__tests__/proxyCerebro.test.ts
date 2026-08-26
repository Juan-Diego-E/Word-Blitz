// La whitelist del proxy es lo único que impide que alguien que descubra
// /api/cerebro/ use nuestra API key para lo que quiera. Estos tests fijan
// qué pasa y qué no.
import { describe, expect, it } from 'vitest';
import { evaluarRuta } from '../../api/cerebro/[...path]';

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

  it('permite /{coleccion}/{external_id} y lo codifica', () => {
    const v = evaluarRuta(['preferencias', 'abc-123'], 'GET');
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.ruta).toBe('preferencias/abc-123');
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

  it('rechaza una ruta vacia', () => {
    expect(evaluarRuta([], 'GET')).toMatchObject({ ok: false, status: 403 });
  });

  it('rechaza rutas mas profundas que /{coleccion}/{id}', () => {
    expect(evaluarRuta(['partidas', 'a', 'b'], 'POST')).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it('no permite escapar de la app via path traversal', () => {
    // Aunque se cuele, encodeURIComponent lo neutraliza: nunca sale del
    // prefijo /api/apps/word-blitz/.
    const v = evaluarRuta(['preferencias', '../../otra-app/secretos'], 'GET');
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.ruta).not.toContain('/../');
      expect(v.ruta).toBe('preferencias/..%2F..%2Fotra-app%2Fsecretos');
    }
  });
});
