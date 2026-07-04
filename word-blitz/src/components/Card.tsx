// Carta que voltea: reverso con logo → categoría al frente.
import type { Categoria } from '../types';
import './Card.css';

interface Props {
  category: Pick<Categoria, 'nombre' | 'icono' | 'descripcion'> | null;
  /** true cuando la categoría está a la vista. */
  flipped: boolean;
  /** Voltear (solo vista control, fase idle). */
  onFlip?: () => void;
  disabled?: boolean;
  size?: 'control' | 'tv';
}

export function Card({ category, flipped, onFlip, disabled, size = 'control' }: Props) {
  const inner = (
    <div className={`card__inner ${flipped ? 'card__inner--flipped' : ''}`}>
      <div className="card__face card__face--back" aria-hidden={flipped}>
        <span className="card__logo">WB</span>
        {onFlip && <span className="card__hint">Tocá para voltear</span>}
      </div>
      <div className="card__face card__face--front" aria-hidden={!flipped}>
        {category && (
          <>
            <span className="card__icon" aria-hidden="true">{category.icono}</span>
            <span className="card__category">{category.nombre}</span>
            {category.descripcion && <span className="card__desc">{category.descripcion}</span>}
          </>
        )}
      </div>
    </div>
  );

  if (onFlip) {
    return (
      <button
        type="button"
        className={`card card--${size}`}
        onClick={onFlip}
        disabled={disabled || flipped}
        aria-label={flipped && category ? `Categoría: ${category.nombre}` : 'Voltear la carta'}
      >
        {inner}
      </button>
    );
  }
  return (
    <div
      className={`card card--${size}`}
      role="img"
      aria-label={flipped && category ? `Categoría: ${category.nombre}` : 'Carta boca abajo'}
    >
      {inner}
    </div>
  );
}
