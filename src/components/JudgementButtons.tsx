// SÍ / NO del moderador, con feedback de color, sonido y vibración opcional.
import { Check, X } from 'lucide-react';
import { play } from '../lib/sound';
import { useSettingsStore } from '../store/settingsStore';
import './JudgementButtons.css';

interface Props {
  onJudge(acierto: boolean): void;
  disabled?: boolean;
}

export function JudgementButtons({ onJudge, disabled }: Props) {
  const vibracion = useSettingsStore((s) => s.vibracion);
  const judge = (ok: boolean) => {
    // El resultado se conoce acá, así que el sonido de acierto/error sale de
    // este punto. Los sonidos de fase (flip, chicharra, victoria) los maneja
    // src/lib/soundEffects.ts.
    play(ok ? 'acierto' : 'error');
    if (vibracion && 'vibrate' in navigator) navigator.vibrate(ok ? 40 : [30, 40, 30]);
    onJudge(ok);
  };
  return (
    <div className="judgement" role="group" aria-label="Juzgar respuesta">
      <button
        type="button"
        className="judgement__btn judgement__btn--no"
        onClick={() => judge(false)}
        disabled={disabled}
      >
        <X aria-hidden="true" strokeWidth={3} /> No
      </button>
      <button
        type="button"
        className="judgement__btn judgement__btn--si"
        onClick={() => judge(true)}
        disabled={disabled}
      >
        <Check aria-hidden="true" strokeWidth={3} /> ¡Sí!
      </button>
    </div>
  );
}
