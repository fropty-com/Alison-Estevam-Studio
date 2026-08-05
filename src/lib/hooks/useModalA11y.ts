'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'

/**
 * Escape-to-close + focus trap + initial focus for a modal/dialog panel.
 * Attach the returned ref to the dialog panel element (also give that
 * element `role="dialog"` `aria-modal="true"` `tabIndex={-1}`).
 *
 * `active` lets this be used on panels that stay mounted permanently and
 * only toggle visibility via CSS (drawers that animate closed instead of
 * unmounting) — pass the same open/closed flag so focus isn't stolen and
 * Escape/Tab aren't captured while the panel is actually hidden. Modals
 * that mount/unmount conditionally (`{open && <Modal/>}`) can omit it.
 */
export function useModalA11y(onClose: () => void, active = true) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = ref.current
    if (!panel || !active) return

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
    ;(focusables()[0] ?? panel).focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const els = focusables()
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, active])

  return ref
}
