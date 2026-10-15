import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { QuoteRequestsPage } from './pages/QuoteRequestsPage'
import { RequestQuotePage } from './pages/RequestQuotePage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/request-quote" element={<RequestQuotePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/quote-requests" element={<QuoteRequestsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/quote-requests" replace />} />
    </Routes>
  )
}