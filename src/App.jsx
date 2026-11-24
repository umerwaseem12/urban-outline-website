import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProductDetail from './Pages/ProductDetail.jsx'
import Checkout from './Pages/Checkout.jsx'
import Contact from './Pages/Contact.jsx'
import Account from './Pages/Account.jsx'
import CustomerCare from './Pages/CustomerCare.jsx'
import OrderConfirmation from './Pages/OrderConfirmation.jsx'
import PasswordReset from './Pages/PasswordReset.jsx'
import ChatAssistant from './Pages/ChatAssistant.jsx'
import { API_BASE } from './config'

import {
  ArrowRight,
  Heart,
  Menu,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Trash2,
  Truck,
  UserRound,
  X,
} from 'lucide-react'
import { FaFacebookF, FaInstagram } from 'react-icons/fa'


import { catalogGroups, products } from '../shared/catalog.mjs'

const navItems = [
  { label: 'Men', href: '#men' },
  { label: 'Women', href: '#women' },
  { label: 'Boys', href: '#boys' },
  { label: 'Girls', href: '#girls' },
]

const formatPrice = (amount) =>
  `Rs. ${new Intl.NumberFormat('en-PK').format(amount)}`
const categories = catalogGroups.map((group) => ({
  id: group.id,
  title: group.title,
  subtitle:
    group.id === 'men'
      ? 'Everyday, elevated.'
      : group.id === 'women'
        ? 'Made to make a statement.'
        : group.id === 'boys'
          ? 'Made for everyday adventures.'
          : 'Everyday styles for girls.',
  image: group.images[0],
}))
function Logo() {
  return (
    <a
      href="#home"
      className="flex shrink-0 items-center"
      aria-label="Urban Outline home"
    >
        <img
        src="/urban.jpg"
        alt="Urban Outline"
        className="h-14 w-14 shrink-0 rounded-full border border-[var(--line)] object-cover"
      />
    </a>
  )
}

function SectionHeading({ eyebrow, title, description, link }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-brand">
          {eyebrow}
        </p>

        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        )}
      </div>

      {link && (
        <a
          href="#new-arrivals"
          className="inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors hover:text-brand"
        >
          {link}
          <ArrowRight size={15} />
        </a>
      )}
    </div>
  )
}


