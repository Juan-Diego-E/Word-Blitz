// Cuenta regresiva basada en deadline (epoch ms) — sin drift y con cleanup
// correcto: un solo interval por deadline, siempre limpiado al desmontar o
// al cambiar de ronda (arregla el bug de intervalos apilados).
import { useEffect, useRef, useState } from 'react';

export function useTimer(deadline: number | null, onExpire?: () => void) {
  const [remainingMs, setRemainingMs] = useState<number | null>(
    deadline ? Math.max(0, deadline - Date.now()) : null,
  );
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (deadline == null) {
      setRemainingMs(null);
      return;
    }
    expiredRef.current = false;
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setRemainingMs(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [deadline]);

  const seconds = remainingMs == null ? null : Math.ceil(remainingMs / 1000);
  return { remainingMs, seconds };
}
