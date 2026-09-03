// Vista pública de solo lectura para la pantalla grande. Muestra código + QR
// hasta que el control se conecta; después renderiza el tablero sincronizado.
//
// UNA PANTALLA GRANDE NO ES UNA CHICA ESTIRADA. La versión anterior centraba
// la misma columna del celular en 1920px: la sala en espera ocupaba ~650px de
// ancho (el 66% del lienzo era fondo vacío) y los `clamp()` frenaban la
// tipografía justo donde hacía falta — medido a 1920, `.tv__room`,
// `.tv__idle-hint` y `.tv__fallback` renderizaban a 16px, y las filas del
// podio topaban en 28,8px.
//
// Acá la composición se piensa para 16:9: bloque dramático a la izquierda,
// marcador permanente a la derecha, el tiempo como barra ancha. Todo se mide
// en unidades de contenedor (ver TvScreen.css), incluidas las sombras: un
// blur de 32px es invisible en 65 pulgadas.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import QRCode from 'qrcode';
import { AlarmClock, Trophy, X } from 'lucide-react';
import { BoardTrack } from '../components/BoardTrack';
import { Card } from '../components/Card';
import { Confetti } from '../components/Confetti';
import { PlayerTurnBanner } from '../components/PlayerTurnBanner';
import { Podium } from '../components/Podium';
import { RouletteLetters } from '../components/RouletteLetters';
import { TimerRing } from '../components/TimerRing';
import { useTimer } from '../hooks/useTimer';
import { usePageTitle } from '../hooks/usePageTitle';
import { generateRoomCode, joinUrl } from '../lib/realtime';
import { useSessionStore } from '../store/sessionStore';
import { Wordmark } from '../components/Wordmark';
import './TvScreen.css';