function ProductCard({
  product,
  onAdd,
  onView,
  isFavourite,
  onToggleFavourite,
  quantity,
  onChangeQuantity,
  onRemove,
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45 }}
      className="group min-w-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#efede8] dark:bg-[#292824]">
        {product.image ? (
          <motion.img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onClick={() => onView(product)}
            whileHover={{ scale: 1.045 }}
            transition={{ duration: 0.55 }}
            className="h-full w-full cursor-pointer object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#ece8e1] px-4 text-center dark:bg-[#2b2925]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Add image
            </span>
          </div>
        )}

        {product.badge && (
          <span className="absolute left-3 top-3 bg-[var(--surface)] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em]">
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleFavourite(product.id)}
          aria-label={isFavourite ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] transition-transform hover:scale-105"
        >
          <Heart
            size={16}
            className={isFavourite ? 'fill-brand text-brand' : ''}
          />
        </button>

        <div className="absolute bottom-3 left-3 right-3 flex justify-center">
          {quantity > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-sm border border-white/20 bg-[#201f1c] text-white shadow-md">
                <button
                  type="button"
                  onClick={() => onChangeQuantity(product.id, -1)}
                  aria-label={`Decrease ${product.name} quantity`}
                  className="flex h-10 w-10 items-center justify-center transition-colors hover:text-[#db7657]"
                >
                  <Minus size={15} />
                </button>

                <span
                  aria-live="polite"
                  className="min-w-8 text-center text-sm font-semibold"
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => onChangeQuantity(product.id, 1)}
                  aria-label={`Increase ${product.name} quantity`}
                  className="flex h-10 w-10 items-center justify-center transition-colors hover:text-[#db7657]"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onRemove(product.id)}
                aria-label={`Remove ${product.name} from cart`}
                className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#201f1c] text-white shadow-md transition-colors hover:bg-[#db7657]"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(product)}
              className="inline-flex min-h-10 items-center justify-center rounded-sm bg-[#201f1c] px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-md transition-colors hover:bg-[#db7657]"
            >
              Buy now
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            {product.category}
          </p>

          <button
            type="button"
            onClick={() => onView(product)}
            className="mt-1.5 text-left font-display text-sm font-semibold transition-colors hover:text-brand sm:text-base"
          >
            {product.name}
          </button>
        </div>

        <div className="shrink-0 text-right text-sm font-semibold">
          <p>{formatPrice(product.price)}</p>

          {product.oldPrice && (
            <p className="mt-1 text-xs font-normal text-[var(--muted)] line-through">
              {formatPrice(product.oldPrice)}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  )
}

 function App() {
  const [resetToken, setResetToken] = useState(
    () => new URLSearchParams(window.location.search).get('resetToken') || '',
  )

  useEffect(() => {
    if (!resetToken) return

    const url = new URL(window.location.href)
    url.searchParams.delete('resetToken')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }, [resetToken])
    const [verifyToken, setVerifyToken] = useState(
    () => new URLSearchParams(window.location.search).get('verifyToken') || '',
  )
  const [verifyStatus, setVerifyStatus] = useState('')
  const [verifyMessage, setVerifyMessage] = useState('')
  const verifyStarted = useRef(false)

  useEffect(() => {
    if (!verifyToken || verifyStarted.current) return
    verifyStarted.current = true

    const url = new URL(window.location.href)
    url.searchParams.delete('verifyToken')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)

    setVerifyStatus('checking')

    fetch(API_BASE + '/api/auth/verify-email', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken }),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        setVerifyStatus(response.ok ? 'success' : 'error')
        setVerifyMessage(
          result.message ||
            (response.ok
              ? 'Email verified. Please sign in.'
              : 'Verification link invalid or expired.'),
        )
      })
      .catch(() => {
        setVerifyStatus('error')
        setVerifyMessage('Server se connection nahi ho raha. Dobara try karein.')
      })
  }, [verifyToken])
  const [isDark, setIsDark] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.localStorage.getItem('urban-outline-theme') === 'dark',
  )
  const [searchOpen, setSearchOpen] = useState(false)
const [searchQuery, setSearchQuery] = useState('')
const [selectedGroup, setSelectedGroup] = useState('')
const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
const [cartOpen, setCartOpen] = useState(false)
const [checkoutOpen, setCheckoutOpen] = useState(false)
const [completedOrder, setCompletedOrder] = useState(null)
const [cartItems, setCartItems] = useState([])
const [favourites, setFavourites] = useState([])
const [selectedProduct, setSelectedProduct] = useState(null)
const [contactOpen, setContactOpen] = useState(false)
const [accountOpen, setAccountOpen] = useState(false)
const [headerUser, setHeaderUser] = useState(null)
const [headerPhotoFailed, setHeaderPhotoFailed] = useState(false)

useEffect(() => {
  setHeaderPhotoFailed(false)
}, [headerUser?.id, headerUser?.profilePicture])

useEffect(() => {
  if (accountOpen) return

  let active = true

  fetch(API_BASE + '/api/auth/me', {
    credentials: 'include',
  })
    .then(async (response) => {
      if (response.status === 401) {
        if (active) setHeaderUser(null)
        return
      }

      if (!response.ok) return

      const result = await response.json()
      if (active) setHeaderUser(result.user || null)
    })
    .catch(() => {
      console.error('Account status check failed.')
    })

  return () => {
    active = false
  }
}, [accountOpen])
const [activeCustomerCarePage, setActiveCustomerCarePage] = useState(null)
const [toast, setToast] = useState('')
const [cartToast, setCartToast] = useState(null)

