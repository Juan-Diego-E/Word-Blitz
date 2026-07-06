// Vista pública de solo lectura para la pantalla grande. Muestra código + QR
// hasta que el control se conecta; después renderiza el tablero sincronizado.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import QRCode from 'qrcode';
import { AlarmClock, Trophy } from 'lucide-react';
import logo from '../assets/logo.png';
import { Card } from '../components/Card';
import { PlayerTurnBanner } from '../components/PlayerTurnBanner';
import { Podium } from '../components/Podium';
import { RouletteLetters } from '../components/RouletteLetters';
import { TimerRing } from '../components/TimerRing';
import { useTimer } from '../hooks/useTimer';
import { usePageTitle } from '../hooks/usePageTitle';
import { generateRoomCode, joinUrl } from '../lib/realtime';
import { useSessionStore } from '../store/sessionStore';
import './TvScreen.css';

export function TvScreen() {
  usePageTitle('Pantalla grande');
  const session = useSessionStore();
  const code = useMemo(() => generateRoomCode(), []);
  const [qr, setQr] = useState<string>('');

  useEffect(() => {
    void session.openRoom(code, 'tv');
    void QRCode.toDataURL(joinUrl(code), {
      width: 360,
      margin: 1,
      color: { dark: '#0c1a37', light: '#ffffff' },
    }).then(setQr);
    return () => useSessionStore.getState().leaveRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const st = session.remoteState;
  const { seconds } = useTimer(st?.phase === 'revealed' ? st.deadline : null);

  // Sala en espera: código + QR bien grandes.
  if (!st || st.players.length === 0) {
    return (
      <main className="view tv tv--waiting">
        <h1 className="tv__logo">
          <img src={logo} alt="Word Blitz" width={640} height={640} />
        </h1>
        <div className="tv__join glass glow-border">
          <p className="tv__join-label">Código de sala</p>
          <p className="tv__code">{code}</p>
          {qr && <img src={qr} alt={`Código QR para unirse a la sala ${code}`} className="tv__qr" width={220} height={220} />}
          <p className="tv__join-hint">
            Escaneá el QR con el celu, o entrá a la app y cargá el código en el Modo Clásico.
          </p>
        </div>
        <p className="tv__fallback">
          ¿Sin segundo dispositivo? <Link to="/jugar">Jugá pase-y-pasa en esta pantalla</Link>.
        </p>
      </main>
    );
  }

  const current = st.players[st.turnIndex];
  const flipped = st.phase === 'revealed' || st.phase === 'timeout';

  if (st.phase === 'finished') {
    const winner = [...st.players].sort((a, b) => b.puntaje - a.puntaje)[0];
    return (
      <main className="view tv tv--over">
        <h1 className="tv__over-title">
          <Trophy aria-hidden="true" className="tv__over-trophy" /> ¡Ganó {winner.nombre}!
        </h1>
        <Podium players={st.players} size="tv" title="Podio final" />
      </main>
    );
  }

  return (
    <main className="view tv">
      <header className="tv__header">
        <img src={logo} alt="Word Blitz" className="tv__brand" width={640} height={640} />
        <span className="tv__room">Sala {session.code}</span>
      </header>

      <PlayerTurnBanner nombre={current.nombre} size="tv" />

      <div className="tv__board">
        <RouletteLetters letter={st.activeLetter} spinning={st.phase === 'spinning'} size="tv" />
        <Card category={st.currentCategory} flipped={flipped} size="tv" />
        <div className="tv__side">
          <TimerRing
            seconds={st.phase === 'revealed' ? seconds : null}
            totalSeconds={st.timerSeconds}
            size="tv"
          />
          {st.phase === 'timeout' && (
            <p className="tv__timeout" role="status">
              <AlarmClock aria-hidden="true" className="tv__timeout-icon" /> ¡Tiempo!
            </p>
          )}
          {st.phase === 'idle' && (
            <p className="tv__idle-hint">Esperando la próxima carta…</p>
          )}
        </div>
      </div>

      <Podium players={st.players} currentPlayerId={current.id} size="tv" title="Ranking" />
    </main>
  );
}
