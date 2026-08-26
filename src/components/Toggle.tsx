// Interruptor accesible. Es un checkbox real por debajo (foco y teclado
// gratis); el switch visual se dibuja con CSS.
import './Toggle.css';

interface Props {
  checked: boolean;
  onChange(v: boolean): void;
  /** Etiqueta visible. */
  label: string;
  /** Aclaración opcional bajo la etiqueta. */
  hint?: string;
  id: string;
}

export function Toggle({ checked, onChange, label, hint, id }: Props) {
  return (
    <label className="toggle" htmlFor={id}>
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint && <span className="toggle__hint">{hint}</span>}
      </span>
      <input
        id={id}
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}
