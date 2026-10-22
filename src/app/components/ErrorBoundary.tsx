import React from 'react';

interface Props {
  fallback: (retry: () => void) => React.ReactNode;
  children: React.ReactNode;
}

/** Shows a retry message instead of a blank app when a screen fails (e.g. a chunk could not load offline). */
export class ErrorBoundary extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    return this.state.failed ? this.props.fallback(() => this.setState({ failed: false })) : this.props.children;
  }
}
