import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI error:', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="card flex max-w-md flex-col items-center gap-3">
          <h1 className="text-2xl">Something went wrong</h1>
          <p className="mut">This page hit an error. Reload to try again.</p>
          <button className="btn" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}