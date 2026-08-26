// /unirse/:code (destino del QR) → abre la config del modo ya conectando.
// El código viene de la URL, así que se valida contra el alfabeto real antes
// de propagarlo: un código inválido manda a elegir modo en vez de intentar
// abrir una sala inexistente.
import { Navigate, useParams } from 'react-router';
import { normalizeRoomCode } from '../lib/validation';

export function JoinRedirect() {
  const { code } = useParams();
  const valid = normalizeRoomCode(code ?? '');
  if (!valid) return <Navigate to="/jugar" replace />;
  return <Navigate to={`/clasico?sala=${valid}`} replace />;
}
