// Selector de modos.
//
// JERARQUÍA: antes los 7 modos se listaban igual, y los 4 que todavía no
// existen ocupaban el 55% del alto — más que los 3 jugables. Ahora los
// jugables van primero y grandes, y los que vienen quedan agrupados abajo en
// una tira compacta: siguen comunicando la hoja de ruta sin robarle
// protagonismo a lo que sí se puede jugar hoy.
import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { TopBar } from '../components/TopBar';
import { getModos } from '../lib/content';
import { usePageTitle } from '../hooks/usePageTitle';
import './SelectMode.css';

export function SelectMode() {
  usePageTitle('Elegí un modo');
  const modos = getModos();
  const jugables = modos.filter((m) => m.habilitado);
  const proximos = modos.filter((m) => !m.habilitado);

  return (
    <main className="view select-mode">
      <TopBar volverA="/" titulo="Elegí un modo" />

      <h2 className="select-mode__heading">¿Cómo quieren jugar?</h2>

      <ul className="select-mode__grid">
        {jugables.map((m) => (
          <li key={m.id}>
            <Link to={`/${m.slug}`} className="mode-card glass mode-card--enabled">
              <Icon name={m.icono} className="mode-card__icon" size={32} />
              <span className="mode-card__name">{m.nombre}</span>
              <span className="mode-card__desc">{m.descripcion}</span>
              <span className="mode-card__go" aria-hidden="true">Jugar →</span>
            </Link>
          </li>
        ))}
      </ul>

      {proximos.length > 0 && (
        <section className="select-mode__soon" aria-label="Modos en camino">
          <h3 className="select-mode__soon-title">En camino</h3>
          <ul className="select-mode__soon-list">
            {proximos.map((m) => (
              <li key={m.id} className="soon-chip" title={m.descripcion}>
                <Icon name={m.icono} size={16} />
                <span>{m.nombre}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
