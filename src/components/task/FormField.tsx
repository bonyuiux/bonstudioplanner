'use client'

// Shared styled form primitives used across task forms

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Jost, sans-serif',
  fontSize: 8,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#9A9490',
  marginBottom: 6,
}

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--card-bg)',
  border: '1px solid var(--border-emphasis)',
  borderRadius: 4,
  padding: '9px 12px',
  color: 'var(--fg)',
  fontFamily: 'Jost, sans-serif',
  fontSize: 13,
  fontWeight: 300,
  outline: 'none',
}

export function FieldWrapper({
  label,
  children,
  style,
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputBase, ...props.style }}
      onFocus={e => (e.currentTarget.style.borderColor = '#614E3A')}
      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
    />
  )
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        ...inputBase,
        resize: 'vertical',
        minHeight: 72,
        ...props.style,
      }}
      onFocus={e => (e.currentTarget.style.borderColor = '#614E3A')}
      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        ...inputBase,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239A9490' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 32,
        cursor: 'pointer',
        ...props.style,
      }}
      onFocus={e => (e.currentTarget.style.borderColor = '#614E3A')}
      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
    />
  )
}

export function PrimaryButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      style={{
        background: (props.disabled || loading) ? 'rgba(97,78,58,0.5)' : '#614E3A',
        color: '#F5F3F0',
        border: 'none',
        borderRadius: 4,
        padding: '13px 20px',
        fontFamily: 'Jost, sans-serif',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: (props.disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'background 150ms ease',
        ...props.style,
      }}
    >
      {loading ? 'Saving…' : children}
    </button>
  )
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        background: 'none',
        border: '1px solid var(--border-hairline)',
        borderRadius: 4,
        padding: '13px 20px',
        fontFamily: 'Jost, sans-serif',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#9A9490',
        cursor: 'pointer',
        transition: 'border-color 150ms ease',
        ...props.style,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-hairline)')}
    >
      {children}
    </button>
  )
}
