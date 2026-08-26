// Confeti de victoria. Canvas propio, sin librerías: unas 40 partículas con
// gravedad y rotación, que caen una vez y se desvanecen. Se salta entero si
// el usuario pidió reducir movimiento.
import { useEffect, useRef } from 'react';
import { PAWN_COLORS } from '../types';
import { useSettingsStore } from '../store/settingsStore';

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  color: string;
  size: number;
}

const COLORES = [...PAWN_COLORS, '#ffffff'];
const DURACION_MS = 2600;

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionReduced = useSettingsStore((s) => s.motionReduced)();

  useEffect(() => {
    if (motionReduced) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Se lanzan desde el borde superior, con impulso hacia abajo y a los lados.
    const N = Math.round(Math.min(60, w / 8));
    const parts: Particula[] = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.3,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
      size: 6 + Math.random() * 6,
    }));

    const inicio = performance.now();
    let raf = 0;

    const frame = (t: number) => {
      const transcurrido = t - inicio;
      const alpha = Math.max(0, 1 - transcurrido / DURACION_MS);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = alpha;

      for (const p of parts) {
        p.vy += 0.05; // gravedad
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (transcurrido < DURACION_MS) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [motionReduced]);

  if (motionReduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
