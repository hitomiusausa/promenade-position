import { useEffect, useState } from 'react'

export type Route =
  | { page: 'dances' }
  | { page: 'figures'; dance: string }
  | { page: 'figure'; dance: string; figureId: string }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'figures' && parts.length === 2) return { page: 'figures', dance: parts[1] }
  if (parts[0] === 'figure' && parts.length === 3) return { page: 'figure', dance: parts[1], figureId: parts[2] }
  return { page: 'dances' }
}

export function navigate(path: string) {
  location.hash = path
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
