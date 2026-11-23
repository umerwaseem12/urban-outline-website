import { useState } from 'react'

export default function EditProfile({ user, setUser, isDark }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.fullName || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function startEditing() {
    setName(user.fullName || '')
    setPhone(user.phone || '')
    setMessage('')
    setEditing(true)
  }

  function cancelEditing() {
    setMessage('')
    setEditing(false)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setMessage('')
    setSaving(true)

    try {
      const response = await fetch(API_BASE + '/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, phone }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Profile update failed.')
      }

      setUser(result.user)
      setEditing(false)
      setMessage('Profile updated successfully.')
    } catch (error) {
      setMessage(error.message || 'Profile update failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const muted = isDark ? 'text-[#b1adb0]' : 'text-[#8c8580]'
  const box = isDark
    ? 'border-[#373a41] bg-[#292c33]'
    : 'border-[#f1eeeb] bg-[#faf9f8]'
  const input = isDark
    ? 'border-[#484b52] bg-[#22252b] text-white'
    : 'border-[#ded9d4] bg-white text-[#24211f]'

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Personal information</h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Your account details in one place.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="rounded-xl bg-[#db7657] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c96547]"
          >
            Edit Profile
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={saveProfile} className={`space-y-5 rounded-2xl border p-5 ${box}`}>
          <label className="block">
            <span className={`block text-xs ${muted}`}>Full name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
              disabled={saving}
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#db7657] ${input}`}
            />
          </label>

          <div>
            <p className={`text-xs ${muted}`}>Email address</p>
            <p className="mt-1 break-all text-sm font-semibold">{user.email}</p>
            <p className={`mt-1 text-xs ${muted}`}>Email cannot be changed here.</p>
          </div>

          <label className="block">
            <span className={`block text-xs ${muted}`}>Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={30}
              placeholder="Add phone number"
              disabled={saving}
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#db7657] ${input}`}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#db7657] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="rounded-xl border border-[#aaa49e] px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className={`space-y-5 rounded-2xl border p-5 ${box}`}>
          <div>
            <p className={`text-xs ${muted}`}>Full name</p>
            <p className="mt-1 break-words text-sm font-semibold">{user.fullName}</p>
          </div>
          <div>
            <p className={`text-xs ${muted}`}>Email address</p>
            <p className="mt-1 break-all text-sm font-semibold">{user.email}</p>
          </div>
          <div>
            <p className={`text-xs ${muted}`}>Phone number</p>
            <p className="mt-1 break-words text-sm font-semibold">
              {user.phone || 'Not added'}
            </p>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className={`mt-4 text-sm ${muted}`}>
          {message}
        </p>
      )}
    </>
  )
}