import { useEffect, useState } from 'react'
import { API_BASE } from '../config'

const inputClass =
  'mt-2 w-full rounded-xl border border-[#ded8d2] bg-white px-4 py-3 text-sm text-[#24211f] outline-none focus:border-[#db7657]'

export default function PasswordReset({
  token = '',
  initialEmail = '',
  onBack,
}) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
    const [linkStatus, setLinkStatus] = useState(token ? 'checking' : 'valid')

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function checkLink() {
      try {
        const response = await fetch(
          API_BASE + '/api/auth/check-reset-link',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: controller.signal,
          },
        )
         if (response.status === 429) {
          setLinkStatus('limited')
          return
        }

        if (response.status === 400) {
          setLinkStatus('invalid')
        } else if (response.ok) {
          setLinkStatus('valid')
        } else {
          setLinkStatus('error')
        }
      } catch (err) {
        if (err.name !== 'AbortError') setLinkStatus('error')
      }
    }

    checkLink()
    return () => controller.abort()
  }, [token])

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy) return

    setError('')
    setMessage('')

    if (token && password !== confirmPassword) {
      setError('Passwords match nahi karte.')
      return
    }

    setBusy(true)

   try {
      const response = await fetch(
        `${API_BASE}/api/auth/${
          token ? 'reset-password' : 'forgot-password'
        }`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            token
              ? { token, password }
              : { email: email.trim() },
          ),
        },
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request failed. Please try again.')
      }

      setPassword('')
      setConfirmPassword('')
      setMessage(data.message)
      setCompleted(true)
    } catch (err) {
      setError(err.message || 'Server se connection nahi ho raha.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f1ee] px-4 py-10 text-[#24211f]">
      <div className="w-full max-w-md rounded-[28px] border border-[#db7657] bg-white p-6 shadow-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#db7657]">
          Urban Outline
        </p>

        <h1 className="mt-3 text-2xl font-semibold">
          {token ? 'Set a new password' : 'Reset your password'}
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#827b75]">
          {token
            ? 'Enter your new password below.'
            : 'Enter your account email to request a reset link.'}
        </p>
                {token && linkStatus === 'checking' && (
          <p role="status" className="mt-6 text-sm">Checking reset link...</p>
        )}

        {token && linkStatus === 'invalid' && (
          <p role="alert" className="mt-6 text-sm text-red-700">
            This reset link is invalid or expired. Please request a new link.
          </p>
        )}
        {token && linkStatus === 'limited' && (
          <p role="alert" className="mt-6 text-sm text-red-700">
            Too many attempts. Please wait 15 minutes and try again.
          </p>
        )}

        {token && linkStatus === 'error' && (
          <p role="alert" className="mt-6 text-sm text-red-700">
            Link check nahi ho saka. Backend check karke dobara try karein.
          </p>
        )}

         {!completed && (!token || linkStatus === 'valid') && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {token ? (
              <>
                <label className="block text-sm font-medium">
                  New password
                  <input
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                <label className="block text-sm font-medium">
                  Confirm password
                  <input
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </label>
              </>
            ) : (
              <label className="block text-sm font-medium">
                Email address
                <input
                  className={inputClass}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#24211f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#db7657] disabled:opacity-50"
            >
              {busy
                ? 'Please wait...'
                : token
                  ? 'Save new password'
                  : 'Send reset link'}
            </button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="mt-4 text-sm leading-6 text-[#437b59]">
            {message}
          </p>
        )}

        {!token && (
          <p className="mt-4 text-xs leading-5 text-[#827b75]">
            Google-only accounts ka password Google se manage hota hai.
            Email na mile to spam folder bhi check karein.
          </p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-sm font-semibold text-[#db7657] hover:underline"
        >
          {token ? 'Go to sign in' : 'Back'}
        </button>
      </div>
    </main>
  )
}