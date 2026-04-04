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
    console.error("Scene render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%" }}>
          <rect width="400" height="250" fill="#0a0a0a" />
          <text x="200" y="125" textAnchor="middle" fill="#4a4a4a" fontSize="12" fontFamily="Georgia, serif">
            The scene flickers...
          </text>
        </svg>
      );
    }
    return this.props.children;
  }
}
