// Red de seguridad de toda la app. Sin esto, cualquier excepción durante el
// render desmonta React y deja la pantalla en blanco — especialmente grave en
// la TV, donde nadie tiene una consola a mano para entender qué pasó.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  /** Etiqueta para distinguir dónde ocurrió (ej. "TV", "Partida"). */
  scope?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Sin telemetría externa: el log local alcanza para diagnosticar.
    console.error(`[Word Blitz${this.props.scope ? ` · ${this.props.scope}` : ''}]`, error, info);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="view error-boundary" role="alert">
        <h1 className="error-boundary__title">Se nos cayó una ficha</h1>
        <p className="error-boundary__text">
          Algo falló al dibujar esta pantalla. Tu partida sigue guardada.
        </p>
        <div className="error-boundary__actions">
          <button type="button" className="btn btn-primary" onClick={this.reset}>
            Reintentar
          </button>
          <a href="/" className="btn btn-secondary">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }
}
