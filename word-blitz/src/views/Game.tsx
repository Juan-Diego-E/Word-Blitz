// Vista control (celular del moderador): header con letra activa + cuenta
// regresiva + ajustes, jugador en turno, carta, SÍ/NO y ranking temporal.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/Card';
import { JudgementButtons } from '../components/JudgementButtons';
import { PlayerTurnBanner } from '../components/PlayerTurnBanner';
import { Podium } from '../components/Podium';
import { RouletteLetters } from '../components/RouletteLetters';
import { TimerRing } from '../components/TimerRing';
import { useTimer } from '../hooks/useTimer';
import { usePageTitle } from '../hooks/usePageTitle';
import { getGameDefaults } from '../lib/content';
import { useGameStore } from '../store/gameStore';
import { useSessionStore } from '../store/sessionStore';
import './Game.css';

const defaults = getGameDefaults();

export function Game() {
  usePageTitle('Partida');
  const navigate = useNavigate();
  const g = useGameStore();
  const session = useSessionStore();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDialogElement>(null);

  const { seconds } = useTimer(g.phase === 'revealed' ? g.deadline : null, g.handleTimeout);

  // Sin partida armada → volver a configurar.
  useEffect(() => {
    if (!g.inProgress && g.players.length === 0) navigate('/clasico', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.inProgress, g.players.length]);

  // "¡Tiempo!" breve y rebote automático al siguiente jugador.
  useEffect(() => {
    if (g.phase !== 'timeout') return;
    const t = window.setTimeout(() => useGameStore.getState().passTurn(), 1600);
    return () => window.clearTimeout(t);
  }, [g.phase]);

  useEffect(() => {
    const dlg = settingsRef.current;
    if (!dlg) return;
    if (showSettings && !dlg.open) dlg.showModal();
    if (!showSettings && dlg.open) dlg.close();
  }, [showSettings]);

  if (g.players.length === 0) return null;

  const current = g.players[g.turnIndex];
  const flipped = g.phase === 'revealed' || g.phase === 'timeout';
  const nextPlayer = g.players[(g.turnIndex + 1) % g.players.length];
  const cardsLabel =
    g.letterLimit != null ? `Carta ${Math.min(g.cardsResolved + 1, g.letterLimit)} de ${g.letterLimit}` : `Carta ${g.cardsResolved + 1}`;

  if (g.phase === 'finished') {
    const winner = [...g.players].sort((a, b) => b.puntaje - a.puntaje)[0];
    return (
      <main className="view game game--over">
        <h1 className="game__over-title">🏆 ¡Ganó {winner.nombre}!</h1>
        <Podium players={g.players} size="tv" title="Podio final" />
        <div className="game__over-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const nombres = g.players.map((p) => p.nombre);
              g.startGame(nombres, g.timerSeconds, g.letterLimit);
            }}
          >
            Revancha
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              g.resetGame();
              session.leaveRoom();
              navigate('/');
            }}
          >
            Salir
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="view game">
      <header className="game__header">
        <RouletteLetters
          letter={g.activeLetter}
          spinning={g.phase === 'spinning'}
          onSettled={g.startRound}
        />
        <div className="game__header-center">
          <span className="game__progress">{cardsLabel}</span>
          {session.status === 'connected' && (
            <span className="game__room" aria-label={`Conectado a la sala ${session.code}`}>
              📺 {session.code}
            </span>
          )}
        </div>
        <div className="game__header-right">
          <TimerRing seconds={g.phase === 'revealed' ? seconds : null} totalSeconds={g.timerSeconds} />
          <button
            type="button"
            className="game__settings-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Ajustes de la partida"
          >
            ⚙️
          </button>
        </div>
      </header>

      <PlayerTurnBanner nombre={current.nombre} />

      <div className="game__stage">
        <Card
          category={g.currentCategory}
          flipped={flipped}
          onFlip={g.drawCard}
          disabled={g.phase === 'spinning'}
        />
        {g.phase === 'timeout' && (
          <p className="game__timeout glass" role="status">
            ⏰ ¡Tiempo! Le toca a <strong>{nextPlayer.nombre}</strong> con la misma carta.
          </p>
        )}
      </div>

      <JudgementButtons onJudge={g.judge} disabled={g.phase !== 'revealed'} />
      {g.phase === 'revealed' && (
        <p className="game__rule-hint">
          Si no acierta, la carta rebota al siguiente con la misma letra.
        </p>
      )}

      <Podium players={g.players} currentPlayerId={current.id} title="Ranking" />

      <dialog ref={settingsRef} className="game__settings glass" onClose={() => setShowSettings(false)}>
        <h2>Ajustes</h2>
        <div className="game__settings-row">
          <label htmlFor="timer-ingame">Segundos por turno</label>
          <div className="stepper">
            <button type="button" onClick={() => g.setTimerSeconds(g.timerSeconds - 5)} aria-label="Menos tiempo">−</button>
            <input
              id="timer-ingame"
              type="number"
              inputMode="numeric"
              min={defaults.minTimerSeconds}
              max={defaults.maxTimerSeconds}
              value={g.timerSeconds}
              onChange={(e) => g.setTimerSeconds(Number(e.target.value) || g.timerSeconds)}
            />
            <button type="button" onClick={() => g.setTimerSeconds(g.timerSeconds + 5)} aria-label="Más tiempo">+</button>
          </div>
        </div>
        <div className="game__settings-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowSettings(false);
              g.endGame();
            }}
          >
            Terminar partida
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowSettings(false)}>
            Seguir jugando
          </button>
        </div>
      </dialog>
    </main>
  );
}
