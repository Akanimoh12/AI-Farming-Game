import { create } from 'zustand'

type ModalType =
  | 'wallet'
  | 'marketplace'
  | 'inventory'
  | 'settings'
  | 'achievement'
  | 'harvest'
  | null

interface Toast {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface UIStore {
  // Modal state
  activeModal: ModalType
  modalData: Record<string, unknown> | null

  // Loading state
  isLoading: boolean
  loadingMessage: string

  // Toast notifications
  toasts: Toast[]

  // Sidebar state
  isSidebarOpen: boolean

  // Actions
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void
  closeModal: () => void

  setLoading: (isLoading: boolean, message?: string) => void

  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  activeModal: null,
  modalData: null,
  isLoading: false,
  loadingMessage: '',
  toasts: [],
  isSidebarOpen: true,

  // Modal actions
  openModal: (modal, data) => set({ activeModal: modal, modalData: data || null }),

  closeModal: () => set({ activeModal: null, modalData: null }),

  // Loading actions
  setLoading: (isLoading, message = '') =>
    set({ isLoading, loadingMessage: isLoading ? message : '' }),

  // Toast actions
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast = { ...toast, id }
    set((state) => ({ toasts: [...state.toasts, newToast] }))

    // Auto remove after duration
    const duration = toast.duration || 3000
    setTimeout(() => {
      get().removeToast(id)
    }, duration)

    return id
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))

// Helper functions for common toast types
export const showSuccessToast = (title: string, message: string) => {
  useUIStore.getState().addToast({ title, message, type: 'success' })
}

export const showErrorToast = (title: string, message: string) => {
  useUIStore.getState().addToast({ title, message, type: 'error', duration: 5000 })
}

export const showInfoToast = (title: string, message: string) => {
  useUIStore.getState().addToast({ title, message, type: 'info' })
}

export const showWarningToast = (title: string, message: string) => {
  useUIStore.getState().addToast({ title, message, type: 'warning', duration: 4000 })
}
