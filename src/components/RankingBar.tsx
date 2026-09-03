// Ranking colapsado. El podio completo se abre desde acá.
//
// POR QUÉ EXISTE: en la vista de partida el podio ocupaba una tarjeta entera
// al pie de la columna. Medido en 360×640, el documento medía 940px en un
// viewport de 640 y la letra activa terminaba en top:-276 — el moderador
// juzgaba sin ver la letra ni el reloj. El ranking es contexto, no la acción:
// se lee de un vistazo y se despliega solo si alguien lo pide.
import { useEffect, useRef, useState } from 'react';
import { Podium } from './Podium';
import type { Player } from '../types';
import './RankingBar.css';

interface Props {
  players: Player[];
  currentPlayerId?: string;
}

export function RankingBar({ players, currentPlayerId }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const sorted = [...players].sort((a, b) => b.puntaje - a.puntaje);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  // El detalle visual queda oculto a lectores: la etiqueta del botón ya
  // dice el ranking completo, incluidos los jugadores que no se ven.
  const resumen = sorted
    .map((p, i) => `${i + 1}º ${p.nombre}, ${p.puntaje}`)
    .join('; ');

  return (
    <>
      <button
        type="button"
        className="ranking-bar"
        onClick={() => setOpen(true)}
        aria-label={`Ranking: ${resumen}. Abrir el podio completo.`}
      >
        <span className="ranking-bar__list" aria-hidden="true">
          {sorted.map((p, i) => (
            <span
              key={p.id}
              className={
                'ranking-bar__item' +
                (p.id === currentPlayerId ? ' ranking-bar__item--current' : '')
              }
            >
              <span className={`ranking-bar__pos ranking-bar__pos--${i + 1}`}>{i + 1}</span>
              <span className="ranking-bar__name">{p.nombre}</span>
              <span className="ranking-bar__score">{p.puntaje}</span>
            </span>
          ))}
        </span>
        {sorted.length > 3 && (
          <span className="ranking-bar__more" aria-hidden="true">+{sorted.length - 3}</span>
        )}
      </button>

      <dialog ref={ref} className="ranking-sheet surface" onClose={() => setOpen(false)}>
        <Podium players={players} currentPlayerId={currentPlayerId} title="Ranking" />
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </dialog>
    </>
  );
}
