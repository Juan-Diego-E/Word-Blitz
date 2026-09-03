// Vista de juego del Modo Órbita. Loop: descubrir carta → Verdadero/Falso
// contra el reloj → coleccionar si acertás → siguiente jugador. Primero en
// juntar la meta gana. Mantiene el tema cósmico activo mientras dura.
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Trophy, Volume2, VolumeX, X } from 'lucide-react';
import { Confetti } from '../components/Confetti';
import { OrbitaCard } from '../components/OrbitaCard';
import { CelestialBody } from '../components/CelestialBody';
import { TimerRing } from '../components/TimerRing';
import { useTimer } from '../hooks/useTimer';
import { useCountdownTicks } from '../hooks/useCountdownTicks';
import { useModoTheme } from '../hooks/useModoTheme';
import { usePageTitle } from '../hooks/usePageTitle';
import { getOrbitaCards } from '../lib/content';
import { play } from '../lib/sound';
import { useOrbitaStore } from '../store/orbitaStore';
import { useSettingsStore } from '../store/settingsStore';
import type { OrbitaCard as OrbitaCardData } from '../types';
import './OrbitaGame.css';

const cardsById = new Map(getOrbitaCards().map((c) => [c.id, c] as const));
const RESOLVE_MS = 2400;

export function OrbitaGame() {
  usePageTitle('Órbita — Partida');
  useModoTheme('orbita');
  const navigate = useNavigate();
  const g = useOrbitaStore();
  const sonido = useSettingsStore((s) => s.sonido);
  const setSonido = useSettingsStore((s) => s.setSonido);
  const vibracion = useSettingsStore((s) => s.vibracion);

  const { seconds } = useTimer(g.phase === 'revealed' ? g.deadline : null, g.handleTimeout);
  useCountdownTicks(g.phase === 'revealed' ? seconds : null);

  // Sin partida armada AL ENTRAR → volver a configurar. Solo al montar: si
  // corriera en cada cambio, "Salir" (que resetea el store) competiría con
  // navigate('/') y te devolvería a la config en vez de al inicio.
  const bootRef = useRef(false);
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    if (!g.inProgress && g.players.length === 0) navigate('/orbita', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Feedback breve tras responder, luego repartir la próxima carta.
  useEffect(() => {
    if (g.phase !== 'correct' && g.phase !== 'wrong') return;
    const t = window.setTimeout(() => useOrbitaStore.getState().next(), RESOLVE_MS);
    return () => window.clearTimeout(t);
  }, [g.phase]);

  // Sonido de victoria al terminar.
  const finishedRef = useRef(false);
  useEffect(() => {
    if (g.phase === 'finished' && !finishedRef.current) {
      finishedRef.current = true;
      play('victoria');
    }
    if (g.phase !== 'finished') finishedRef.current = false;
  }, [g.phase]);

  if (g.players.length === 0) return null;

  const card: OrbitaCardData | null = g.cartaActual ? cardsById.get(g.cartaActual) ?? null : null;
  const afirmacion = card?.afirmaciones[g.afirmacionIndex] ?? null;
  const current = g.players[g.turnIndex];
  const flipped = g.phase !== 'idle';

  const reveal = () => {
    if (g.phase !== 'idle') return;
    play('flip');
    g.reveal();
  };

  const responder = (vf: boolean) => {
    if (g.phase !== 'revealed' || !afirmacion) return;
    const ok = vf === afirmacion.esVerdad;
    play(ok ? 'acierto' : 'error');
    if (vibracion && 'vibrate' in navigator) navigator.vibrate(ok ? 40 : [30, 40, 30]);
    g.answer(vf);
  };

  // ---- Pantalla de fin ----
  if (g.phase === 'finished') {
    const winner = g.players.find((p) => p.id === g.winnerId) ?? g.players[0];
    return (
      <main className="view orbita-game orbita-game--over">
        <Confetti />
        <h1 className="orbita-game__over-title">
          <Trophy aria-hidden="true" className="orbita-game__over-trophy" /> ¡Ganó {winner.nombre}!
        </h1>
        <p className="orbita-game__over-sub">
          Reunió {winner.coleccion.length} {winner.coleccion.length === 1 ? 'carta' : 'cartas'} del cosmos.
        </p>
        <ScoreBoard />
        <div className="orbita-game__over-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => g.startGame(g.players.map((p) => p.nombre), g.timerSeconds, g.metaCartas)}
          >
            Revancha
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              g.resetGame();
              navigate('/');
            }}
          >
            Salir
          </button>
        </div>
      </main>
    );
  }

  const resuelto = g.phase === 'correct' || g.phase === 'wrong';

  return (
    <main className="view orbita-game">
      <header className="orbita-game__header">
        <span className="orbita-game__turn">
          Turno de <strong>{current.nombre}</strong>
        </span>
        <div className="orbita-game__header-right">
          {g.phase === 'revealed' && (
            <TimerRing seconds={seconds} totalSeconds={g.timerSeconds} />
          )}
          <button
            type="button"
            className="orbita-game__icon-btn"
            onClick={() => setSonido(!sonido)}
            aria-label={sonido ? 'Silenciar' : 'Activar sonido'}
          >
            {sonido ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="orbita-game__icon-btn"
            onClick={() => {
              g.resetGame();
              navigate('/');
            }}
            aria-label="Salir del modo"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      </header>

      <p className="orbita-game__goal">
        Junta <strong>{g.metaCartas}</strong> cartas para ganar · te faltan{' '}
        <strong>{Math.max(0, g.metaCartas - current.coleccion.length)}</strong>
      </p>

      <div className="orbita-game__stage">
        <OrbitaCard card={card} flipped={flipped} onFlip={reveal} disabled={g.phase !== 'idle'} />

        {/* Reto Verdadero/Falso */}
        {g.phase === 'revealed' && afirmacion && (
          <div className="orbita-game__challenge">
            <p className="orbita-game__statement">"{afirmacion.texto}"</p>
            <div className="orbita-game__vf" role="group" aria-label="Verdadero o Falso">
              <button type="button" className="vf vf--false" onClick={() => responder(false)}>
                Falso
              </button>
              <button type="button" className="vf vf--true" onClick={() => responder(true)}>
                Verdadero
              </button>
            </div>
          </div>
        )}

        {/* Feedback tras responder */}
        {resuelto && card && afirmacion && (
          <div
            className={`orbita-game__result orbita-game__result--${g.phase} surface`}
            role="status"
          >
            <p className="orbita-game__verdict">
              {g.phase === 'correct'
                ? '¡Correcto! Sumaste la carta.'
                : `Era ${afirmacion.esVerdad ? 'Verdadero' : 'Falso'}. ¡A la próxima!`}
            </p>
            <p className="orbita-game__fact">
              <strong>{card.nombre}:</strong> {card.curiosidad}
            </p>
          </div>
        )}

        {g.phase === 'idle' && (
          <p className="orbita-game__hint">
            Tocá la carta para descubrir el astro y su desafío.
          </p>
        )}
      </div>

      <ScoreBoard />
    </main>
  );
}

