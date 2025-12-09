import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './src/App.tsx'
import './src/index.css'

// REAL MODE: Mock server initialization is removed.
// ensure you are running the Python backend (server.py).

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)