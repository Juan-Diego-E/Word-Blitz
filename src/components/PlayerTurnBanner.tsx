import './PlayerTurnBanner.css';

interface Props {
  nombre: string;
  size?: 'control' | 'tv';
}

export function PlayerTurnBanner({ nombre, size = 'control' }: Props) {
  return (
    <p className={`turn-banner turn-banner--${size}`} aria-live="polite">
      Turno de <strong>{nombre}</strong>
    </p>
  );
}
