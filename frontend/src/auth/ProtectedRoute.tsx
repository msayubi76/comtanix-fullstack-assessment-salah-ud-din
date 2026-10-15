import { Navigate, Outlet, useLocation } from 'react-router'
import { getErrorMessage } from '../api/client'
import { Spinner } from '../components/Spinner'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user, isLoading, loadError, reload } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <Spinner label="Checking your session..." />
  }

  if (loadError) {
    return (
      <div className="mx-auto mt-24 max-w-md rounded-lg border border-red-200 bg-white p-6 text-center">
        <p className="text-sm text-red-700">{getErrorMessage(loadError)}</p>
        <button onClick={reload} className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Try again
        </button>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
