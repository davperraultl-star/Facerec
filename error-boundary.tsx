import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                An unexpected error occurred. You can try again or reload the application.
              </p>
            </div>
            {this.state.error && (
              <div className="w-full surface-elevated rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={this.handleRetry} className="btn-secondary text-sm">
                Try Again
              </button>
              <button onClick={this.handleReload} className="btn-primary text-sm flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Reload App
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
