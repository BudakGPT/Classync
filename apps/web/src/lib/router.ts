import { useSyncExternalStore } from 'react'

// Tiny hash router: '#/classes/B?tab=members' → { path: '/classes/B', segments: ['classes','B'], params }
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const getHash = () => window.location.hash.slice(1) || '/'

export function useRoute() {
  const raw = useSyncExternalStore(subscribe, getHash)
  const [path, query = ''] = raw.split('?')
  return { path, segments: path.split('/').filter(Boolean), params: new URLSearchParams(query) }
}

export const navigate = (to: string) => { window.location.hash = to }
export const href = (to: string) => `#${to}`