/** Marcador: cada jugador con sus cartas coleccionadas (puntos por tipo). */
function ScoreBoard() {
  const players = useOrbitaStore((s) => s.players);
  const turnIndex = useOrbitaStore((s) => s.turnIndex);
  const meta = useOrbitaStore((s) => s.metaCartas);
  const phase = useOrbitaStore((s) => s.phase);
  return (
    <section className="orbita-score" aria-label="Colecciones">
      {players.map((p, i) => (
        <div
          key={p.id}
          className={`orbita-score__row ${i === turnIndex && phase !== 'finished' ? 'orbita-score__row--current' : ''}`}
        >
          <span className="orbita-score__name">{p.nombre}</span>
          <div className="orbita-score__slots">
            {Array.from({ length: meta }).map((_, k) => {
              const cardId = p.coleccion[k];
              const c = cardId ? cardsById.get(cardId) : null;
              return (
                <span
                  key={k}
                  className={`orbita-score__slot ${c ? `orbita-score__slot--${c.tipo}` : ''}`}
                  title={c?.nombre}
                >
                  {c && <CelestialBody variante={c.variante} className="orbita-score__mini" />}
                </span>
              );
            })}
          </div>
          <span className="orbita-score__count">{p.coleccion.length}</span>
        </div>
      ))}
    </section>
  );
}
