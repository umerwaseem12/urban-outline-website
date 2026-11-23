import { useState } from 'react'
import PasswordReset from './PasswordReset.jsx'
import EditProfile from './EditProfile.jsx'
import { API_BASE } from '../config'
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react'

export default function ProfileDashboard({
  user,
  setUser,
  photoFailed,
  setPhotoFailed,
  photoVersion,
  uploadingPhoto,
  handlePhotoUpload,
  feedback,
  onBack,
  isDark,
  onToggleTheme,
  onHelp,
  onLogout,
}) {
  const [view, setView] = useState('profile')
  const [resetOpen, setResetOpen] = useState(false)

  const initials = (user.fullName || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const pageClass = isDark
    ? 'bg-[#17191e] text-[#f5f3f0]'
    : 'bg-[#f6f4f1] text-[#24211f]'

  const cardClass = isDark
    ? 'border-[#373a41] bg-[#22252b]'
    : 'border-[#eee9e4] bg-white'

  const mutedClass = isDark ? 'text-[#b1adb0]' : 'text-[#8c8580]'

  const menuClass = isDark
    ? 'border-[#373a41] bg-[#292c33] hover:bg-[#32353d]'
    : 'border-[#f1eeeb] bg-[#faf9f8] hover:bg-[#f3efec]'

  const title =
    view === 'account'
      ? 'My Account'
      : view === 'settings'
        ? 'Settings'
        : 'Profile'

  const items = [
    {
      label: 'My Account',
      description: 'Your personal information',
      icon: UserRound,
      action: () => setView('account'),
    },
    {
      label: 'Settings',
      description: 'Appearance and security',
      icon: Settings,
      action: () => setView('settings'),
    },
    {
      label: 'Help Center',
      description: 'Contact our support team',
      icon: CircleHelp,
      action: onHelp,
    },
    {
      label: 'Log out',
      description: 'Sign out of this account',
      icon: LogOut,
      action: onLogout,
    },
  ]

   if (resetOpen) {
    return (
      <PasswordReset
        initialEmail={user.email}
        onBack={() => setResetOpen(false)}
      />
    )
  }

  return (
    <main className={`min-h-screen px-4 py-6 transition-colors sm:px-6 sm:py-12 ${pageClass}`}>
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#db7657]">
            Urban Outline
          </p>
          <p className={`mt-1 text-xs ${mutedClass}`}>
            Your account, your way
          </p>
        </div>

        <div className={`overflow-hidden rounded-[28px] border shadow-[0_18px_55px_rgba(48,38,31,0.07)] ${cardClass}`}>
          <header className="relative flex h-16 items-center justify-center border-b border-[#88888820] px-5">
            <button
              type="button"
              onClick={view === 'profile' ? onBack : () => setView('profile')}
              aria-label={view === 'profile' ? 'Back to store' : 'Back to profile'}
              className="absolute left-4 rounded-full p-2 transition hover:bg-[#88888818] focus-visible:outline-2 focus-visible:outline-[#db7657]"
            >
              <ArrowLeft size={20} />
            </button>

            <h1 className="text-base font-semibold">{title}</h1>
          </header>

          <div className="p-5 sm:p-8">
            {view === 'profile' && (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {(user.hasCustomPhoto || user.profilePicture) && !photoFailed ? (
                      <img
                        src={
                          user.hasCustomPhoto
                            ? API_BASE + `/api/auth/photo?v=${photoVersion}`
                            : user.profilePicture
                        }
                        alt={`${user.fullName}'s profile`}
                        onError={() => setPhotoFailed(true)}
                        referrerPolicy="no-referrer"
                        className="h-28 w-28 rounded-full object-cover ring-4 ring-[#f8e9e2] sm:h-32 sm:w-32"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#f9e7df] text-3xl font-semibold text-[#bd5d3e] ring-4 ring-[#f8e9e2] sm:h-32 sm:w-32">
                        {initials}
                      </div>
                    )}

                    <label
                      className={`absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-[#ece8e4] bg-white text-[#706a65] shadow-md focus-within:outline-2 focus-within:outline-[#db7657] ${
                        uploadingPhoto ? 'cursor-wait opacity-60' : 'cursor-pointer'
                      }`}
                    >
                      <Camera size={18} aria-hidden="true" />
                      <span className="sr-only">Change profile photo</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingPhoto}
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <h2 className="mt-5 max-w-full break-words text-xl font-semibold">
                    {user.fullName}
                  </h2>
                  <p className={`mt-1 max-w-full break-all text-sm ${mutedClass}`}>
                    {user.email}
                  </p>

                  {uploadingPhoto && (
                    <p role="status" className={`mt-3 text-sm ${mutedClass}`}>
                      Uploading photo...
                    </p>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  {items.map(({ label, description, icon: Icon, action }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={action}
                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-2 focus-visible:outline-[#db7657] ${menuClass}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fae9e2] text-[#db7657]">
                        <Icon size={20} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className={`mt-0.5 block text-xs ${mutedClass}`}>
                          {description}
                        </span>
                      </span>

                      <ChevronRight size={19} className={mutedClass} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {view === 'account' && (
  <EditProfile user={user} setUser={setUser} isDark={isDark} />
)}
            {view === 'settings' && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">Make it yours</h2>
                  <p className={`mt-1 text-sm ${mutedClass}`}>
                    Manage your appearance and account security.
                  </p>
                </div>

                <p className={`mb-2 px-1 text-xs font-semibold uppercase tracking-wider ${mutedClass}`}>
                  Appearance
                </p>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-2 focus-visible:outline-[#db7657] ${menuClass}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fae9e2] text-[#db7657]">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      Switch to {isDark ? 'light' : 'dark'} mode
                    </span>
                    <span className={`mt-0.5 block text-xs ${mutedClass}`}>
                      Choose how Urban Outline looks.
                    </span>
                  </span>
                  <ChevronRight size={19} className={mutedClass} />
                </button>

                <p className={`mb-2 mt-7 px-1 text-xs font-semibold uppercase tracking-wider ${mutedClass}`}>
                  Security
                </p>
               <button
  type="button"
  onClick={() => setResetOpen(true)}
  className={`flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left ${menuClass}`}
>
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fae9e2] text-[#db7657]">
    <LockKeyhole size={20} />
  </span>

  <span className="min-w-0 flex-1">
    <span className="block text-sm font-semibold">Password reset</span>
    <span className={`mt-1 block text-xs leading-5 ${mutedClass}`}>
      Request a password reset link by email.
    </span>
  </span>

  <ChevronRight size={19} className={mutedClass} />
</button>
              </>
            )}

            {feedback && (
              <p
                role={feedback.type === 'error' ? 'alert' : 'status'}
                className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                  feedback.type === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-[#fff1ea] text-[#765344]'
                }`}
              >
                {feedback.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}