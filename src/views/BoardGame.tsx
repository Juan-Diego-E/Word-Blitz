// Vista control (celu del moderador) para el Modo 1000 Nombres.
// Estructura pareja a `Game.tsx`: header con timer/ajustes, banner del turno,
// tablero con carta central, botones SÍ/NO y podio con puntaje/posición.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlarmClock, Settings, Trophy, Tv } from 'lucide-react';
import { BoardTrack } from '../components/BoardTrack';
import { Card } from '../components/Card';
import { JudgementButtons } from '../components/JudgementButtons';
import { PlayerTurnBanner } from '../components/PlayerTurnBanner';
import { Podium } from '../components/Podium';
import { TimerRing } from '../components/TimerRing';
import { useTimer } from '../hooks/useTimer';
import { usePageTitle } from '../hooks/usePageTitle';
import { getGameDefaults } from '../lib/content';
import { useBoardGameStore } from '../store/boardGameStore';
import { useSessionStore } from '../store/sessionStore';
import './BoardGame.css';

const defaults = getGameDefaults();

export function BoardGame() {
  usePageTitle('1000 Nombres — Partida');
  const navigate = useNavigate();
  const g = useBoardGameStore();
  const session = useSessionStore();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDialogElement>(null);

  const { seconds } = useTimer(g.phase === 'revealed' ? g.deadline : null, g.handleTimeout);

  useEffect(() => {
    if (!g.inProgress && g.players.length === 0) navigate('/1000-nombres', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.inProgress, g.players.length]);

  useEffect(() => {
    if (g.phase !== 'timeout') return;
    const t = window.setTimeout(() => useBoardGameStore.getState().passTurn(), 1600);
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
  const total = g.boardLetters.length;
  const targetCell = Math.min(current.position + 1, total - 1);
  const targetLetter = g.boardLetters[targetCell];

  if (g.phase === 'finished') {
    const winner = g.players.find((p) => p.id === g.winnerId) ?? g.players[0];
    return (
      <main className="view board-game board-game--over">
        <h1 className="board-game__over-title">
          <Trophy aria-hidden="true" className="board-game__over-trophy" /> ¡Ganó {winner.nombre}!
        </h1>
        <BoardTrack
          letters={g.boardLetters}
          players={g.players}
          currentPlayerId={winner.id}
          size="control"
        />
        <Podium players={g.players} size="tv" title="Podio final" />
        <div className="board-game__over-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const nombres = g.players.map((p) => p.nombre);
              g.startGame(nombres, g.layoutId, g.timerSeconds);
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
    <main className="view board-game">
      <header className="board-game__header">
        <div className="board-game__letter" aria-label={`Letra objetivo: ${targetLetter}`}>
          <span className="board-game__letter-label">Letra</span>
          <span className="board-game__letter-value">{targetLetter}</span>
        </div>
        <div className="board-game__header-center">
          <span className="board-game__progress">
            Casilla {current.position} de {total - 1}
          </span>
          {session.status === 'connected' && (
            <span className="board-game__room" aria-label={`Conectado a la sala ${session.code}`}>
              <Tv size={14} aria-hidden="true" /> {session.code}
            </span>
          )}
        </div>
        <div className="board-game__header-right">
          <TimerRing seconds={g.phase === 'revealed' ? seconds : null} totalSeconds={g.timerSeconds} />
          <button
            type="button"
            className="board-game__settings-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Ajustes de la partida"
          >
            <Settings aria-hidden="true" />
          </button>
        </div>
      </header>

      <PlayerTurnBanner nombre={current.nombre} />

      <BoardTrack
        letters={g.boardLetters}
        players={g.players}
        currentPlayerId={current.id}
        targetCell={targetCell}
      >
        <div className="board-game__center-card">
          <Card
            category={g.currentCategory}
            flipped={flipped}
            onFlip={g.drawCard}
            disabled={g.phase === 'spinning'}
            size="control"
          />
        </div>
      </BoardTrack>

      {g.phase === 'timeout' && (
        <p className="board-game__timeout glass" role="status">
          <AlarmClock aria-hidden="true" className="board-game__timeout-icon" /> ¡Tiempo!{' '}
          <strong>{current.nombre}</strong> se queda en su casilla.
        </p>
      )}

      <JudgementButtons onJudge={g.judge} disabled={g.phase !== 'revealed'} />
      {g.phase === 'revealed' && (
        <p className="board-game__rule-hint">
          Palabra que empiece con <strong>{targetLetter}</strong> para avanzar a la próxima casilla.
        </p>
      )}

      <Podium players={g.players} currentPlayerId={current.id} title="Ranking" />

      <dialog ref={settingsRef} className="board-game__settings glass" onClose={() => setShowSettings(false)}>
        <h2>Ajustes</h2>
        <div className="board-game__settings-row">
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
        <div className="board-game__settings-actions">
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
