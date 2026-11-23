import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'

const formatPrice = (amount) =>
  `Rs. ${new Intl.NumberFormat('en-PK').format(amount)}`

function getDefaultSizes(group) {
  if (group === 'baby') {
    return ['0–3M', '3–6M', '6–12M', '12–18M']
  }

  if (group === 'kids') {
    return ['2–3Y', '4–5Y', '6–7Y', '8–9Y', '10–12Y']
  }

  return ['S', 'M', 'L', 'XL', 'XXL']
}

export default function ProductDetail({
  product,
  onBack,
  onAddToCart,
  onBuyNow,
  isFavourite = false,
  onToggleWishlist,
}) {
  const images = useMemo(() => {
    if (Array.isArray(product?.images)) {
      return [...new Set(product.images.filter(Boolean))]
    }

    return product?.image ? [product.image] : []
  }, [product?.id, product?.image, product?.images])

  const [activeImage, setActiveImage] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('As shown')
  const [quantity, setQuantity] = useState(1)
  const [sizeError, setSizeError] = useState('')

  useEffect(() => {
    setActiveImage(images[0] || '')
    setSelectedSize('')
    setSelectedColor(
      product?.colors?.[0]?.name || product?.colors?.[0] || 'As shown',
    )
    setQuantity(1)
    setSizeError('')
  }, [product?.id, images])

  const sizes =
    product?.sizes?.length > 0
      ? product.sizes
      : getDefaultSizes(product?.group)

  const colors =
    product?.colors?.length > 0
      ? product.colors
      : [{ name: 'As shown', hex: '#a99b89' }]

  const needsSize = !/bag|accessor/i.test(product?.category || '')
  const discount =
    product?.oldPrice > product?.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : null

  function handlePurchase(action) {
    if (needsSize && !selectedSize) {
      setSizeError('Select your Size')
      return
    }

    const options = {
      size: needsSize ? selectedSize : null,
      color: selectedColor,
      quantity,
    }

    if (action === 'buy' && onBuyNow) {
      onBuyNow(product, options)
      return
    }

    onAddToCart?.(product, options)
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Product nahi mila
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 text-sm font-semibold text-brand"
        >
          Wapas products par jao
        </button>
      </section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 lg:px-10"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-brand"
      >
        <ArrowLeft size={16} />
        Back to products
      </button>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,1fr)_minmax(280px,0.72fr)]">
        {/* Product image gallery */}
        <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-3 sm:grid-cols-[70px_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(image)}
                aria-label={`View product image ${index + 1}`}
                className={`aspect-[4/5] overflow-hidden border bg-[var(--surface)] ${
                  activeImage === image
                    ? 'border-brand'
                    : 'border-[var(--line)]'
                }`}
              >
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="flex min-h-[400px] items-center justify-center overflow-hidden bg-[#efede8] dark:bg-[#292824] sm:min-h-[600px]">
            {activeImage ? (
              <motion.img
                key={activeImage}
                src={activeImage}
                alt={product.name}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="h-full max-h-[760px] w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 px-5 text-center text-[var(--muted)]">
                <ShoppingBag size={38} strokeWidth={1.2} />
                <span className="text-xs font-semibold uppercase tracking-[0.15em]">
                  Product image add karein
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Product information */}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
            {product.category}
          </p>

          <h1 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
            {product.name}
          </h1>

          <p className="mt-3 border-b border-[var(--line)] pb-4 text-xs text-[var(--muted)]">
            Urban Outline product · Reviews coming soon
          </p>

          <div className="flex items-baseline gap-3 py-5">
            <span className="text-3xl font-semibold">
              {formatPrice(product.price)}
            </span>

            {product.oldPrice && (
              <span className="text-sm text-[var(--muted)] line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}

            {discount && (
              <span className="text-xs font-semibold text-brand">
                {discount}% off
              </span>
            )}
          </div>

          <p className="text-sm leading-6 text-[var(--muted)]">
            {product.description ||
              'Product ki fabric, fit aur care details yahan add ki jayengi.'}
          </p>

          {/* Color selector */}
          <div className="mt-7">
            <p className="mb-3 text-sm">
              Color: <strong>{selectedColor}</strong>
            </p>

            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const name = typeof color === 'string' ? color : color.name
                const hex =
                  typeof color === 'string' ? '#a99b89' : color.hex || '#a99b89'

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedColor(name)}
                    aria-label={`Select color ${name}`}
                    title={name}
                    className={`flex h-10 items-center gap-2 border px-3 text-xs ${
                      selectedColor === name
                        ? 'border-brand'
                        : 'border-[var(--line)]'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                    {name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Size selector */}
          {needsSize && (
            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm">
                  Size: <strong>{selectedSize || 'Select a size'}</strong>
                </p>

                <details className="text-xs text-brand">
                  <summary className="cursor-pointer">Size guide</summary>
                  <p className="mt-2 max-w-xs leading-5 text-[var(--muted)]">
                  
                  </p>
                </details>
              </div>

              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size)
                      setSizeError('')
                    }}
                    className={`min-w-12 border px-3 py-2.5 text-xs font-semibold transition-colors ${
                      selectedSize === size
                        ? 'border-brand bg-brand text-white'
                        : 'border-[var(--line)] hover:border-brand'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {sizeError && (
                <p className="mt-2 text-xs text-red-600">{sizeError}</p>
              )}
            </div>
          )}

          {/* Product notes */}
          <div className="mt-8 space-y-3 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)]">
            <p className="flex items-center gap-2">
              <Truck size={16} className="shrink-0 text-brand" />
              Delivery across Pakistan; charges shown at checkout.
            </p>
            <p className="flex items-center gap-2">
              <RotateCcw size={16} className="shrink-0 text-brand" />
              Return and exchange details are in the store policy.
            </p>
          </div>
        </div>

        {/* Order box */}
        <aside className="border border-[var(--line)] bg-[var(--surface)] p-5 xl:sticky xl:top-28">
          <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>

          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          
          </p>

          <p className="mt-5 text-sm font-semibold text-emerald-700">
            Stock status checkout par confirm hoga
          </p>

          <label
            htmlFor="product-quantity"
            className="mt-5 block text-xs font-semibold"
          >
            Quantity
          </label>

          <div className="mt-2 flex w-fit items-center border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              aria-label="Decrease quantity"
              className="p-2.5"
            >
              <Minus size={14} />
            </button>

            <span
              id="product-quantity"
              className="min-w-9 text-center text-sm"
            >
              {quantity}
            </span>

            <button
              type="button"
              onClick={() => setQuantity((current) => current + 1)}
              aria-label="Increase quantity"
              className="p-2.5"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePurchase('cart')}
            className="mt-5 flex w-full items-center justify-center gap-2 bg-brand px-4 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-brand-dark"
          >
            <ShoppingBag size={16} />
            Add to Cart
          </button>

          <button
            type="button"
            onClick={() => handlePurchase('buy')}
            className="mt-3 w-full border border-[var(--line)] px-4 py-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-brand hover:text-brand"
          >
            Buy now
          </button>

          <button
            type="button"
            onClick={() => onToggleWishlist?.(product.id)}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-[var(--line)] px-4 py-3 text-xs font-semibold hover:border-brand"
          >
            <Heart
              size={16}
              className={isFavourite ? 'fill-brand text-brand' : ''}
            />
            {isFavourite ? 'Saved to wishlist' : 'Add to wishlist'}
          </button>

          <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-4 text-[11px] text-[var(--muted)]">
            <p className="flex items-center gap-2">
              <ShieldCheck size={15} className="shrink-0 text-brand" />
             
            </p>
            <p className="flex items-center gap-2">
              <Truck size={15} className="shrink-0 text-brand" />
              
            </p>
          </div>
        </aside>
      </div>

      {/* Product details section */}
      <div className="mt-12 border-t border-[var(--line)] pt-8">
        <h2 className="font-display text-xl font-semibold">Product details</h2>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--muted)]">Product</dt>
            <dd className="mt-1 font-medium">{product.name}</dd>
          </div>

          <div>
            <dt className="text-xs text-[var(--muted)]">Category</dt>
            <dd className="mt-1 font-medium">{product.category}</dd>
          </div>

          <div>
            <dt className="text-xs text-[var(--muted)]">Price</dt>
            <dd className="mt-1 font-medium">{formatPrice(product.price)}</dd>
          </div>

          <div>
            <dt className="text-xs text-[var(--muted)]">Store</dt>
            <dd className="mt-1 font-medium">Urban Outline · Pakistan</dd>
          </div>
        </dl>
      </div>
    </motion.section>
  )
}