import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-screen bg-bg-void flex items-center justify-center">
          <div className="glass p-6 rounded-lg max-w-md text-center space-y-3">
            <h2 className="font-space text-lg font-semibold text-danger-orange">Something broke</h2>
            <p className="font-body text-sm text-text-meta">{this.state.error.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="px-4 py-2 border border-neon-cyan text-neon-cyan rounded font-mono text-xs hover:bg-neon-cyan hover:text-bg-void transition-all"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
