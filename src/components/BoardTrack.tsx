// Tablero perimetral del Modo 1000 Nombres. Coloca N casillas alrededor
// del perímetro de una grilla rectangular y dibuja los peones de cada
// jugador en su casilla actual. El componente es 100% presentacional.
import { useMemo } from 'react';
import { Flag, Play } from 'lucide-react';
import type { BoardPlayer } from '../types';
import './BoardTrack.css';

interface Props {
  letters: string[];
  players: BoardPlayer[];
  currentPlayerId?: string;
  /** Índice de la casilla siguiente al peón del jugador en turno (para resaltar). */
  targetCell?: number | null;
  /** Tamaño visual: control (celu) o tv (pantalla grande). */
  size?: 'control' | 'tv';
  /** Contenido central (carta, timer, etc.). */
  children?: React.ReactNode;
}

interface Dims {
  cols: number;
  rows: number;
}

/** Elige cols/rows para que el perímetro alcance a `n` casillas. */
function pickDims(n: number): Dims {
  // Perímetro de un rectángulo cols×rows = 2*(cols + rows) - 4.
  // Preferimos rectángulos casi cuadrados y ligeramente más anchos.
  let best: Dims | null = null;
  for (let cols = 4; cols <= 30; cols++) {
    for (let rows = 3; rows <= cols; rows++) {
      const per = 2 * (cols + rows) - 4;
      if (per !== n) continue;
      if (!best || Math.abs(cols - rows) < Math.abs(best.cols - best.rows)) {
        best = { cols, rows };
      }
    }
  }
  if (best) return best;
  // Si no hay una combinación exacta, elegimos el rectángulo más cercano
  // por exceso; algunas casillas quedarán sin usar (raro con nuestros
  // layouts, todos pares y >= 20).
  for (let cols = 4; cols <= 30; cols++) {
    for (let rows = 3; rows <= cols; rows++) {
      if (2 * (cols + rows) - 4 >= n) return { cols, rows };
    }
  }
  return { cols: 8, rows: 6 };
}

/** Devuelve `[col, row]` (1-based) para el índice `i` de casilla en perímetro. */
function positionFor(i: number, cols: number, rows: number): [number, number] {
  // Recorrido horario partiendo de la esquina superior izquierda:
  //   fila superior → columna derecha → fila inferior (der→izq) → columna izq (abajo→arriba).
  const topLen = cols;
  const rightLen = rows - 1;
  const bottomLen = cols - 1;
  if (i < topLen) return [i + 1, 1];
  const j = i - topLen;
  if (j < rightLen) return [cols, j + 2];
  const k = j - rightLen;
  if (k < bottomLen) return [cols - k - 1, rows];
  const l = k - bottomLen;
  return [1, rows - l - 1];
}

export function BoardTrack({ letters, players, currentPlayerId, targetCell, size = 'control', children }: Props) {
  const n = letters.length;
  const dims = useMemo(() => pickDims(n), [n]);

  const cellsByIndex = useMemo(() => {
    // Agrupar peones por casilla para renderizar apilados con offset.
    const map = new Map<number, BoardPlayer[]>();
    for (const p of players) {
      const arr = map.get(p.position) ?? [];
      arr.push(p);
      map.set(p.position, arr);
    }
    return map;
  }, [players]);

  return (
    <div
      className={`board-track board-track--${size}`}
      style={
        {
          '--board-cols': dims.cols,
          '--board-rows': dims.rows,
        } as React.CSSProperties
      }
      role="grid"
      aria-label={`Tablero con ${n} casillas`}
    >
      {letters.map((letra, i) => {
        const [col, row] = positionFor(i, dims.cols, dims.rows);
        const isStart = i === 0;
        const isMeta = i === n - 1;
        const isTarget = targetCell === i;
        const pawns = cellsByIndex.get(i) ?? [];
        return (
          <div
            key={i}
            className={
              'board-track__cell' +
              (isStart ? ' board-track__cell--start' : '') +
              (isMeta ? ' board-track__cell--meta' : '') +
              (isTarget ? ' board-track__cell--target' : '')
            }
            style={{ gridColumn: col, gridRow: row }}
            role="gridcell"
            aria-label={
              isStart ? 'Casilla de salida' : isMeta ? 'Casilla META' : `Casilla ${i}: letra ${letra}`
            }
          >
            {isStart ? (
              <Play className="board-track__cell-icon" aria-hidden="true" />
            ) : isMeta ? (
              <Flag className="board-track__cell-icon" aria-hidden="true" />
            ) : (
              <span className="board-track__cell-letter">{letra}</span>
            )}

            {pawns.length > 0 && (
              <div className="board-track__pawns" aria-hidden="true">
                {pawns.map((p, idx) => (
                  <span
                    key={p.id}
                    className={
                      'board-track__pawn' +
                      (p.id === currentPlayerId ? ' board-track__pawn--current' : '')
                    }
                    style={{
                      background: p.color,
                      transform: `translate(${idx * 6 - (pawns.length - 1) * 3}px, ${idx * -4}px)`,
                    }}
                    title={p.nombre}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="board-track__center" style={{ gridColumn: `2 / ${dims.cols}`, gridRow: `2 / ${dims.rows}` }}>
        {children}
      </div>
    </div>
  );
}
