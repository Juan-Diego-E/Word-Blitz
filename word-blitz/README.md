# Word Blitz

Party-game de palabras inspirado en los juegos de la infancia (Tutti Frutti /
Basta). El celu es el control, la TV es el tablero. Ver `CONTEXT.md`, `DATA.md`
y `BRAND.md` para la especificación completa.

## Correr

```bash
npm install
npm run dev        # desarrollo
npm test           # tests (gameStore + useTimer)
npm run build      # producción (incluye PWA)
npm run preview    # servir el build
```

> El ruteo es SPA: en hosting estático configurá el fallback de todas las rutas
> a `index.html` (Netlify/Vercel lo hacen con una regla de rewrite).

## Reglas del Modo Clásico (decisiones cerradas)

- **SÍ** → +1 punto, la carta se resuelve: nueva letra (ruleta) + nueva
  categoría para el siguiente jugador.
- **NO** o **tiempo agotado** → *rebote*: el siguiente jugador intenta la
  **misma** categoría+letra con el timer reiniciado.
- Si la carta da la vuelta completa (fallaron todos), **se quema**: se resuelve
  sin puntos y el turno pasa al siguiente del jugador que la abrió.
- **Fin de partida**: al resolverse la cantidad de cartas configurada
  ("Cartas por partida"; "Sin límite" = hasta terminar manualmente desde ⚙️).
- La ruleta evita repetir letras hasta agotar el pool; después recicla.
  Ñ/K/W/X están desactivadas y las letras difíciles pesan menos
  (`src/data/letras.ts`).
- El timer es modificable **durante** el juego (⚙️) y se re-basa en la ronda
  corriente.

## Modo TV (dos vistas sincronizadas)

1. En la TV (navegador) abrí la app → "modo TV" (`/tv`). Muestra un código de
   4 letras + QR.
2. En el celu, escaneá el QR (abre `/unirse/CODE`) o cargá el código en la
   config del Clásico → "Conectar".
3. El host publica cada cambio de estado; la TV solo renderiza. Nunca se
   exponen los controles (reveal, SÍ/NO) en la pantalla grande.

**Transporte:**
- Sin configuración extra usa `BroadcastChannel`: funciona entre pestañas del
  mismo navegador (laptop→TV por HDMI, o casteando la pestaña `/tv`).
- Para multi-dispositivo real, deployá el server PartyKit y definí el host:

```bash
npx partykit dev              # desarrollo local
npx partykit deploy           # → word-blitz.<usuario>.partykit.dev
echo 'VITE_PARTYKIT_HOST=word-blitz.<usuario>.partykit.dev' > .env.local
```

El canal solo transporta estado efímero del juego (sin datos personales).

## Arquitectura

- **Contenido** (categorías, letras, modos, defaults): fuente única en
  `src/data/`, accedida SOLO por `src/lib/content.ts`. Categorías custom en
  IndexedDB (`lib/persistence.ts`), mergeadas en las accesoras.
- **Estado**: Zustand — `gameStore` (loop del juego), `sessionStore` (sala TV),
  `settingsStore` (preferencias). La partida en curso se persiste en IndexedDB
  y el Home ofrece "Continuar partida".
- **Timer**: `hooks/useTimer.ts`, basado en deadline (epoch ms), un solo
  interval con cleanup — testeado contra el bug histórico de intervalos
  apilados.
- **PWA**: `vite-plugin-pwa`, contenido local y fuentes cacheadas offline.
- **Fondo animado**: patrón "tatetí" en CSS puro (`styles/global.css`), sin CDN.
- **Fase 3**: modos futuros tipados en `data/modos.ts` y ruteados a un
  placeholder (`views/ComingSoon.tsx`).
