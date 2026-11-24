import { useLanguage } from '../i18n/LanguageContext'

export default function RoleBadge({ role }) {
  const { t } = useLanguage()
  const styles = role === 'admin' ? 'bg-amber-500/15 text-amber-200' : 'bg-blue-500/15 text-slate-100'
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>{t(`role.${role}`)}</span>
}
