import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Disable mouse wheel / scroll behavior on number inputs globally to prevent accidental value changes
document.addEventListener('wheel', (e) => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
    e.target.blur();
  }
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

