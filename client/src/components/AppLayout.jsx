import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { Database, Droplets, FileText, LayoutDashboard, LogOut, Menu, Settings, Sprout, Upload, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import RoleBadge from './RoleBadge'
import LanguageToggle from './LanguageToggle'
import WaterBackground from './WaterBackground'
import { AppFooter } from './Footer'

// `section` groups the links under a small heading in the sidebar
const NAV_ITEMS = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, section: 'main' },
  { to: '/upload', labelKey: 'nav.upload', icon: Upload, section: 'main' },
  { to: '/crops', labelKey: 'nav.crops', icon: Sprout, section: 'main' },
  { to: '/reports', labelKey: 'nav.reports', icon: FileText, section: 'main' },
  { to: '/admin/records', labelKey: 'nav.records', icon: Database, section: 'main', adminOnly: true },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings, section: 'account' },
]

const SECTIONS = [
  { id: 'main', labelKey: 'nav.sectionMain' },
  { id: 'account', labelKey: 'nav.sectionAccount' },
]

function Brand() {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-600/30">
        <Droplets className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-semibold tracking-wide text-white">{t('app.name')}</p>
        <p className="truncate text-xs text-slate-400">{t('app.tagline')}</p>
      </div>
    </div>
  )
}

// Thin line that fades out at both ends
const Divider = () => <div className="mx-5 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return async () => {
    await logout()
    navigate('/login', { replace: true })
  }
}

// Link with its icon in a small rounded box: blue when active, navy otherwise
function SidebarLink({ to, labelKey, icon: Icon, onNavigate }) {
  const { t } = useLanguage()
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 whitespace-nowrap rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActive ? 'bg-navy-800/90 text-white shadow-lg shadow-black/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40' : 'bg-navy-800 text-blue-400 group-hover:text-blue-300'
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          {t(labelKey)}
        </>
      )}
    </NavLink>
  )
}

// Sidebar contents: a floating panel on desktop, the slide-in drawer on mobile
function Sidebar({ onNavigate }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const handleLogout = useLogout()
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === 'admin')

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-linear-to-b from-navy-900/95 to-navy-950/95 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur">
      {/* In the mobile drawer (onNavigate set) leave room for the close button */}
      <div className={`flex h-20 items-center ps-5 ${onNavigate ? 'pe-12' : 'pe-5'}`}>
        <Brand />
      </div>
      <Divider />

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {SECTIONS.map(({ id, labelKey }) => (
          <div key={id}>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">{t(labelKey)}</p>
            <div className="space-y-1">
              {items.filter((item) => item.section === id).map((item) => (
                <SidebarLink key={item.to} {...item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Account card at the bottom */}
      <div className="p-3">
        <div className="rounded-2xl bg-linear-to-br from-blue-600/35 via-indigo-600/20 to-navy-900 p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="font-latin truncate text-xs text-slate-300" dir="ltr">{user.email}</p>
            </div>
            <RoleBadge role={user.role} />
          </div>
          <LanguageToggle className="mt-3" />
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-navy-950/60 px-3 py-2 text-sm font-semibold text-red-400 ring-1 ring-white/10 transition-colors hover:bg-red-500/15 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0 rtl:-scale-x-100" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Layout for all logged-in pages: floating sidebar on desktop, slide-in drawer on mobile.
// Uses start/end classes so the sidebar moves to the right in Urdu (right-to-left).
export default function AppLayout() {
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close on Escape and stop the page behind the drawer from scrolling
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="relative isolate min-h-screen bg-navy-950">
      <WaterBackground />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-4 start-4 z-20 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/70" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-2 start-2 w-72 max-w-[85vw]">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute end-3 top-5 z-10 rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
              aria-label={t('nav.closeMenu')}
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Column layout keeps the footer at the bottom even on short pages */}
      <div className="flex min-h-screen flex-col lg:ps-72">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-navy-900/80 px-4 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-1.5 text-slate-100 hover:bg-white/10"
            aria-label={t('nav.openMenu')}
          >
            <Menu className="h-6 w-6" />
          </button>
          <Brand />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <AppFooter />
      </div>
    </div>
  )
}
