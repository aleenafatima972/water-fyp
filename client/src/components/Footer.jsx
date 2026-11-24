import { Link } from 'react-router'
import { Droplets } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const QUICK_LINKS = [
  { to: '/dashboard', labelKey: 'nav.dashboard' },
  { to: '/upload', labelKey: 'nav.upload' },
  { to: '/crops', labelKey: 'nav.crops' },
  { to: '/reports', labelKey: 'nav.reports' },
]

// Read once when the app loads, so the footer never shows an old year
const YEAR = new Date().getFullYear()

function Copyright({ className }) {
  const { t } = useLanguage()
  return <p className={className}>{t('footer.copyright', { year: YEAR, name: t('app.name') })}</p>
}

// Slim one-line footer for the logged-in pages (inside AppLayout); stacks on small screens
export function AppFooter() {
  const { t } = useLanguage()
  return (
    <footer className="mt-auto border-t border-white/10 bg-navy-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-3 text-center sm:px-6 lg:flex-row lg:justify-between lg:gap-6 lg:px-8 lg:text-start">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-blue-500 to-blue-700">
            <Droplets className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </div>
          <Copyright className="text-xs font-medium text-slate-100" />
        </div>

        <nav aria-label={t('footer.quickLinks')} className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px]">
          {QUICK_LINKS.map(({ to, labelKey }) => (
            <Link key={to} to={to} className="whitespace-nowrap text-slate-300 transition-colors hover:text-white">
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <span className="whitespace-nowrap rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
          {t('footer.fyp')}
        </span>
      </div>
    </footer>
  )
}

// Small footer under the Login / Register card
export function AuthFooter() {
  return (
    <footer className="relative mt-6 text-center text-xs text-slate-200">
      <Copyright />
    </footer>
  )
}
