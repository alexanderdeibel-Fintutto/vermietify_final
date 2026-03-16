import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true, error: _error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-slate-200">
            <div className="text-6xl mb-4">⚔️</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Ups, da ist etwas schiefgelaufen
            </h1>
            <p className="text-slate-600 mb-6">
              Keine Sorge - versuche die Seite neu zu laden.
            </p>

            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Seite neu laden
              </button>
              <a
                href="/"
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                Zur Startseite
              </a>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-semibold">
                  Fehlerdetails
                </summary>
                <pre className="mt-3 bg-slate-100 p-3 rounded text-xs text-slate-700 overflow-auto max-h-40 border border-slate-200">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
