// Cuenta regresiva circular. Recibe segundos ya calculados (useTimer vive en la vista).
import './TimerRing.css';

interface Props {
  seconds: number | null;
  totalSeconds: number;
  size?: 'control' | 'tv';
}

export function TimerRing({ seconds, totalSeconds, size = 'control' }: Props) {
  const px = size === 'tv' ? 160 : 76;
  const stroke = size === 'tv' ? 10 : 6;
  const r = (px - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const frac = seconds == null ? 1 : Math.max(0, Math.min(1, seconds / totalSeconds));
  const urgent = seconds != null && seconds <= 5;

  return (
    <div
      className={`timer-ring timer-ring--${size} ${urgent ? 'timer-ring--urgent' : ''}`}
      role="timer"
      aria-live={urgent ? 'assertive' : 'off'}
      aria-label={seconds == null ? 'Temporizador detenido' : `${seconds} segundos restantes`}
    >
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-hidden="true">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="var(--color-white-22)" strokeWidth={stroke} />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke={urgent ? 'var(--color-red)' : 'var(--color-blue-air)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          transform={`rotate(-90 ${px / 2} ${px / 2})`}
          className="timer-ring__progress"
        />
      </svg>
      <span className="timer-ring__value">{seconds ?? '–'}</span>
    </div>
  );
}
