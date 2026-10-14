import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Auto-recover from chunk loading errors after new production deployments
if (typeof window !== 'undefined') {
  const triggerSafeReload = (reason) => {
    const now = Date.now()
    const lastReload = parseInt(window.sessionStorage.getItem('smarthire_last_chunk_reload') || '0', 10)
    if (now - lastReload > 10000) {
      window.sessionStorage.setItem('smarthire_last_chunk_reload', String(now))
      console.warn(`[SmartHire] Chunk recovery triggered (${reason}), reloading...`)
      window.location.reload()
    }
  }

  window.addEventListener('vite:preloadError', (event) => {
    triggerSafeReload('vite:preloadError')
  })

  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event?.reason?.message || event?.reason || '')
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('ChunkLoadError') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Expected a JavaScript module script')
    ) {
      triggerSafeReload('unhandledrejection:dynamic_import')
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
