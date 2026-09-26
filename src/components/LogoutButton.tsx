'use client'

const CSRF_COOKIE = 'dpirc-csrf-token'
const CSRF_HEADER = 'x-csrf-token'

function readCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  const encoded = `${encodeURIComponent(CSRF_COOKIE)}=`
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(encoded)) {
      return decodeURIComponent(trimmed.slice(encoded.length))
    }
  }
  return ''
}

export default function LogoutButton() {
  const handleLogout = async () => {
    const csrf = readCsrfToken()
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: csrf ? { [CSRF_HEADER]: csrf } : {},
    })
    window.location.reload()
  }

  return (
    <button
      onClick={handleLogout}
      className="logout"
      style={{
        color: 'rgb(1000, 1000, 1000)',
        background: 'rgb(239, 68, 68)',
        border: '1px solid rgb(239, 68, 68)',
        textDecoration: 'none',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Sign Out
    </button>
  )
}
