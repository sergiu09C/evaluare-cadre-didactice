import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (err: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div role="alert" className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="max-w-md w-full bg-danger-bg border border-red-200 rounded-xl shadow-elev-2 p-6">
            <h2 className="font-display text-lg font-semibold text-danger-fg mb-2">
              A apărut o eroare neașteptată
            </h2>
            <p className="text-sm text-danger-fg mb-4">
              {this.state.error.message || 'Eroare necunoscută.'} Reîncarcă pagina sau revino la pagina principală.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 h-10 rounded-md bg-danger text-white font-medium shadow-elev-1 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              >
                Reîncarcă
              </button>
              <button
                onClick={() => {
                  this.reset();
                  window.location.href = '/';
                }}
                className="inline-flex items-center px-4 h-10 rounded-md bg-white border border-neutral-200 text-neutral-800 font-medium shadow-elev-1 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40"
              >
                Pagina principală
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
