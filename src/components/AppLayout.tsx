import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, Users, ChartBar as BarChart3, Settings as SettingsIcon, LogOut, Bell, Search, Menu, X, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, X as XIcon, Calculator, Ticket, Bike, ShieldCheck, Download, Volume2, VolumeX, Pencil, FolderTree } from 'lucide-react'
import Logo from './Logo'
import MyProfileModal from './MyProfileModal'
import { useAuth } from '../auth/AuthContext'
import { useWoo } from '../auth/WooContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import type { NavKey } from '../lib/permissions'
import { formatCurrency, type Product } from '@/data/mockData'

const NAV_ITEMS: { key: NavKey; to: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'pos', to: '/pos', label: 'POS Terminal', icon: Calculator },
  { key: 'orders', to: '/orders', label: 'Orders', icon: ShoppingCart },
  { key: 'products', to: '/products', label: 'Products', icon: Package },
  { key: 'categories', to: '/categories', label: 'Categories', icon: FolderTree },
  { key: 'customers', to: '/customers', label: 'Customers', icon: Users },
  { key: 'coupons', to: '/coupons', label: 'Coupons', icon: Ticket },
  { key: 'delivery', to: '/delivery', label: 'Delivery Hub', icon: Bike },
  { key: 'reports', to: '/reports', label: 'Reports / Analytics', icon: BarChart3 },
  { key: 'staff-roles', to: '/staff-roles', label: 'Roles & Staff', icon: ShieldCheck },
  { key: 'settings', to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, permissions, role } = useAuth()
  const { isConnected, isLive, toasts, dismissToast, soundAlertsOn, toggleSoundAlerts, newOrderAlerts, dismissNewOrderAlert, isStandalone } = useWoo()
  const navigate = useNavigate()
  const location = useLocation()
  const { products } = useWoo()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const { canInstall, promptInstall } = useInstallPrompt()

  // Global product search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || q.length < 1) return []
    return products
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [products, searchQuery])

  const isSearchDropdownOpen = searchOpen && searchQuery.trim().length > 0

  useEffect(() => {
    if (!searchOpen) return
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [searchOpen])

  const handleSearchSelect = (product: Product) => {
    setSearchQuery('')
    setSearchOpen(false)
    navigate(`/products?highlight=${encodeURIComponent(product.id)}`)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchOpen(false)
  }

  useEffect(() => {
    if (!bellOpen) return
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  const unreadCount = newOrderAlerts.length

  const handleNotificationClick = (alertId: string) => {
    dismissNewOrderAlert(alertId)
    setBellOpen(false)
    navigate('/orders?openOrderId=' + encodeURIComponent(alertId))
  }

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.key === 'categories') return isStandalone && permissions.includes('categories')
    return permissions.includes(item.key)
  })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/')

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-3 pb-6 pt-4 mb-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {visibleNav.map((item) => {
          const active = isActive(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand text-white shadow-brand'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        {canInstall && (
          <button
            onClick={promptInstall}
            className="mb-2 flex w-full items-center gap-3 rounded-xl bg-[#9f0f0f] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#880d0d] active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Install App
          </button>
        )}
        <button
          onClick={() => setProfileOpen(true)}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            {user?.name?.charAt(0) ?? 'C'}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.name ?? 'Client'}</p>
            <p className="truncate text-xs text-slate-400">{(role || user?.email) ?? ''}</p>
          </div>
          <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-brand" />
        </button>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand"
        >
          <LogOut className="h-4.5 w-4.5 text-slate-400" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white md:block">
        {Sidebar}
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl animate-fade-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {Sidebar}
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="md:hidden">
                <Logo />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {canInstall && (
                <button
                  onClick={promptInstall}
                  className="flex items-center gap-1.5 rounded-full bg-[#9f0f0f] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#880d0d] active:scale-[0.98]"
                >
                  <Download className="h-3.5 w-3.5" /> Install
                </button>
              )}
              <div className="relative hidden sm:block" ref={searchRef}>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search products…"
                  className="w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none lg:w-72"
                  aria-label="Search products"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {isSearchDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-in lg:w-96">
                    {searchResults.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto py-1">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSearchSelect(p)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              ) : (
                                <Package className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                              <p className="truncate text-xs text-slate-400">{p.sku} · {p.category}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-slate-900">{formatCurrency(p.salePrice ?? p.price)}</p>
                              <p className={`text-xs font-medium ${p.stock <= 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-green-600'}`}>
                                {p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <Search className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-sm text-slate-400">No products match “{searchQuery}”.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Sound alerts toggle */}
              <button
                onClick={toggleSoundAlerts}
                title={soundAlertsOn ? 'Sound Alerts: ON — click to mute' : 'Sound Alerts: OFF — click to enable'}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  soundAlertsOn
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {soundAlertsOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{soundAlertsOn ? 'Sound On' : 'Muted'}</span>
              </button>
              {/* Connection badge — admin only */}
              {role === 'admin' && (
                <Link
                  to="/settings"
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isLive
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                  title={isConnected ? 'Live Store Connected' : 'Pure Cloud Mode — orders sync directly to your cloud database'}
                >
                  <span className={`relative flex h-2 w-2 ${isLive ? '' : ''}`}>
                    {isLive && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    )}
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-amber-400'}`} />
                  </span>
                  {isConnected ? 'Live Store Connected' : 'Pure Cloud Mode'}
                </Link>
              )}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((o) => !o)}
                  className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {unreadCount > 0 ? (
                        newOrderAlerts.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => handleNotificationClick(a.id)}
                            className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                              <ShoppingCart className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">New Order: {a.id}</p>
                              <p className="truncate text-xs text-slate-500">{a.customer} · ₹{a.total.toLocaleString('en-IN')}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-10 text-center">
                          <Bell className="mx-auto h-8 w-8 text-slate-300" />
                          <p className="mt-2 text-sm text-slate-400">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white/60 px-4 py-5 text-center text-xs text-slate-400 sm:px-6">
          Powered by ZUBKAS STOREPULSE
        </footer>
      </div>

      {/* New Order notification banner */}
      <div className="fixed top-16 right-4 z-[90] flex flex-col gap-2 sm:top-20">
        {newOrderAlerts.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-3 rounded-xl border border-brand/30 bg-brand px-4 py-3 text-sm shadow-lg animate-slide-in-right"
          >
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-white" />
            <div className="flex-1 text-white">
              <p className="font-semibold">New Order Received: {a.id}</p>
              <p className="text-xs text-white/80">{a.customer} · ₹{a.total.toLocaleString('en-IN')}</p>
            </div>
            <Link
              to={'/orders?openOrderId=' + encodeURIComponent(a.id)}
              onClick={() => dismissNewOrderAlert(a.id)}
              className="shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/30"
            >
              View
            </Link>
            <button
              onClick={() => dismissNewOrderAlert(a.id)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-0.5 text-white/70 transition hover:text-white"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <MyProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg animate-slide-in-right ${
              t.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-0.5 text-slate-400 transition hover:text-slate-600"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
