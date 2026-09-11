import React from 'react';

interface Props { children: React.ReactNode; onReset?: () => void; }
interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="error-banner" style={{ marginBottom: 16 }}>
            <strong>Произошла ошибка интерфейса.</strong>
            <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 12 }}>
              {this.state.error.message}
            </div>
          </div>
          <button className="primary" onClick={() => { this.setState({ error: null }); this.props.onReset?.(); }}>
            Вернуться на главную
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}