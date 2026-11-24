import { useState } from 'react'
import { CheckCircle2, Droplets, GraduationCap } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageToggle from './LanguageToggle'
import WaterBackground from './WaterBackground'
import { AuthFooter } from './Footer'
import waterBg from '../assets/water-bg.jpg'

const FEATURE_KEYS = ['auth.feature1', 'auth.feature2', 'auth.feature3']

// Water photo with the project's name and main features: left half on desktop, top banner on mobile
function BrandPanel() {
  const { t } = useLanguage()
  return (
    <div className="relative flex flex-col justify-between gap-6 overflow-hidden p-5 text-white sm:gap-8 sm:p-8 lg:p-10">
      <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${waterBg})` }} />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/60 to-slate-900/30" />

      <div className="relative flex items-center gap-2 text-base font-bold sm:text-lg">
        <Droplets className="h-6 w-6" aria-hidden="true" />
        {t('app.name')}
      </div>

      <div className="relative">
        <h2 className="text-xl font-bold leading-tight sm:text-2xl lg:text-3xl">{t('auth.heroTitle')}</h2>
        <p className="mt-2 text-xs text-slate-200 sm:mt-3 sm:text-sm">{t('auth.heroText')}</p>
        <ul className="mt-5 space-y-2.5 lg:mt-6">
          {FEATURE_KEYS.map((key) => (
            <li key={key} className="flex items-center gap-2.5 text-xs font-medium sm:text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Shared card layout and inputs for the Login and Register pages
export function AuthCard({ title, subtitle, children }) {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <WaterBackground overlay="bg-navy-950/75" />

      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-navy-900 shadow-2xl ring-1 ring-white/10 lg:grid-cols-2">
        <BrandPanel />

        <div className="px-5 py-6 sm:px-12 sm:py-10">
          <LanguageToggle className="mb-6 justify-end" />
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 sm:mb-4 sm:h-14 sm:w-14">
            <GraduationCap className="h-7 w-7 text-white sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <h1 className="text-center text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          <p className="mt-1 text-center text-sm text-slate-400">{subtitle}</p>
          <div className="mt-6 sm:mt-8">{children}</div>
        </div>
      </div>

      <AuthFooter />
    </main>
  )
}

export function Field({ label, type = 'text', ...inputProps }) {
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <div className="relative mt-1.5">
        <input
          {...inputProps}
          type={isPassword && showPassword ? 'text' : type}
          dir={type === 'email' ? 'ltr' : undefined}
          className={`w-full rounded-lg border border-white/15 bg-navy-950/50 px-3.5 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 ${isPassword ? 'pe-20' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 end-0 px-3 text-sm font-semibold text-slate-400 hover:text-white"
          >
            {showPassword ? t('auth.hide') : t('auth.show')}
          </button>
        )}
      </div>
    </label>
  )
}

export function ErrorMessage({ children }) {
  if (!children) return null
  return <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{children}</p>
}

export function SubmitButton({ loading, children }) {
  const { t } = useLanguage()
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
    >
      {loading ? t('common.pleaseWait') : children}
    </button>
  )
}
