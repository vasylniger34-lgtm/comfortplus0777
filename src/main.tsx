import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MockupApp from './MockupApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MockupApp />
  </StrictMode>,
)