useEffect(() => {
  if (!cartToast) return

  const timer = window.setTimeout(() => {
    setCartToast(null)
  }, 4000)

  return () => window.clearTimeout(timer)
}, [cartToast])
const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(
      'urban-outline-theme',
      isDark ? 'dark' : 'light',
    )
  }, [isDark])

  useEffect(() => {
    if (!toast) return undefined

    const timer = window.setTimeout(() => setToast(''), 2500)

    return () => window.clearTimeout(timer)
  }, [toast])

 const visibleProducts = useMemo(() => {
  const query = searchQuery.trim().toLowerCase()

  return products.filter((product) => {
    const matchesGroup =
      !selectedGroup || product.group === selectedGroup

    const matchesQuery =
      !query ||
      `${product.name} ${product.category}`.toLowerCase().includes(query)

    return matchesGroup && matchesQuery
  })
}, [searchQuery, selectedGroup])

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  )
  const searchSuggestions = useMemo(() => {
  const tokens = searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (tokens.length === 0) return []

  return products
    .map((product) => {
      const name = product.name.toLowerCase()
      const category = product.category.toLowerCase()
      const group = (product.group || '').toLowerCase()

      const score = tokens.reduce((total, token) => {
        if (name.includes(token)) return total + 3
        if (category.includes(token) || group.includes(token)) return total + 1
        return total
      }, 0)

      return { product, score }
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map((result) => result.product)
}, [searchQuery])

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  function addToCart(product) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === product.id,
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...currentItems, { ...product, quantity: 1 }]
    })

    setToast('')
