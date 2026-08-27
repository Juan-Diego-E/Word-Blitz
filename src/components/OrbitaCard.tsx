// Carta del Modo Órbita. Boca abajo muestra un reverso de misterio; al
// "descubrir" gira y revela el astro con su categoría, rareza y atributos.
// Sigue la arquitectura ganadora del documento de diseño Órbita.
import { CelestialBody } from './CelestialBody';
import type { OrbitaCard as OrbitaCardData, OrbitaRareza } from '../types';
import './OrbitaCard.css';

const RAREZA_LABEL: Record<OrbitaRareza, string> = {
  comun: 'Común',
  rara: 'Rara',
  epica: 'Épica',
  legendaria: 'Legendaria',
};

const TIPO_LABEL: Record<string, string> = {
  estrella: 'Estrella',
  planeta: 'Planeta',
  satelite: 'Satélite',
  menor: 'Cuerpo menor',
};

interface Props {
  card: OrbitaCardData | null;
  /** true cuando el astro está a la vista (revelado). */
  flipped: boolean;
  /** Voltear (fase idle). */
  onFlip?: () => void;
  disabled?: boolean;
  size?: 'control' | 'tv';
}

export function OrbitaCard({ card, flipped, onFlip, disabled, size = 'control' }: Props) {
  const inner = (
    <div className={`ocard__inner ${flipped ? 'ocard__inner--flipped' : ''}`}>
      {/* Reverso: misterio */}
      <div className="ocard__face ocard__face--back" aria-hidden={flipped}>
        <span className="ocard__mystery">?</span>
        {onFlip && <span className="ocard__hint">Tocá para descubrir</span>}
      </div>

      {/* Frente: el astro */}
      <div
        className={`ocard__face ocard__face--front ocard__face--${card?.tipo ?? 'planeta'}`}
        aria-hidden={!flipped}
      >
        {card && (
          <>
            <div className="ocard__top">
              <span className="ocard__cat">{TIPO_LABEL[card.tipo] ?? card.tipo}</span>
              <span className={`ocard__rare ocard__rare--${card.rareza}`}>
                {RAREZA_LABEL[card.rareza]}
              </span>
            </div>
            <div className="ocard__illus">
              <CelestialBody variante={card.variante} />
            </div>
            <div className="ocard__id">
              <span className="ocard__name">{card.nombre}</span>
              <span className="ocard__type">{card.tipoLabel}</span>
            </div>
            <div className="ocard__attrs">
              {card.atributos.map((a) => (
                <div className="ocard__attr" key={a.label}>
                  <b>{a.valor}</b>
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (onFlip) {
    return (
      <button
        type="button"
        className={`ocard ocard--${size}`}
        onClick={onFlip}
        disabled={disabled || flipped}
        aria-label={flipped && card ? `Carta: ${card.nombre}` : 'Descubrir la carta'}
      >
        {inner}
      </button>
    );
  }
  return (
    <div
      className={`ocard ocard--${size}`}
      role="img"
      aria-label={flipped && card ? `Carta: ${card.nombre}` : 'Carta boca abajo'}
    >
      {inner}
    </div>
  );
}
