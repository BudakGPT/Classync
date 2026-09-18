import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-[13px] text-rose-800">
        <p className="font-bold">This view failed to render.</p>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs opacity-80">{this.state.error.message}</pre>
        <button type="button" onClick={() => this.setState({ error: null })} className="mt-3 rounded-lg bg-white px-3 py-1.5 font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">Try again</button>
      </div>
    )
  }
}
