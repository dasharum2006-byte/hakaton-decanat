import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './lib/auth'
import { DataProvider } from './lib/store'
import { Toaster } from './components/Toaster'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {
        /* офлайн-режим не критичен для демо */
      })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <App />
        </HashRouter>
        <Toaster />
      </DataProvider>
    </AuthProvider>
  </StrictMode>,
)
