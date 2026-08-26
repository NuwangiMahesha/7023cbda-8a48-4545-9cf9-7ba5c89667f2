import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught app error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center font-sans bg-surface-page">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card border border-ink-300/30">
            <h2 className="text-xl font-bold text-ink-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-win-red">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/win";
                }}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white shadow-lift transition-opacity hover:opacity-90"
              >
                Reload Game
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="w-full rounded-xl bg-surface-sunken py-2.5 text-sm font-bold text-ink-700 hover:bg-brand-50"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}