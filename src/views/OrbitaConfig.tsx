// Config del Modo Órbita: jugadores, cartas para ganar y tiempo por turno.
// Al montarse aplica el tema "orbita": la app entera se transforma al cosmos
// con una transición suave (ver global.css + useModoTheme).
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { getGameDefaults } from '../lib/content';
import { useOrbitaStore } from '../store/orbitaStore';
import { useModoTheme } from '../hooks/useModoTheme';
import { usePageTitle } from '../hooks/usePageTitle';
import './OrbitaConfig.css';

const defaults = getGameDefaults();

export function OrbitaConfig() {
  usePageTitle('Órbita');
  useModoTheme('orbita');
  const navigate = useNavigate();
  const startGame = useOrbitaStore((s) => s.startGame);

  const [nombres, setNombres] = useState<string[]>(['', '']);
  const [timer, setTimer] = useState(20);
  const [meta, setMeta] = useState(4);
  const [errores, setErrores] = useState<string[]>([]);

  const setNombre = (i: number, v: string) =>
    setNombres((ns) => ns.map((n, j) => (j === i ? v : n)));
  const agregar = () => {
    if (nombres.length < defaults.maxPlayers) setNombres((ns) => [...ns, '']);
  };
  const quitar = (i: number) => {
    if (nombres.length > defaults.minPlayers) setNombres((ns) => ns.filter((_, j) => j !== i));
  };

  const jugar = (e: FormEvent) => {
    e.preventDefault();
    const limpios = nombres.map((n) => n.trim());
    const errs: string[] = [];
    limpios.forEach((n, i) => {
      if (!n) errs.push(`Falta el nombre del explorador ${i + 1}.`);
    });
    const repetidos = limpios.filter((n, i) => n && limpios.indexOf(n) !== i);
    if (repetidos.length) errs.push(`Hay nombres repetidos: ${[...new Set(repetidos)].join(', ')}.`);
    setErrores(errs);
    if (errs.length) return;
    startGame(limpios, timer, meta);
    navigate('/orbita/partida');
  };

  return (
    <main className="view orbita-config">
      <h1 className="orbita-config__title">Descubridores del cosmos</h1>
      <p className="orbita-config__intro">
        Volteá cartas, respondé Verdadero o Falso sobre cada astro y coleccionalo si acertás.
        Gana quien primero junte {meta} cartas.
      </p>

      <form className="config-form glass" onSubmit={jugar} noValidate>
        <fieldset className="config-form__section">
          <legend>Exploradores</legend>
          {nombres.map((n, i) => (
            <div className="config-form__player" key={i}>
              <label htmlFor={`player-${i}`} className="visually-hidden">
                Nombre del explorador {i + 1}
              </label>
              <input
                id={`player-${i}`}
                type="text"
                value={n}
                maxLength={20}
                placeholder={`Explorador ${i + 1}`}
                onChange={(e) => setNombre(i, e.target.value)}
                autoComplete="off"
              />
              {nombres.length > defaults.minPlayers && (
                <button
                  type="button"
                  className="config-form__remove"
                  onClick={() => quitar(i)}
                  aria-label={`Quitar al explorador ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {nombres.length < defaults.maxPlayers && (
            <button type="button" className="btn btn-secondary" onClick={agregar}>
              + Agregar explorador
            </button>
          )}
        </fieldset>

        <fieldset className="config-form__section">
          <legend>Reglas</legend>
          <div className="config-form__row">
            <label htmlFor="meta">Cartas para ganar</label>
            <select id="meta" value={meta} onChange={(e) => setMeta(Number(e.target.value))}>
              <option value={3}>3 cartas</option>
              <option value={4}>4 cartas</option>
              <option value={5}>5 cartas</option>
              <option value={6}>6 cartas</option>
            </select>
          </div>
          <div className="config-form__row">
            <label htmlFor="timer">Segundos por carta</label>
            <div className="stepper">
              <button type="button" onClick={() => setTimer((t) => Math.max(defaults.minTimerSeconds, t - 5))} aria-label="Menos tiempo">−</button>
              <input
                id="timer"
                type="number"
                inputMode="numeric"
                min={defaults.minTimerSeconds}
                max={defaults.maxTimerSeconds}
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value) || 20)}
              />
              <button type="button" onClick={() => setTimer((t) => Math.min(defaults.maxTimerSeconds, t + 5))} aria-label="Más tiempo">+</button>
            </div>
          </div>
        </fieldset>

        {errores.length > 0 && (
          <ul className="config-form__errors" role="alert">
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        <button type="submit" className="btn btn-primary config-form__submit orbita-config__go">
          Despegar 🚀
        </button>
      </form>

      <Link to="/jugar" className="btn-ghost">Volver</Link>
    </main>
  );
}
