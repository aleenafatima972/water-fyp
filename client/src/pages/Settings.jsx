import { Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import PageHeader from '../components/PageHeader'
import RoleBadge from '../components/RoleBadge'
import LanguageToggle from '../components/LanguageToggle'

export default function Settings() {
  const { user } = useAuth()
  const { t, locale } = useLanguage()

  const rows = [
    [t('dashboard.name'), user.name],
    [t('dashboard.email'), <span key="email" className="font-latin" dir="ltr">{user.email}</span>],
    [t('dashboard.role'), <RoleBadge key="role" role={user.role} />],
    [t('settings.memberSince'), new Date(user.created_at + 'Z').toLocaleDateString(locale, { dateStyle: 'medium' })],
    [t('lang.label'), <LanguageToggle key="lang" />],
  ]

  return (
    <>
      <PageHeader icon={SettingsIcon} title={t('settings.title')} description={t('settings.desc')} />
      <section className="overflow-hidden rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10">
        {/* Profile banner: initial in a circle, name and email */}
        <div className="flex items-center gap-4 bg-linear-to-r from-blue-500 to-blue-700 px-5 py-6 sm:px-7">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-blue-700 shadow-lg ring-4 ring-white/30">
            {user.name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 text-white">
            <p className="truncate text-lg font-semibold">{user.name}</p>
            <p className="font-latin truncate text-sm text-sky-100" dir="ltr">{user.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-white/5 px-5 sm:px-7">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-center sm:gap-4">
              <dt className="w-44 shrink-0 text-sm font-semibold text-slate-300">{label}</dt>
              <dd className="break-all text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
