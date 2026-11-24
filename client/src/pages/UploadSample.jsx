import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Camera, Gauge, ImagePlus, LayoutDashboard, MapPin, Radio, RotateCcw, ScanSearch, ShieldCheck, Sprout, Upload, X } from 'lucide-react'
import { api } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import PageHeader, { SectionHeading } from '../components/PageHeader'

const MAX_IMAGE_MB = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const WATER_BODIES = ['river', 'lake', 'pond', 'stream']

const READING_FIELDS = [
  { name: 'ph', unit: '', min: 0, max: 14, step: '0.1' },
  { name: 'turbidity', unit: 'NTU', min: 0, max: 4000, step: '0.1' },
  { name: 'tds', unit: 'mg/L', min: 0, max: 50000, step: '1' },
  { name: 'temperature', unit: '°C', min: -5, max: 60, step: '0.1' },
]

const EMPTY_FORM = { ph: '', turbidity: '', tds: '', temperature: '', sourceType: '', location: '' }

const LIVE_POLL_MS = 3000
// The ESP32 sends every 5 s, so a reading older than this means it has gone offline
const LIVE_FRESH_MS = 20000

// Round to the input's step, e.g. step '0.1' → one decimal
const formatReading = (value, step) => value.toFixed(step.includes('.') ? step.split('.')[1].length : 0)

// Errors are kept untranslated ({ key, vars } or an Error from api()) so they follow a language switch.
// `vars.field` is a parameter key like 'ph' and is translated here.
function useErrorText() {
  const { t, tError } = useLanguage()
  return (error) => {
    if (error instanceof Error) return tError(error)
    const vars = error.vars?.field ? { ...error.vars, field: t(`param.${error.vars.field}`) } : error.vars
    return t(error.key, vars)
  }
}

// Same checks as the server, done here so messages appear in the chosen language
function validateReadings(form) {
  for (const { name, min, max } of READING_FIELDS) {
    const raw = form[name].trim()
    const value = Number(raw)
    if (!raw || !Number.isFinite(value)) return { key: 'error.fieldRequired', vars: { field: name } }
    if (value < min || value > max) return { key: 'error.fieldRange', vars: { field: name, min, max } }
  }
  return null
}

