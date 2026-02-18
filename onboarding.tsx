import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoIcon } from '../components/layout/logo-icon'
import { useAppSettings } from '../stores/app-settings.store'
import { Moon, Sun, Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

const TOTAL_STEPS = 4

export function Onboarding(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const completeOnboarding = useAppSettings((s) => s.completeOnboarding)

  const [step, setStep] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>('dark')
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  const goNext = useCallback(() => {
    if (transitioning) return
    setDirection('forward')
    setTransitioning(true)
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
      setTransitioning(false)
    }, 250)
  }, [transitioning])

  const goBack = useCallback(() => {
    if (transitioning) return
    setDirection('backward')
    setTransitioning(true)
    setTimeout(() => {
      setStep((s) => Math.max(s - 1, 0))
      setTransitioning(false)
    }, 250)
  }, [transitioning])

  const handleLanguageSelect = (lang: string): void => {
    setSelectedLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const handleThemeSelect = (theme: 'dark' | 'light'): void => {
    setSelectedTheme(theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleComplete = async (): Promise<void> => {
    localStorage.setItem('apexrec-theme', selectedTheme)
    await completeOnboarding({ language: selectedLanguage, theme: selectedTheme })
  }

  const stepAnimation = transitioning
    ? 'opacity-0 transition-opacity duration-200'
    : direction === 'forward'
      ? 'animate-onboarding-slide-left'
      : 'animate-onboarding-slide-right'

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Background atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-onboarding-glow-pulse"
          style={{
            background: `radial-gradient(circle, hsl(var(--glow) / 0.12) 0%, transparent 70%)`
          }}
        />
      </div>

      {/* Drag region for macOS */}
      <div className="drag-region absolute top-0 left-0 right-0 h-8" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-8">
        {/* Step content */}
        <div key={step} className={stepAnimation}>
          {step === 0 && <WelcomeStep onNext={goNext} t={t} />}
          {step === 1 && (
            <LanguageStep
              selected={selectedLanguage}
              onSelect={handleLanguageSelect}
              t={t}
            />
          )}
          {step === 2 && (
            <ThemeStep selected={selectedTheme} onSelect={handleThemeSelect} t={t} />
          )}
          {step === 3 && (
            <ReadyStep
              onComplete={handleComplete}
              language={selectedLanguage}
              theme={selectedTheme}
              t={t}
            />
          )}
        </div>

        {/* Navigation footer — steps 1, 2 */}
        {step > 0 && step < 3 && (
          <div className="mt-10 flex items-center justify-between animate-onboarding-fade-in">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('onboarding.back')}
            </button>
            <button onClick={goNext} className="btn-primary flex items-center gap-2 text-sm">
              {t('onboarding.next')}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-10 flex items-center gap-2.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step
                ? 'w-8 bg-primary'
                : i < step
                  ? 'w-1.5 bg-primary/40'
                  : 'w-1.5 bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Step Components ───────────────────────────────────────────── */

function WelcomeStep({
  onNext,
  t
}: {
  onNext: () => void
  t: (key: string) => string
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Logo */}
      <div className="animate-onboarding-scale-in">
        <div className="relative">
          <LogoIcon className="h-24 w-24 text-foreground" />
          <div
            className="absolute inset-0 blur-2xl animate-onboarding-glow-pulse"
            style={{
              background: `radial-gradient(circle, hsl(var(--glow) / 0.2) 0%, transparent 70%)`
            }}
          />
        </div>
      </div>

      {/* App name */}
      <div className="mt-8 animate-onboarding-fade-in animate-delay-200">
        <span className="text-3xl font-extralight tracking-[0.3em] text-primary">APEX</span>
        <span className="text-3xl font-semibold tracking-[0.3em] text-foreground">REC</span>
      </div>

      {/* Subtitle */}
      <p className="mt-3 text-sm text-muted-foreground animate-onboarding-fade-in animate-delay-400">
        {t('onboarding.welcome.subtitle')}
      </p>

      {/* Get Started button */}
      <button
        onClick={onNext}
        className="mt-10 btn-primary flex items-center gap-2.5 text-sm animate-onboarding-fade-in animate-delay-600"
      >
        <Sparkles className="h-4 w-4" />
        {t('onboarding.welcome.getStarted')}
      </button>
    </div>
  )
}

function LanguageStep({
  selected,
  onSelect,
  t
}: {
  selected: string
  onSelect: (lang: string) => void
  t: (key: string) => string
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold tracking-tight animate-onboarding-fade-in">
        {t('onboarding.language.title')}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground animate-onboarding-fade-in animate-delay-100">
        {t('onboarding.language.subtitle')}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
        <LanguageCard
          label="English"
          flag="🇬🇧"
          isSelected={selected === 'en'}
          onClick={() => onSelect('en')}
          delay="animate-delay-200"
        />
        <LanguageCard
          label="Français"
          flag="🇫🇷"
          isSelected={selected === 'fr'}
          onClick={() => onSelect('fr')}
          delay="animate-delay-300"
        />
      </div>
    </div>
  )
}

function LanguageCard({
  label,
  flag,
  isSelected,
  onClick,
  delay
}: {
  label: string
  flag: string
  isSelected: boolean
  onClick: () => void
  delay: string
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`animate-onboarding-fade-in ${delay} relative flex flex-col items-center gap-3 p-6 rounded-xl border transition-all duration-300 ${
        isSelected
          ? 'border-primary/60 bg-primary/[0.08] shadow-[0_0_20px_hsl(var(--glow)/0.1)]'
          : 'border-border/60 bg-surface-1 hover:border-border hover:bg-accent/40'
      }`}
    >
      <span className="text-3xl">{flag}</span>
      <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
        {label}
      </span>
      {isSelected && (
        <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </button>
  )
}

function ThemeStep({
  selected,
  onSelect,
  t
}: {
  selected: 'dark' | 'light'
  onSelect: (theme: 'dark' | 'light') => void
  t: (key: string) => string
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold tracking-tight animate-onboarding-fade-in">
        {t('onboarding.theme.title')}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground animate-onboarding-fade-in animate-delay-100">
        {t('onboarding.theme.subtitle')}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
        {/* Dark theme card */}
        <button
          onClick={() => onSelect('dark')}
          className={`animate-onboarding-fade-in animate-delay-200 relative flex flex-col items-center gap-3 p-6 rounded-xl border transition-all duration-300 ${
            selected === 'dark'
              ? 'border-primary/60 bg-primary/[0.08] shadow-[0_0_20px_hsl(var(--glow)/0.1)]'
              : 'border-border/60 bg-surface-1 hover:border-border hover:bg-accent/40'
          }`}
        >
          {/* Mini preview */}
          <div className="w-full aspect-[4/3] rounded-lg bg-[hsl(228,24%,6%)] border border-[hsl(226,16%,14%)] p-2 flex flex-col gap-1.5">
            <div className="h-1.5 w-10 rounded-full bg-[hsl(210,80%,58%)]" />
            <div className="flex-1 rounded bg-[hsl(226,22%,9%)]" />
            <div className="h-1 w-8 rounded-full bg-[hsl(215,14%,25%)]" />
          </div>
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span
              className={`text-sm font-medium ${selected === 'dark' ? 'text-primary' : 'text-foreground'}`}
            >
              {t('onboarding.theme.dark')}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{t('onboarding.theme.darkDesc')}</p>
          {selected === 'dark' && (
            <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </button>

        {/* Light theme card */}
        <button
          onClick={() => onSelect('light')}
          className={`animate-onboarding-fade-in animate-delay-300 relative flex flex-col items-center gap-3 p-6 rounded-xl border transition-all duration-300 ${
            selected === 'light'
              ? 'border-primary/60 bg-primary/[0.08] shadow-[0_0_20px_hsl(var(--glow)/0.1)]'
              : 'border-border/60 bg-surface-1 hover:border-border hover:bg-accent/40'
          }`}
        >
          {/* Mini preview */}
          <div className="w-full aspect-[4/3] rounded-lg bg-[hsl(210,20%,98%)] border border-[hsl(214,20%,88%)] p-2 flex flex-col gap-1.5">
            <div className="h-1.5 w-10 rounded-full bg-[hsl(210,80%,55%)]" />
            <div className="flex-1 rounded bg-white" />
            <div className="h-1 w-8 rounded-full bg-[hsl(215,14%,82%)]" />
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span
              className={`text-sm font-medium ${selected === 'light' ? 'text-primary' : 'text-foreground'}`}
            >
              {t('onboarding.theme.light')}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{t('onboarding.theme.lightDesc')}</p>
          {selected === 'light' && (
            <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

function ReadyStep({
  onComplete,
  language,
  theme,
  t
}: {
  onComplete: () => void
  language: string
  theme: string
  t: (key: string) => string
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Checkmark */}
      <div className="animate-onboarding-check-bounce">
        <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-primary/25 flex items-center justify-center">
            <Check className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-2xl font-semibold tracking-tight animate-onboarding-fade-in animate-delay-200">
        {t('onboarding.ready.title')}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground animate-onboarding-fade-in animate-delay-300">
        {t('onboarding.ready.subtitle')}
      </p>

      {/* Preferences summary */}
      <div className="mt-6 flex items-center gap-6 animate-onboarding-fade-in animate-delay-400">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-lg">{language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
          <span>{language === 'fr' ? 'Français' : 'English'}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          <span>{theme === 'dark' ? t('onboarding.theme.dark') : t('onboarding.theme.light')}</span>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="mt-10 btn-primary flex items-center gap-2.5 text-sm animate-onboarding-fade-in animate-delay-500"
      >
        {t('onboarding.ready.launch')}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
