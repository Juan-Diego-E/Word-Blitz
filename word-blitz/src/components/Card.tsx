// Carta que voltea: reverso con logo → categoría al frente.
import type { Categoria } from '../types';
import { Icon } from './Icon';
import logo from '../assets/logo.png';
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
        <img src={logo} alt="" className="card__logo" width={140} height={140} />
        {onFlip && <span className="card__hint">Tocá para voltear</span>}
      </div>
      <div className="card__face card__face--front" aria-hidden={!flipped}>
        {category && (
          <>
            <Icon name={category.icono} className="card__icon" size="1em" />
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
