// Pantalla de ajustes. Expone las preferencias que ya se persistían pero no
// tenían dónde tocarse: sonido, vibración, reducir movimiento y la
// sincronización de partidas con Cerebro.
import { Moon, Sun } from 'lucide-react';
import { Toggle } from '../components/Toggle';
import { TopBar } from '../components/TopBar';
import { play } from '../lib/sound';
import { usePageTitle } from '../hooks/usePageTitle';
import { useSettingsStore } from '../store/settingsStore';
import type { TemaId } from '../types';
import './Settings.css';

type MotionOpt = 'auto' | 'reducir' | 'normal';

export function Settings() {
  usePageTitle('Ajustes');
  const s = useSettingsStore();

  // El tri-estado de movimiento: null = seguir al sistema.
  const motion: MotionOpt =
    s.reducirMovimiento == null ? 'auto' : s.reducirMovimiento ? 'reducir' : 'normal';
  const setMotion = (opt: MotionOpt) =>
    s.setReducirMovimiento(opt === 'auto' ? null : opt === 'reducir');

  const vibracionDisponible = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  return (
    <main className="view settings">
      <TopBar volverA="/" titulo="Ajustes" />

      <section className="settings__group surface">
        <h2 className="settings__group-title">Apariencia</h2>
        <div className="settings__row">
          <div className="settings__row-text">
            <span className="settings__row-label">Tema</span>
            <span className="settings__row-hint">
              El diurno es el de siempre. Si están jugando de noche con la luz
              apagada, el nocturno no encandila. La pantalla grande sigue al
              control: cambiándolo acá cambia también en la TV.
            </span>
          </div>
          <div className="settings__segmented" role="group" aria-label="Tema">
            {(
              [
                ['claro', 'Diurno', Sun],
                ['oscuro', 'Nocturno', Moon],
              ] as [TemaId, string, typeof Sun][]
            ).map(([opt, texto, Ico]) => (
              <button
                key={opt}
                type="button"
                className={
                  'settings__segment' + (s.tema === opt ? ' settings__segment--active' : '')
                }
                aria-pressed={s.tema === opt}
                onClick={() => s.setTema(opt)}
              >
                <Ico aria-hidden="true" size={16} /> {texto}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings__group surface">
        <h2 className="settings__group-title">Sonido y tacto</h2>
        <Toggle
          id="set-sonido"
          label="Efectos de sonido"
          hint="Voltear cartas, aciertos, cuenta regresiva y victoria."
          checked={s.sonido}
          onChange={(v) => {
            s.setSonido(v);
            if (v) play('acierto'); // muestra al instante cómo suena
          }}
        />
        <Toggle
          id="set-vibracion"
          label="Vibración"
          hint={
            vibracionDisponible
              ? 'Un toque al marcar acierto o error.'
              : 'Este dispositivo no admite vibración.'
          }
          checked={s.vibracion && vibracionDisponible}
          onChange={(v) => {
            s.setVibracion(v);
            if (v && vibracionDisponible) navigator.vibrate(40);
          }}
        />
      </section>

      <section className="settings__group surface">
        <h2 className="settings__group-title">Accesibilidad</h2>
        <div className="settings__row">
          <div className="settings__row-text">
            <span className="settings__row-label">Reducir movimiento</span>
            <span className="settings__row-hint">
              Menos animaciones. En automático sigue lo que pide tu sistema.
            </span>
          </div>
          <div className="settings__segmented" role="group" aria-label="Reducir movimiento">
            {(
              [
                ['auto', 'Automático'],
                ['reducir', 'Reducir'],
                ['normal', 'Normal'],
              ] as [MotionOpt, string][]
            ).map(([opt, texto]) => (
              <button
                key={opt}
                type="button"
                className={
                  'settings__segment' + (motion === opt ? ' settings__segment--active' : '')
                }
                aria-pressed={motion === opt}
                onClick={() => setMotion(opt)}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings__group surface">
        <h2 className="settings__group-title">Partidas</h2>
        <Toggle
          id="set-sync"
          label="Guardar historial de partidas"
          hint="Sube las partidas terminadas a tu dashboard. Incluye los nombres de los jugadores, que hasta ahora no salían del dispositivo."
          checked={s.sincronizarPartidas}
          onChange={s.setSincronizarPartidas}
        />
      </section>
    </main>
  );
}
