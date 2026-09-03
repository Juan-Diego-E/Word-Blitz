// Cuenta regresiva basada en deadline (epoch ms) — sin drift y con cleanup
// correcto: un solo interval por deadline, siempre limpiado al desmontar o
// al cambiar de ronda (arregla el bug de intervalos apilados).
//
// El interval sigue en 100ms para que la expiración sea puntual, pero el
// ESTADO guarda el segundo mostrado, no los milisegundos: así el componente
// re-renderiza una vez por segundo en vez de diez. Con el timer corriendo,
// cada render repintaba la vista entera de la partida —incluida la carta y
// el podio—, que es lo último que uno quiere estar haciendo mientras corre
// el reloj. `setSeconds` con el mismo valor no dispara render: React sale
// antes por igualdad.
import { useEffect, useRef, useState } from 'react';

const secondsLeft = (deadline: number) => Math.ceil(Math.max(0, deadline - Date.now()) / 1000);

export function useTimer(deadline: number | null, onExpire?: () => void) {
  const [seconds, setSeconds] = useState<number | null>(
    deadline ? secondsLeft(deadline) : null,
  );
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (deadline == null) {
      setSeconds(null);
      return;
    }
    expiredRef.current = false;
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      const s = Math.ceil(left / 1000);
      setSeconds((prev) => (prev === s ? prev : s));
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [deadline]);

  return { seconds };
}
