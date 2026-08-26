import { useEffect } from 'react';
import { Route, Routes } from 'react-router';
import { hydrateContenido } from './lib/content';
import { iniciarSync } from './lib/sync';
import { iniciarSonidos } from './lib/soundEffects';
import { useSettingsStore } from './store/settingsStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './views/Home';
import { SelectMode } from './views/SelectMode';
import { ClassicConfig } from './views/ClassicConfig';
import { Game } from './views/Game';
import { BoardConfig } from './views/BoardConfig';
import { BoardGame } from './views/BoardGame';
import { TvScreen } from './views/TvScreen';
import { JoinRedirect } from './views/JoinRedirect';
import { ComingSoon } from './views/ComingSoon';
import { Settings } from './views/Settings';

export function App() {
  const reducirMovimiento = useSettingsStore((s) => s.reducirMovimiento);

  useEffect(() => {
    // Contenido primero (local y, si esta, el de Cerebro); despues el sync.
    void hydrateContenido();
    iniciarSync();
    iniciarSonidos();
  }, []);

  useEffect(() => {
    if (reducirMovimiento == null) delete document.documentElement.dataset.reducedMotion;
    else document.documentElement.dataset.reducedMotion = String(reducirMovimiento);
  }, [reducirMovimiento]);

  return (
    <>
      <div className="bg-lights" aria-hidden="true" />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jugar" element={<SelectMode />} />
          <Route path="/clasico" element={<ClassicConfig />} />
          <Route path="/partida" element={<Game />} />
          <Route path="/1000-nombres" element={<BoardConfig />} />
          <Route path="/1000-nombres/partida" element={<BoardGame />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/tv" element={<TvScreen />} />
          <Route path="/unirse/:code" element={<JoinRedirect />} />
          <Route path="/:slug" element={<ComingSoon />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}
