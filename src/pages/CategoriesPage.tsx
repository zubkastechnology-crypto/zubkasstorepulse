import { useEffect, useState, useMemo } from 'react'
import { FolderTree, Plus, Pencil, Trash2, RefreshCw, X, Loader as Loader2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useWoo } from '@/auth/WooContext'
import {
  fetchStandaloneCategories,
  createStandaloneCategory,
  updateStandaloneCategory,
  deleteStandaloneCategory,
  type CategoryRow,
} from '@/lib/standaloneDb'

type ModalState = { mode: 'create' | 'edit'; category: CategoryRow | null }

export default function CategoriesPage() {
  const { products, isStandalone, pushToast } = useWoo()
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({ mode: 'create', category: null })
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // form fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCategories = async () => {
    setLoading(true)
    try {
      const rows = await fetchStandaloneCategories()
      setCategories(rows)
    } catch (err) {
      pushToast('error', `Failed to load categories: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isStandalone) return
    loadCategories()
  }, [isStandalone])

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of products) {
      counts[p.category] = (counts[p.category] ?? 0) + 1
    }
    return counts
  }, [products])

  const openCreate = () => {
    setModalState({ mode: 'create', category: null })
    setName('')
    setSlug('')
    setDescription('')
    setImageUrl('')
    setModalOpen(true)
  }

  const openEdit = (cat: CategoryRow) => {
    setModalState({ mode: 'edit', category: cat })
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description ?? '')
    setImageUrl(cat.image_url ?? '')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      pushToast('error', 'Category name is required.')
      return
    }
    setSaving(true)
    try {
      const input = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
      }
      if (modalState.mode === 'edit' && modalState.category) {
        const updated = await updateStandaloneCategory(modalState.category.id, input)
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        pushToast('success', `Category "${updated.name}" updated.`)
      } else {
        const created = await createStandaloneCategory(input)
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        pushToast('success', `Category "${created.name}" created.`)
      }
      setModalOpen(false)
    } catch (err) {
      pushToast('error', `Failed to save category: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteStandaloneCategory(deleteTarget.id)
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      pushToast('success', `Category "${deleteTarget.name}" deleted.`)
      setDeleteTarget(null)
    } catch (err) {
      pushToast('error', `Failed to delete category: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setDeleting(false)
    }
  }

  if (!isStandalone) {
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
              You are currently in <span className="font-medium text-slate-600">WooCommerce Live Sync</span> mode. Category changes should be made in your WooCommerce admin dashboard.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Switch to Standalone Cloud POS mode in Settings to manage custom categories here.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-brand">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Categories</h1>
              <p className="text-sm text-slate-500">Organize your products into custom categories.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadCategories}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Category
            </button>
          </div>
        </div>

        {loading && categories.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">Loading categories…</p>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const count = productCounts[cat.name] ?? 0
              return (
                <div
                  key={cat.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <FolderTree className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(cat)}
                        aria-label="Edit category"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        aria-label="Delete category"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">{cat.name}</h3>
                  <p className="mt-0.5 text-xs font-mono text-slate-400">/{cat.slug}</p>
                  {cat.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{cat.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 border-t border-slate-50 pt-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {count} {count === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <FolderTree className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-700">No categories yet</h2>
            <p className="mt-2 text-sm text-slate-400">Create your first category to start organizing your products.</p>
            <button onClick={openCreate} className="btn-primary mt-4 mx-auto">
              <Plus className="h-4 w-4" /> Add Category
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => !saving && setModalOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full overflow-y-auto bg-white shadow-2xl animate-slide-in-right sm:max-w-md">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {modalState.mode === 'edit' ? 'Edit Category' : 'New Category'}
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  {modalState.mode === 'edit' ? 'Edit Category Details' : 'Add Category'}
                </h2>
              </div>
              <button
                onClick={() => !saving && setModalOpen(false)}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-5 px-5 py-5" noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category Name <span className="text-red-500">*</span></label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (modalState.mode === 'create') {
                      setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
                    }
                  }}
                  className="input-field"
                  placeholder="e.g. Wedding Sarees"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder="auto-generated from name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field min-h-20 resize-y"
                  placeholder="Optional category description…"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Image URL</label>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://example.com/category-image.jpg"
                />
                {imageUrl && (
                  <div className="mt-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {saving ? 'Saving…' : modalState.mode === 'edit' ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete category?"
        message={`"${deleteTarget?.name ?? ''}" will be permanently removed. Products in this category will not be affected but will lose their category association.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        danger
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </AppLayout>
  )
}
