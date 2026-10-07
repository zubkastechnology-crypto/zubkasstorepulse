import { FolderTree } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

export default function CategoriesPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-brand">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Categories</h1>
            <p className="text-sm text-slate-500">Product category management</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <FolderTree className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">Categories are managed directly via your WooCommerce store</h2>
          <p className="mt-2 text-sm text-slate-400">
            Zubkas StorePulse runs in <span className="font-medium text-slate-600">WooCommerce Live Sync</span> mode. Category changes should be made in your WooCommerce admin dashboard.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
