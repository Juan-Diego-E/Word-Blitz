// Puente entre los stores del juego y Cerebro.
//
// Vive aparte a propósito: los stores no importan `cerebro.ts` ni saben que
// existe un backend. Si mañana se saca la integración, se borra este archivo
// y su import en `main.tsx`, y el juego queda exactamente como estaba.
//
// MODELO DE PERSISTENCIA — Cerebro COMPLEMENTA, no reemplaza:
//   - IndexedDB sigue siendo la fuente de verdad de la partida en curso. Es
//     lo que permite reanudar sin red, y el juego es una PWA que tiene que
//     andar en una casa con wifi flojo.
//   - Cerebro recibe el historial de partidas terminadas (opt-in) y las
//     preferencias, para que el dashboard tenga algo que mostrar.
//   - No se migra nada de lo que ya tienen los usuarios: nada se borra ni se
//     mueve. Si Cerebro no responde, no se pierde un solo dato.
import {
  subirPartidaClasico,
  subirPartidaTablero,
  subirPreferencias,
  traerPreferencias,
} from './cerebro';
import { getInstalacionId, savePrefs } from './persistence';
import { useBoardGameStore } from '../store/boardGameStore';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';

/** Partidas ya subidas en esta sesión, para no repetir el POST. */
const subidas = new Set<string>();

function sincronizarPartidasHabilitado(): boolean {
  return useSettingsStore.getState().sincronizarPartidas;
}

/**
 * Sube la partida al terminar. Solo corre con el opt-in encendido: el array
 * de jugadores lleva nombres reales.
 */
function observarPartidas() {
  useGameStore.subscribe((s) => {
    if (s.phase !== 'finished' || !s.gameId || subidas.has(s.gameId)) return;
    if (!sincronizarPartidasHabilitado()) return;
    subidas.add(s.gameId);
    void subirPartidaClasico(s.gameId, useGameStore.getState().snapshot(), true);
  });

  useBoardGameStore.subscribe((s) => {
    if (s.phase !== 'finished' || !s.gameId || subidas.has(s.gameId)) return;
    if (!sincronizarPartidasHabilitado()) return;
    subidas.add(s.gameId);
    void subirPartidaTablero(s.gameId, useBoardGameStore.getState().snapshot(), true);
  });
}

/** Sube las preferencias cuando cambian, con throttle. */
function observarPreferencias() {
  let timer: number | undefined;
  useSettingsStore.subscribe((s) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void subirPreferencias(getInstalacionId(), {
        sonido: s.sonido,
        vibracion: s.vibracion,
        reducirMovimiento: s.reducirMovimiento,
        sincronizarPartidas: s.sincronizarPartidas,
      });
    }, 800);
  });
}

/**
 * Trae las preferencias guardadas en Cerebro para esta instalación.
 * Solo se aplican si el dispositivo todavía no tiene preferencias propias:
 * lo local siempre gana, para no pisar un ajuste recién hecho con uno viejo.
 */
async function restaurarPreferencias() {
  const remotas = await traerPreferencias(getInstalacionId());
  if (!remotas) return;
  const actual = useSettingsStore.getState();
  savePrefs({
    sonido: remotas.sonido ?? actual.sonido,
    vibracion: remotas.vibracion ?? actual.vibracion,
    reducirMovimiento: remotas.reducirMovimiento ?? actual.reducirMovimiento,
    // Nunca viene de Cerebro: es una decisión de este dispositivo.
    sincronizarPartidas: actual.sincronizarPartidas,
  });
}

let iniciado = false;

/** Arranca la sincronización. Idempotente y seguro de llamar siempre. */
export function iniciarSync() {
  if (iniciado) return;
  iniciado = true;
  observarPartidas();
  observarPreferencias();
  // Sin `await`: si Cerebro no está, el juego arranca igual.
  void restaurarPreferencias();
}
