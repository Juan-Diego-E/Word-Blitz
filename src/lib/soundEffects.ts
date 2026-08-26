// Conecta los sonidos a las transiciones de fase de los dos modos.
//
// Vive aparte de los stores (igual que persistence y sync): los stores no
// saben que existe el audio. Los eventos de acierto/error se disparan desde
// JudgementButtons, que es donde se conoce el resultado; acá van los que se
// leen de la máquina de estados:
//   - flip:      idle → spinning (se voltea la carta)
//   - chicharra: revealed → timeout (se acabó el tiempo)
//   - victoria:  cualquier fase → finished (terminó la partida)
import { play } from './sound';
import { useGameStore } from '../store/gameStore';
import { useBoardGameStore } from '../store/boardGameStore';

type Fase = string;

function observar(
  subscribe: (cb: (fase: Fase) => void) => void,
  faseInicial: Fase,
) {
  let anterior = faseInicial;
  subscribe((fase) => {
    if (fase === anterior) return;
    if (anterior === 'idle' && fase === 'spinning') play('flip');
    else if (anterior === 'revealed' && fase === 'timeout') play('chicharra');
    else if (fase === 'finished') play('victoria');
    anterior = fase;
  });
}

let iniciado = false;

/** Arranca los efectos de fase. Idempotente. */
export function iniciarSonidos() {
  if (iniciado) return;
  iniciado = true;

  observar(
    (cb) => useGameStore.subscribe((s) => cb(s.phase)),
    useGameStore.getState().phase,
  );
  observar(
    (cb) => useBoardGameStore.subscribe((s) => cb(s.phase)),
    useBoardGameStore.getState().phase,
  );
}
