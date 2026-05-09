export default function LogPage() {
  return (
    <div style={{ padding: '40px 32px 80px', maxWidth: 760, margin: '0 auto' }}>
      <p
        style={{
          fontFamily: 'Jost, sans-serif',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#9A9490',
          marginBottom: 8,
        }}
      >
        Archive
      </p>
      <h1
        style={{
          fontFamily: 'Bodoni Moda, serif',
          fontSize: 48,
          fontWeight: 500,
          lineHeight: 1.1,
          color: 'var(--fg)',
          marginBottom: 32,
        }}
      >
        What you&apos;ve <em style={{ fontStyle: 'italic', fontWeight: 400 }}>shipped</em>
      </h1>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 6,
        }}
      >
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9A9490', fontStyle: 'italic' }}>
          Log view — coming in Phase 3.
        </p>
      </div>
    </div>
  )
}
