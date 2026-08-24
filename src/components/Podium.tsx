// Ranking con puntaje real. Compacto (control) o grande (TV / final).
import type { Player } from '../types';
import './Podium.css';

interface Props {
  players: Player[];
  currentPlayerId?: string;
  size?: 'control' | 'tv';
  title?: string;
}

export function Podium({ players, currentPlayerId, size = 'control', title }: Props) {
  const sorted = [...players].sort((a, b) => b.puntaje - a.puntaje);
  return (
    <section className={`podium podium--${size} glass`} aria-label={title ?? 'Ranking'}>
      {title && <h2 className="podium__title">{title}</h2>}
      <ol className="podium__list">
        {sorted.map((p, i) => (
          <li
            key={p.id}
            className={`podium__row ${p.id === currentPlayerId ? 'podium__row--current' : ''}`}
          >
            <span
              className={`podium__pos ${i < 3 ? `podium__pos--${i + 1}` : ''}`}
              aria-label={`Puesto ${i + 1}`}
            >
              {i + 1}
            </span>
            <span className="podium__name">{p.nombre}</span>
            <span className="podium__score" aria-label={`${p.puntaje} puntos`}>
              {p.puntaje}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
