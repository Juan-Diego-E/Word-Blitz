// Scaffolding de los modos de la Fase 3: ruta tipada + placeholder.
import { Link, useParams } from 'react-router';
import { Icon } from '../components/Icon';
import { getModos } from '../lib/content';
import { usePageTitle } from '../hooks/usePageTitle';
import type { ModoSlug } from '../types';

export function ComingSoon() {
  const { slug } = useParams();
  const modo = getModos().find((m) => m.slug === (slug as ModoSlug));
  usePageTitle(modo?.nombre ?? 'Próximamente');
  return (
    <main className="view" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {modo ? (
          <>
            <Icon name={modo.icono} size={36} /> {modo.nombre}
          </>
        ) : (
          'Ese modo no existe'
        )}
      </h1>
      <p style={{ color: 'var(--color-white-70)', maxWidth: '36ch' }}>
        {modo ? `${modo.descripcion} Muy pronto en Word Blitz.` : 'Elegí un modo de la lista.'}
      </p>
      <Link to="/jugar" className="btn btn-secondary">Volver a los modos</Link>
    </main>
  );
}
