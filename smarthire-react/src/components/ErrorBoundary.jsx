import React from 'react'
import InfinityLoader from './InfinityLoader'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, isChunkRecovering: false }
  }

  static isChunkError(error) {
    const msg = String(error?.message || error || '')
    return (
      error?.name === 'ChunkLoadError' ||
      /Loading (CSS )?chunk/i.test(msg) ||
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /error loading dynamically imported module/i.test(msg) ||
      /Importing a module script failed/i.test(msg) ||
      /Expected a JavaScript module script/i.test(msg)
    )
  }

  static getDerivedStateFromError(error) {
    const isChunk = ErrorBoundary.isChunkError(error)
    return { hasError: true, error, isChunkRecovering: isChunk }
  }

  componentDidCatch(error, errorInfo) {
    console.error('SmartHire UI ErrorBoundary caught error:', error, errorInfo)
    this.setState({ errorInfo })

    if (ErrorBoundary.isChunkError(error)) {
      const now = Date.now()
      const lastReload = parseInt(window.sessionStorage.getItem('smarthire_last_chunk_reload') || '0', 10)
      if (now - lastReload > 10000) {
        window.sessionStorage.setItem('smarthire_last_chunk_reload', String(now))
        console.warn('[SmartHire] Chunk loading error detected, auto-reloading page...')
        window.location.reload()
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkRecovering: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkRecovering || ErrorBoundary.isChunkError(this.state.error)) {
        return (
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
            <InfinityLoader text="" showBrand={false} minHeight="85vh" />
          </div>
        )
      }

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>Refresh & Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
