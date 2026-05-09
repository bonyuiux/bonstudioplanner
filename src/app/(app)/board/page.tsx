export default function BoardPage() {
  return (
    <div style={{ padding: '32px 32px 80px' }}>
      {/* Tasks today — placeholder */}
      <section style={{ marginBottom: 40 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 24px',
            gap: 16,
            alignItems: 'start',
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#9A9490',
                marginBottom: 4,
              }}
            >
              Now
            </p>
            <h2
              style={{
                fontFamily: 'Bodoni Moda, serif',
                fontSize: 44,
                fontWeight: 500,
                lineHeight: 1,
                color: 'var(--fg)',
              }}
            >
              Tasks{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 400 }}>today</em>
            </h2>
          </div>

          {/* Empty state */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 120,
              background: 'var(--card-bg)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 6,
            }}
          >
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: 11,
                color: '#9A9490',
                fontStyle: 'italic',
              }}
            >
              Nothing urgent today — good time to tackle flexible work.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border-hairline)', marginBottom: 24 }} />

      {/* General view — placeholder */}
      <section>
        <p
          style={{
            fontFamily: 'Jost, sans-serif',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#9A9490',
            marginBottom: 16,
          }}
        >
          General view
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            background: 'var(--column-bg)',
            border: '1px solid var(--column-border)',
            borderRadius: 6,
          }}
        >
          <p
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 11,
              color: '#9A9490',
              fontStyle: 'italic',
            }}
          >
            Categories will appear here — Phase 2.
          </p>
        </div>
      </section>
    </div>
  )
}