function ImagePicker({ file, onChange, onError }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Free the preview's memory when this component goes away
  const previewRef = useRef(null)
  useEffect(() => () => previewRef.current && URL.revokeObjectURL(previewRef.current), [])

  function setPreview(selected) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = selected ? URL.createObjectURL(selected) : null
    setPreviewUrl(previewRef.current)
  }

  function pick(selected) {
    if (!selected) return
    if (!ALLOWED_TYPES.includes(selected.type)) return onError({ key: 'upload.badType' })
    if (selected.size > MAX_IMAGE_MB * 1024 * 1024) return onError({ key: 'upload.tooBig', vars: { mb: MAX_IMAGE_MB } })
    onError(null)
    setPreview(selected)
    onChange(selected)
  }

  if (file) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {previewUrl && <img src={previewUrl} alt={t('upload.previewAlt')} className="h-56 w-full object-contain sm:h-64" />}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-navy-950/50 px-4 py-2.5 text-sm">
          <span className="font-latin truncate text-slate-100" dir="ltr">{file.name}</span>
          <span className="font-latin shrink-0 text-slate-300" dir="ltr">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setPreview(null)
            onChange(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          className="absolute end-2 top-2 flex items-center gap-1 rounded-xl bg-navy-900/70 px-3 py-1.5 text-sm font-semibold text-red-400 shadow-md hover:bg-navy-800"
        >
          <X className="h-4 w-4" /> {t('upload.remove')}
        </button>
      </div>
    )
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        pick(e.dataTransfer.files[0])
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-12 text-center transition-colors ${
        dragging ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-white/5 hover:border-blue-400/60 hover:bg-white/10'
      }`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-950/50 shadow-md shadow-black/40 ring-1 ring-white/10"><ImagePlus className="h-8 w-8 text-slate-400" /></span>
      <span className="mt-4 font-semibold text-white">{t('upload.dropHere')}</span>
      <span className="mt-1 text-sm text-slate-300">{t('upload.fileHint', { mb: MAX_IMAGE_MB })}</span>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => pick(e.target.files[0])}
      />
    </label>
  )
}

// Newest reading sent by the ESP32, refreshed every few seconds
function useLiveReading() {
  const [reading, setReading] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await api('/readings/latest')
        if (!cancelled) setReading(data.reading)
      } catch {
        // Keep the last reading; its age makes it show as offline
      }
      if (!cancelled) setNow(Date.now())
    }
    load()
    const timer = setInterval(load, LIVE_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { reading, now }
}

function LiveReadings({ onUse }) {
  const { t, locale } = useLanguage()
  const { reading, now } = useLiveReading()
  // SQLite stores UTC without a zone marker
  const receivedAt = reading && new Date(reading.receivedAt + 'Z')
  const online = receivedAt && now - receivedAt.getTime() < LIVE_FRESH_MS
  const hasValues = reading && READING_FIELDS.some(({ name }) => reading[name] !== null)

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Radio className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-white">{t('live.title')}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-slate-400'}`}>
            <span className={`h-2 w-2 rounded-full ${online ? 'animate-pulse bg-green-500' : 'bg-slate-400'}`} />
            {online ? t('live.online') : t('live.offline')}
          </span>
        </div>
        {hasValues && (
          <button
            type="button"
            onClick={() => onUse(reading)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700"
          >
            {t('live.use')}
          </button>
        )}
      </div>

      {reading ? (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {READING_FIELDS.map(({ name, unit, step }) => (
              <div key={name} className="rounded-xl bg-navy-950/50 px-3 py-2 ring-1 ring-white/10">
                <dt className="text-xs text-slate-300">{t(`param.${name}`)}</dt>
                <dd className="font-latin text-lg font-bold text-white" dir="ltr">
                  {reading[name] === null ? '—' : `${formatReading(reading[name], step)}${unit ? ` ${unit}` : ''}`}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-slate-300">
            {t('live.updated', { time: '' })}<bdi className="font-latin">{receivedAt.toLocaleTimeString(locale)}</bdi>
          </p>
          {READING_FIELDS.some(({ name }) => reading[name] === null) && (
            <p className="mt-1 text-xs text-slate-300">{t('live.dashNote')}</p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-300">{t('live.none')}</p>
      )}
    </div>
  )
}

function ResultCard({ result, onReset }) {
  const { t } = useLanguage()
  const { analysis } = result
  const contaminated = analysis.isContaminated
  const percent = Math.round(analysis.confidence * 100)

  return (
    <section className="overflow-hidden rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10">
      <div className={`flex items-center gap-4 p-5 sm:p-7 ${contaminated ? 'bg-linear-to-r from-red-500/20 to-rose-500/10' : 'bg-linear-to-r from-emerald-500/20 to-green-500/10'}`}>
        <div className={`rounded-2xl bg-linear-to-br p-3.5 text-white shadow-lg ${contaminated ? 'from-rose-500 to-red-600 shadow-red-500/30' : 'from-emerald-500 to-green-600 shadow-green-500/30'}`}>
          {contaminated ? <AlertTriangle className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300">{t('result.title')}</p>
          <p className={`text-2xl font-bold ${contaminated ? 'text-red-300' : 'text-emerald-300'}`}>
            {contaminated ? t('result.contaminated') : t('result.safe')}
          </p>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-slate-100">{t('result.confidence')}</span>
            <span className="font-latin text-lg font-bold text-white">{percent}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-blue-500/15">
            <div
              className={`h-full rounded-full ${contaminated ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-300">{t('result.basedOn')}</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-slate-300">
              <tr>
                <th className="py-2.5 ps-4 pe-3 text-start font-semibold">{t('result.parameter')}</th>
                <th className="py-2.5 pe-3 text-start font-semibold">{t('result.yourValue')}</th>
                <th className="hidden py-2.5 pe-3 text-start font-semibold sm:table-cell">{t('result.safeLimit')}</th>
                <th className="py-2.5 pe-4 text-start font-semibold">{t('result.status')}</th>
              </tr>
            </thead>
            <tbody>
              {analysis.checks.map((c) => (
                <tr key={c.parameter} className="border-b border-white/5 last:border-0">
                  <td className="py-3 ps-4 pe-3 font-medium text-slate-100">{t(`param.${c.parameter}`)}</td>
                  <td className="py-2.5 pe-3">
                    <span className="font-latin" dir="ltr">{c.value}{c.unit && ` ${c.unit}`}</span>
                    {/* On small screens the limit is shown here instead of in its own column */}
                    <span className="block text-xs text-slate-300 sm:hidden">
                      {t('result.limit', { limit: '' })}<bdi className="font-latin">{c.limit}</bdi>
                    </span>
                  </td>
                  <td className="hidden py-2.5 pe-3 text-slate-300 sm:table-cell">
                    <bdi className="font-latin">{c.limit}</bdi>
                  </td>
                  <td className="py-3 pe-4 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.exceeded ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {c.exceeded ? t('result.outOfRange') : t('result.normal')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            to={`/crops?analysis=${analysis.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-green-700 px-5 py-2.5 font-semibold text-white shadow-md shadow-green-600/25 transition hover:from-emerald-700 hover:to-green-800"
          >
            <Sprout className="h-4 w-4" /> {t('result.viewCrops')}
          </Link>
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-navy-950/50 px-5 py-2.5 font-semibold text-slate-100 transition hover:border-blue-400/60 hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" /> {t('result.another')}
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-navy-950/50 px-5 py-2.5 font-semibold text-slate-100 transition hover:border-blue-400/60 hover:bg-white/10"
          >
            <LayoutDashboard className="h-4 w-4" /> {t('result.viewDashboard')}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function UploadSample() {
  const { t } = useLanguage()
  const errorText = useErrorText()
  const [image, setImage] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  // Fill the fields the ESP32 sent; sensors it doesn't have yet stay as typed
  function applyLiveReading(reading) {
    const filled = {}
    for (const { name, step } of READING_FIELDS) {
      if (reading[name] !== null) filled[name] = formatReading(reading[name], step)
    }
    setForm((current) => ({ ...current, ...filled }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!image) return setError({ key: 'upload.chooseImage' })
    const readingsError = validateReadings(form)
    if (readingsError) return setError(readingsError)
    if (!form.sourceType) return setError({ key: 'upload.chooseType' })

    const data = new FormData()
    data.append('image', image)
    for (const [key, value] of Object.entries(form)) data.append(key, value)

    setError(null)
    setSubmitting(true)
    try {
      setResult(await api('/samples', { method: 'POST', body: data }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setResult(null)
    setImage(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  if (result) {
    return (
      <>
        <PageHeader icon={ScanSearch} title={t('upload.title')} description={t('upload.doneDesc')} />
        <ResultCard result={result} onReset={reset} />
      </>
    )
  }

  return (
    <>
      <PageHeader icon={Upload} title={t('upload.title')} description={t('upload.desc')} />

      {/* noValidate: the browser's own popups would appear in the browser's language, not the app's */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{errorText(error)}</p>}

        <section className="rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10 p-5 sm:p-7">
          <SectionHeading icon={Camera}>{t('upload.step1')}</SectionHeading>
          <ImagePicker file={image} onChange={setImage} onError={setError} />
        </section>

        <section className="rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10 p-5 sm:p-7">
          <SectionHeading icon={Gauge}>{t('upload.step2')}</SectionHeading>
          <LiveReadings onUse={applyLiveReading} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {READING_FIELDS.map(({ name, unit, min, max, step }) => (
              <label key={name} className="block">
                <span className="text-sm font-semibold text-slate-100">
                  {t(`param.${name}`)} {unit && <span className="font-latin text-sky-400">({unit})</span>}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  dir="ltr"
                  required
                  min={min}
                  max={max}
                  step={step}
                  value={form[name]}
                  onChange={update(name)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-navy-950/50 px-3.5 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/25"
                />
                <span className="mt-1.5 block text-xs text-slate-400">{t(`upload.hint.${name}`)}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-navy-900/70 shadow-lg shadow-black/30 ring-1 ring-white/10 p-5 sm:p-7">
          <SectionHeading icon={MapPin}>{t('upload.step3')}</SectionHeading>
          <fieldset>
            <legend className="text-sm font-semibold text-slate-100">{t('upload.type')}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WATER_BODIES.map((type) => (
                <label
                  key={type}
                  className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-semibold transition has-focus-visible:ring-2 has-focus-visible:ring-blue-400 ${
                    form.sourceType === type
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'border-white/10 bg-navy-950/50 text-slate-100 hover:border-blue-400/60 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="sourceType"
                    value={type}
                    checked={form.sourceType === type}
                    onChange={update('sourceType')}
                    className="sr-only"
                  />
                  {t(`water.${type}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-100">
              {t('upload.location')} <span className="text-sky-400">{t('common.optional')}</span>
            </span>
            <input
              type="text"
              dir="auto"
              maxLength={200}
              placeholder={t('upload.locationPlaceholder')}
              value={form.location}
              onChange={update('location')}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-navy-950/50 px-3.5 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/25"
            />
          </label>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-5 py-2.5 font-semibold text-white shadow-md shadow-blue-600/30 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 w-full py-3 sm:w-auto sm:px-10"
        >
          <ScanSearch className="h-5 w-5" aria-hidden="true" />
          {submitting ? t('upload.submitting') : t('upload.submit')}
        </button>
      </form>
    </>
  )
}
