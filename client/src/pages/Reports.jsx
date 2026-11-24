import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { FileText, Search, Upload } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import PageHeader from '../components/PageHeader'
import { DownloadButton, Num, StatusBadge } from '../components/ReportBits'
import { formatDate, usePdfDownload } from '../utils/reports'

const FILTERS = ['all', 'safe', 'contaminated']

export default function Reports() {
  const { user } = useAuth()
  const { t, tError, locale } = useLanguage()
  const isAdmin = user.role === 'admin'
  const [reports, setReports] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const { downloading, downloadError, download: handleDownload } = usePdfDownload()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api('/reports')
      .then((data) => setReports(data.reports))
      .catch(setLoadError)
  }, [])

  const visible = useMemo(() => {
    if (!reports) return []
    const query = search.trim().toLowerCase()
    return reports.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false
      if (!query) return true
      // Match English and translated words, so searching "دریا" or "river" both work
      const haystack = [
        r.reportId,
        r.location,
        r.sourceType,
        r.sourceType && t(`water.${r.sourceType}`),
        formatDate(r.createdAt, locale),
        r.createdAt,
        isAdmin && r.userName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [reports, search, filter, t, locale, isAdmin])

  const header = <PageHeader icon={FileText} title={t('nav.reports')} description={t('reports.desc')} />

  if (loadError) {
    return (
      <>
        {header}
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{tError(loadError)}</p>
      </>
    )
  }

  if (!reports) {
    return (
      <>
        {header}
        <div className="h-48 animate-pulse rounded-3xl bg-navy-900/60 shadow-lg shadow-black/30" />
      </>
    )
  }

  if (reports.length === 0) {
    return (
      <>
        {header}
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-white/10 bg-navy-900/80 px-6 py-14 text-center shadow-lg shadow-black/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15"><FileText className="h-8 w-8 text-slate-400" /></div>
          <p className="mt-4 font-semibold text-white">{t('reports.empty')}</p>
          <p className="mt-1 mb-5 text-sm text-slate-300">{t('reports.emptyDesc')}</p>
          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-5 py-2.5 font-semibold text-white shadow-md shadow-blue-600/30 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> {t('crops.uploadSample')}
          </Link>
        </div>
      </>
    )
  }

  const waterBody = (r) => (r.sourceType ? t(`water.${r.sourceType}`) : t('common.none'))

  return (
    <>
      {header}

      {/* Search and filter */}
      <div className="mb-5 flex flex-col gap-3 rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10 p-4 md:flex-row md:items-center md:justify-between">
        <label className="relative block md:w-96">
          <span className="sr-only">{t('reports.searchPlaceholder')}</span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
          <input
            type="search"
            dir="auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('reports.searchPlaceholder')}
            className="w-full rounded-xl border border-white/10 bg-navy-950/50 py-2.5 ps-10 pe-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/25"
          />
        </label>
        <div role="group" className="inline-flex self-start rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              {t(`reports.filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 px-1 text-sm font-medium text-slate-300">{t('reports.showing', { shown: visible.length, total: reports.length })}</p>
      {downloadError && (
        <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{tError(downloadError)}</p>
      )}

      {visible.length === 0 ? (
        <div className="rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10 px-6 py-12 text-center">
          <p className="font-medium text-slate-100">{t('reports.noMatch')}</p>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
            className="mt-3 text-sm font-semibold text-slate-300 hover:underline"
          >
            {t('reports.clearFilters')}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden overflow-x-auto rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10 md:block">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3.5 text-start font-semibold">{t('reports.col.reportId')}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{t('reports.col.date')}</th>
                  {isAdmin && <th className="px-4 py-3.5 text-start font-semibold">{t('reports.col.user')}</th>}
                  <th className="px-4 py-3.5 text-start font-semibold">{t('reports.col.waterBody')}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{t('param.ph')}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{t('param.tds')}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{t('param.turbidity')}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{t('param.temperature')}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{t('reports.col.status')}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{t('reports.col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/10">
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-100"><Num>{r.reportId}</Num></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-100">{formatDate(r.createdAt, locale)}</td>
                    {isAdmin && <td className="px-4 py-3.5 text-slate-100">{r.userName}</td>}
                    <td className="px-4 py-3.5">
                      {waterBody(r)}
                      {r.location && <span className="block max-w-[12rem] truncate text-xs text-slate-300">{r.location}</span>}
                    </td>
                    <td className="px-4 py-3.5"><Num>{r.ph}</Num></td>
                    <td className="whitespace-nowrap px-4 py-3.5"><Num>{r.tds} mg/L</Num></td>
                    <td className="whitespace-nowrap px-4 py-3.5"><Num>{r.turbidity} NTU</Num></td>
                    <td className="whitespace-nowrap px-4 py-3.5"><Num>{r.temperature} °C</Num></td>
                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5">
                      <DownloadButton report={r} downloading={downloading} onDownload={handleDownload} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: one card per report */}
          <ul className="space-y-3 md:hidden">
            {visible.map((r) => (
              <li key={r.id} className="rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white"><Num>{r.reportId}</Num></p>
                    <p className="text-xs text-slate-300">{formatDate(r.createdAt, locale)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-2 truncate text-sm text-slate-100">
                  {waterBody(r)}
                  {r.location && <> · {r.location}</>}
                  {isAdmin && <> · {r.userName}</>}
                </p>
                <dl className="mt-3 grid grid-cols-4 gap-2 rounded-2xl bg-white/5 p-3 text-center">
                  {[
                    ['ph', r.ph, ''],
                    ['tds', r.tds, 'mg/L'],
                    ['turbidity', r.turbidity, 'NTU'],
                    ['temperature', r.temperature, '°C'],
                  ].map(([key, value, unit]) => (
                    <div key={key} className="min-w-0">
                      <dt className="truncate text-[11px] text-slate-300">{t(`param.${key}`)}</dt>
                      <dd className="text-sm font-semibold text-white">
                        <Num>{value}</Num>
                        {unit && <span className="font-latin block text-[10px] font-normal text-sky-400">{unit}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
                <DownloadButton report={r} downloading={downloading} onDownload={handleDownload} className="mt-3 w-full" />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
