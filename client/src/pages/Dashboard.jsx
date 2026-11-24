import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, FlaskConical, ShieldCheck, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { api } from '../api'

const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0)

const TONES = {
  sky: {
    badge: 'from-blue-500 to-blue-700 shadow-blue-500/30',
    card: 'from-navy-900/90 to-blue-500/15',
    watermark: 'text-slate-400',
    bar: 'from-blue-400 to-blue-600',
  },
  red: {
    badge: 'from-rose-500 to-red-600 shadow-red-500/30',
    card: 'from-navy-900/90 to-red-500/15',
    watermark: 'text-red-400',
    bar: 'from-rose-400 to-red-600',
  },
  green: {
    badge: 'from-emerald-500 to-green-600 shadow-green-500/30',
    card: 'from-navy-900/90 to-emerald-500/15',
    watermark: 'text-emerald-400',
    bar: 'from-emerald-400 to-green-600',
  },
}

// `bar` (0–100) draws a progress bar under the number; omit it for cards without a share
function SummaryCard({ title, value, note, icon: Icon, tone, loading, bar }) {
  const colors = TONES[tone]

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-linear-to-br p-5 shadow-lg sm:p-7 ring-1 ring-white/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl ${colors.card}`}
    >
      {/* Large faded icon in the corner, decoration only */}
      <Icon aria-hidden="true" className={`pointer-events-none absolute -bottom-6 -end-6 h-32 w-32 opacity-[0.06] ${colors.watermark}`} />

      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 bg-linear-to-br shadow-lg ${colors.badge}`}>
          <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-slate-100 sm:text-base">{title}</p>
      </div>

      <div className="relative mt-4 sm:mt-6">
        {loading ? (
          <div className="h-12 w-20 animate-pulse rounded-lg bg-blue-500/15" />
        ) : (
          <p className="font-latin text-4xl font-bold text-white sm:text-5xl">{value}</p>
        )}
      </div>

      <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-blue-500/20">
        {bar !== undefined && (
          <div
            className={`h-full rounded-full bg-linear-to-r transition-[width] duration-700 ${colors.bar}`}
            style={{ width: `${loading ? 0 : bar}%` }}
          />
        )}
      </div>
      <p className="relative mt-3 text-sm font-medium text-slate-300">{loading ? ' ' : note}</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { t, tError } = useLanguage()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api('/samples/summary')
      .then(setSummary)
      .catch(setError)
  }, [])

  const loading = !summary && !error
  const { total = 0, contaminated = 0, safe = 0, pending = 0 } = summary ?? {}

  return (
    <>
      <section className="mb-8 rounded-3xl bg-navy-900/80 px-5 py-7 text-center sm:py-10 shadow-lg ring-1 ring-white/10 backdrop-blur sm:px-10">
        <h1 className="text-2xl font-semibold text-slate-100 sm:text-3xl lg:text-4xl">{t('dashboard.welcome', { name: user.name })}</h1>
        <Link
          to="/upload"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-medium sm:px-6 sm:py-3 sm:text-base text-white shadow-lg shadow-blue-600/40 transition hover:from-blue-700 hover:to-blue-800"
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          {t('nav.upload')}
        </Link>
      </section>

      {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{tError(error)}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard
          title={t('dashboard.totalSamples')}
          value={total}
          note={pending ? t('dashboard.awaiting', { count: pending }) : t('dashboard.allAnalysed')}
          icon={FlaskConical}
          tone="sky"
          loading={loading}
          bar={total ? 100 : 0}
        />
        <SummaryCard
          title={t('dashboard.contaminated')}
          value={contaminated}
          note={t('dashboard.percentOfAll', { percent: percent(contaminated, total) })}
          icon={AlertTriangle}
          tone="red"
          loading={loading}
          bar={percent(contaminated, total)}
        />
        <SummaryCard
          title={t('dashboard.safe')}
          value={safe}
          note={t('dashboard.percentOfAll', { percent: percent(safe, total) })}
          icon={ShieldCheck}
          tone="green"
          loading={loading}
          bar={percent(safe, total)}
        />
      </div>
    </>
  )
}
