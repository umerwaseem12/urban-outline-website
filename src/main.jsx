import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Admin from './Pages/Admin.jsx'
import './index.css'

const isAdminPage = window.location.pathname === '/dev.urban'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminPage ? <Admin /> : <App />}
  </StrictMode>,
)