export function TvScreen() {
  usePageTitle('Pantalla grande');
  const session = useSessionStore();
  const code = useMemo(() => generateRoomCode(), []);
  const [qr, setQr] = useState<string>('');

  useEffect(() => {
    void session.openRoom(code, 'tv');
    void QRCode.toDataURL(joinUrl(code), {
      // 720 y no 360: el QR se dibuja a un cuarto del alto de la pantalla,
      // que en un televisor 4K son bastantes más píxeles que 360.
      width: 720,
      margin: 1,
      color: { dark: '#0f1b33', light: '#ffffff' },
    }).then(setQr);
    return () => useSessionStore.getState().leaveRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const st = session.remoteState;
  const bst = session.remoteBoardState;
  const activeDeadline =
    bst && bst.players.length > 0
      ? bst.phase === 'revealed' ? bst.deadline : null
      : st?.phase === 'revealed' ? st.deadline : null;
  const { seconds } = useTimer(activeDeadline);

  // Sala en espera: código + QR bien grandes.
  const hasClassic = st && st.players.length > 0;
  const hasBoard = bst && bst.players.length > 0;
  if (!hasClassic && !hasBoard) {
    return (
      <main className="view tv tv--waiting">
        <Wordmark className="tv__wordmark tv__wordmark--hero" title="Word Blitz" />
        <div className="tv__join">
          <div className="tv__join-text">
            <p className="tv__join-label">Código de sala</p>
            <p className="tv__code">{code}</p>
            <p className="tv__join-hint">
              Escaneá el QR con el celu, o entrá a la app y cargá el código en
              el Modo Clásico.
            </p>
          </div>
          {qr && (
            <img
              src={qr}
              alt={`Código QR para unirse a la sala ${code}`}
              className="tv__qr"
            />
          )}
        </div>
        <p className="tv__fallback">
          ¿Sin segundo dispositivo? <Link to="/jugar">Jugá pase-y-pasa en esta pantalla</Link>.
        </p>
      </main>
    );
  }

  // Modo 1000 Nombres tiene prioridad si hay estado activo del tablero.
  if (hasBoard && bst) {
    const currentB = bst.players[bst.turnIndex];
    const total = bst.boardLetters.length;
    const targetCell = Math.min(currentB.position + 1, total - 1);
    const targetLetter = bst.boardLetters[targetCell];
    const flipped = bst.phase === 'revealed' || bst.phase === 'timeout';

    if (bst.phase === 'finished') {
      const winner = bst.players.find((p) => p.id === bst.winnerId) ?? bst.players[0];
      return (
        <main className="view tv tv--over">
          <Confetti />
          <h1 className="tv__over-title">
            <Trophy aria-hidden="true" className="tv__over-trophy" /> ¡Ganó {winner.nombre}!
          </h1>
          <BoardTrack letters={bst.boardLetters} players={bst.players} currentPlayerId={winner.id} size="tv" />
          <Podium players={bst.players} size="tv" title="Podio final" />
        </main>
      );
    }

    return (
      <main className="view tv tv--board">
        <header className="tv__header">
          <Wordmark className="tv__wordmark" title="Word Blitz" />
          <span className="tv__room">Sala {session.code}</span>
        </header>

        <PlayerTurnBanner nombre={currentB.nombre} size="tv" />

        <BoardTrack
          letters={bst.boardLetters}
          players={bst.players}
          currentPlayerId={currentB.id}
          targetCell={targetCell}
          size="tv"
        >
          <div className="tv__board-inner">
            <div className="tv__board-letter" aria-label={`Letra objetivo: ${targetLetter}`}>
              {targetLetter}
            </div>
            <Card category={bst.currentCategory} flipped={flipped} size="tv" />
            <TimerRing
              seconds={bst.phase === 'revealed' ? seconds : null}
              totalSeconds={bst.timerSeconds}
              size="tv"
            />
            {bst.phase === 'timeout' && (
              <p className="tv__timeout" role="status">
                <AlarmClock aria-hidden="true" className="tv__timeout-icon" /> ¡Tiempo!
              </p>
            )}
          </div>
        </BoardTrack>

        <Podium players={bst.players} currentPlayerId={currentB.id} size="tv" title="Ranking" />
      </main>
    );
  }

  // A partir de acá, sabemos que hay estado del Clásico.
  const current = st!.players[st!.turnIndex];
  const flipped = st!.phase === 'revealed' || st!.phase === 'timeout' || st!.phase === 'rejected';

  if (st!.phase === 'finished') {
    const winner = [...st!.players].sort((a, b) => b.puntaje - a.puntaje)[0];
    return (
      <main className="view tv tv--over">
        <Confetti />
        <h1 className="tv__over-title">
          <Trophy aria-hidden="true" className="tv__over-trophy" /> ¡Ganó {winner.nombre}!
        </h1>
        <Podium players={st!.players} size="tv" title="Podio final" />
      </main>
    );
  }

  const total = st!.timerSeconds;
  const frac =
    st!.phase === 'revealed' && seconds != null
      ? Math.max(0, Math.min(1, seconds / total))
      : 0;
  const urgente =
    (seconds != null && seconds <= 5) ||
    st!.phase === 'timeout' ||
    st!.phase === 'rejected';
  const progreso =
    st!.letterLimit != null
      ? `Carta ${Math.min(st!.cardsResolved + 1, st!.letterLimit)} de ${st!.letterLimit}`
      : `Carta ${st!.cardsResolved + 1}`;

  return (
    <main className="view tv tv--play">
      <header className="tv__header">
        <Wordmark className="tv__wordmark" title="Word Blitz" />
        <span className="tv__room">Sala {session.code}</span>
      </header>

      {/* Bloque dramático: la letra y la categoría son lo que la mesa mira. */}
      <section className="tv__stage">
        <RouletteLetters
          letter={st!.activeLetter}
          spinning={st!.phase === 'spinning'}
          size="tv"
        />
        <div className="tv__cat">
          <p className="tv__cat-label">Categoría</p>
          <p className="tv__cat-name" aria-live="polite">
            {flipped && st!.currentCategory ? st!.currentCategory.nombre : 'Carta boca abajo'}
          </p>
          <p className="tv__cat-hint">
            Si no acierta, rebota al siguiente con la misma letra.
          </p>
        </div>
      </section>

      {/* El tiempo como barra ancha: a tres metros, un anillo de 160px se lee
          peor que una barra que cruza media pantalla. */}
      <section className={`tv__meter ${urgente ? 'tv__meter--urgent' : ''}`}>
        <p className="tv__turn">
          {st!.phase === 'timeout' ? (
            <>
              <AlarmClock aria-hidden="true" className="tv__timeout-icon" /> ¡Tiempo!
            </>
          ) : st!.phase === 'rejected' ? (
            <>
              <X aria-hidden="true" className="tv__timeout-icon" /> No vale
            </>
          ) : (
            <>
              Le toca a <strong>{current.nombre}</strong>
            </>
          )}
        </p>
        <div
          className="tv__bar"
          role="timer"
          aria-live={urgente ? 'assertive' : 'off'}
          aria-label={seconds == null ? 'Temporizador detenido' : `${seconds} segundos restantes`}
        >
          <span className="tv__bar-fill" style={{ transform: `scaleX(${frac})` }} />
        </div>
        <p className="tv__secs">
          {seconds ?? '–'}
          <small>seg</small>
        </p>
        <p className="tv__progress">{progreso}</p>
      </section>

      {/* Marcador permanente: en una mesa de cinco, saber quién va ganando es
          la mitad de la conversación. */}
      <aside className="tv__score">
        <Podium players={st!.players} currentPlayerId={current.id} size="tv" title="Ranking" />
      </aside>

      {st!.usedLetters.length > 0 && (
        <footer className="tv__played">
          <span className="tv__played-label">Jugadas</span>
          <span className="tv__played-list">{st!.usedLetters.join(' · ')}</span>
        </footer>
      )}
    </main>
  );
}
