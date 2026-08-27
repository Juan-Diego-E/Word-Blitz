// Aplica un tema visual de modo (p. ej. "orbita") a toda la app mientras
// alguna vista del modo esté montada, y lo quita al salir del modo. La
// transición suave del fondo vive en global.css (`body { transition }` +
// `.orbita-veil`).
//
// Usa un refcount por tema para no romperse con StrictMode (que monta/limpia
// /monta) ni al navegar entre dos vistas del mismo modo (config → partida):
// el atributo solo se borra cuando NINGUNA vista del modo sigue montada.
import { useEffect } from 'react';

const refs = new Map<string, number>();

export function useModoTheme(modo: string | null) {
  useEffect(() => {
    if (!modo) return;
    const root = document.documentElement;
    refs.set(modo, (refs.get(modo) ?? 0) + 1);
    root.dataset.modo = modo;
    return () => {
      const n = (refs.get(modo) ?? 1) - 1;
      if (n <= 0) {
        refs.delete(modo);
        if (root.dataset.modo === modo) delete root.dataset.modo;
      } else {
        refs.set(modo, n);
      }
    };
  }, [modo]);
}
