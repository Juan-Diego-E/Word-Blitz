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
- **Fondo animado**: el gradiente y el patrón tic-tac-toe originales, con el
  asset localizado en `src/assets/tic-tac-toe.webp` (sin CDN). El borde cónico
  arcoíris original vive en la carta (`Card.css`) y en `.glow-border`.
- **Íconos**: SVG vía `lucide-react`, referenciados por nombre desde la capa de
  datos (`icono: 'paw-print'`) y resueltos en `components/Icon.tsx` — render
  consistente en cualquier dispositivo (sin emojis).
- **Logo**: `src/assets/logo.png` (UI) y derivados en `public/` (favicons, PWA,
  OG). Para actualizar el logo: reemplazá el PNG maestro y regenerá los íconos.
  Ojo: la v1 dice "WORD BLTZ" (sin la I).
- **Fase 3**: modos futuros tipados en `data/modos.ts` y ruteados a un
  placeholder (`views/ComingSoon.tsx`).

## Cerebro (backend opcional)

El juego está dado de alta en [Cerebro](https://cerebro-five-murex.vercel.app)
como app `word-blitz`. La integración es **opcional**: sin configurar, todo
funciona igual con los datos que viajan en el bundle y con IndexedDB.

### Qué hace Cerebro y qué no

| dato | fuente de verdad | Cerebro |
|---|---|---|
| Categorías, letras, modos, layouts | `src/data/` (respaldo) | Fuente preferida — permite rebalancear sin redeploy |
| Partida en curso | **IndexedDB** | No la toca |
| Partidas terminadas | — | Recibe el historial, **solo con opt-in** |
| Preferencias | localStorage | Copia sincronizada por instalación |

Cerebro **complementa**, no reemplaza. No se migra ni se borra nada de lo que
ya tienen los usuarios: si Cerebro no responde, no se pierde un solo dato.

### Privacidad: el historial de partidas arranca apagado

El array `jugadores` incluye los nombres que la gente escribe. Hoy esos nombres
no salen del dispositivo salvo por el relay efímero de la TV. Subirlos a
Cerebro es un cambio de comportamiento del producto, así que la preferencia
`sincronizarPartidas` viene en `false` y solo la enciende la persona.

> Todavía no hay UI para ese toggle (ver Fase 2 de la auditoría, junto con los
> ajustes de sonido y vibración). Hasta entonces se enciende desde la consola:
> `useSettingsStore.getState().setSincronizarPartidas(true)`.

### Variables de entorno

La API key de Cerebro es **server-to-server**. Va en la función serverless
`api/cerebro/[...path].ts`, nunca en el cliente: **ninguna lleva prefijo
`VITE_`**, porque ese prefijo es lo que hace que el bundler la inyecte en el
JavaScript que cualquiera puede leer desde DevTools.

Configuralas en Vercel (Project → Settings → Environment Variables):

| nombre | valor |
|---|---|
| `CEREBRO_URL` | `https://cerebro-five-murex.vercel.app` |
| `CEREBRO_API_KEY` | la key `cbk_…` |
| `CEREBRO_APP_SLUG` | `word-blitz` |

Para probar el proxy en local hace falta `vercel dev` (con `vite` a secas la
carpeta `api/` no corre, y la app degrada a sus datos locales — que es
justamente el comportamiento esperado).

### Cómo está armado

- `api/cerebro/[...path].ts` — proxy con **whitelist** de colección y método.
  Sin esa whitelist, cualquiera que descubra la ruta usa la key para lo que
  quiera. La decisión vive en `evaluarRuta()`, que tiene tests propios.
- `src/lib/cerebro.ts` — único lugar que arma URLs y maneja respuestas.
  Ninguna de sus funciones lanza: ante `401`/`403`/`404`/`413`/`502`/`503`
  devuelven `null` y el juego sigue con sus datos locales.
- `src/lib/sync.ts` — puente entre los stores y Cerebro. Los stores no saben
  que Cerebro existe; borrando este archivo y su import en `App.tsx` la
  integración desaparece sin tocar el juego.

### IDs estables

Cada partida genera un `gameId` (`crypto.randomUUID()`) al empezar, que es su
`external_id` en Cerebro. El upsert es por ese id: reenviar la misma partida
actualiza en vez de duplicar. Las partidas guardadas antes de este cambio no lo
tienen y reciben uno al restaurarse.
