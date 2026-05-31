// Shared loading skeleton for every page in the (app) route group.
// Renders instantly on tab switch while the server component fetches data,
// so navigation feels snappy even on a cold cache.

export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        padding: '40px 32px',
        maxWidth: 760,
        margin: '0 auto',
        opacity: 0.5,
      }}
    >
      <div
        style={{
          width: 80,
          height: 10,
          background: 'var(--card-bg)',
          borderRadius: 2,
          marginBottom: 18,
        }}
      />
      <div
        style={{
          width: '60%',
          height: 38,
          background: 'var(--card-bg)',
          borderRadius: 4,
          marginBottom: 28,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              height: 48,
              background: 'var(--card-bg)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 4,
            }}
          />
        ))}
      </div>
    </div>
  )
}
