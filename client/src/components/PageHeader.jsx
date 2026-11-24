// Header card at the top of each page: gradient icon badge + title + optional description
export default function PageHeader({ title, description, icon: Icon }) {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-3xl bg-navy-900/80 p-5 shadow-lg shadow-black/30 ring-1 ring-white/10 backdrop-blur sm:p-6">
      {Icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-400 to-blue-700 shadow-md shadow-blue-600/40 sm:h-14 sm:w-14">
          <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-300 sm:text-base">{description}</p>}
      </div>
    </div>
  )
}

// Heading inside a card section, with a small tinted icon
export function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 text-base font-semibold text-white sm:text-lg">
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-slate-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      {children}
    </h2>
  )
}
