import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { getModos } from '../lib/content';
import { usePageTitle } from '../hooks/usePageTitle';
import './SelectMode.css';

export function SelectMode() {
  usePageTitle('Elegí un modo');
  const modos = getModos();
  return (
    <main className="view select-mode">
      <h1>¿Cómo quieren jugar?</h1>
      <ul className="select-mode__grid">
        {modos.map((m) => (
          <li key={m.id}>
            {m.habilitado ? (
              <Link to={`/${m.slug}`} className="mode-card glass mode-card--enabled">
                <Icon name={m.icono} className="mode-card__icon" size={32} />
                <span className="mode-card__name">{m.nombre}</span>
                <span className="mode-card__desc">{m.descripcion}</span>
              </Link>
            ) : (
              <div className="mode-card glass mode-card--disabled" aria-disabled="true">
                <Icon name={m.icono} className="mode-card__icon" size={32} />
                <span className="mode-card__name">{m.nombre}</span>
                <span className="mode-card__desc">{m.descripcion}</span>
                <span className="mode-card__badge">Próximamente</span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Link to="/" className="btn-ghost">Volver</Link>
    </main>
  );
}
