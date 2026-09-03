import { useEffect } from 'react';
import { Route, Routes } from 'react-router';
import { hydrateContenido } from './lib/content';
import { iniciarSync } from './lib/sync';
import { iniciarSonidos } from './lib/soundEffects';
import { useSettingsStore } from './store/settingsStore';
import { useSessionStore } from './store/sessionStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './views/Home';
import { SelectMode } from './views/SelectMode';
import { ClassicConfig } from './views/ClassicConfig';
import { Game } from './views/Game';
import { BoardConfig } from './views/BoardConfig';
import { BoardGame } from './views/BoardGame';
import { OrbitaConfig } from './views/OrbitaConfig';
import { OrbitaGame } from './views/OrbitaGame';
import { TvScreen } from './views/TvScreen';
import { JoinRedirect } from './views/JoinRedirect';
import { ComingSoon } from './views/ComingSoon';
import { Settings } from './views/Settings';

/** Color de la barra del navegador por tema: el campo de cada uno. */
const THEME_COLOR = { claro: '#edeff4', oscuro: '#08122b' } as const;

export function App() {
  const reducirMovimiento = useSettingsStore((s) => s.reducirMovimiento);
  const temaLocal = useSettingsStore((s) => s.tema);
  const temaSala = useSessionStore((s) => s.remoteTema);
  const rol = useSessionStore((s) => s.role);
  // La pantalla grande sigue al control: el moderador manda. En cualquier
  // otro rol vale la preferencia del dispositivo. Un solo escritor del
  // atributo, para que la TV no parpadee entre los dos valores.
  const tema = rol === 'tv' && temaSala ? temaSala : temaLocal;

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

  useEffect(() => {
    document.documentElement.dataset.theme = tema === 'oscuro' ? 'dark' : 'light';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[tema]);
  }, [tema]);

  return (
    <>
      <div className="orbita-veil" aria-hidden="true" />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jugar" element={<SelectMode />} />
          <Route path="/clasico" element={<ClassicConfig />} />
          <Route path="/partida" element={<Game />} />
          <Route path="/1000-nombres" element={<BoardConfig />} />
          <Route path="/1000-nombres/partida" element={<BoardGame />} />
          <Route path="/orbita" element={<OrbitaConfig />} />
          <Route path="/orbita/partida" element={<OrbitaGame />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/tv" element={<TvScreen />} />
          <Route path="/unirse/:code" element={<JoinRedirect />} />
          <Route path="/:slug" element={<ComingSoon />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}
