import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { esCL as t } from "../i18n/es-CL";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary", error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.hash = "#/";
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center"
      >
        <p className="text-lg font-semibold text-red-400">
          {t.errors.boundaryTitle}
        </p>
        <p className="text-sm text-slate-400 max-w-md">
          {t.errors.boundaryMessage}
        </p>
        {import.meta.env.DEV && this.state.error && (
          <pre className="max-w-md overflow-x-auto rounded bg-slate-950/70 p-2 text-left text-xs text-slate-500">
            {this.state.error.message}
          </pre>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={this.reload}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            {t.errors.reload}
          </button>
          <button
            type="button"
            onClick={this.goHome}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            {t.errors.goHome}
          </button>
        </div>
      </div>
    );
  }
}
