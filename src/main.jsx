import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import SystemDebugger from './components/common/SystemDebugger'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
        <SystemDebugger />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
)