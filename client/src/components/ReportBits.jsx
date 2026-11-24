// Small pieces shared by the Reports and admin Records pages
import { Download, Loader2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export function StatusBadge({ status }) {
  const { t } = useLanguage()
  const contaminated = status === 'contaminated'
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        contaminated ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${contaminated ? 'bg-red-500' : 'bg-green-500'}`} aria-hidden="true" />
      {contaminated ? t('result.contaminated') : t('result.safe')}
    </span>
  )
}

// `compact` shows just "PDF" (for the table); the full label stays available as a tooltip
export function DownloadButton({ report, downloading, onDownload, compact = false, className = '' }) {
  const { t } = useLanguage()
  const busy = downloading === report.id
  const label = busy ? t('reports.downloading') : t('reports.download')
  return (
    <button
      type="button"
      onClick={() => onDownload(report)}
      disabled={busy}
      title={label}
      aria-label={`${label} ${report.reportId}`}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-white/10 bg-navy-950/50 px-3 py-1.5 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-blue-400/60 hover:bg-white/10 disabled:opacity-60 ${className}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {compact ? <span className="font-latin">PDF</span> : label}
    </button>
  )
}

export const Num = ({ children }) => <span className="font-latin" dir="ltr">{children}</span>
