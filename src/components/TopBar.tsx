// Barra superior de las pantallas secundarias.
//
// POR QUÉ EXISTE: antes cada vista repetía un `.btn-ghost` "Volver" al FINAL
// de la página. En pantallas largas (la config del tablero mide 1470px en un
// viewport de 812) había que scrollear hasta abajo para volver, y el enlace
// medía 23px de alto — la mitad del mínimo táctil de 44px.
//
// Acá el volver está siempre arriba, siempre en el mismo lugar y con área
// táctil real. El slot `acciones` permite colgar botones a la derecha
// (ajustes, salir) sin que cada vista invente su propio header.
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import './TopBar.css';

interface Props {
  /** Ruta a la que vuelve. Si se omite, usa el historial. */
  volverA?: string;
  /** Texto accesible del botón volver. */
  volverLabel?: string;
  /** Título de la pantalla. */
  titulo?: string;
  /** Botones opcionales a la derecha. */
  acciones?: ReactNode;
}

export function TopBar({ volverA, volverLabel = 'Volver', titulo, acciones }: Props) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__back"
        onClick={() => (volverA ? navigate(volverA) : navigate(-1))}
        aria-label={volverLabel}
      >
        <ArrowLeft aria-hidden="true" size={20} />
        <span className="topbar__back-text">Volver</span>
      </button>
      {titulo && <h1 className="topbar__title">{titulo}</h1>}
      <div className="topbar__actions">{acciones}</div>
    </header>
  );
}
