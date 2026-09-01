import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './boundary/ui/App'
import './boundary/ui/theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
