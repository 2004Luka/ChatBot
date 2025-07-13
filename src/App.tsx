import { Suspense, lazy } from 'react'
import './App.css'

// Lazy load the main component for better performance
const Deepseek = lazy(() => import('./components/deepseak'))

function App() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading AI Chat Assistant...</p>
        </div>
      </div>
    }>
      <Deepseek />
    </Suspense>
  )
}

export default App
