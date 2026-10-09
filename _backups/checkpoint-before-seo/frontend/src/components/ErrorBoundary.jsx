import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TerraAI Caught Application Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('terra_data_state_v4');
      localStorage.removeItem('terra_data_state');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="screen-container error-screen-container">
          <div className="error-card-box">
            <div className="error-icon-circle">
              <ShieldAlert size={36} className="text-danger" />
            </div>

            <h1 className="error-title">Something went wrong</h1>
            <p className="error-subtitle">
              An unexpected issue occurred while rendering this view. Your session data is safely preserved.
            </p>

            <div className="error-diagnosis-box">
              <span className="error-msg-label">Error Diagnosis:</span>
              <code className="error-code-snippet">
                {this.state.error?.message || 'Component failed to mount.'}
              </code>
            </div>

            <div className="error-actions-group">
              <button
                type="button"
                className="btn-primary-pill btn-error-reload"
                onClick={this.handleReload}
              >
                <RefreshCw size={16} />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                className="btn-secondary-pill btn-error-reset"
                onClick={this.handleResetState}
              >
                <Home size={16} />
                <span>Reset Cache & Return to Start</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
