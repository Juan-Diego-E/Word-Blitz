// SÍ / NO del moderador, con feedback de color y vibración opcional.
import { useSettingsStore } from '../store/settingsStore';
import './JudgementButtons.css';

interface Props {
  onJudge(acierto: boolean): void;
  disabled?: boolean;
}

export function JudgementButtons({ onJudge, disabled }: Props) {
  const vibracion = useSettingsStore((s) => s.vibracion);
  const judge = (ok: boolean) => {
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
        <span aria-hidden="true">✕</span> No
      </button>
      <button
        type="button"
        className="judgement__btn judgement__btn--si"
        onClick={() => judge(true)}
        disabled={disabled}
      >
        <span aria-hidden="true">✓</span> ¡Sí!
      </button>
    </div>
  );
}
