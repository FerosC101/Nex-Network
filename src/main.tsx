import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Lazy so the public site never ships the admin bundle or its queries.
const AdminPage = lazy(() => import('./admin/AdminPage.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Suspense fallback={null}><AdminPage /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
