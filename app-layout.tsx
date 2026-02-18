import { Outlet } from 'react-router-dom'
import { Navbar } from './navbar'
import { ErrorBoundary } from '../ui/error-boundary'
import { ToastContainer } from '../ui/toast'

export function AppLayout(): React.JSX.Element {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 overflow-auto">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <ToastContainer />
    </div>
  )
}
