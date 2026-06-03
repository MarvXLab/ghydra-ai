import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import Landing   from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Threats   from './pages/Threats'
import Network   from './pages/Network'
import Pricing   from './pages/Pricing'
import Settings  from './pages/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/threats"   element={<Threats />} />
          <Route path="/network"   element={<Network />} />
          <Route path="/pricing"   element={<Pricing />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
