import { useLayoutEffect, useRef, type UIEvent } from 'react'

// Scroll position of each main tab. It is kept in memory while the user visits other tabs (CC-02).
const savedPositions = new Map<string, number>()

// Props for a page's scroll container. The position is saved on every scroll and restored when the page opens again.
// Pages that load their content later may restore to the top, because the content is not there yet.
export function useTabScroll<T extends HTMLElement>(tab: string) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = savedPositions.get(tab) ?? 0
    }
  }, [tab])

  return {
    ref,
    'data-scroll-tab': tab,
    onScroll: (event: UIEvent<T>) => savedPositions.set(tab, event.currentTarget.scrollTop),
  }
}
