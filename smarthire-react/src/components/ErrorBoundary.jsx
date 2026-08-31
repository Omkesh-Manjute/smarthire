import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('SmartHire UI ErrorBoundary caught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '28px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '24px' }}>⚠️</div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
                Temporary View Rendering Notice
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              The application encountered a minor rendering issue while loading this page. You can safely refresh the dashboard to reload the latest version:
            </p>
            {this.state.error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '4px',
                padding: '10px 12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#991b1b',
                marginBottom: '18px',
                overflowX: 'auto'
              }}>
                {String(this.state.error.message || this.state.error)}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => window.location.href = '/ats'}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Go to ATS Platform
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)'
                }}
              >
                🔄 Refresh & Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
