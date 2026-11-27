import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Admin from './Pages/Admin.jsx'
import './index.css'

// Accept /dev.urban, /dev.urban/ and any letter casing.
const adminPath = window.location.pathname.replace(/\/+$/, '').toLowerCase()
const isAdminPage = adminPath === '/dev.urban'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminPage ? <Admin /> : <App />}
  </StrictMode>,
)