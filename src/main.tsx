import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
// El orden importa: `App` arrastra el CSS de todas las vistas, asi que si
// se importa primero, global.css termina INYECTADO AL FINAL del bundle y las
// reglas base le ganan a las de los componentes. Con esto, `.view` deja de
// pisar el `display: grid` de `.tv--play`.
import './styles/global.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
