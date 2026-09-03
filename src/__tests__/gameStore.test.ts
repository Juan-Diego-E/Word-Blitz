import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

const g = () => useGameStore.getState();

function startRevealedRound() {
  g().drawCard();
  g().startRound();
}

describe('gameStore — loop del Modo Clásico', () => {
  beforeEach(() => {
    g().startGame(['Ana', 'Beto', 'Caro'], 30, 3);
  });

  it('arranca en idle con puntajes en cero', () => {
    expect(g().phase).toBe('idle');
    expect(g().players.map((p) => p.puntaje)).toEqual([0, 0, 0]);
    expect(g().turnIndex).toBe(0);
  });

  it('drawCard sortea letra y categoría; startRound arranca el timer', () => {
    g().drawCard();
    expect(g().phase).toBe('spinning');
    expect(g().activeLetter).toMatch(/^[A-Z]$/);
    expect(g().currentCategory).not.toBeNull();
    g().startRound();
    expect(g().phase).toBe('revealed');
    expect(g().deadline).toBeGreaterThan(Date.now());
  });

  it('SÍ: suma 1, consume la letra y pasa el turno con carta nueva', () => {
    startRevealedRound();
    const letra = g().activeLetter!;
    g().judge(true);
    expect(g().players[0].puntaje).toBe(1);
    expect(g().usedLetters).toContain(letra);
    expect(g().turnIndex).toBe(1);
    expect(g().phase).toBe('idle');
    expect(g().activeLetter).toBeNull();
    expect(g().cardsResolved).toBe(1);
  });

  it('NO: entra en el beat antes de rebotar, sin tocar el turno ni el reloj', () => {
    startRevealedRound();
    const letra = g().activeLetter;
    g().judge(false);
    // El rechazo es una decisión humana: la mesa necesita verla antes de que
    // arranque el reloj del siguiente. Hasta que la vista llama a passTurn,
    // no cambió nada más que la fase.
    expect(g().phase).toBe('rejected');
    expect(g().turnIndex).toBe(0);
    expect(g().deadline).toBeNull();
    expect(g().activeLetter).toBe(letra);
  });

  it('NO: rebota la MISMA categoría+letra al siguiente jugador', () => {
    startRevealedRound();
    const letra = g().activeLetter;
    const cat = g().currentCategory?.id;
    g().judge(false);
    g().passTurn();
    expect(g().turnIndex).toBe(1);
    expect(g().phase).toBe('revealed');
    expect(g().activeLetter).toBe(letra);
    expect(g().currentCategory?.id).toBe(cat);
    expect(g().players.every((p) => p.puntaje === 0)).toBe(true);
  });

  it('si fallan todos, la carta se quema: se resuelve sin puntos y sigue el turno', () => {
    startRevealedRound();
    const letra = g().activeLetter!;
    const rechazar = () => {
      g().judge(false);
      g().passTurn();
    };
    rechazar(); // Ana → Beto
    rechazar(); // Beto → Caro
    rechazar(); // Caro → volvería a Ana (dueña) ⇒ quemada
    expect(g().phase).toBe('idle');
    expect(g().cardsResolved).toBe(1);
    expect(g().usedLetters).toContain(letra);
    expect(g().turnIndex).toBe(1); // siguiente al último que intentó (Caro)
    expect(g().players.every((p) => p.puntaje === 0)).toBe(true);
  });

  it('timeout: pasa a fase timeout y passTurn rebota', () => {
    startRevealedRound();
    g().handleTimeout();
    expect(g().phase).toBe('timeout');
    g().passTurn();
    expect(g().phase).toBe('revealed');
    expect(g().turnIndex).toBe(1);
  });

  it('termina al resolver el límite de cartas', () => {
    for (let i = 0; i < 3; i++) {
      startRevealedRound();
      g().judge(true);
    }
    expect(g().phase).toBe('finished');
    expect(g().cardsResolved).toBe(3);
  });

  it('setTimerSeconds respeta los límites y aplica en la ronda corriente', () => {
    startRevealedRound();
    g().setTimerSeconds(999);
    expect(g().timerSeconds).toBe(120);
    g().setTimerSeconds(1);
    expect(g().timerSeconds).toBe(5);
    expect(g().phase).toBe('revealed');
  });
});
