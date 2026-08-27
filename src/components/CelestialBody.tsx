// Ilustración de un objeto celeste, dibujada 100% con CSS (radiales y capas):
// sin assets, escalable y liviana. `variante` elige el astro.
import './CelestialBody.css';

interface Props {
  variante: string;
  className?: string;
}

export function CelestialBody({ variante, className }: Props) {
  return (
    <div className={`celestial celestial--${variante} ${className ?? ''}`} aria-hidden="true">
      <span className="celestial__body" />
    </div>
  );
}
