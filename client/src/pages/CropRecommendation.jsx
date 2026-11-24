import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AlertTriangle, CheckCircle2, Sprout, Upload, XCircle } from 'lucide-react'
import { api } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import PageHeader from '../components/PageHeader'

// pH scale drawn under each crop card
const SCALE_MIN = 4
const SCALE_MAX = 10
const toPercent = (ph) => ((Math.min(SCALE_MAX, Math.max(SCALE_MIN, ph)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100

// Built here (not taken from the server's English `reason`) so it can be shown in either language
function cropReason(t, { cropName, minPh, maxPh }, ph) {
  const vars = { ph, crop: t(`crop.${cropName}`), range: `${minPh.toFixed(1)}–${maxPh.toFixed(1)}` }
  if (ph < minPh) return t('crops.reason.below', vars)
  if (ph > maxPh) return t('crops.reason.above', vars)
  return t('crops.reason.within', vars)
}

// Numbers read left-to-right in both languages, so the scale is always LTR
function PhScale({ minPh, maxPh, ph, suitable }) {
  return (
    <div className="font-latin mt-4" dir="ltr" aria-hidden="true">
      <div className="relative h-2.5 rounded-full bg-blue-500/15">
        <div
          className={`absolute inset-y-0 rounded-full ${suitable ? 'bg-emerald-400' : 'bg-white/10'}`}
          style={{ left: `${toPercent(minPh)}%`, width: `${toPercent(maxPh) - toPercent(minPh)}%` }}
        />
        <div
          className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-blue-700"
          style={{ left: `${toPercent(ph)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-sky-400">
        <span>pH {SCALE_MIN}</span>
        <span>{SCALE_MAX}</span>
      </div>
    </div>
  )
}

function scoreTone(score) {
  if (score >= 75) return { labelKey: 'crops.score.excellent', bar: 'bg-green-500', text: 'text-emerald-300' }
  if (score >= 50) return { labelKey: 'crops.score.fair', bar: 'bg-amber-400', text: 'text-amber-300' }
  return { labelKey: 'crops.score.none', bar: 'bg-white/10', text: 'text-slate-300' }
}

function ScoreMeter({ score }) {
  const { t } = useLanguage()
  const value = Math.round(score ?? 0)
  const tone = scoreTone(value)
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-slate-100">{t('crops.score')}</span>
        <span className="flex items-baseline gap-2">
          <span className="font-latin" dir="ltr">
            <span className="font-bold text-white">{value}</span>
            <span className="text-sky-400">/100</span>
          </span>
          <span className={`text-xs font-semibold ${tone.text}`}>{t(tone.labelKey)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-blue-500/15">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function CropCard({ crop, ph }) {
  const { t } = useLanguage()
  const { cropName, isSuitable, minPh, maxPh } = crop
  const hasRange = minPh !== undefined && maxPh !== undefined

  return (
    <div className={`rounded-3xl border bg-navy-900/70 p-5 shadow-lg shadow-black/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${isSuitable ? 'border-emerald-500/30' : 'border-white/10'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-2xl p-3 ${isSuitable ? 'bg-linear-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-green-500/30' : 'bg-blue-500/15 text-slate-400'}`}>
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{t(`crop.${cropName}`)}</h3>
            {hasRange && (
              <p className="text-xs text-slate-300">
                {t('crops.idealPh', { range: `${minPh.toFixed(1)}–${maxPh.toFixed(1)}` })}
              </p>
            )}
          </div>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isSuitable ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-slate-100'
          }`}
        >
          {isSuitable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {isSuitable ? t('crops.suitable') : t('crops.unsuitable')}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-100">{hasRange ? cropReason(t, crop, ph) : crop.reason}</p>
      <ScoreMeter score={crop.score} />
      {hasRange && <PhScale minPh={minPh} maxPh={maxPh} ph={ph} suitable={isSuitable} />}
    </div>
  )
}

function SampleSummary({ sample, analysis }) {
  const { t, locale } = useLanguage()
  const contaminated = analysis.isContaminated
  const items = [
    [t('crops.waterBody'), sample.sourceType ? t(`water.${sample.sourceType}`) : t('common.none')],
    [t('upload.location'), sample.location || t('common.none')],
    [t('param.ph'), <span key="ph" className="font-latin">{sample.ph}</span>],
    // SQLite stores UTC without a zone marker, so add 'Z' before converting to local time
    [t('crops.analysed'), new Date(analysis.analysedAt + 'Z').toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })],
  ]

  return (
    <section className="mb-6 rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{t('crops.sample', { id: sample.id })}</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            contaminated ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
          }`}
        >
          {t('crops.confidenceBadge', {
            status: contaminated ? t('result.contaminated') : t('result.safe'),
            percent: Math.round(analysis.confidence * 100),
          })}
        </span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl bg-white/5 p-3.5">
            <dt className="text-xs font-medium text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-white">
              {/* bdi keeps an English value (e.g. a location) from jumping to the other side in Urdu */}
              <bdi>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function UploadButton({ children }) {
  return (
    <Link
      to="/upload"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-5 py-2.5 font-semibold text-white shadow-md shadow-blue-600/30 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
    >
      <Upload className="h-4 w-4" /> {children}
    </Link>
  )
}

export default function CropRecommendation() {
  const { t, tError } = useLanguage()
  const [searchParams] = useSearchParams()
  const analysisId = searchParams.get('analysis')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api(analysisId ? `/crops/${analysisId}` : '/crops/latest')
      .then(setData)
      .catch(setError)
  }, [analysisId])

  const header = (
    <PageHeader icon={Sprout} title={t('crops.title')} description={analysisId ? t('crops.descSelected') : t('crops.descLatest')} />
  )

  if (error) {
    return (
      <>
        {header}
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{tError(error)}</p>
      </>
    )
  }

  if (!data) {
    return (
      <>
        {header}
        <div className="h-32 animate-pulse rounded-3xl bg-navy-900/60 shadow-lg shadow-black/30" />
      </>
    )
  }

  if (!data.analysis) {
    return (
      <>
        {header}
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-white/10 bg-navy-900/80 px-6 py-14 text-center shadow-lg shadow-black/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15"><Sprout className="h-8 w-8 text-slate-400" /></div>
          <p className="mt-4 font-semibold text-white">{t('crops.noSamples')}</p>
          <p className="mt-1 mb-5 text-sm text-slate-300">{t('crops.noSamplesDesc')}</p>
          <UploadButton>{t('crops.uploadSample')}</UploadButton>
        </div>
      </>
    )
  }

  const { analysis, sample, recommendations } = data
  const suitableCount = recommendations.filter((c) => c.isSuitable).length

  return (
    <>
      {header}
      <SampleSummary sample={sample} analysis={analysis} />

      {analysis.isContaminated ? (
        <section className="rounded-3xl border border-red-500/30 bg-linear-to-b from-red-500/20 to-rose-500/10 p-6 text-center shadow-lg shadow-black/30 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 to-red-600 shadow-lg shadow-red-500/30"><AlertTriangle className="h-8 w-8 text-white" /></div>
          <h2 className="mt-4 text-xl font-bold text-red-200">{t('crops.notSafeTitle')}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-red-300">{t('crops.notSafeDesc')}</p>
          <div className="mt-6">
            <UploadButton>{t('crops.testAnother')}</UploadButton>
          </div>
        </section>
      ) : (
        <>
          <p className="mb-5 rounded-2xl bg-navy-900/80 px-5 py-3.5 text-sm text-slate-100 shadow-md shadow-black/30 ring-1 ring-white/10">
            <span className="font-semibold text-white">
              {t('crops.countOf', { count: suitableCount, total: recommendations.length })}
            </span>{' '}
            {t('crops.suitableRest', { ph: sample.ph })}
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {recommendations.map((crop) => (
              <CropCard key={crop.cropName} crop={crop} ph={sample.ph} />
            ))}
          </div>
          <p className="mt-5 rounded-xl bg-navy-900/80 px-4 py-2.5 text-xs text-slate-300">{t('crops.footnote')}</p>
        </>
      )}
    </>
  )
}
