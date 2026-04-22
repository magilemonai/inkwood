import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the browser's normal error plumbing so DevTools /
    // ErrorEvent listeners / external observers (if ever wired up)
    // see the failure rather than having it buried in a console.error.
    if (typeof window !== "undefined" && typeof window.reportError === "function") {
      try { window.reportError(error); } catch { /* ignore */ }
    }
    console.error("Scene render error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          role="alert"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "1rem",
            background: "#0a0a0a",
            color: "#8a8878",
            fontFamily: "Georgia, serif",
          }}
        >
          <p style={{ opacity: 0.7 }}>The scene flickers...</p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              border: "1px solid #4a4a4a",
              padding: "0.4rem 1rem",
              color: "#a8a898",
              background: "transparent",
              fontFamily: "Georgia, serif",
              cursor: "pointer",
              borderRadius: "2px",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
