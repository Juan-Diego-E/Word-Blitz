import { useEffect } from 'react';
import { Route, Routes } from 'react-router';
import { hydrateCustomCategorias } from './lib/content';
import { useSettingsStore } from './store/settingsStore';
import { Home } from './views/Home';
import { SelectMode } from './views/SelectMode';
import { ClassicConfig } from './views/ClassicConfig';
import { Game } from './views/Game';
import { TvScreen } from './views/TvScreen';
import { JoinRedirect } from './views/JoinRedirect';
import { ComingSoon } from './views/ComingSoon';

export function App() {
  const reducirMovimiento = useSettingsStore((s) => s.reducirMovimiento);

  useEffect(() => {
    void hydrateCustomCategorias();
  }, []);

  useEffect(() => {
    if (reducirMovimiento == null) delete document.documentElement.dataset.reducedMotion;
    else document.documentElement.dataset.reducedMotion = String(reducirMovimiento);
  }, [reducirMovimiento]);

  return (
    <>
      <div className="bg-lights" aria-hidden="true" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jugar" element={<SelectMode />} />
        <Route path="/clasico" element={<ClassicConfig />} />
        <Route path="/partida" element={<Game />} />
        <Route path="/tv" element={<TvScreen />} />
        <Route path="/unirse/:code" element={<JoinRedirect />} />
        <Route path="/:slug" element={<ComingSoon />} />
      </Routes>
    </>
  );
}
