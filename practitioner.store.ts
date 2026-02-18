import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string | null
  role: string
  isActive: boolean
}

interface PractitionerState {
  practitioners: User[]
  activePractitioner: User | null
  isLoading: boolean

  loadPractitioners: () => Promise<void>
  setActivePractitioner: (id: string) => Promise<void>
}

export const usePractitionerStore = create<PractitionerState>((set, get) => ({
  practitioners: [],
  activePractitioner: null,
  isLoading: true,

  loadPractitioners: async (): Promise<void> => {
    try {
      const practitioners = await window.api.users.list()
      const activeId = await window.api.settings.get('active_practitioner_id')

      let active: User | null = null
      if (activeId) {
        active = practitioners.find((p) => p.id === activeId) || null
      }
      // Fallback to first practitioner
      if (!active && practitioners.length > 0) {
        active = practitioners[0]
        await window.api.settings.set('active_practitioner_id', active.id)
      }

      set({ practitioners, activePractitioner: active, isLoading: false })
    } catch (error) {
      console.error('Failed to load practitioners:', error)
      set({ isLoading: false })
    }
  },

  setActivePractitioner: async (id: string): Promise<void> => {
    const { practitioners } = get()
    const practitioner = practitioners.find((p) => p.id === id) || null

    if (practitioner) {
      await window.api.settings.set('active_practitioner_id', id)
      set({ activePractitioner: practitioner })
    }
  }
}))
