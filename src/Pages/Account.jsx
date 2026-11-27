import { useEffect, useState } from 'react'
import PasswordReset from './PasswordReset.jsx'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import ProfileDashboard from './ProfileDashboard.jsx'
import { API_BASE } from '../config'

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'

// Public OAuth client ID. It is safe to ship in the bundle (it is public by
// design) and keeps the Google button visible when no .env file is present.
// Set VITE_GOOGLE_CLIENT_ID to override it.
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '304005390868-2e3o6jv3db69gmlgrp3lf6joq1h8ji8e.apps.googleusercontent.com'
const isValidEmail = (value) =>
  typeof value === 'string' &&
  value.trim().length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
const inputClass =
  'w-full rounded-xl border border-[#e5e2de] bg-white px-4 py-2.5 text-sm text-[#24211f] outline-none transition-all duration-200 placeholder:text-[#aaa49e] focus:border-[#db7657] focus:ring-4 focus:ring-[#db7657]/10'

export default function Account({ onBack, isDark, onToggleTheme, onHelp }) {
  const reduceMotion = useReducedMotion()
  const [resetOpen, setResetOpen] = useState(false)

  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [user, setUser] = useState(null)
  const [photoFailed, setPhotoFailed] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoVersion, setPhotoVersion] = useState(0)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resending, setResending] = useState(false)

  async function handlePhotoUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    setFeedback(null)
    setUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch(API_BASE + '/api/auth/photo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Photo upload failed.')
      }

      setUser(result.user)
      setPhotoFailed(false)
      setPhotoVersion((version) => version + 1)
      setFeedback({ type: 'info', text: 'Profile photo updated.' })
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'Photo upload failed.',
      })
    } finally {
      setUploadingPhoto(false)
    }
  }
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let active = true

    fetch(API_BASE + '/api/auth/me', {
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) return null
        return response.json()
      })
      .then((result) => {
        if (active && result?.user) setUser(result.user)
      })
      .catch((error) => console.error('Session check failed:', error))
      .finally(() => {
        if (active) setCheckingSession(false)
      })

    return () => {
      active = false
    }
  }, [])

  function switchMode(nextMode) {
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setFeedback(null)
    setUnverifiedEmail('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)
    
    if (!isValidEmail(email)) {
  setFeedback({
    type: 'error',
    text: 'Please enter a valid email address.',
  })
  return
}

    if (mode === 'signup' && password !== confirmPassword) {
      setFeedback({
        type: 'error',
        text: 'Passwords do not match. Please check and try again.',
      })
      return
    }

    try {
      const response = await fetch(API_BASE + `/api/auth/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'signup'
            ? { fullName, phone, email, password }
            : { email, password },
        ),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (result.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(email)
        }

        setFeedback({
          type: 'error',
          text: result.message || 'Please try again.',
        })
        return
      }

      // Signup ke baad login nahi hota: pehle email verify karni hoti hai.
      if (result.verificationRequired) {
        setUnverifiedEmail(email)
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        setShowPassword(false)
        setShowConfirmPassword(false)
        setFeedback({
          type: 'info',
          text:
            result.message ||
            'Account created. Please check your email and verify it before signing in.',
        })
        return
      }

      setPassword('')
      setConfirmPassword('')
      setUnverifiedEmail('')
      setUser(result.user)
      setFeedback({
        type: 'info',
        text: `Welcome, ${result.user.fullName}! You are signed in.`,
      })
    } catch (error) {
      console.error('Authentication failed:', error)
      setFeedback({
        type: 'error',
        text: 'Could not reach the server. Please try again.',
      })
    }
  }

  async function handleResend() {
    if (!unverifiedEmail || resending) return

    setResending(true)

    try {
      const response = await fetch(
        API_BASE + '/api/auth/resend-verification',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: unverifiedEmail }),
        },
      )

      const result = await response.json().catch(() => ({}))

      setFeedback({
        type: response.ok ? 'info' : 'error',
        text:
          result.message ||
          (response.ok
            ? 'A new verification link has been sent to your email.'
            : 'We could not send the link. Please try again.'),
      })
    } catch {
      setFeedback({
        type: 'error',
        text: 'Could not reach the server. Please try again.',
      })
    } finally {
      setResending(false)
    }
  }

  if (checkingSession) {
    return <p className="p-8 text-center">Checking your account...</p>
  }
  async function handleGoogle(response) {
    setFeedback(null)

    try {
      const result = await fetch(API_BASE + '/api/auth/google', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await result.json()

      if (!result.ok) {
        setFeedback({
          type: 'error',
          text: data.message || 'Google sign-in failed.',
        })
        return
      }

      setUser(data.user)
      setFeedback(null)
    } catch {
      setFeedback({
        type: 'error',
        text: 'Could not reach the server. Please try again.',
      })
    }
  }

  if (resetOpen) {
    return (
      <PasswordReset
        initialEmail={email}
        onBack={() => setResetOpen(false)}
      />
    )
  }
  if (user) {
    return (
      <ProfileDashboard
        user={user}
        setUser={setUser}
        photoFailed={photoFailed}
        setPhotoFailed={setPhotoFailed}
        photoVersion={photoVersion}
        uploadingPhoto={uploadingPhoto}
        handlePhotoUpload={handlePhotoUpload}
        feedback={feedback}
        onBack={onBack}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onHelp={onHelp}
        onLogout={async () => {
          try {
            const response = await fetch(API_BASE + '/api/auth/logout', {
              method: 'POST',
              credentials: 'include',
            })

            if (!response.ok) throw new Error('Logout failed')
            setUser(null)
            setPhotoFailed(false)
            setFeedback(null)
          } catch {
            setFeedback({
              type: 'error',
              text: 'Sign out failed. Please try again.',
            })
          }
        }}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#f3f1ee] px-4 py-5 text-[#24211f] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onBack?.()}
            className="flex items-center gap-2 text-sm font-medium text-[#706a65] transition-colors hover:text-[#db7657]"
          >
            <ArrowLeft size={17} />
            Back to store
          </button>

          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8e8882]">
            Urban Outline
          </span>
        </header>

        <motion.div
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: 25, scale: 0.98 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid overflow-hidden rounded-[28px] border border-[#db7657] bg-white p-3 shadow-[0_25px_80px_rgba(48,38,31,0.10)] lg:min-h-[500px] lg:grid-cols-2"
        >
          {/* Left image panel */}
          <div className="relative min-h-[280px] overflow-hidden rounded-[20px] bg-[#28221e] sm:min-h-[340px] lg:min-h-full">
            <motion.img
              src="https://koreanclothing.net/cdn/shop/collections/ChatGPT_Image_May_18_2026_04_21_26_PM.png?v=1779118402&width=3840"
              alt="Contemporary fashion outfit"
              initial={reduceMotion ? false : { scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/65" />

            <div className="relative flex h-full min-h-[280px] flex-col justify-between p-7 text-white sm:min-h-[340px] sm:p-10 lg:min-h-full lg:p-12">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">
                  Your style, your outline
                </span>

                <h1 className="mt-6 max-w-md text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.6rem]">
                  Find your
                  <br />
                  everyday style.
                </h1>

                <p className="mt-4 max-w-xs text-sm leading-6 text-white/75">
                  Thoughtful pieces for every day, made to feel like you.
                </p>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mt-10 flex items-center gap-3"
              >
                <img
                  src="/urban.jpg"
                  alt=""
                  className="h-10 w-10 rounded-full border border-white/40 object-cover"
                />

                <div>
                  <p className="text-xs font-bold tracking-[0.15em]">
                    URBAN OUTLINE
                  </p>
                  <p className="mt-1 text-[10px] text-white/65">
                    Made for your everyday.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right form panel */}
          <section className="flex items-center px-5 py-5 sm:px-8 lg:px-8 xl:px-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-4 flex items-center gap-3">
                <img
                  src="/urban.jpg"
                  alt="Urban Outline"
                  className="h-12 w-12 rounded-full border border-[#ece8e4] object-cover"
                />

                <span className="text-[11px] font-bold tracking-[0.16em] text-[#302b28]">
                  URBAN OUTLINE
                </span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#db7657]">
                    {mode === 'login' ? 'Welcome back' : 'Join the outline'}
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2.1rem]">
                    {mode === 'login'
                      ? 'Sign in to your account'
                      : 'Create your account'}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#928b85]">
                    {mode === 'login'
                      ? 'Welcome back. Enter your details to continue.'
                      : 'Join Urban Outline for a more personal shopping experience.'}
                  </p>

                  <div className="my-3 h-px bg-[#f0eeeb]" />

                  <form onSubmit={handleSubmit} className="space-y-2.5">
                    {mode === 'signup' && (
                      <>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-[#77716b]">
                            Full name
                          </span>
                          <input
                            className={inputClass}
                            type="text"
                            name="fullName"
                            autoComplete="name"
                            placeholder="Your full name"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            required
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-xs font-medium text-[#77716b]">
                            Phone number <span className="text-[#aaa49e]">(optional)</span>
                          </span>
                          <input
                            className={inputClass}
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            placeholder="03XX XXXXXXX"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                          />
                        </label>
                      </>
                    )}

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[#77716b]">
                        Email address
                      </span>
                      <input
                        className={inputClass}
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[#77716b]">
                        Password
                      </span>

                      <span className="relative block">
                        <input
                          className={`${inputClass} pr-12`}
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          autoComplete={
                            mode === 'login' ? 'current-password' : 'new-password'
                          }
                          placeholder={
                            mode === 'signup'
                              ? 'At least 8 characters'
                              : 'Enter your password'
                          }
                          minLength={mode === 'signup' ? 8 : undefined}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((shown) => !shown)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a39d97] hover:text-[#db7657]"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </span>
                    </label>

                    {mode === 'signup' && (
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-[#77716b]">
                          Confirm password
                        </span>

                        <span className="relative block">
                          <input
                            className={`${inputClass} pr-12`}
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            autoComplete="new-password"
                            placeholder="Enter password again"
                            minLength={8}
                            value={confirmPassword}
                            onChange={(event) =>
                              setConfirmPassword(event.target.value)
                            }
                            required
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((shown) => !shown)
                            }
                            aria-label={
                              showConfirmPassword
                                ? 'Hide confirm password'
                                : 'Show confirm password'
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a39d97] hover:text-[#db7657]"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </span>
                      </label>
                    )}

                    {mode === 'login' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setResetOpen(true)}
                          className="text-xs font-medium text-[#db7657] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {feedback && (
                      <p
                        role={feedback.type === 'error' ? 'alert' : 'status'}
                        className={`rounded-xl border px-4 py-3 text-xs leading-5 ${
                          feedback.type === 'error'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-[#f1d7cd] bg-[#fff7f3] text-[#765344]'
                        }`}
                      >
                        {feedback.text}
                      </p>
                    )}

                    {unverifiedEmail && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resending}
                          className="text-xs font-medium text-[#db7657] hover:underline disabled:opacity-60"
                        >
                          {resending ? 'Sending...' : 'Resend verification link'}
                        </button>
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      whileHover={reduceMotion ? undefined : { y: -2 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#252220] px-5 py-4 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(37,34,32,0.16)] transition-colors hover:bg-[#db7657] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#db7657] focus-visible:ring-offset-2"
                    >
                      {mode === 'login' ? 'Sign in' : 'Create account'}
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </motion.button>
                  </form>

                  <p className="mt-5 text-center text-xs text-[#928b85]">
                    {mode === 'login'
                      ? "Don't have an account? "
                      : 'Already have an account? '}

                    <button
                      type="button"
                      onClick={() =>
                        switchMode(mode === 'login' ? 'signup' : 'login')
                      }
                      className="font-semibold text-[#24211f] hover:text-[#db7657]"
                    >
                      {mode === 'login' ? 'Create account' : 'Log in'}
                    </button>
                  </p>

                  <div className="my-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-[#efedeb]" />
                    <span className="text-xs text-[#aaa49e]">Or</span>
                    <span className="h-px flex-1 bg-[#efedeb]" />
                  </div>

                  {GOOGLE_CLIENT_ID ? (
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                      <div className="flex justify-center">
                        <GoogleLogin
                          onSuccess={handleGoogle}
                          onError={() =>
                            setFeedback({
                              type: 'error',
                              text: 'Google sign-in failed. Please try again.',
                            })
                          }
                          text="continue_with"
                          shape="pill"
                        />
                      </div>
                    </GoogleOAuthProvider>
                  ) : (
                    <p className="text-center text-sm text-red-700">
                      Google sign-in is not configured.
                    </p>
                  )}

                  <p className="mt-5 text-center text-[11px] leading-5 text-[#aaa49e]">
                    You can also shop as a guest.
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  )
}
