import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Settings } from 'lucide-react';
import { getAppMeta } from '../lib/content';
import { loadBoardSnapshot, loadGameSnapshot } from '../lib/persistence';
import { useGameStore } from '../store/gameStore';
import { useBoardGameStore } from '../store/boardGameStore';
import { usePageTitle } from '../hooks/usePageTitle';
import type { BoardSnapshot, GameSnapshot } from '../types';
import { Wordmark } from '../components/Wordmark';
import './Home.css';

export function Home() {
  usePageTitle('');
  const meta = getAppMeta();
  const navigate = useNavigate();
  const restore = useGameStore((s) => s.restore);
  const restoreBoard = useBoardGameStore((s) => s.restore);
  const [saved, setSaved] = useState<GameSnapshot | null>(null);
  const [savedBoard, setSavedBoard] = useState<BoardSnapshot | null>(null);

  useEffect(() => {
    void loadGameSnapshot().then((snap) => {
      if (snap && snap.phase !== 'finished' && snap.players.length > 0) setSaved(snap);
    });
    void loadBoardSnapshot().then((snap) => {
      if (snap && snap.phase !== 'finished' && snap.players.length > 0) setSavedBoard(snap);
    });
  }, []);

  const continuar = () => {
    if (!saved) return;
    restore(saved);
    navigate('/partida');
  };
  const continuarTablero = () => {
    if (!savedBoard) return;
    restoreBoard(savedBoard);
    navigate('/1000-nombres/partida');
  };

  return (
    <main className="view home">
      <h1 className="home__logo">
        <Wordmark />
      </h1>
      <p className="home__tagline">{meta.tagline}</p>

      <div className="home__actions">
        <Link to="/jugar" className="btn btn-primary home__cta">
          Jugar
        </Link>
        {saved && (
          <button type="button" className="btn btn-secondary" onClick={continuar}>
            Continuar partida
          </button>
        )}
        {savedBoard && (
          <button type="button" className="btn btn-secondary" onClick={continuarTablero}>
            Continuar 1000 Nombres
          </button>
        )}
      </div>

      <Link to="/tv" className="btn-ghost home__tv-link">
        ¿Esta es la pantalla grande? Abrí el modo TV
      </Link>

      <Link to="/ajustes" className="home__settings-link" aria-label="Ajustes">
        <Settings aria-hidden="true" size={20} /> Ajustes
      </Link>
    </main>
  );
}
