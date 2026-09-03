// Estado de la sala TV. El host es la fuente de verdad y publica snapshots;
// la vista /tv consume. Sin datos personales en el canal.
import { create } from 'zustand';
import { createRoomTransport, type RoomTransport } from '../lib/realtime';
import type { BoardSnapshot, GameSnapshot, RoomRole, RoomStatus, TemaId } from '../types';
import { useGameStore } from './gameStore';
import { useBoardGameStore } from './boardGameStore';
import { useSettingsStore } from './settingsStore';

interface SessionState {
  code: string | null;
  role: RoomRole | null;
  status: RoomStatus;
  /** Snapshot del modo Clásico (si aplica). */
  remoteState: GameSnapshot | null;
  /** Snapshot del Modo 1000 Nombres (si aplica). */
  remoteBoardState: BoardSnapshot | null;
  /**
   * Tema que publica el control. La TV corre en otro navegador y nunca
   * compartió localStorage con el celular, así que sin esto el interruptor
   * de Ajustes cambia el tema del control y no el de la pantalla grande.
   */
  remoteTema: TemaId | null;
  peerPresent: boolean;

  openRoom(code: string, role: RoomRole): Promise<void>;
  leaveRoom(): void;
}

let transport: RoomTransport | null = null;
let unsubGame: (() => void) | null = null;
let unsubBoard: (() => void) | null = null;
let unsubTema: (() => void) | null = null;
let unsubMsg: (() => void) | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  code: null,
  role: null,
  status: 'idle',
  remoteState: null,
  remoteBoardState: null,
  remoteTema: null,
  peerPresent: false,

  openRoom: async (code, role) => {
    get().leaveRoom();
    const normalized = code.toUpperCase();
    set({ code: normalized, role, status: 'waiting', remoteState: null, remoteBoardState: null, remoteTema: null, peerPresent: false });
    try {
      transport = await createRoomTransport(normalized);
    } catch {
      set({ status: 'error' });
      return;
    }

    unsubMsg = transport.onMessage((msg) => {
      if (msg.code !== normalized) return;
      if (role === 'tv') {
        if (msg.type === 'hello-host') {
          set({ peerPresent: true, status: 'connected' });
        } else if (msg.type === 'state') {
          // La TV muestra el modo que esté activo; el último snapshot manda.
          set({ remoteState: msg.state, remoteBoardState: null, peerPresent: true, status: 'connected' });
        } else if (msg.type === 'board-state') {
          set({ remoteBoardState: msg.state, remoteState: null, peerPresent: true, status: 'connected' });
        } else if (msg.type === 'theme') {
          set({ remoteTema: msg.tema });
        } else if (msg.type === 'bye' && msg.from === 'host') {
          set({ peerPresent: false, status: 'waiting' });
        }
      } else {
        if (msg.type === 'hello-tv') {
          set({ peerPresent: true, status: 'connected' });
          // La TV acaba de entrar: reenviar el estado del modo que esté activo
          // y el tema, que es lo único que no vive en el snapshot.
          sendActiveState(normalized);
          sendTema(normalized);
        } else if (msg.type === 'bye' && msg.from === 'tv') {
          set({ peerPresent: false });
        }
      }
    });

    if (role === 'host') {
      transport.send({ type: 'hello-host', code: normalized });
      sendActiveState(normalized);
      sendTema(normalized);
      // Publicar cada cambio de cualquiera de los dos modos.
      unsubGame = useGameStore.subscribe((s) => {
        if (!s.inProgress) return;
        transport?.send({
          type: 'state',
          code: normalized,
          state: useGameStore.getState().snapshot(),
        });
      });
      unsubBoard = useBoardGameStore.subscribe((s) => {
        if (!s.inProgress) return;
        transport?.send({
          type: 'board-state',
          code: normalized,
          state: useBoardGameStore.getState().snapshot(),
        });
      });
      let temaPublicado = useSettingsStore.getState().tema;
      unsubTema = useSettingsStore.subscribe((s) => {
        if (s.tema === temaPublicado) return;
        temaPublicado = s.tema;
        sendTema(normalized);
      });
    } else {
      transport.send({ type: 'hello-tv', code: normalized });
    }
  },

  leaveRoom: () => {
    const { code, role } = get();
    if (transport && code && role) transport.send({ type: 'bye', code, from: role });
    unsubGame?.();
    unsubBoard?.();
    unsubTema?.();
    unsubMsg?.();
    transport?.close();
    transport = null;
    unsubGame = null;
    unsubBoard = null;
    unsubTema = null;
    unsubMsg = null;
    set({ code: null, role: null, status: 'idle', remoteState: null, remoteBoardState: null, remoteTema: null, peerPresent: false });
  },
}));

// Elige qué snapshot publicar según qué modo esté en curso; si ninguno,
// publica el snapshot del Clásico (compatibilidad con la vista TV vacía).
function sendActiveState(code: string) {
  const board = useBoardGameStore.getState();
  if (board.inProgress) {
    transport?.send({ type: 'board-state', code, state: board.snapshot() });
    return;
  }
  transport?.send({ type: 'state', code, state: useGameStore.getState().snapshot() });
}

function sendTema(code: string) {
  transport?.send({ type: 'theme', code, tema: useSettingsStore.getState().tema });
}
