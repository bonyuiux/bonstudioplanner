'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/board')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-theme flex items-center justify-center px-6">
      {/* Theme toggle — top right */}
      <div className="fixed top-6 right-6">
        <ThemeToggle />
      </div>

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Wordmark */}
        <div className="text-center mb-8">
          <h1
            className="text-cream"
            style={{
              fontFamily: 'Italiana, serif',
              fontSize: 38,
              letterSpacing: '0.02em',
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            BonPlanner
          </h1>
          <p
            className="text-mist"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            A Bon Studio Workspace
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-emphasis)',
            borderRadius: 12,
            padding: '32px 28px',
          }}
        >
          <h2
            className="text-cream"
            style={{
              fontFamily: 'Bodoni Moda, serif',
              fontSize: 22,
              fontStyle: 'italic',
              fontWeight: 400,
              marginBottom: 24,
              lineHeight: 1.2,
            }}
          >
            Welcome back.
          </h2>

          <form onSubmit={handleSignIn} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label
                className="text-mist"
                style={{
                  display: 'block',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 8,
                  fontWeight: 500,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-emphasis)',
                  borderRadius: 4,
                  padding: '10px 12px',
                  color: 'var(--fg)',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 13,
                  fontWeight: 300,
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#614E3A')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 22 }}>
              <label
                className="text-mist"
                style={{
                  display: 'block',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 8,
                  fontWeight: 500,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-emphasis)',
                  borderRadius: 4,
                  padding: '10px 12px',
                  color: 'var(--fg)',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 13,
                  fontWeight: 300,
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#614E3A')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  color: '#BC3B3B',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 11,
                  marginBottom: 14,
                }}
              >
                {error}
              </p>
            )}

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(97,78,58,0.6)' : '#614E3A',
                color: '#F5F3F0',
                border: 'none',
                borderRadius: 4,
                padding: '13px 14px',
                fontFamily: 'Jost, sans-serif',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 150ms ease',
                marginBottom: 16,
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {/* Forgot password */}
            <div className="text-center">
              <button
                type="button"
                className="text-mist"
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: 11,
                  fontWeight: 300,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  opacity: 0.7,
                }}
                onClick={() => {
                  // Supabase password reset — deferred to v1 polish
                  alert('Contact your Supabase dashboard to reset your password.')
                }}
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
