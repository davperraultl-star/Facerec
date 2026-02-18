import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSettings } from './stores/app-settings.store'
import { AppLayout } from './components/layout/app-layout'
import { Onboarding } from './pages/onboarding'
import { Dashboard } from './pages/dashboard'
import { RegisterPatient } from './pages/register-patient'
import { BrowsePatients } from './pages/browse-patients'
import { PatientProfile } from './pages/patient-profile'
import { VisitPage } from './pages/visit-page'
import { CompareVisits } from './pages/compare-visits'
import { Portfolio } from './pages/portfolio'
import { Settings } from './pages/settings'
import { CaseSearch } from './pages/case-search'
import { Presentation } from './pages/presentation'
import { LogoIcon } from './components/layout/logo-icon'

function App(): React.JSX.Element {
  const { isLoading, onboardingCompleted, language, theme, loadInitialSettings } = useAppSettings()
  const { i18n } = useTranslation()

  // Load settings from DB on mount
  useEffect(() => {
    loadInitialSettings()
  }, [])

  // Sync language from DB into i18next
  useEffect(() => {
    if (!isLoading && language) {
      i18n.changeLanguage(language)
    }
  }, [isLoading, language])

  // Sync theme from DB into DOM
  useEffect(() => {
    if (!isLoading) {
      if (theme === 'light') {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('apexrec-theme', 'light')
      } else {
        document.documentElement.classList.add('dark')
        localStorage.setItem('apexrec-theme', 'dark')
      }
    }
  }, [isLoading, theme])

  // Loading screen
  if (isLoading) {
    return <LoadingScreen />
  }

  // First launch — show onboarding
  if (!onboardingCompleted) {
    return <Onboarding />
  }

  // Normal app
  return (
    <HashRouter>
      <Routes>
        {/* Presentation mode — outside AppLayout (no navbar) */}
        <Route path="/presentation/:portfolioId" element={<Presentation />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<RegisterPatient />} />
          <Route path="/patients" element={<BrowsePatients />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/patients/:patientId/visits/:visitId" element={<VisitPage />} />
          <Route path="/patients/:patientId/compare" element={<CompareVisits />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/search" element={<CaseSearch />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

function LoadingScreen(): React.JSX.Element {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LogoIcon className="h-12 w-12 text-foreground animate-pulse" />
        <div className="flex items-center gap-1">
          <span className="text-lg font-extralight tracking-[0.25em] text-primary">APEX</span>
          <span className="text-lg font-semibold tracking-[0.25em] text-foreground">REC</span>
        </div>
      </div>
    </div>
  )
}

export default App
