import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Título da seção — aparece no erro para facilitar diagnóstico */
  sectionName?: string;
  /** Se true, renderiza um fallback inline (menor) em vez de tela cheia */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  componentStack?: string;
}

/**
 * TripSpaceErrorBoundary
 *
 * Captura crashes de renderização dentro do Trip Space e exibe
 * um fallback elegante em vez de tela cinza vazia.
 *
 * Uso:
 *   <TripSpaceErrorBoundary sectionName="DayWorkspace">
 *     <DayWorkspace ... />
 *   </TripSpaceErrorBoundary>
 */
export class TripSpaceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[TripSpace] Crash em "${this.props.sectionName || 'componente desconhecido'}":`,
      error,
      info.componentStack
    );
    this.setState({ componentStack: info.componentStack ?? undefined });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, componentStack: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, sectionName, inline } = this.props;

    if (!hasError) return children;

    if (inline) {
      return (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex flex-col items-center justify-center gap-3 text-center min-h-[120px]">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-sm font-bold text-red-700">
            {sectionName ? `Erro em "${sectionName}"` : 'Ocorreu um erro neste componente.'}
          </p>
          <button
            onClick={this.handleReset}
            className="text-xs font-bold text-red-600 underline hover:text-red-800"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-1">
          {sectionName ? `Erro em "${sectionName}"` : 'Ocorreu um erro inesperado'}
        </h3>
        <p className="text-sm font-medium text-slate-500 mb-2 max-w-sm">
          {error?.message || 'Um componente falhou ao renderizar. Seus dados não foram perdidos.'}
        </p>
        <button
          onClick={this.handleReset}
          className="mt-4 px-5 py-2.5 bg-slate-900 text-white text-sm font-extrabold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Tentar novamente
        </button>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left max-w-lg w-full">
            <summary className="text-xs font-bold text-slate-400 cursor-pointer">Stack técnica (dev only)</summary>
            <pre className="text-[10px] text-red-600 bg-red-50 p-3 rounded-lg mt-2 overflow-auto max-h-40 font-mono whitespace-pre-wrap">
              {error.message}
              {this.state.componentStack}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
