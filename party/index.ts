// Servidor PartyKit: una sala (Durable Object) por código. Relay simple:
// reenvía cada mensaje al resto de las conexiones de la sala. No persiste
// nada ni maneja datos personales — solo estado efímero de juego.
//
// Endurecido contra abuso: el relay es público (basta conocer el código de
// sala), así que aplica límites de tamaño, de conexiones y de frecuencia.
// La validación de FORMA vive además en el cliente (src/lib/validation.ts):
// defensa en profundidad, porque el server no debe conocer el esquema del
// juego para hacer su trabajo.
//
// Desarrollo:  npx partykit dev
// Deploy:      npx partykit deploy
// Frontend:    definir VITE_PARTYKIT_HOST (ej. word-blitz.usuario.partykit.dev)
import type * as Party from 'partykit/server';

/** Un snapshot legítimo pesa <2KB; 16KB deja margen de sobra. */
const MAX_MESSAGE_BYTES = 16 * 1024;
/** Host + TV + algún espectador. Corta el flood de conexiones a una sala. */
const MAX_CONNECTIONS = 8;
/** Ventana y tope de mensajes: el host publica en cada cambio de estado. */
const RATE_WINDOW_MS = 1000;
const RATE_MAX_PER_WINDOW = 30;

interface Bucket {
  count: number;
  resetAt: number;
}

export default class WordBlitzRoom implements Party.Server {
  private buckets = new Map<string, Bucket>();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Rechaza salas sobrepobladas: una sala real son 2 pares (host + TV).
    if ([...this.room.getConnections()].length > MAX_CONNECTIONS) {
      conn.close(1013, 'Sala llena');
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    if (typeof message !== 'string' || message.length > MAX_MESSAGE_BYTES) return;
    if (this.isRateLimited(sender.id)) return;
    // Relay a todos menos el emisor.
    this.room.broadcast(message, [sender.id]);
  }

  onClose(conn: Party.Connection) {
    this.buckets.delete(conn.id);
  }

  onError(conn: Party.Connection) {
    this.buckets.delete(conn.id);
  }

  /** Token bucket por conexión: descarta ráfagas sin tirar la conexión. */
  private isRateLimited(id: string): boolean {
    const now = Date.now();
    const b = this.buckets.get(id);
    if (!b || now >= b.resetAt) {
      this.buckets.set(id, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return false;
    }
    b.count += 1;
    return b.count > RATE_MAX_PER_WINDOW;
  }
}
