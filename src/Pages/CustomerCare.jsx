const customerCarePages = {
  shipping: {
    title: 'Shipping & Delivery',
    intro:
      'We currently offer delivery within Pakistan. Please check these details before placing your order.',
    sections: [
      {
        title: 'Delivery areas',
        text: 'Delivery is available within Pakistan. Service availability and timing may vary by city and courier.',
      },
      {
        title: 'Delivery charges',
        text: 'Any delivery charge is shown in your order summary before you place your order.',
      },
      {
        title: 'Delivery timing',
        text: 'Delivery time depends on your location, courier availability, and order volume. Contact us if you need an estimate for your area.',
      },
    ],
  },

  returns: {
    title: 'Returns & Exchanges',
    intro:
      'Please contact us before sending an item back. We will confirm the available options and explain the next steps.',
    sections: [
      {
        title: 'Contact us first',
        text: 'Share your order details and the reason for your request. Please wait for our instructions before shipping an item back.',
      },
      {
        title: 'Keep the item in its original condition',
        text: 'While we review your request, keep the item unused and unwashed, with its original tags and packaging.',
      },
      {
        title: 'Eligibility and next steps',
        text: 'Return or exchange eligibility, timelines, and any applicable charges must be confirmed with our team before you send an item.',
      },
    ],
  },

   privacy: {
    title: 'Privacy Policy',
    intro:
      'We take the privacy of our customers seriously. This page explains what information we collect and how it is used.',
    sections: [
      {
        title: 'Information we collect',
        text: 'When you place an order, we collect your name, phone number, delivery address, city, postal code and optional email. If you create an account, we also store your login details and any profile photo you upload.',
      },
      {
        title: 'How we use it',
        text: 'We use this information to process and deliver your order, contact you about it, and help you with account and support requests. Order details are stored in our database.',
      },
      {
        title: 'Shopping assistant',
        text: 'Messages you send to the shopping assistant are processed by Google Gemini to generate replies. Please do not share passwords, payment details or other sensitive information in the chat.',
      },
      {
        title: 'Payments',
        text: 'We currently accept Cash on Delivery only. Never share your payment PIN, password, or one-time verification code through a website form or customer message.',
      },
    ],
  },
}

export default function CustomerCare({ page, onBack, onContact }) {
  const currentPage = customerCarePages[page]

  if (!currentPage) return null

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-6 text-[var(--page-fg)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[var(--muted)] transition-colors hover:text-[#db7657]"
          >
            ← Back to store
          </button>

          <span className="text-xs font-bold tracking-[0.2em]">
            URBAN OUTLINE
          </span>

          <span className="w-20" />
        </header>

        <section className="mx-auto max-w-3xl py-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#db7657]">
            Customer Care
          </p>

          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            {currentPage.title}
          </h1>

          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            {currentPage.intro}
          </p>

          <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {currentPage.sections.map((section) => (
              <article key={section.title} className="py-6">
                <h2 className="text-base font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {section.text}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 border border-[var(--line)] p-5 sm:p-6">
            <h2 className="font-semibold">Need more help?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Contact us and our team can help with your question.
            </p>
            <button
              type="button"
              onClick={onContact}
              className="mt-5 bg-[#db7657] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c96243]"
            >
              Contact us
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}