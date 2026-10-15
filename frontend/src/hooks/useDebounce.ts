import { useCallback, useEffect, useRef } from 'react'

export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delay = 400) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latest = useRef(callback)

  useEffect(() => {
    latest.current = callback
  }, [callback])

  useEffect(() => () => clearTimeout(timer.current), [])

  const cancel = useCallback(() => clearTimeout(timer.current), [])

  const run = useCallback((...args: Args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => latest.current(...args), delay)
  }, [delay])

  return { run, cancel }
}
