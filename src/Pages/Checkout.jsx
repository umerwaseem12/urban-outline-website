import { useState } from 'react'

const paymentMethods = [{ value: 'cod', label: 'Cash on Delivery' }]
const inputClasses =
  'mt-2 w-full rounded-sm border border-[#d9d6ce] bg-white px-3 py-3 text-sm text-[#201f1c] outline-none placeholder:text-[#96928a] focus:border-[#201f1c] dark:border-[#47443d] dark:bg-[#24221e] dark:text-[#f5f2ec]'

function formatCheckoutPrice(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function Checkout({
  cartItems = [],
  onBack,
  onPlaceOrder,
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    province: '',
    city: '',
    address: '',
    postalCode: '',
    paymentMethod: 'cod',
  })

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  )

  const shippingFee = 250
  const total = subtotal + shippingFee

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) return

    if (!cartItems.length) {
      setError('Your bag is empty.')
      return
    }

    if (typeof onPlaceOrder !== 'function') {
      setError('Order submission is not connected.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const itemsForBackend = cartItems.map((item) => {
        const productId = String(
          item.productId || item.id || item._id || '',
        )
        const productName = String(
          item.productName || item.name || item.title || 'Product',
        )

        return {
          productId,
          id: productId,
          productName,
          name: productName,
          image: String(
            item.image || item.productImage || item.imageUrl || '',
          ),
          price: Number(item.price ?? item.unitPrice ?? 0),
          quantity: Math.max(1, Number(item.quantity) || 1),
        }
      })

      const order = {
        customer: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          province: formData.province,
          city:
  formData.province === 'Punjab'
    ? formData.city.trim()
    : formData.province,
          address: formData.address.trim(),
          postalCode: formData.postalCode.trim(),
        },
        items: itemsForBackend,
        subtotal,
        shippingFee,
        total,
        paymentMethod: formData.paymentMethod,
      }

      const result = await onPlaceOrder(order)

      if (result?.success === false) {
        setError(result.message || 'Order place nahi ho saka.')
      }
    } catch (submitError) {
      console.error('Order submission error:', submitError)
      setError('Order place nahi ho saka. Dobara try karein.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!cartItems.length) {
    return (
      <main className="min-h-screen bg-[#f6f5f2] px-4 py-12 text-[#201f1c] dark:bg-[#191816] dark:text-[#f5f2ec]">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-semibold">Your bag is empty</h1>

          <p className="mt-3 text-sm text-[#77746d] dark:text-[#aaa69c]">
            Checkout karne se pehle bag mein product add karein.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-6 bg-[#201f1c] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white"
          >
            Back to Cart
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-6 text-[#201f1c] dark:bg-[#191816] dark:text-[#f5f2ec] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between border-b border-[#dedbd3] pb-5 dark:border-[#3e3b34]">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[#66635c] hover:text-[#201f1c] dark:text-[#c4c0b7] dark:hover:text-white"
          >
            ← Back to bag
          </button>

          <span className="text-xs font-bold tracking-[0.2em]">
            URBAN OUTLINE
          </span>

          <span className="text-xs text-[#77746d] dark:text-[#aaa69c]">
            Pakistan delivery
          </span>
        </header>

        <div className="py-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#77746d] dark:text-[#aaa69c]">
            Checkout
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Delivery and payment
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"
        >
          <div className="space-y-6">
            <section className="border border-[#e2dfd7] bg-white p-5 dark:border-[#3e3b34] dark:bg-[#211f1b] sm:p-7">
              <h2 className="text-lg font-semibold">Delivery details</h2>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  Full name
                  <input
                    className={inputClasses}
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                    placeholder="Your full name"
                  />
                </label>

                <label className="text-sm">
                  Phone number
                  <input
                    className={inputClasses}
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    required
                    placeholder="03XX XXXXXXX"
                  />
                </label>

                <label className="text-sm">
                  Email <span className="text-[#77746d]">(optional)</span>
                  <input
                    className={inputClasses}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>
<label className="text-sm">
  Delivery location
  <select
    className={inputClasses}
    name="province"
    value={formData.province}
    onChange={handleChange}
    required
  >
    <option value="">Select delivery location</option>
    <option value="Karachi">Karachi</option>
    <option value="Lahore">Lahore</option>
    <option value="Islamabad">Islamabad</option>
    <option value="Hyderabad">Hyderabad</option>
    <option value="Punjab">Punjab</option>
  </select>
</label>
{formData.province === 'Punjab' && (
  <label className="text-sm">
    City
    <input
      className={inputClasses}
      name="city"
      value={formData.city}
      onChange={handleChange}
      autoComplete="address-level2"
      required
      placeholder="Enter your city"
    />
  </label>
)}

                <label className="text-sm sm:col-span-2">
                  Complete delivery address
                  <textarea
                    className={`${inputClasses} min-h-[100px] resize-y`}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                    required
                    placeholder="House number, street, area"
                  />
                </label>

                <label className="text-sm">
                  Postal code{' '}
                  <span className="text-[#77746d]">(optional)</span>
                  <input
                    className={inputClasses}
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    autoComplete="postal-code"
                    placeholder="Postal code"
                  />
                </label>
              </div>
            </section>

            <section className="border border-[#e2dfd7] bg-white p-5 dark:border-[#3e3b34] dark:bg-[#211f1b] sm:p-7">
              <h2 className="text-lg font-semibold">Payment method</h2>

              <div className="mt-5 space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer items-center gap-3 border p-4 transition-colors ${
                      formData.paymentMethod === method.value
                        ? 'border-[#201f1c] dark:border-white'
                        : 'border-[#e2dfd7] dark:border-[#47443d]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleChange}
                      className="accent-[#201f1c]"
                    />

                    <span className="text-sm font-medium">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>

             
            </section>

            {error && (
              <p
                role="alert"
                className="border border-red-300 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          </div>

          <aside className="border border-[#e2dfd7] bg-white p-5 dark:border-[#3e3b34] dark:bg-[#211f1b] sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Order summary</h2>

            <div className="mt-4 divide-y divide-[#e2dfd7] dark:divide-[#3e3b34]">
              {cartItems.map((item) => (
                <div
                  key={item.id || item.productId || item.name}
                  className="flex items-center gap-3 py-4"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name || 'Product'}
                      className="h-16 w-14 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-14 items-center justify-center bg-[#ece8e1] text-[8px] dark:bg-[#2b2925]">
                      No image
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.name || item.productName || 'Product'}
                    </p>

                    <p className="mt-1 text-xs text-[#77746d] dark:text-[#aaa69c]">
                      Qty: {item.quantity || 1}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm">
                    {formatCheckoutPrice(
                      Number(item.price || 0) * Number(item.quantity || 1),
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3 border-t border-[#e2dfd7] pt-4 text-sm dark:border-[#3e3b34]">
              <div className="flex justify-between">
                <span className="text-[#77746d] dark:text-[#aaa69c]">
                  Subtotal
                </span>
                <span>{formatCheckoutPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#77746d] dark:text-[#aaa69c]">
                  Delivery
                </span>
                <span>{formatCheckoutPrice(shippingFee)}</span>
              </div>

              <div className="flex justify-between border-t border-[#e2dfd7] pt-3 text-base font-semibold dark:border-[#3e3b34]">
                <span>Total</span>
                <span>{formatCheckoutPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-between rounded-sm border border-[#e98665] bg-[#db7657] px-5 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#c96243] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Placing order...' : 'Place order'}
              <span>{formatCheckoutPrice(total)}</span>
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-[#77746d] dark:text-[#aaa69c]">
                           Payment: Cash on Delivery.
            </p>
          </aside>
        </form>
      </div>
    </main>
  )
}