import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { getAppMeta } from '../lib/content';
import { loadGameSnapshot } from '../lib/persistence';
import { useGameStore } from '../store/gameStore';
import { usePageTitle } from '../hooks/usePageTitle';
import type { GameSnapshot } from '../types';
import logo from '../assets/logo.png';
import './Home.css';

export function Home() {
  usePageTitle('');
  const meta = getAppMeta();
  const navigate = useNavigate();
  const restore = useGameStore((s) => s.restore);
  const [saved, setSaved] = useState<GameSnapshot | null>(null);

  useEffect(() => {
    void loadGameSnapshot().then((snap) => {
      if (snap && snap.phase !== 'finished' && snap.players.length > 0) setSaved(snap);
    });
  }, []);

  const continuar = () => {
    if (!saved) return;
    restore(saved);
    navigate('/partida');
  };

  return (
    <main className="view home">
      <h1 className="home__logo">
        <img src={logo} alt="Word Blitz" width={640} height={640} />
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
      </div>

      <Link to="/tv" className="btn-ghost home__tv-link">
        ¿Esta es la pantalla grande? Abrí el modo TV
      </Link>
    </main>
  );
}
