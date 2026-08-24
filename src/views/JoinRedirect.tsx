// /unirse/:code (destino del QR) → abre la config del Clásico ya conectando.
import { Navigate, useParams } from 'react-router';

export function JoinRedirect() {
  const { code } = useParams();
  return <Navigate to={`/clasico?sala=${(code ?? '').toUpperCase()}`} replace />;
}
