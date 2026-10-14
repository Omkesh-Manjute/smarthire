import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Auto-recover from chunk loading errors after new production deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[SmartHire] New version deployed or chunk preload error, auto-refreshing...', event)
    window.location.reload()
  })

  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event?.reason?.message || event?.reason || '')
    if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('error loading dynamically imported module')) {
      console.warn('[SmartHire] Dynamic module import failed, auto-refreshing...', msg)
      window.location.reload()
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
