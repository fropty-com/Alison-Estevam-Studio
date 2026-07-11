'use client'

import { useEffect, useRef } from 'react'

/**
 * Scroll-triggered reveal animation hook.
 * Adds 'visible' class when element enters viewport.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -36px 0px',
        ...options,
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return ref
}

/**
 * Initialize all .reveal elements on the page.
 * Use in layout or page components to activate all reveals at once.
 *
 * Sections like Servicos/Cuidados render their .reveal cards after an
 * async fetch resolves, so a one-time querySelectorAll at mount misses
 * them entirely — they'd stay opacity:0 forever, present in the DOM but
 * invisible. A MutationObserver keeps watching so newly-added .reveal
 * elements (from any section, now or in the future) get observed too.
 */
export function useRevealAll() {
  useEffect(() => {
    const observed = new WeakSet<Element>()

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -36px 0px' }
    )

    const watch = (el: Element) => {
      if (observed.has(el)) return
      observed.add(el)
      io.observe(el)
    }

    const scan = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>('.reveal').forEach(watch)
    }

    scan(document)

    const mo = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return
          if (node.classList.contains('reveal')) watch(node)
          scan(node)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
}
