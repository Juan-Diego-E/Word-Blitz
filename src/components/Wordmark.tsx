// Logotipo, en vector y con tipografía real.
//
// POR QUÉ EXISTE: el asset de marca —primer elemento del Home y reverso de
// todas las cartas— tenía el rayo COLOCADO SOBRE la palabra en vez de EN
// LUGAR de la I, así que la lectura literal era "WORD BLTZ". Además era un
// raster de 368KB con biselado 3D y contorno blanco: un idioma visual de
// sticker que no compartía nada con el resto de la interfaz, y que sobre el
// papel claro del tema diurno se nota el doble.
//
// Acá el rayo resuelve la I dentro de la caja tipográfica. Es texto real con
// la fuente de display del sistema, así que escala con font-size, hereda los
// tokens de color y pesa cero.
import './Wordmark.css';

interface Props {
  className?: string;
  /** Texto accesible. El logo se anuncia una sola vez, no letra por letra. */
  title?: string;
}

export function Wordmark({ className = '', title = 'Word Blitz' }: Props) {
  return (
    <span className={`wordmark ${className}`} role="img" aria-label={title}>
      <span className="wordmark__line" aria-hidden="true">
        Word
      </span>
      <span className="wordmark__line wordmark__line--accent" aria-hidden="true">
        Bl
        <svg className="wordmark__bolt" viewBox="0 0 24 48" aria-hidden="true" focusable="false">
          <path d="M14.5 0 L2 28 H9.5 L7 48 L22 19 H14 Z" />
        </svg>
        tz
      </span>
    </span>
  );
}
