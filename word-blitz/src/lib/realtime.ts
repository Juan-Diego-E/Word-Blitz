// Transporte de la sala TV. El host publica el estado; la TV lo consume.
// - Con VITE_PARTYKIT_HOST definido: PartySocket (multi-dispositivo real).
// - Sin definir: BroadcastChannel (misma máquina/navegador — sirve para
//   laptop→TV por HDMI o casteo de la pestaña /tv, y para desarrollo).
// El canal solo transporta estado efímero de juego: sin datos personales.

import type { RoomMessage } from '../types';

export interface RoomTransport {
  send(msg: RoomMessage): void;
  onMessage(cb: (msg: RoomMessage) => void): () => void;
  close(): void;
}

const PARTYKIT_HOST: string | undefined = import.meta.env.VITE_PARTYKIT_HOST;

export function generateRoomCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I/O para evitar confusión visual
  return Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
}

export function joinUrl(code: string): string {
  return `${location.origin}/unirse/${code}`;
}

function createBroadcastTransport(code: string): RoomTransport {
  const ch = new BroadcastChannel(`word-blitz-${code}`);
  const subs = new Set<(m: RoomMessage) => void>();
  ch.onmessage = (e) => subs.forEach((cb) => cb(e.data as RoomMessage));
  return {
    send: (msg) => ch.postMessage(msg),
    onMessage: (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    close: () => ch.close(),
  };
}

async function createPartyTransport(code: string): Promise<RoomTransport> {
  const { default: PartySocket } = await import('partysocket');
  const socket = new PartySocket({ host: PARTYKIT_HOST!, room: code.toUpperCase() });
  const subs = new Set<(m: RoomMessage) => void>();
  socket.addEventListener('message', (e) => {
    try {
      const msg = JSON.parse(e.data as string) as RoomMessage;
      subs.forEach((cb) => cb(msg));
    } catch {
      /* mensaje inválido: ignorar */
    }
  });
  return {
    send: (msg) => socket.send(JSON.stringify(msg)),
    onMessage: (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    close: () => socket.close(),
  };
}

export async function createRoomTransport(code: string): Promise<RoomTransport> {
  if (PARTYKIT_HOST) return createPartyTransport(code);
  return createBroadcastTransport(code);
}
