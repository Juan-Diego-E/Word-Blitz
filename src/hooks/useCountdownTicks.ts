// Dispara el tic del reloj en cada segundo nuevo de los últimos `desde`
// segundos de la cuenta regresiva. Reutilizado por las dos vistas de juego
// para no duplicar la lógica.
import { useEffect, useRef } from 'react';
import { play } from '../lib/sound';

export function useCountdownTicks(seconds: number | null, desde = 5) {
  const anterior = useRef<number | null>(null);

  useEffect(() => {
    const s = seconds;
    const prev = anterior.current;
    anterior.current = s;
    // Solo al CRUZAR a un segundo nuevo dentro de la ventana final: evita
    // repetir el tic en cada frame del intervalo de 100ms.
    if (s == null || prev == null) return;
    if (s !== prev && s > 0 && s <= desde) play('tick');
  }, [seconds, desde]);
}
