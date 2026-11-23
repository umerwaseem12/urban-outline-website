import { useState } from 'react'
import { API_BASE } from '../config'

const inputClass =
  'mt-2 w-full border border-[#d9d6ce] bg-white px-3 py-3 text-sm text-[#201f1c] outline-none placeholder:text-[#96928a] focus:border-[#db7657] dark:border-[#47443d] dark:bg-[#24221e] dark:text-[#f5f2ec]'

export default function Contact({ onBack }) {
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (status === 'sending') return

    const form = event.currentTarget
    const data = new FormData(form)

    setStatus('sending')
    setFeedback('')

    try {
      const response = await fetch(API_BASE + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          subject: data.get('subject'),
          message: data.get('message'),
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setStatus('error')
        setFeedback(result.message || 'Message send nahi ho saka.')
        return
      }

      form.reset()
      setStatus('sent')
      setFeedback(result.message || 'Aap ka message mil gaya hai.')
    } catch {
      setStatus('error')
      setFeedback('Backend se connection nahi ho raha. Thori der baad try karein.')
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-6 text-[#201f1c] dark:bg-[#191816] dark:text-[#f5f2ec] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-[#dedbd3] pb-5 dark:border-[#3e3b34]">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[#66635c] hover:text-[#db7657] dark:text-[#c4c0b7]"
          >
            ← Back to store
          </button>
          <span className="text-xs font-bold tracking-[0.2em]">
            URBAN OUTLINE
          </span>
        </header>

        <div className="grid gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#db7657]">
              We’re here to help
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Contact us</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#77746d] dark:text-[#aaa69c]">
              Product, order, delivery ya returns ke baare mein sawal ho to
              neeche form fill karein.
            </p>
          </section>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 border border-[#e2dfd7] bg-white p-5 dark:border-[#3e3b34] dark:bg-[#211f1b] sm:p-7"
          >
            <label className="block text-sm">
              Full name
              <input
                className={inputClass}
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                placeholder="Your name"
              />
            </label>

            <label className="block text-sm">
              Email address
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm">
              Subject
              <input
                className={inputClass}
                name="subject"
                required
                maxLength={200}
                placeholder="How can we help?"
              />
            </label>

            <label className="block text-sm">
              Message
              <textarea
                className={`${inputClass} min-h-[150px] resize-y`}
                name="message"
                required
                maxLength={2000}
                placeholder="Write your message"
              />
            </label>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full bg-[#db7657] px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#c96243] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'sending' ? 'Sending...' : 'Send message'}
            </button>

            {feedback && (
              <p
                role={status === 'error' ? 'alert' : 'status'}
                className={`text-sm ${
                  status === 'error'
                    ? 'text-red-600'
                    : 'text-[#77746d] dark:text-[#aaa69c]'
                }`}
              >
                {feedback}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}