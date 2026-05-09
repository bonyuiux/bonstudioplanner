'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCategory } from '@/lib/actions/categories'
import { FieldWrapper, TextInput, PrimaryButton, GhostButton } from '@/components/task/FormField'

interface Props {
  currentCount: number
  onClose: () => void
}

export default function AddCategoryModal({ currentCount, onClose }: Props) {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    const result = await createCategory({
      name:       name.trim(),
      subtitle:   subtitle.trim() || undefined,
      sort_order: currentCount,
    })

    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.refresh()
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--bg)',
          border: '1px solid var(--border-emphasis)',
          borderRadius: 12,
          padding: '28px 28px 24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A9490', margin: '0 0 6px' }}>
              General view
            </p>
            <h2
              style={{
                fontFamily: 'Bodoni Moda, serif',
                fontSize: 22,
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--fg)',
                margin: 0,
              }}
            >
              New category
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9490', fontSize: 20, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <FieldWrapper label="Name">
            <TextInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. BonStudioHK"
              required
              autoFocus
            />
          </FieldWrapper>

          <FieldWrapper label="Subtitle (optional)">
            <TextInput
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. Photography"
            />
          </FieldWrapper>

          {error && (
            <p style={{ color: '#BC3B3B', fontFamily: 'Jost, sans-serif', fontSize: 11, marginBottom: 14 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
            <PrimaryButton type="submit" loading={loading}>Create</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
