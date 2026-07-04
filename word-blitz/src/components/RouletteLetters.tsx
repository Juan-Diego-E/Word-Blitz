// Ruleta de letras: cicla caracteres y se clava en la letra activa.
import { useEffect, useState } from 'react';
import { getLetras } from '../lib/content';
import { useSettingsStore } from '../store/settingsStore';
import './RouletteLetters.css';

interface Props {
  /** Letra final. Si es null, la ruleta está en reposo. */
  letter: string | null;
  /** true mientras "gira" (fase spinning). */
  spinning: boolean;
  /** Callback al terminar la animación de giro. */
  onSettled?: () => void;
  size?: 'control' | 'tv';
}

const SPIN_MS = 1600;
const TICK_MS = 70;

export function RouletteLetters({ letter, spinning, onSettled, size = 'control' }: Props) {
  const [shown, setShown] = useState<string>(letter ?? '?');
  const motionReduced = useSettingsStore((s) => s.motionReduced)();

  useEffect(() => {
    if (!spinning) {
      setShown(letter ?? '?');
      return;
    }
    if (motionReduced) {
      setShown(letter ?? '?');
      const t = window.setTimeout(() => onSettled?.(), 200);
      return () => window.clearTimeout(t);
    }
    const pool = getLetras().map((l) => l.caracter);
    const started = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - started >= SPIN_MS) {
        window.clearInterval(id);
        setShown(letter ?? '?');
        onSettled?.();
        return;
      }
      setShown(pool[Math.floor(Math.random() * pool.length)]);
    }, TICK_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, letter]);

  return (
    <div
      className={`roulette roulette--${size} ${spinning ? 'roulette--spinning' : ''} ${
        letter && !spinning ? 'roulette--settled' : ''
      }`}
      role="img"
      aria-label={letter && !spinning ? `Letra activa: ${letter}` : 'Ruleta de letras'}
    >
      <span className="roulette__letter" aria-hidden="true">
        {shown}
      </span>
    </div>
  );
}
