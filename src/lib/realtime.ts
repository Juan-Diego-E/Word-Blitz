// Transporte de la sala TV. El host publica el estado; la TV lo consume.
// - Con VITE_PARTYKIT_HOST definido: PartySocket (multi-dispositivo real).
// - Sin definir: BroadcastChannel (misma máquina/navegador — sirve para
//   laptop→TV por HDMI o casteo de la pestaña /tv, y para desarrollo).
// El canal solo transporta estado efímero de juego: sin datos personales.

import type { RoomMessage } from '../types';
import { ROOM_CODE_ALPHABET, parseRoomMessage } from './validation';

export interface RoomTransport {
  send(msg: RoomMessage): void;
  onMessage(cb: (msg: RoomMessage) => void): () => void;
  close(): void;
}

const PARTYKIT_HOST: string | undefined = import.meta.env.VITE_PARTYKIT_HOST;

/** Corta payloads absurdos antes de parsearlos (defensa ante flood). */
const MAX_MESSAGE_BYTES = 16 * 1024;

export function generateRoomCode(): string {
  // `crypto.getRandomValues` en vez de Math.random: el código es lo único
  // que separa una sala de otra, así que debe ser impredecible.
  const abc = ROOM_CODE_ALPHABET; // sin I/O para evitar confusión visual
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

export function joinUrl(code: string): string {
  return `${location.origin}/unirse/${code}`;
}

function createBroadcastTransport(code: string): RoomTransport {
  const ch = new BroadcastChannel(`word-blitz-${code}`);
  const subs = new Set<(m: RoomMessage) => void>();
  ch.onmessage = (e) => {
    // Aun en BroadcastChannel validamos: otra pestaña del mismo origen
    // (o un bookmarklet) puede postear cualquier cosa al canal.
    const msg = parseRoomMessage(e.data);
    if (!msg) return;
    subs.forEach((cb) => cb(msg));
  };
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
      const data = e.data as string;
      // El relay no autentica: cualquiera en la sala puede mandar lo que
      // quiera. Descartamos por tamaño y después por forma.
      if (typeof data !== 'string' || data.length > MAX_MESSAGE_BYTES) return;
      const msg = parseRoomMessage(JSON.parse(data));
      if (!msg) return;
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
