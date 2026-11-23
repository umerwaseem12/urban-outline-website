import { useEffect, useState } from 'react'
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
  Package,
  PackageCheck,
  ShoppingBag,
  SlidersHorizontal,
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
        throw new Error(data.message || 'Status update nahi hua.')
      }

      onUpdated(data.order)
      setMessage('Status saved successfully.')
    } catch (error) {
      setFailed(true)
      setMessage(error.message || 'Status update nahi hua.')
    } finally {
      setSaving(false)
    }
  }
  async function deleteOrder() {
    const confirmed = window.confirm(
      'Kya aap ye order permanently delete karna chahte hain? Ye action undo nahi hoga.',
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
        throw new Error(data.message || 'Order delete nahi hua.')
      }

      onDeleted(order._id)
    } catch (error) {
      setFailed(true)
      setMessage(error.message || 'Order delete nahi hua.')
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

        if (!response.ok) throw new Error('Messages load nahi hue.')

        const data = await response.json()
        setMessages(data.messages || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Messages load nahi hue.')
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
      setError('Status update nahi hua.')
    }
  }

  async function removeMessage(id) {
    if (!window.confirm('Ye message permanently delete karna hai?')) return

    try {
      const response = await fetch(
        API_BASE + `/api/admin/messages/${id}`,
        { method: 'DELETE', credentials: 'include' },
      )
      if (!response.ok && response.status !== 404) {
        throw new Error('Message delete nahi hua.')
      }
      setMessages((current) => current.filter((m) => m._id !== id))
    } catch (err) {
      setError(err.message || 'Message delete nahi hua.')
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
          Abhi koi message nahi hai.
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
export default function Admin() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      try {
        const response = await fetch(
          API_BASE + '/api/admin/orders',
          {
            credentials: 'include',
            signal: controller.signal,
          },
        )

        if (response.status === 401) {
          throw new Error(
            'Admin account se sign in karein, phir yahan wapas aayein.',
          )
        }

        if (response.status === 403) {
          throw new Error('Is account ko admin access nahi hai.')
        }

        if (!response.ok) {
          throw new Error('Orders load nahi hue. Dobara try karein.')
        }

        const data = await response.json()
        setOrders(data.orders)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Backend se connection nahi ho raha.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [])

  function updateOrder(updatedOrder) {
    setOrders((current) =>
      current.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order,
      ),
    )
  }

    function removeOrder(orderId) {
    setOrders((current) => current.filter((order) => order._id !== orderId))
  }

  const visibleOrders =
    filter === 'all'
      ? orders
      : orders.filter((order) => order.orderStatus === filter)

  const summary = [
    {
      label: 'Total orders',
      value: orders.length,
      icon: ClipboardList,
      iconClass: 'bg-[#fff0e9] text-[#d46d4f]',
    },
    {
      label: 'Processing',
      value: orders.filter((order) => order.orderStatus === 'processing').length,
      icon: Clock3,
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Shipped',
      value: orders.filter((order) => order.orderStatus === 'shipped').length,
      icon: Truck,
      iconClass: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Delivered',
      value: orders.filter((order) => order.orderStatus === 'delivered').length,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-700',

    },
      {
      label: 'Cancelled',
      value: orders.filter((order) => order.orderStatus === 'cancelled').length,
      icon: XCircle,
      iconClass: 'bg-red-50 text-red-700',
    },
  ]

  return (
    <main className="min-h-screen bg-[#f5f3f0] text-[#24211f]">
      {/* Top bar */}
      <header className="border-b border-[#e8e3de] bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
       <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[20px]">
  <img
    src="/urban.jpg"
    alt="Urban Outline logo"
    className="block h-full w-full object-cover"
  />
</div>
            <div>
              <p className="text-sm font-bold tracking-[0.14em]">
                URBAN OUTLINE
              </p>
              <p className="mt-0.5 text-xs text-[#928b85]">Admin dashboard</p>
            </div>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e8e3de] px-4 py-3 text-sm font-semibold transition hover:bg-[#f7f5f2]"
          >
            <ArrowLeft size={17} />
            Back to store
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
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
              View and manage your latest 50 orders in one place.
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
            Orders load ho rahe hain...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
          >
            <p>{error}</p>
            <a href="/" className="mt-3 inline-block font-bold underline">
              Store par jaakar sign in karein
            </a>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summary.map(({ label, value, icon: Icon, iconClass }) => {
  const cardFilter =
    label === 'Total orders' ? 'all' : label.toLowerCase()

  return (
    <button
      type="button"
      key={label}
      onClick={() => setFilter(cardFilter)}
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
              Summary counts are based on the latest 50 loaded orders.
            </p>

            {/* List heading and filter */}
          
            
            <div
  id="orders-list"
  className="mb-5 mt-12 scroll-mt-6 flex flex-wrap items-end justify-between gap-5"
></div>

            {visibleOrders.length === 0 ? (
              <div className="rounded-[24px] border border-[#e9e5e0] bg-white px-6 py-14 text-center">
                <Package size={32} className="mx-auto text-[#c7bdb5]" />
                <p className="mt-4 font-semibold">No orders found</p>
                <p className="mt-1 text-sm text-[#928b85]">
                  Is filter mein koi order nahi hai.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {visibleOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onUpdated={updateOrder}
                    onDeleted={removeOrder}
                  />
                ))}
                          </div>
            )}
          </>
        )}

        {!loading && !error && <MessagesSection />}
      </div>
    </main>
  )
}