// Servidor PartyKit: una sala (Durable Object) por código. Relay simple:
// reenvía cada mensaje al resto de las conexiones de la sala. No persiste
// nada ni maneja datos personales — solo estado efímero de juego.
//
// Desarrollo:  npx partykit dev
// Deploy:      npx partykit deploy
// Frontend:    definir VITE_PARTYKIT_HOST (ej. word-blitz.usuario.partykit.dev)
import type * as Party from 'partykit/server';

export default class WordBlitzRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onMessage(message: string, sender: Party.Connection) {
    // Relay a todos menos el emisor.
    this.room.broadcast(message, [sender.id]);
  }
}
