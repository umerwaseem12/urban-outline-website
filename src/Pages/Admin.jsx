import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { XCircle } from 'lucide-react'
import { API_BASE } from '../config'
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  MapPin,
  MessageSquare,
  Package,
  PackageCheck,
  Truck,
  UserRound,
} from 'lucide-react'

const statuses = [
  { value: 'placed', label: 'Placed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped / Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusColors = {
  placed: 'bg-blue-50 text-blue-700 ring-blue-200',
  processing: 'bg-amber-50 text-amber-700 ring-amber-200',
  shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`
const ORDERS_PER_PAGE = 20
const countStatus = (orders, status) =>
  orders.filter((order) => order.orderStatus === status).length

function OrderCard({ order, onUpdated, onDeleted }) {
  const [status, setStatus] = useState(order.orderStatus)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  async function saveStatus() {
    setSaving(true)
    setMessage('')
    setFailed(false)

    try {
      const response = await fetch(
        API_BASE + `/api/admin/orders/${order._id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Status could not be updated.')
      }

      onUpdated(data.order)
      setMessage('Status saved successfully.')
    } catch (error) {
      setFailed(true)
      setMessage(error.message || 'Status could not be updated.')
    } finally {
      setSaving(false)
    }
  }
  async function deleteOrder() {
    const confirmed = window.confirm(
      'Delete this order permanently? This cannot be undone.',
    )

    if (!confirmed) return

    setSaving(true)
    setMessage('')
    setFailed(false)

    try {
      const response = await fetch(
        API_BASE + `/api/admin/orders/${order._id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )

      const data = await response.json()

      if (response.status === 404) {
        onDeleted(order._id)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Order could not be deleted.')
      }

      onDeleted(order._id)
    } catch (error) {
      setFailed(true)
      setMessage(error.message || 'Order could not be deleted.')
    } finally {
      setSaving(false)
    }
  }

  const currentStatus =
    statuses.find((item) => item.value === order.orderStatus)?.label ||
    order.orderStatus

  return (
    <article className="overflow-hidden rounded-2xl border border-[#db7657] bg-white shadow-sm">
      {/* Order heading */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0ece8] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="break-all text-sm font-bold">
            Order #{order._id}
          </p>
          <p className="mt-1 text-xs text-[#8b837c]">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-[#8b837c]">Total amount</p>
          <p className="text-lg font-bold">{money(order.total)}</p>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-5">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
              statusColors[order.orderStatus] ||
              'bg-gray-100 text-gray-700 ring-gray-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {currentStatus}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f3f1] px-3 py-1 text-xs font-semibold text-[#706a65]">
            <CreditCard size={13} />
            {order.paymentMethod?.toUpperCase()} · {order.paymentStatus}
          </span>
        </div>

        {/* Customer and address */}
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0 rounded-xl bg-[#faf8f6] px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#827b75]">
              <UserRound size={14} className="text-[#db7657]" />
              Customer
            </p>
            <p className="mt-1 break-words font-semibold">
              {order.customer?.fullName}
            </p>
            <p className="break-words text-xs leading-5 text-[#706a65]">
              {order.customer?.phone}
              {order.customer?.email ? ` · ${order.customer.email}` : ''}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-[#faf8f6] px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#827b75]">
              <MapPin size={14} className="text-[#db7657]" />
              Delivery address
            </p>
            <p className="mt-1 break-words text-xs leading-5 text-[#706a65]">
              {order.customer?.address}, {order.customer?.city},{' '}
              {order.customer?.province}
              {order.customer?.postalCode
                ? ` · ${order.customer.postalCode}`
                : ''}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#827b75]">
            <Package size={14} className="text-[#db7657]" />
            Ordered items
          </p>

          <ul className="mt-1 space-y-1">
            {order.items?.map((item, index) => (
              <li
                key={`${item.productId}-${index}`}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="min-w-0 break-words">
                  {item.name} × {item.quantity}
                  {(item.size || (item.color && item.color !== 'As shown')) && (
                    <span className="block text-xs text-[#8b837c]">
                      {[
                        item.size ? `Size ${item.size}` : '',
                        item.color && item.color !== 'As shown' ? item.color : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-semibold">
                  {money(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Status controls */}
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[#f0ece8] pt-3">
          <div className="min-w-[180px] flex-1 sm:flex-none">
            <label
              htmlFor={`status-${order._id}`}
              className="mb-1 block text-xs font-bold text-[#827b75]"
            >
              Update order status
            </label>

            <select
              id={`status-${order._id}`}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setMessage('')
              }}
              disabled={saving}
              className="w-full rounded-lg border border-[#ded8d2] bg-white px-3 py-2 text-sm outline-none focus:border-[#db7657] sm:min-w-[200px]"
            >
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={saveStatus}
            disabled={saving || status === order.orderStatus}
            className="rounded-lg bg-[#24211f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#db7657] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save status'}
          </button>
                    <button
            type="button"
            onClick={deleteOrder}
            disabled={saving}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete order
          </button>

          {message && (
            <p
              role={failed ? 'alert' : 'status'}
              className={`w-full text-xs ${
                failed ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
function MessagesSection() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadMessages() {
      try {
        const response = await fetch(API_BASE + '/api/admin/messages', {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Messages could not be loaded.')

        const data = await response.json()
        setMessages(data.messages || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Messages could not be loaded.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadMessages()
    return () => controller.abort()
  }, [])

  async function markRead(id) {
    try {
      const response = await fetch(
        API_BASE + `/api/admin/messages/${id}/read`,
        { method: 'PATCH', credentials: 'include' },
      )
      if (!response.ok) return
      setMessages((current) =>
        current.map((m) => (m._id === id ? { ...m, isRead: true } : m)),
      )
    } catch {
      setError('Status could not be updated.')
    }
  }

  async function removeMessage(id) {
    if (!window.confirm('Delete this message permanently?')) return

    try {
      const response = await fetch(
        API_BASE + `/api/admin/messages/${id}`,
        { method: 'DELETE', credentials: 'include' },
      )
      if (!response.ok && response.status !== 404) {
        throw new Error('Message could not be deleted.')
      }
      setMessages((current) => current.filter((m) => m._id !== id))
    } catch (err) {
      setError(err.message || 'Message could not be deleted.')
    }
  }

  const unread = messages.filter((m) => !m.isRead).length

  return (
    <section className="mt-14">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d46d4f]">
        Customer messages
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight">
        Messages
        {unread > 0 && (
          <span className="ml-3 rounded-full bg-[#db7657] px-3 py-1 align-middle text-xs font-bold text-white">
            {unread} new
          </span>
        )}
      </h2>

      {loading && (
        <p className="mt-5 text-sm text-[#77706a]">Messages load ho rahe hain...</p>
      )}

      {error && (
        <p role="alert" className="mt-5 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && messages.length === 0 && !error && (
        <div className="mt-5 rounded-[24px] border border-[#e9e5e0] bg-white px-6 py-10 text-center text-sm text-[#928b85]">
          No customer messages yet.
        </div>
      )}

      <div className="mt-5 space-y-4">
        {messages.map((item) => (
          <article
            key={item._id}
            className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
              item.isRead ? 'border-[#e8e3de]' : 'border-[#db7657]'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-bold">{item.subject}</p>
                <p className="mt-1 break-words text-xs text-[#706a65]">
                  {item.name} · {item.email}
                </p>
              </div>
              <p className="text-xs text-[#8b837c]">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
              {item.message}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                           <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                  item.email,
                )}&su=${encodeURIComponent(`Re: ${item.subject}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ffffff' }}
                className="inline-block rounded-lg bg-[#24211f] px-4 py-2 text-sm font-bold no-underline transition hover:bg-[#db7657]"
              >
                Reply by email
              </a>

              {!item.isRead && (
                <button
                  type="button"
                  onClick={() => markRead(item._id)}
                  className="rounded-lg border border-[#ded8d2] px-4 py-2 text-sm font-bold transition hover:border-[#db7657]"
                >
                  Mark as read
                </button>
              )}

              <button
                type="button"
                onClick={() => removeMessage(item._id)}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
const CATEGORY_SEPARATOR = ' \u00B7 '

const fieldClass =
  'w-full rounded-lg border border-[#ded8d2] bg-white px-3 py-2 text-sm outline-none focus:border-[#db7657]'
const labelClass = 'mb-1 block text-xs font-bold text-[#827b75]'

function toDraft(product) {
  return {
    name: product.name || '',
    category: product.category || '',
    price: String(product.price ?? ''),
    oldPrice: product.oldPrice == null ? '' : String(product.oldPrice),
    stock: String(product.stock ?? ''),
    lowStockAt: String(product.lowStockAt ?? ''),
    image: product.image || '',
    description: product.description || '',
  }
}

function groupLabelFor(products, groupId) {
  const sample = products.find((item) => item.group === groupId)
  return sample ? sample.category.split(CATEGORY_SEPARATOR)[0] : groupId
}

function AddProductForm({ groups, labelFor, onCreated, onClose }) {
  const [form, setForm] = useState(() => ({
    group: groups[0] || '',
    category: groups[0] ? labelFor(groups[0]) + CATEGORY_SEPARATOR : '',
    name: '',
    price: '',
    oldPrice: '',
    stock: '0',
    image: '',
    description: '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleGroupChange(event) {
    const group = event.target.value
    setForm((current) => ({
      ...current,
      group,
      category: labelFor(group) + CATEGORY_SEPARATOR,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.category.trim().endsWith('\u00B7')) {
      setError('Category poori likhein, jaise: Men \u00B7 Shirts')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(API_BASE + '/api/admin/products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Product could not be created.')
      }

      onCreated(data.product)
      onClose()
    } catch (err) {
      setError(err.message || 'Product could not be created.')
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 rounded-2xl border border-[#db7657] bg-white p-4 shadow-sm sm:p-5"
    >
      <p className="text-sm font-bold">Add new product</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-group" className={labelClass}>
            Group
          </label>
          <select
            id="new-group"
            name="group"
            value={form.group}
            onChange={handleGroupChange}
            className={fieldClass}
          >
            {groups.map((groupId) => (
              <option key={groupId} value={groupId}>
                {labelFor(groupId)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="new-category" className={labelClass}>
            Category (jaise Men &middot; Shirts)
          </label>
          <input
            id="new-category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="new-name" className={labelClass}>
            Product name
          </label>
          <input
            id="new-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="new-price" className={labelClass}>
            Price (Rs.)
          </label>
          <input
            id="new-price"
            name="price"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="new-old-price" className={labelClass}>
            Old price (optional)
          </label>
          <input
            id="new-old-price"
            name="oldPrice"
            type="number"
            min="0"
            step="1"
            value={form.oldPrice}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="new-stock" className={labelClass}>
            Starting stock
          </label>
          <input
            id="new-stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="new-image" className={labelClass}>
            Image link (https://...)
          </label>
          <input
            id="new-image"
            name="image"
            value={form.image}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="new-description" className={labelClass}>
            Description (optional)
          </label>
          <textarea
            id="new-description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#24211f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#db7657] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Create product'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-[#ded8d2] px-4 py-2 text-sm font-bold transition hover:border-[#db7657]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function ProductRow({ product, onUpdated }) {
  const [draft, setDraft] = useState(() => toDraft(product))
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(product))
  const outOfStock = product.stock === 0
  const lowStock = product.stock > 0 && product.stock <= product.lowStockAt

  function handleChange(event) {
    const { name, value } = event.target
    setDraft((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  async function patch(body) {
    setSaving(true)
    setMessage('')
    setFailed(false)

    try {
      const response = await fetch(
        API_BASE + `/api/admin/products/${product._id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Product could not be updated.')
      }

      onUpdated(data.product)
      setDraft(toDraft(data.product))
      setMessage('Saved.')
    } catch (error) {
      setFailed(true)
      setMessage(error.message || 'Product could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  function saveDraft() {
    patch({
      name: draft.name,
      category: draft.category,
      price: draft.price,
      oldPrice: draft.oldPrice,
      stock: draft.stock,
      lowStockAt: draft.lowStockAt,
      image: draft.image,
      description: draft.description,
    })
  }

  return (
    <article
      className={`rounded-2xl border border-[#e8e3de] bg-white p-4 shadow-sm sm:p-5 ${
        product.active ? '' : 'opacity-70'
      }`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f5f3f1]">
          {product.image && (
            <img
              src={product.image}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1 basis-48">
          <p className="break-words text-sm font-bold">{product.name}</p>
          <p className="mt-0.5 break-words text-xs text-[#8b837c]">
            {product.productId} | {product.category}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {!product.active && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 ring-1 ring-inset ring-gray-200">
                Hidden
              </span>
            )}
            {outOfStock && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusColors.cancelled}`}
              >
                Out of stock
              </span>
            )}
            {lowStock && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusColors.processing}`}
              >
                Low stock
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="w-28">
            <label htmlFor={`price-${product._id}`} className={labelClass}>
              Price (Rs.)
            </label>
            <input
              id={`price-${product._id}`}
              name="price"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={draft.price}
              onChange={handleChange}
              disabled={saving}
              className={fieldClass}
            />
          </div>

          <div className="w-24">
            <label htmlFor={`stock-${product._id}`} className={labelClass}>
              Stock
            </label>
            <input
              id={`stock-${product._id}`}
              name="stock"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={draft.stock}
              onChange={handleChange}
              disabled={saving}
              className={fieldClass}
            />
          </div>

          <button
            type="button"
            onClick={saveDraft}
            disabled={saving || !dirty}
            className="rounded-lg bg-[#24211f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#db7657] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() => patch({ active: !product.active })}
            disabled={saving}
            className="rounded-lg border border-[#ded8d2] px-4 py-2 text-sm font-bold transition hover:border-[#db7657] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {product.active ? 'Hide' : 'Show'}
          </button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg border border-[#ded8d2] px-4 py-2 text-sm font-bold transition hover:border-[#db7657]"
          >
            {open ? 'Close' : 'Edit details'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 border-t border-[#f0ece8] pt-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`name-${product._id}`} className={labelClass}>
              Product name
            </label>
            <input
              id={`name-${product._id}`}
              name="name"
              value={draft.name}
              onChange={handleChange}
              disabled={saving}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor={`category-${product._id}`} className={labelClass}>
              Category
            </label>
            <input
              id={`category-${product._id}`}
              name="category"
              value={draft.category}
              onChange={handleChange}
              disabled={saving}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor={`oldprice-${product._id}`} className={labelClass}>
              Old price (leave empty for no discount)
            </label>
            <input
              id={`oldprice-${product._id}`}
              name="oldPrice"
              type="number"
              min="0"
              step="1"
              value={draft.oldPrice}
              onChange={handleChange}
              disabled={saving}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor={`low-${product._id}`} className={labelClass}>
              Low stock alert (is se kam ho to warning)
            </label>
            <input
              id={`low-${product._id}`}
              name="lowStockAt"
              type="number"
              min="0"
              step="1"
              value={draft.lowStockAt}
              onChange={handleChange}
              disabled={saving}
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor={`image-${product._id}`} className={labelClass}>
              Image link (https://...)
            </label>
            <input
              id={`image-${product._id}`}
              name="image"
              value={draft.image}
              onChange={handleChange}
              disabled={saving}
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor={`description-${product._id}`}
              className={labelClass}
            >
              Description
            </label>
            <textarea
              id={`description-${product._id}`}
              name="description"
              rows={3}
              value={draft.description}
              onChange={handleChange}
              disabled={saving}
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {message && (
        <p
          role={failed ? 'alert' : 'status'}
          className={`mt-3 text-xs ${
            failed ? 'text-red-700' : 'text-emerald-700'
          }`}
        >
          {message}
        </p>
      )}
    </article>
  )
}

function ProductsSection() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        const response = await fetch(API_BASE + '/api/admin/products', {
          credentials: 'include',
          signal: controller.signal,
        })

        if (response.status === 401) {
          throw new Error(
            'Please sign in with an admin account, then open this page again.',
          )
        }

        if (response.status === 403) {
          throw new Error('This account does not have admin access.')
        }

        if (!response.ok) {
          throw new Error('Products could not be loaded. Please try again.')
        }

        const data = await response.json()
        setProducts(data.products || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err.message ||
              'Could not reach the API. Check the backend and try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [])

  function updateProduct(updated) {
    setProducts((current) =>
      current.map((item) => (item._id === updated._id ? updated : item)),
    )
  }

  function addProduct(created) {
    setProducts((current) => [created, ...current])
  }

  const groups = [...new Set(products.map((item) => item.group))]
  const labelFor = (groupId) => groupLabelFor(products, groupId)
  const isLow = (item) => item.stock > 0 && item.stock <= item.lowStockAt

  const cards = [
    { key: 'all', label: 'Total products', value: products.length },
    {
      key: 'active',
      label: 'Visible',
      value: products.filter((item) => item.active).length,
    },
    {
      key: 'hidden',
      label: 'Hidden',
      value: products.filter((item) => !item.active).length,
    },
    { key: 'low', label: 'Low stock', value: products.filter(isLow).length },
    {
      key: 'out',
      label: 'Out of stock',
      value: products.filter((item) => item.stock === 0).length,
    },
  ]

  const search = query.trim().toLowerCase()

  const visible = products.filter((item) => {
    if (
      search &&
      !item.name.toLowerCase().includes(search) &&
      !item.productId.toLowerCase().includes(search)
    ) {
      return false
    }
    if (group !== 'all' && item.group !== group) return false
    if (statusFilter === 'active' && !item.active) return false
    if (statusFilter === 'hidden' && item.active) return false
    if (statusFilter === 'out' && item.stock !== 0) return false
    if (statusFilter === 'low' && !isLow(item)) return false
    return true
  })

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d46d4f]">
        Catalog and stock
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Products
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#827b75]">
        Update price, stock and visibility here. Hiding a product keeps it in
        the database; it just stops showing on the store.
      </p>

      {loading && (
        <div className="mt-6 rounded-2xl border border-[#e8e3de] bg-white p-8 text-sm text-[#77706a]">
          Loading products...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => (
              <button
                type="button"
                key={card.key}
                onClick={() => setStatusFilter(card.key)}
                aria-pressed={statusFilter === card.key}
                className={`rounded-2xl border border-[#db7657] bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                  statusFilter === card.key ? 'ring-2 ring-[#db7657]/30' : ''
                }`}
              >
                <p className="text-3xl font-bold tracking-tight">
                  {card.value}
                </p>
                <p className="mt-1 text-sm font-medium text-[#827b75]">
                  {card.label}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="product-search" className={labelClass}>
                Search (naam ya ID)
              </label>
              <input
                id="product-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="jaise Oxford ya men-1"
                className={fieldClass}
              />
            </div>

            <div className="w-44">
              <label htmlFor="product-group" className={labelClass}>
                Group
              </label>
              <select
                id="product-group"
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className={fieldClass}
              >
                <option value="all">All groups</option>
                {groups.map((groupId) => (
                  <option key={groupId} value={groupId}>
                    {labelFor(groupId)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAdd((value) => !value)}
              className="rounded-lg bg-[#24211f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#db7657]"
            >
              {showAdd ? 'Close form' : 'Add product'}
            </button>
          </div>

          {showAdd && (
            <AddProductForm
              groups={groups}
              labelFor={labelFor}
              onCreated={addProduct}
              onClose={() => setShowAdd(false)}
            />
          )}

          <p className="mt-4 text-xs text-[#928b85]">
            Showing {visible.length} product{visible.length === 1 ? '' : 's'}.
          </p>

          {visible.length === 0 ? (
            <div className="mt-4 rounded-[24px] border border-[#e9e5e0] bg-white px-6 py-14 text-center">
              <Package size={32} className="mx-auto text-[#c7bdb5]" />
              <p className="mt-4 font-semibold">No products found</p>
              <p className="mt-1 text-sm text-[#928b85]">
                Try a different search or filter.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {visible.map((item) => (
                <ProductRow
                  key={item._id}
                  product={item}
                  onUpdated={updateProduct}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default function Admin() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [tab, setTab] = useState('orders')

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ORDERS_PER_PAGE),
        })

        if (filter !== 'all') params.set('status', filter)
        if (search) params.set('q', search)

        const response = await fetch(
          `${API_BASE}/api/admin/orders?${params.toString()}`,
          {
            credentials: 'include',
            signal: controller.signal,
          },
        )

        if (response.status === 401) {
          throw new Error(
            'Please sign in with an admin account in the store, then open this page again.',
          )
        }

        if (response.status === 403) {
          throw new Error('This account does not have admin access.')
        }

        if (!response.ok) {
          throw new Error('Orders could not be loaded. Please try again.')
        }

        const data = await response.json()
        const nextOrders = Array.isArray(data.orders) ? data.orders : []
        const nextPageCount = Math.max(1, Number(data.pageCount) || 1)

        setOrders(nextOrders)
        setTotal(Number(data.total) || 0)
        setPageCount(nextPageCount)
        setLastUpdated(new Date())

        if (page > nextPageCount) setPage(nextPageCount)
      } catch (err) {
        if (err.name === 'AbortError') return

        setError(
          err instanceof TypeError
            ? 'Could not reach the API. Check that the backend is running and allows this origin.'
            : err.message || 'Orders could not be loaded.',
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [page, filter, search, reloadToken])

  function updateOrder(updatedOrder) {
    setOrders((current) =>
      current.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order,
      ),
    )
  }

  function removeOrder(orderId) {
    setOrders((current) => current.filter((order) => order._id !== orderId))
    setTotal((current) => Math.max(0, current - 1))
  }

  function applyFilter(nextFilter) {
    setFilter(nextFilter)
    setPage(1)
    setError('')
  }

  function submitSearch(event) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
    setError('')
  }

  function clearSearch() {
    setSearchInput('')
    setSearch('')
    setPage(1)
    setError('')
  }

  function refreshOrders() {
    setError('')
    setReloadToken((token) => token + 1)
  }

  const summary = [
    {
      label: 'All orders',
      value: total,
      filter: 'all',
      icon: ClipboardList,
      iconClass: 'bg-[#fff0e9] text-[#d46d4f]',
    },
    {
      label: 'Processing',
      value: countStatus(orders, 'processing'),
      filter: 'processing',
      icon: Clock3,
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Shipped',
      value: countStatus(orders, 'shipped'),
      filter: 'shipped',
      icon: Truck,
      iconClass: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Delivered',
      value: countStatus(orders, 'delivered'),
      filter: 'delivered',
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Cancelled',
      value: countStatus(orders, 'cancelled'),
      filter: 'cancelled',
      icon: XCircle,
      iconClass: 'bg-red-50 text-red-700',
    },
  ]

  return (
    <main className="min-h-screen bg-[#f5f3f0] text-[#24211f]">
      <div className="lg:flex">
        {/* Sidebar */}
        <aside className="sticky top-0 z-40 border-b border-white/10 bg-[#201f1c] text-white lg:flex lg:h-screen lg:w-[272px] lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:border-black/20">
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:flex-col lg:items-stretch lg:gap-0 lg:px-6 lg:py-7">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 lg:h-12 lg:w-12">
                <img
                  src="/urban.jpg"
                  alt="Urban Outline logo"
                  className="block h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold tracking-[0.16em]">
                  URBAN OUTLINE
                </p>
                <p className="mt-0.5 text-[11px] text-white/45">
                  Admin dashboard
                </p>
              </div>
            </div>

            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 transition hover:border-white/40 hover:text-white lg:hidden"
            >
              <ArrowLeft size={15} />
              Store
            </a>
          </div>

          <nav
            aria-label="Admin sections"
            className="flex gap-2 overflow-x-auto px-4 pb-4 sm:px-6 lg:mt-7 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-4 lg:pb-0"
          >
            {[
              { id: 'orders', label: 'Orders', icon: ClipboardList },
              { id: 'products', label: 'Products & stock', icon: Package },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => {
              const active = tab === id

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={active}
                  className={`group relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors lg:w-full ${
                    active ? 'text-white' : 'text-white/55 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav-pill"
                      className="absolute inset-0 rounded-xl bg-[#db7657]"
                      transition={{
                        type: 'spring',
                        stiffness: 430,
                        damping: 34,
                      }}
                    />
                  )}

                  <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors group-hover:bg-white/5" />

                  <Icon
                    size={17}
                    strokeWidth={1.9}
                    className="relative z-10"
                  />
                  <span className="relative z-10 whitespace-nowrap">
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="mt-auto hidden px-6 pb-7 lg:block">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 transition hover:text-white"
            >
              <ArrowLeft size={15} />
              Back to store
            </a>
            <p className="mt-5 text-[11px] leading-5 text-white/35">
              Signed in as an admin. New customer orders show up here — press
              Refresh to pull the latest.
            </p>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <motion.div
            key={tab}
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12"
          >
        {tab === 'orders' && (<>
        {/* Page title */}
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d46d4f]">
              Store management
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Orders
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#827b75] sm:text-base">
              Every order that comes through the store, with search, filters and
              status updates.
            </p>
          </div>
<button
  type="button"
  onClick={() => {
    document.getElementById('orders-list')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }}
  className="hidden items-center gap-2 rounded-full border border-[#e8e3de] bg-white px-4 py-2 text-xs font-semibold text-[#77706a] transition hover:border-[#db7657] hover:text-[#db7657] sm:flex"
>
  <PackageCheck size={16} className="text-[#d46d4f]" />
  Order management
</button>
 </div>
       
        {loading && (
            
          <div className="rounded-2xl border border-[#e8e3de] bg-white p-8 text-sm text-[#77706a]">
            Loading orders...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
          >
            <p>{error}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={refreshOrders}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
              >
                Try again
              </button>

              <a href="/" className="font-bold underline">
                Sign in on the store
              </a>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summary.map(({ label, value, filter: cardFilter, icon: Icon, iconClass }) => {
  return (
    <button
      type="button"
      key={label}
      onClick={() => applyFilter(cardFilter)}
      aria-pressed={filter === cardFilter}
      className={`rounded-[24px] border border-[#db7657] bg-white p-6 text-left shadow-[0_8px_30px_rgba(40,32,25,0.04)] transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#db7657] ${
        filter === cardFilter ? 'ring-2 ring-[#db7657]/30' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon size={26} strokeWidth={1.7} />
        </span>
        <ArrowUpRight size={19} className="text-[#c7c0ba]" />
      </div>

      <p className="mt-7 text-4xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm font-medium text-[#827b75]">{label}</p>
    </button>
  )
})}  
            </div>

            <p className="mt-3 text-xs text-[#928b85]">
              “All orders” counts every order that matches the current search and
              filter. The status cards count the orders on this page.
            </p>

            {/* List heading and filter */}
          
            
            <div
              id="orders-list"
              className="mb-5 mt-12 flex scroll-mt-6 flex-wrap items-end justify-between gap-4"
            >
              <form
                onSubmit={submitSearch}
                className="flex flex-wrap items-end gap-2"
              >
                <label className="block text-xs font-bold text-[#827b75]">
                  Search orders
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Order ID, name, phone, city or product"
                    className="mt-1 block w-full min-w-[240px] rounded-lg border border-[#ded8d2] bg-white px-3 py-2 text-sm font-normal text-[#24211f] outline-none focus:border-[#db7657] sm:w-[320px]"
                  />
                </label>

                <button
                  type="submit"
                  className="rounded-lg bg-[#24211f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#db7657]"
                >
                  Search
                </button>

                {(search || searchInput) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="rounded-lg border border-[#ded8d2] bg-white px-4 py-2 text-sm font-semibold text-[#706a65] transition hover:border-[#db7657] hover:text-[#db7657]"
                  >
                    Clear
                  </button>
                )}
              </form>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#928b85]">
                  {lastUpdated
                    ? `Updated ${lastUpdated.toLocaleTimeString()}`
                    : ''}
                </span>

                <button
                  type="button"
                  onClick={refreshOrders}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#ded8d2] bg-white px-4 py-2 text-sm font-semibold text-[#706a65] transition hover:border-[#db7657] hover:text-[#db7657]"
                >
                  Refresh
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-[24px] border border-[#e9e5e0] bg-white px-6 py-14 text-center">
                <Package size={32} className="mx-auto text-[#c7bdb5]" />
                <p className="mt-4 font-semibold">No orders found</p>
                <p className="mt-1 text-sm text-[#928b85]">
                  {search || filter !== 'all'
                    ? 'No orders match this search or filter.'
                    : 'Orders will appear here as soon as customers check out.'}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onUpdated={updateOrder}
                    onDeleted={removeOrder}
                  />
                ))}
              </div>
            )}

            {pageCount > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8e3de] bg-white px-4 py-3">
                <p className="text-xs text-[#827b75]">
                  Page {page} of {pageCount} · {total} order
                  {total === 1 ? '' : 's'}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-[#ded8d2] bg-white px-4 py-2 text-sm font-semibold text-[#706a65] transition hover:border-[#db7657] hover:text-[#db7657] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(pageCount, current + 1))
                    }
                    disabled={page >= pageCount}
                    className="rounded-lg border border-[#ded8d2] bg-white px-4 py-2 text-sm font-semibold text-[#706a65] transition hover:border-[#db7657] hover:text-[#db7657] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </>)}

        {tab === 'messages' && !loading && !error && <MessagesSection />}

        {tab === 'products' && <ProductsSection />}
          </motion.div>
        </div>
      </div>
    </main>
  )
}