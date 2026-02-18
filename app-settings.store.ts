import { create } from 'zustand'

interface AppSettingsState {
  isLoading: boolean
  onboardingCompleted: boolean | null
  language: string
  theme: string

  loadInitialSettings: () => Promise<void>
  completeOnboarding: (prefs: { language: string; theme: string }) => Promise<void>
}

export const useAppSettings = create<AppSettingsState>((set) => ({
  isLoading: true,
  onboardingCompleted: null,
  language: 'en',
  theme: 'dark',

  loadInitialSettings: async (): Promise<void> => {
    try {
      const settings = await window.api.settings.getMultiple([
        'onboarding_completed',
        'language',
        'theme'
      ])

      set({
        isLoading: false,
        onboardingCompleted: settings['onboarding_completed'] === 'true',
        language: settings['language'] || 'en',
        theme: settings['theme'] || 'dark'
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
      set({
        isLoading: false,
        onboardingCompleted: false,
        language: 'en',
        theme: 'dark'
      })
    }
  },

  completeOnboarding: async (prefs): Promise<void> => {
    await window.api.settings.setMultiple({
      onboarding_completed: 'true',
      language: prefs.language,
      theme: prefs.theme
    })

    set({
      onboardingCompleted: true,
      language: prefs.language,
      theme: prefs.theme
    })
  }
}))
