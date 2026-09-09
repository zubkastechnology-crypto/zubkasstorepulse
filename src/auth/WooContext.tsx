import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  testConnection,
  fetchOrders, fetchProducts, fetchCustomers, fetchSalesReport, fetchCategories,
  type WooConnection, type Order, type Product, type Customer, type SalesReportData,
} from '@/lib/woocommerce'
import { supabase } from '@/lib/supabase'
import { getAppMode, setAppMode as persistAppMode, type AppMode } from '@/lib/appMode'
import { fetchStandaloneProducts, fetchStandaloneOrders, fetchStandaloneCategories } from '@/lib/standaloneDb'

type Toast = { id: number; type: 'success' | 'error'; message: string }

type NewOrderAlert = {
  id: string
  total: number
  customer: string
  timestamp: number
}

type WooContextValue = {
  connection: WooConnection | null
  isConnected: boolean
  isLive: boolean
  connecting: boolean
  connect: (data: WooConnection) => Promise<{ ok: boolean; error?: string }>
  disconnect: () => void
  appMode: AppMode
  isStandalone: boolean
  setAppMode: (mode: AppMode) => void
  orders: Order[]
  products: Product[]
  customers: Customer[]
  categories: string[]
  salesReport: SalesReportData | null
  loading: boolean
  refresh: () => void
  updateOrder: (id: string, patch: Partial<Order>) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, patch: Partial<Product>) => void
  removeProduct: (id: string) => void
  toasts: Toast[]
  pushToast: (type: 'success' | 'error', message: string) => void
  dismissToast: (id: number) => void
  soundAlertsOn: boolean
  toggleSoundAlerts: () => void
  newOrderAlerts: NewOrderAlert[]
  dismissNewOrderAlert: (id: string) => void
}

const WooContext = createContext<WooContextValue | undefined>(undefined)

export function WooProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<WooConnection | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [appMode, setAppModeState] = useState<AppMode>(() => getAppMode())
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [salesReport, setSalesReport] = useState<SalesReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [soundAlertsOn, setSoundAlertsOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zubkas_sound_alerts') !== 'off'
    } catch {
      return true
    }
  })
  const [newOrderAlerts, setNewOrderAlerts] = useState<NewOrderAlert[]>([])
  const activeConnRef = useRef<WooConnection | null>(connection)

  const pushToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const isStandalone = appMode === 'standalone'

  const loadWooData = useCallback(async (rawConn: unknown) => {
    if (!rawConn || typeof rawConn !== 'object') return
    const c = rawConn as Record<string, unknown>
    const url = (String(c.storeUrl ?? c.url ?? c.woocommerce_url ?? '')).trim().replace(/\/+$/, '')
    const consumerKey = (String(c.consumerKey ?? c.consumer_key ?? '')).trim()
    const consumerSecret = (String(c.consumerSecret ?? c.consumer_secret ?? '')).trim()

    if (!url || !consumerKey || !consumerSecret) return

    const conn: WooConnection = {
      storeUrl: url,
      consumerKey,
      consumerSecret,
      connectedAt: (String(c.connectedAt ?? '')) || new Date().toISOString(),
    }

    setLoading(true)
    try {
      const [o, p, cust, s, cats] = await Promise.all([
        fetchOrders(conn),
        fetchProducts(conn),
        fetchCustomers(conn),
        fetchSalesReport(conn),
        fetchCategories(conn),
      ])
      setProducts(p || [])
      setCustomers(cust || [])
      setSalesReport(s || null)
      setOrders(o || [])
      setCategories((cats || []).map((c) => c.name).filter((n) => n && n !== 'Uncategorized'))
    } catch (err) {
      pushToast('error', `Live data error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [pushToast])

  // Auto-fetch credentials from Supabase on startup (cloud-driven, no localStorage)
  useEffect(() => {
    async function initStore() {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)

        if (error || !data || data.length === 0) return

        const row = data[0] as Record<string, unknown>
        const url = (String(row.woocommerce_url ?? row.url ?? '')).trim().replace(/\/+$/, '')
        const consumerKey = (String(row.consumer_key ?? row.consumerKey ?? '')).trim()
        const consumerSecret = (String(row.consumer_secret ?? row.consumerSecret ?? '')).trim()

        if (url && consumerKey && consumerSecret) {
          const conn: WooConnection = {
            storeUrl: url,
            consumerKey,
            consumerSecret,
            connectedAt: new Date().toISOString(),
          }
          activeConnRef.current = conn
          setConnection(conn)
          loadWooData(conn)
        }
      } catch (err) {
        console.error('Failed to init store settings:', err)
      }
    }
    initStore()
  }, [loadWooData])

  const refresh = useCallback(() => {
    if (isStandalone) {
      setLoading(true)
      Promise.all([fetchStandaloneProducts(), fetchStandaloneOrders(), fetchStandaloneCategories()])
        .then(([p, o, cats]) => {
          setProducts(p)
          setOrders(o)
          setCategories((cats || []).map((c) => c.name))
        })
        .finally(() => setLoading(false))
      return
    }
    const current = activeConnRef.current || connection
    if (current) {
      loadWooData(current)
    }
  }, [isStandalone, connection, loadWooData])

  const connect = useCallback(
    async (data: WooConnection): Promise<{ ok: boolean; error?: string }> => {
      setConnecting(true)
      const result = await testConnection(data)
      setConnecting(false)
      if (result.ok) {
        // Persist credentials to Supabase store_settings (cloud-driven)
        try {
          await supabase
            .from('store_settings')
            .upsert({
              id: 1,
              woocommerce_url: data.storeUrl,
              consumer_key: data.consumerKey,
              consumer_secret: data.consumerSecret,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
        } catch {
          /* best-effort cloud save; connection still works locally this session */
        }
        activeConnRef.current = data
        setConnection(data)
        loadWooData(data)
        pushToast('success', 'Connected successfully!')
      }
      return result
    },
    [pushToast, loadWooData],
  )

  const disconnect = useCallback(async () => {
    // Clear credentials from Supabase store_settings
    try {
      await supabase
        .from('store_settings')
        .update({
          woocommerce_url: null,
          consumer_key: null,
          consumer_secret: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
    } catch {
      /* ignore */
    }
    activeConnRef.current = null
    setConnection(null)
    setOrders([])
    setProducts([])
    setCustomers([])
    setSalesReport(null)
    setCategories([])
    pushToast('success', 'Disconnected.')
  }, [pushToast])

  const toggleSoundAlerts = useCallback(() => {
    setSoundAlertsOn((prev) => !prev)
  }, [])

  const dismissNewOrderAlert = useCallback((id: string) => {
    setNewOrderAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const setAppMode = useCallback((mode: AppMode) => {
    persistAppMode(mode)
    setAppModeState(mode)
  }, [])

  const updateOrder = useCallback((id: string, patch: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }, [])

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev])
  }, [])

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return (
    <WooContext.Provider
      value={{
        connection,
        isConnected: !!connection,
        isLive: !!connection || isStandalone,
        connecting,
        connect,
        disconnect,
        appMode,
        isStandalone,
        setAppMode,
        orders,
        products,
        customers,
        categories,
        salesReport,
        loading,
        refresh,
        updateOrder,
        addProduct,
        updateProduct,
        removeProduct,
        toasts,
        pushToast,
        dismissToast,
        soundAlertsOn,
        toggleSoundAlerts,
        newOrderAlerts,
        dismissNewOrderAlert,
      }}
    >
      {children}
    </WooContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWoo(): WooContextValue {
  const ctx = useContext(WooContext)
  if (!ctx) throw new Error('useWoo must be used within WooProvider')
  return ctx
}
