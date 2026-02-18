import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast): void => {
    const id = crypto.randomUUID()
    const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 3000)

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))

    // Auto-dismiss
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, duration)
  },

  removeToast: (id): void => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  },

  clearAll: (): void => {
    set({ toasts: [] })
  }
}))
