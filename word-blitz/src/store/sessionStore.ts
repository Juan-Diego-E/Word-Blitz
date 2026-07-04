// Estado de la sala TV. El host es la fuente de verdad y publica snapshots;
// la vista /tv consume. Sin datos personales en el canal.
import { create } from 'zustand';
import { createRoomTransport, type RoomTransport } from '../lib/realtime';
import type { GameSnapshot, RoomRole, RoomStatus } from '../types';
import { useGameStore } from './gameStore';

interface SessionState {
  code: string | null;
  role: RoomRole | null;
  status: RoomStatus;
  remoteState: GameSnapshot | null; // lo que renderiza la TV
  peerPresent: boolean;

  openRoom(code: string, role: RoomRole): Promise<void>;
  leaveRoom(): void;
}

let transport: RoomTransport | null = null;
let unsubGame: (() => void) | null = null;
let unsubMsg: (() => void) | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  code: null,
  role: null,
  status: 'idle',
  remoteState: null,
  peerPresent: false,

  openRoom: async (code, role) => {
    get().leaveRoom();
    const normalized = code.toUpperCase();
    set({ code: normalized, role, status: 'waiting', remoteState: null, peerPresent: false });
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
          set({ remoteState: msg.state, peerPresent: true, status: 'connected' });
        } else if (msg.type === 'bye' && msg.from === 'host') {
          set({ peerPresent: false, status: 'waiting' });
        }
      } else {
        if (msg.type === 'hello-tv') {
          set({ peerPresent: true, status: 'connected' });
          // La TV acaba de entrar: reenviar el estado actual.
          transport?.send({ type: 'state', code: normalized, state: useGameStore.getState().snapshot() });
        } else if (msg.type === 'bye' && msg.from === 'tv') {
          set({ peerPresent: false });
        }
      }
    });

    if (role === 'host') {
      transport.send({ type: 'hello-host', code: normalized });
      transport.send({ type: 'state', code: normalized, state: useGameStore.getState().snapshot() });
      // Publicar cada cambio del juego.
      unsubGame = useGameStore.subscribe(() => {
        transport?.send({
          type: 'state',
          code: normalized,
          state: useGameStore.getState().snapshot(),
        });
      });
    } else {
      transport.send({ type: 'hello-tv', code: normalized });
    }
  },

  leaveRoom: () => {
    const { code, role } = get();
    if (transport && code && role) transport.send({ type: 'bye', code, from: role });
    unsubGame?.();
    unsubMsg?.();
    transport?.close();
    transport = null;
    unsubGame = null;
    unsubMsg = null;
    set({ code: null, role: null, status: 'idle', remoteState: null, peerPresent: false });
  },
}));