setCartToast({ productName: product.name })
  }

  function changeQuantity(productId, change) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function toggleFavourite(productId) {
    setFavourites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    )
  }
    if (resetToken) {
    return (
      <PasswordReset
        token={resetToken}
        onBack={() => {
          setResetToken('')
          setAccountOpen(true)
        }}
      />
    )
  }
   if (verifyToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f1ee] px-4 text-[#24211f]">
        <div className="w-full max-w-md rounded-[28px] border border-[#db7657] bg-white p-8 text-center shadow-lg">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#db7657]">
            Urban Outline
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            {verifyStatus === 'success'
              ? 'Email verified'
              : verifyStatus === 'error'
                ? 'Verification failed'
                : 'Verifying your email...'}
          </h1>

          {verifyMessage && (
            <p className="mt-3 text-sm leading-6 text-[#706a65]">
              {verifyMessage}
            </p>
          )}

          {verifyStatus && verifyStatus !== 'checking' && (
            <button
              type="button"
              onClick={() => {
                setVerifyToken('')
                setAccountOpen(true)
              }}
              className="mt-6 w-full rounded-xl bg-[#252220] px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#db7657]"
            >
              {verifyStatus === 'success' ? 'Sign in' : 'Back to sign in'}
            </button>
          )}
        </div>
      </main>
    )
  }

 if (accountOpen) {
  return (
    <>
      <Account
        isDark={isDark}
        onToggleTheme={() => setIsDark((dark) => !dark)}
        onHelp={() => {
          setAccountOpen(false)
          setContactOpen(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onBack={() => {
          setAccountOpen(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {renderChat()}
    </>
  )
}
 if (completedOrder) {
  return (
    <OrderConfirmation
      order={completedOrder}
      onContinueShopping={() => {
        setCompletedOrder(null)
        setSelectedGroup('')
        setSearchQuery('')
        window.history.replaceState(null, '', '/')

        window.setTimeout(() => {
          document.getElementById('product-grid')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }, 100)
      }}
    />
  )
}

if (checkoutOpen) {
  return (
    <>
      <Checkout
        cartItems={cartItems}
        onBack={() => {
          setCheckoutOpen(false)
          setCartOpen(true)
        }}
        onPlaceOrder={async (order) => {
          try {
            const response = await fetch(API_BASE + '/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...order,
                paymentMethod:
                  order.paymentMethod || order.customer?.paymentMethod || 'cod',
              }),
            })

            const result = await response.json().catch(() => ({}))

            if (!response.ok) {
              console.error('Order API error:', response.status, result)

              return {
                success: false,
                message:
                  result.message ||
                  result.error ||
                  `Server ne order reject kiya (${response.status}).`,
              }
            }

            const savedOrder = {
              ...order,
              orderId: result.orderId || result.order?._id || result._id || '',
              paymentMethod:
                result.paymentMethod ||
                order.paymentMethod ||
                order.customer?.paymentMethod ||
                'cod',
              subtotal: result.subtotal ?? order.subtotal,
              shippingFee: result.shippingFee ?? order.shippingFee,
              total: result.total ?? order.total,
              paymentStatus: result.paymentStatus || 'pending',
              orderStatus: result.orderStatus || 'placed',
            }

            window.sessionStorage.setItem(
              'urbanOutlineLastOrder',
              JSON.stringify(savedOrder),
            )

            setCompletedOrder(savedOrder)
            setCartItems([])
            setCheckoutOpen(false)
            setCartOpen(false)

            return { success: true }
          } catch (error) {
            console.error('Order request failed:', error)
            return {
              success: false,
              message: 'Backend se connection nahi ho raha. Backend check karo.',
            }
          }
        }}
      />

      {renderChat()}
    </>
  )
}
if (activeCustomerCarePage) {
  return (
    <>
      <CustomerCare
        page={activeCustomerCarePage}
        onBack={() => {
          setActiveCustomerCarePage(null)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onContact={() => {
          setActiveCustomerCarePage(null)
          setContactOpen(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {renderChat()}
    </>
  )
}
if (contactOpen) {
  return (
    <>
      <Contact
        onBack={() => {
          setContactOpen(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {renderChat()}
    </>
  )
}
  if (selectedProduct) {
  return (
    <>
      <ProductDetail
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onAddToCart={(product) => {
          addToCart(product)
          setSelectedProduct(null)
        }}
        onBuyNow={(product) => {
          addToCart(product)
          setSelectedProduct(null)
          setCartOpen(true)
        }}
        isFavourite={favourites.includes(selectedProduct.id)}
        onToggleWishlist={toggleFavourite}
      />

      {renderChat()}
    </>
  )
}
function renderChat() {
  return (
    <ChatAssistant
      products={products}
      onOpenProduct={(product) => {
        setActiveCustomerCarePage(null)
        setContactOpen(false)
        setAccountOpen(false)
        setSelectedProduct(product)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    />
  )
}
function submitSearch(value = searchQuery) {
  const query = value.trim()
  if (!query) return

  setSearchQuery(query)
  setSearchFocused(false)
  setSearchOpen(false)

  window.setTimeout(() => {
    document.getElementById('new-arrivals')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, 150)
}
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] transition-colors duration-300">
      {/* Announcement bar */}
      <div className="bg-[#201f1c] px-4 py-2.5 text-center text-[9px] font-medium uppercase tracking-[0.19em] text-white sm:text-[10px]">
        Thoughtful style, delivered across Pakistan
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--page-bg)]">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Logo />

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
             <a
  key={item.label}
  href={item.href}
  onClick={(event) => {
    event.preventDefault()
    window.history.pushState(null, '', `#/${item.href.slice(1)}`)

    setSelectedGroup(item.href.slice(1))
    setSearchQuery('')
    setSearchOpen(false)
    setSearchFocused(false)
    document.getElementById('product-grid')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }}
  onMouseEnter={(event) => {
  event.currentTarget.style.setProperty('color', '#DB7657', 'important')
}}
onMouseLeave={(event) => {
  event.currentTarget.style.removeProperty('color')
}}
className="inline-flex items-center py-2 text-sm font-bold uppercase tracking-[0.15em] text-[var(--page-fg)] transition-colors duration-200 hover:text-[#db7657] md:text-base"
>
  {item.label}
</a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <span className="hidden items-center px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] xl:flex">
              
            </span>
            {headerUser && (
  <button
    type="button"
    onClick={() => setAccountOpen(true)}
    aria-label="Open your profile"
    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#db7657]"
  >
    {(headerUser.hasCustomPhoto || headerUser.profilePicture) && !headerPhotoFailed ? (
      <img
        src={
  headerUser.hasCustomPhoto
    ? API_BASE + '/api/auth/photo'
    : headerUser.profilePicture
}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setHeaderPhotoFailed(true)}
        className="h-9 w-9 rounded-full object-cover"
      />
    ) : (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f9e7df] text-xs font-bold text-[#bd5d3e]">
        {(headerUser.fullName || 'U')
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase()}
      </span>
    )}
  </button>
)}

            <button
              type="button"
              onClick={() => {
                setSearchOpen((open) => !open)
                setSearchQuery('')
              }}
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center transition-colors hover:text-brand"
            >
              <Search size={19} strokeWidth={1.7} />
            </button>

            <button
              type="button"
              onClick={() => setIsDark((dark) => !dark)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="hidden h-10 w-10 items-center justify-center transition-colors hover:text-brand sm:flex"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
{!headerUser && (
  <button
    type="button"
    onClick={() => setAccountOpen(true)}
    aria-label="Account"
    className="flex h-10 w-10 items-center justify-center transition-colors hover:text-brand"
  >
    <UserRound size={19} strokeWidth={1.7} />
  </button>
)}

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open shopping bag"
              className="relative flex h-10 w-10 items-center justify-center transition-colors hover:text-brand"
            >
              <ShoppingBag size={19} strokeWidth={1.7} />

              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
<AnimatePresence>
  {searchOpen && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="relative z-50 border-t border-[var(--line)]"
    >
      <div className="relative mx-auto flex max-w-[800px] items-start gap-3 px-5 py-4 sm:px-10">
        <Search
          size={18}
          className="mt-3 shrink-0 text-[var(--muted)]"
        />

        <div className="relative min-w-0 flex-1">
          <input
            autoFocus
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setSearchFocused(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submitSearch()
              }

              if (event.key === 'Escape') {
                setSearchFocused(false)
                setSearchOpen(false)
              }
            }}
            placeholder="Search shirts, bags, everyday essentials..."
            className="w-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-brand"
          />

          {searchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full z-[70] mt-1 overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submitSearch()}
                className="flex w-full items-center gap-3 border-b border-[var(--line)] px-4 py-3 text-left text-sm hover:bg-[var(--page-bg)]"
              >
                <Search size={17} className="shrink-0 text-[var(--muted)]" />
                <span className="min-w-0 flex-1 truncate">
                  Search for <strong>“{searchQuery.trim()}”</strong>
                </span>
                <ArrowRight size={16} />
              </button>

              <div className="max-h-[60vh] overflow-y-auto">
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => submitSearch(product.name)}
                      className="flex w-full items-center gap-3 border-b border-[var(--line)] px-4 py-2.5 text-left last:border-b-0 hover:bg-[var(--page-bg)]"
                    >
                      <div className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden bg-[#ece8e1] dark:bg-[#2b2925]">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBag
                            size={17}
                            className="text-[var(--muted)]"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          {product.category}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-semibold">
                        {formatPrice(product.price)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-4 text-sm text-[var(--muted)]">
                    Matching product nahi mila.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchOpen(false)
            setSearchFocused(false)
            setSearchQuery('')
          }}
          aria-label="Close search"
          className="mt-1 p-2 text-[var(--muted)] hover:text-[var(--page-fg)]"
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  )}
</AnimatePresence>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[var(--line)] bg-[var(--page-bg)] lg:hidden"
            >
              <div className="flex flex-col px-5 py-3">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="border-b border-[var(--line)] py-4 text-xs font-semibold uppercase tracking-[0.15em] last:border-0"
                  >
                    {item.label}
                  </a>
                ))}

                <button
                  type="button"
                  onClick={() => setIsDark((dark) => !dark)}
                  className="flex items-center gap-2 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] sm:hidden"
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main id="home">
        {/* Hero */}
        <section className="bg-[#eee9e1] dark:bg-[#262420]">
          <div className="mx-auto grid max-w-[1440px] lg:min-h-[620px] lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-start justify-center px-6 py-16 sm:px-12 lg:px-16 lg:py-20"
            >
              <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.27em] text-brand">
                The new everyday · 2026
              </p>

              <h1 className="font-display text-[clamp(3.4rem,8vw,6.7rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
                GOOD
                <br />
                STYLE
                <br />
                <span className="text-brand">NO RULES</span>
              </h1>

              <p className="mt-7 max-w-sm text-sm leading-7 text-[#625f59] dark:text-[#c5c0b7]">
                Easy pieces, considered details, and a little room to be
                yourself. Find your next favourite in the Urban Outline edit.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
             <a
  href="#new-arrivals"
  className="inline-flex items-center gap-4 bg-[#3a3833] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.16em] !text-white transition-colors hover:bg-brand dark:bg-[#4a4640]"
>
  Shop the edit
  <ArrowRight size={15} />
</a>

                <a
                  href="#collections"
                  className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-brand"
                >
                  Explore collections
                </a>
              </div>

              <p className="mt-12 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                
              </p>
            </motion.div>

            <div className="relative min-h-[390px] overflow-hidden sm:min-h-[500px] lg:min-h-[620px]">
              <motion.img
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1500&q=90"
                alt="Fashion model wearing a contemporary outfit"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute bottom-7 left-6 max-w-[220px] bg-[#f6f3ed] p-4 text-[#201f1c] sm:bottom-10 sm:left-10"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand">
                  A little more you
                </p>

                <p className="mt-2 font-display text-lg font-semibold">
                  Wear it your way.
                </p>
              </motion.div>

              <span className="absolute right-5 top-6 text-[9px] font-bold uppercase tracking-[0.22em] text-white sm:right-8 sm:top-8">
                Urban Outline · 01
              </span>
            </div>
          </div>
        </section>

        {/* Moving text strip */}
        <div className="overflow-hidden border-b border-[var(--line)] py-4">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            className="flex w-max gap-8 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]"
          >
            {[1, 2, 3, 4].map((item) => (
              <span key={item} className="flex items-center gap-8">
                MADE TO MOVE
                <span className="text-brand">✳</span>
                MADE FOR EVERY DAY
                <span className="text-brand">✳</span>
                YOUR STYLE, YOUR OUTLINE
                <span className="text-brand">✳</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* Benefits */}
        <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8 lg:px-10">
          {[
            {
              icon: Truck,
              title: 'Delivery across Pakistan',
              detail: 'Straight to your doorstep.',
            },
            {
              icon: RotateCcw,
              title: 'Easy exchange support',
              detail: 'We are here if the fit is not right.',
            },
            {
              icon: ShieldCheck,
              title: 'A secure checkout',
              detail: 'Your order details stay protected.',
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <div key={item.title} className="flex items-center gap-3 py-2">
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="shrink-0 text-brand"
                />

                <div>
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </section>

        {/* Collections */}
        <section
          id="collections"
          className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 lg:px-10"
        >
          <SectionHeading
            eyebrow="Find your outline"
            title="A little something for everyone."
            description="Explore easy-to-wear pieces for every age, every day, and every version of you."
            link="Shop new arrivals"
          />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.map((category, index) => (
              <motion.a
                id={category.id}
                key={category.title}
                href={`#/${category.id}`}
onClick={(event) => {
  event.preventDefault()
  window.history.pushState(null, '', `#/${category.id}`)
  setSelectedGroup(category.id)
  setSearchQuery('')
  setSearchOpen(false)
  setSearchFocused(false)

  window.setTimeout(() => {
    document.getElementById('new-arrivals')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, 100)
}}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                className="group relative aspect-[4/4.7] overflow-hidden bg-[#efede8] sm:aspect-[4/5]"
              >
                <motion.img
                  src={category.image}
                  alt={`${category.title} clothing collection`}
                  loading="lazy"
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.55 }}
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5 text-white sm:p-7">
                  <div>
                    <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/75">
                      {category.subtitle}
                    </p>

                    <h3 className="font-display text-2xl font-semibold sm:text-3xl">
                      {category.title}
                    </h3>
                  </div>

                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 transition-all group-hover:border-brand group-hover:bg-brand">
                    <ArrowRight size={17} />
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Products */}
        <section
          id="new-arrivals"
          className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10"
        >
          <SectionHeading
            eyebrow="The latest edit"
            title={searchQuery ? 'Search results' : 'New things, good things.'}
            description="Fresh favourites, picked to make getting dressed feel easy."
          />

          {visibleProducts.length > 0 ? (
        <div
  id="product-grid"
  className="scroll-mt-28 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4"
>
    {visibleProducts.map((product) => (
<ProductCard
  key={product.id}
  product={product}
  onAdd={addToCart}
  onView={(product) => setSelectedProduct(product)}
  isFavourite={favourites.includes(product.id)}
  onToggleFavourite={toggleFavourite}
  quantity={cartItems.find((item) => item.id === product.id)?.quantity || 0}
  onChangeQuantity={changeQuantity}
  onRemove={(productId) => {
    setCartItems((current) =>
      current.filter((item) => item.id !== productId),
    )
  }}
/>
))}
            </div>
          ) : (
            <p className="border border-[var(--line)] px-5 py-10 text-center text-sm text-[var(--muted)]">
              No products found. Try another search.
            </p>
          )}
        </section>

        {/* Editorial banner */}
        <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
          <div className="relative min-h-[360px] overflow-hidden bg-[#24221f] sm:min-h-[430px]">
            <img
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1500&q=85"
              alt="Contemporary fashion collection"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-65"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative z-10 flex min-h-[360px] max-w-xl flex-col items-start justify-center px-6 py-12 text-white sm:min-h-[430px] sm:px-12"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#f0a184]">
                The Urban Outline point of view
              </p>

              <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Less fuss.
                <br />
                More feeling.
              </h2>

              <p className="mt-5 max-w-sm text-sm leading-6 text-white/75">
                Pieces you reach for again and again. That is the whole idea.
              </p>

              <a
                href="#new-arrivals"
                className="mt-7 inline-flex items-center gap-3 border-b border-white/60 pb-2 text-[10px] font-bold uppercase tracking-[0.17em] transition-colors hover:border-brand hover:text-[#f0a184]"
              >
                Find your everyday
                <ArrowRight size={15} />
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        id="footer"
        className="border-t border-[var(--line)] bg-[var(--surface)]"
      >
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10 lg:py-16">
          <div>
            <Logo />

            <p className="mt-5 max-w-xs text-xs leading-6 text-[var(--muted)]">
              Easy pieces. Thoughtful details. A little more room to be yourself.
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em]">
              Explore
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-xs text-[var(--muted)]">
              
              <a className="hover:text-brand" href="#men">
                Men
              </a>
              <a className="hover:text-brand" href="#women">
                Women
              </a>
              <a className="hover:text-brand" href="#boys">
               Boys 
              </a>
              <a className="hover:text-brand" href="#girls">
               Girls
              </a>
            </div>
          </div>
<div>
  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em]">
    Customer care
  </h3>

  <div className="mt-5 flex flex-col gap-3 text-xs text-[var(--muted)]">
    <button
      type="button"
      onClick={() => {
        setActiveCustomerCarePage('shipping')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      className="w-fit text-left transition-colors hover:text-brand"
    >
      Shipping &amp; Delivery
    </button>

    <button
      type="button"
      onClick={() => {
        setActiveCustomerCarePage('returns')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      className="w-fit text-left transition-colors hover:text-brand"
    >
      Returns &amp; exchanges
    </button>

    <button
      type="button"
      onClick={() => {
        setActiveCustomerCarePage('privacy')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      className="w-fit text-left transition-colors hover:text-brand"
    >
      Privacy policy
    </button>

    <button
      type="button"
      onClick={() => {
        setContactOpen(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      className="w-fit text-left transition-colors hover:text-brand"
    >
      Contact us
    </button>
  </div>
</div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em]">
              Follow the outline
            </h3>

            <p className="mt-5 text-xs leading-6 text-[var(--muted)]">
              New edits, good outfits, and a little everyday inspiration.
            </p>

            <div className="mt-4 flex gap-3">
              <a
                href="#footer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:border-brand hover:text-brand"
              >
                <FaInstagram size={16} />
              </a>

              <a
                href="#footer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:border-brand hover:text-brand"
              >
                <FaFacebookF size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--line)] px-5 py-4 text-center text-[9px] uppercase tracking-[0.15em] text-[var(--muted)]">
          © {new Date().getFullYear()} Urban Outline · Pakistan · Prices in Rs.
        </div>
      </footer>
      <ChatAssistant
  products={products}
  onOpenProduct={(product) => setSelectedProduct(product)}
/>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close shopping bag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-50 cursor-default bg-black/50"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 z-[51] flex h-full w-full max-w-md flex-col bg-[var(--surface)] shadow-2xl"
              aria-label="Shopping bag"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-5">
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    Your Cart{' '}
                    <span className="text-[var(--muted)]">({cartCount})</span>
                  </h2>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Your picks, all in one place.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  aria-label="Close bag"
                  className="flex h-10 w-10 items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <ShoppingBag
                    size={34}
                    strokeWidth={1.2}
                    className="text-brand"
                  />

                  <h3 className="mt-5 font-display text-xl font-semibold">
                    Your bag is taking a break.
                  </h3>

                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Add something you love and it will show up here.
                  </p>

                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 bg-[#201f1c] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white hover:bg-brand"
                  >
                    Keep exploring
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-5">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 border-b border-[var(--line)] py-5"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-28 w-24 object-cover"
                          />
                        ) : (
                          <div className="flex h-28 w-24 items-center justify-center bg-[#ece8e1] text-center text-[9px] uppercase tracking-wide text-[var(--muted)] dark:bg-[#2b2925]">
                            Add image
                          </div>
                        )}

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
                                {item.category}
                              </p>

                              <h3 className="mt-1 text-sm font-semibold">
                                {item.name}
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setCartItems((current) =>
                                  current.filter(
                                    (product) => product.id !== item.id,
                                  ),
                                )
                              }
                              aria-label={`Remove ${item.name}`}
                              className="p-1 text-[var(--muted)] hover:text-brand"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-[var(--line)]">
                              <button
                                type="button"
                                onClick={() => changeQuantity(item.id, -1)}
                                aria-label="Decrease quantity"
                                className="p-2"
                              >
                                <Minus size={13} />
                              </button>

                              <span className="min-w-7 text-center text-xs">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => changeQuantity(item.id, 1)}
                                aria-label="Increase quantity"
                                className="p-2"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <span className="text-sm font-semibold">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[var(--line)] p-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Subtotal</span>
                      <span className="font-semibold">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>

                    <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">
                      Delivery charges and final details will be shown at
                      checkout.
                    </p>

                <button
  type="button"
  onClick={() => {
    if (cartItems.length === 0) {
      setToast('Your bag is empty.')
      return
    }

    setCartOpen(false)
    setCheckoutOpen(true)
  }}
  className="mt-5 flex w-full items-center justify-between bg-[#201f1c] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-brand"
>
  Continue to checkout
  <ArrowRight size={16} />
</button>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Small status message */}
  {/* Status messages */}
<AnimatePresence>
  {cartToast && (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-5 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-sm border border-[#db7657] bg-[#201f1c] px-6 py-5 text-center text-sm text-white shadow-xl sm:text-base"
    >
      <span>{cartToast.productName} added to your bag</span>

      <a
        href="#cart"
        onClick={(event) => {
          event.preventDefault()
          setCartToast(null)
          setCartOpen(true)
        }}
        className="font-bold text-[#f5a58a] underline underline-offset-4 transition-colors hover:text-white"
      >
        View cart →
      </a>
    </motion.div>
  )}

  {!cartToast && toast && (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 bg-[#201f1c] px-5 py-3 text-center text-xs text-white shadow-lg"
    >
      {toast}
    </motion.div>
  )}
</AnimatePresence>
    </div>
  )
}

export default App