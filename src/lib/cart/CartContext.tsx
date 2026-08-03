'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  imageUrl: string | null
  stockQuantity: number
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  isOpen: boolean
  open: () => void
  close: () => void
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
  subtotal: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'ae_cart'

function loadStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Cart starts empty during SSR/first paint (no access to localStorage),
  // then hydrates from storage — avoids a server/client markup mismatch.
  useEffect(() => {
    setItems(loadStoredCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem: CartContextValue['addItem'] = (item, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId)
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, item.stockQuantity)
        return prev.map(i => i.productId === item.productId ? { ...i, quantity: nextQty } : i)
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.stockQuantity) }]
    })
    setIsOpen(true)
  }

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }

  const setQuantity = (productId: string, quantity: number) => {
    setItems(prev => prev.map(i => {
      if (i.productId !== productId) return i
      const clamped = Math.max(1, Math.min(quantity, i.stockQuantity))
      return { ...i, quantity: clamped }
    }))
  }

  const clear = () => setItems([])

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false),
      addItem, removeItem, setQuantity, clear, subtotal, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
