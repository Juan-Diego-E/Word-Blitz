// Config del Modo Clásico: jugadores, timer, límite de letras y conexión a la TV.
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { TopBar } from '../components/TopBar';
import { getGameDefaults } from '../lib/content';
import { normalizeRoomCode } from '../lib/validation';
import { useGameStore } from '../store/gameStore';
import { useSessionStore } from '../store/sessionStore';
import { usePageTitle } from '../hooks/usePageTitle';
import './ClassicConfig.css';

const defaults = getGameDefaults();

const LIMITES: { valor: number | null; texto: string }[] = [
  { valor: 5, texto: '5' },
  { valor: 10, texto: '10' },
  { valor: 15, texto: '15' },
  { valor: 20, texto: '20' },
  { valor: null, texto: 'Sin límite' },
];

export function ClassicConfig() {
  usePageTitle('Modo Clásico');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const startGame = useGameStore((s) => s.startGame);
  const session = useSessionStore();

  const [nombres, setNombres] = useState<string[]>(['', '']);
  const [timer, setTimer] = useState(defaults.defaultTimerSeconds);
  const [limite, setLimite] = useState<number | null>(defaults.defaultLetterLimit);
  const [errores, setErrores] = useState<string[]>([]);
  const [codigoSala, setCodigoSala] = useState(params.get('sala')?.toUpperCase() ?? '');

  // Si vinieron del QR de la TV, conectar directo.
  useEffect(() => {
    const sala = normalizeRoomCode(params.get('sala') ?? '');
    if (sala && session.status === 'idle') void session.openRoom(sala, 'host');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setNombre = (i: number, v: string) =>
    setNombres((ns) => ns.map((n, j) => (j === i ? v : n)));

  const agregar = () => {
    if (nombres.length < defaults.maxPlayers) setNombres((ns) => [...ns, '']);
  };
  const quitar = (i: number) => {
    if (nombres.length > defaults.minPlayers) setNombres((ns) => ns.filter((_, j) => j !== i));
  };

  const conectarTv = () => {
    const code = normalizeRoomCode(codigoSala);
    if (code) void session.openRoom(code, 'host');
  };

  const jugar = (e: FormEvent) => {
    e.preventDefault();
    const limpios = nombres.map((n) => n.trim());
    const errs: string[] = [];
    limpios.forEach((n, i) => {
      if (!n) errs.push(`Falta el nombre del jugador ${i + 1}.`);
    });
    const repetidos = limpios.filter((n, i) => n && limpios.indexOf(n) !== i);
    if (repetidos.length) errs.push(`Hay nombres repetidos: ${[...new Set(repetidos)].join(', ')}.`);
    setErrores(errs);
    if (errs.length) return;
    startGame(limpios, timer, limite);
    navigate('/partida');
  };

  return (
    <main className="view classic-config">
      <TopBar volverA="/jugar" titulo="Modo Clásico" />
      <h2 className="config-heading">Armemos la partida</h2>

      <form className="config-form surface" onSubmit={jugar} noValidate>
        <fieldset className="config-form__section">
          <legend>Jugadores</legend>
          {nombres.map((n, i) => (
            <div className="config-form__player" key={i}>
              <label htmlFor={`player-${i}`} className="visually-hidden">
                Nombre del jugador {i + 1}
              </label>
              <input
                id={`player-${i}`}
                type="text"
                value={n}
                maxLength={20}
                placeholder={`Jugador ${i + 1}`}
                onChange={(e) => setNombre(i, e.target.value)}
                autoComplete="off"
              />
              {nombres.length > defaults.minPlayers && (
                <button
                  type="button"
                  className="config-form__remove"
                  onClick={() => quitar(i)}
                  aria-label={`Quitar al jugador ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {nombres.length < defaults.maxPlayers && (
            <button type="button" className="btn btn-secondary" onClick={agregar}>
              + Agregar jugador
            </button>
          )}
        </fieldset>

        <fieldset className="config-form__section">
          <legend>Reglas</legend>
          <div className="config-form__row">
            <label htmlFor="timer">Segundos por turno</label>
            <div className="stepper">
              <button type="button" onClick={() => setTimer((t) => Math.max(defaults.minTimerSeconds, t - 5))} aria-label="Menos tiempo">−</button>
              <input
                id="timer"
                type="number"
                inputMode="numeric"
                min={defaults.minTimerSeconds}
                max={defaults.maxTimerSeconds}
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value) || defaults.defaultTimerSeconds)}
              />
              <button type="button" onClick={() => setTimer((t) => Math.min(defaults.maxTimerSeconds, t + 5))} aria-label="Más tiempo">+</button>
            </div>
          </div>
          {/* Chips y no <select>: son cinco opciones fijas, se ven todas sin
              abrir nada, y al lado ya había un stepper propio para los
              segundos. Dos controles vecinos que hacen lo mismo -elegir un
              valor de una lista corta- no pueden hablar dos idiomas.
              Los radios son nativos: el teclado y el lector de pantalla
              vienen de fábrica. */}
          <fieldset className="config-form__chips-group">
            <legend>Cartas por partida</legend>
            <div className="chips">
              {LIMITES.map(({ valor, texto }) => (
                <label
                  key={texto}
                  className={'chip' + (limite === valor ? ' chip--on' : '')}
                >
                  <input
                    type="radio"
                    name="limite"
                    checked={limite === valor}
                    onChange={() => setLimite(valor)}
                  />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>

        <fieldset className="config-form__section">
          <legend>Pantalla grande (opcional)</legend>
          <p className="config-form__hint">
            Abrí <strong>wordblitz</strong> en la TV y tocá "modo TV": te va a mostrar un código.
          </p>
          <div className="config-form__row">
            <label htmlFor="sala" className="visually-hidden">Código de sala</label>
            <input
              id="sala"
              type="text"
              value={codigoSala}
              maxLength={4}
              placeholder="CÓDIGO"
              className="config-form__code"
              onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
            />
            <button type="button" className="btn btn-secondary" onClick={conectarTv} disabled={codigoSala.trim().length !== 4}>
              Conectar
            </button>
          </div>
          {session.role === 'host' && session.status === 'connected' && (
            <p className="config-form__status config-form__status--ok" role="status">
              ✓ Conectados a la sala {session.code}
            </p>
          )}
          {session.role === 'host' && session.status === 'waiting' && (
            <p className="config-form__status" role="status">Buscando la sala {session.code}…</p>
          )}
          {session.status === 'error' && (
            <p className="config-form__status config-form__status--err" role="alert">
              No pudimos conectar. Revisá el código e intentá de nuevo.
            </p>
          )}
        </fieldset>

        {errores.length > 0 && (
          <ul className="config-form__errors" role="alert">
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        <button type="submit" className="btn btn-primary config-form__submit">
          ¡A jugar!
        </button>
      </form>
    </main>
  );
}
