import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'Alison Estevam Studio — Barbearia'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          display:         'flex',
          flexDirection:   'column',
          justifyContent:  'flex-end',
          backgroundColor: '#1C1C1A',
          padding:         '72px 80px',
          position:        'relative',
        }}
      >
        {/* Subtle grid lines */}
        <div style={{
          position:        'absolute',
          inset:           0,
          backgroundImage: 'linear-gradient(rgba(245,240,232,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,232,0.03) 1px, transparent 1px)',
          backgroundSize:  '80px 80px',
        }} />

        {/* Sage accent bar */}
        <div style={{
          position:   'absolute',
          top:        0,
          left:       80,
          width:      60,
          height:     3,
          background: '#7A9182',
        }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{
            fontFamily:     'serif',
            fontSize:       11,
            letterSpacing:  '0.45em',
            textTransform:  'uppercase',
            color:          'rgba(245,240,232,0.28)',
            marginBottom:   20,
          }}>
            BARBEARIA · ATENDIMENTO EXCLUSIVO
          </span>

          <span style={{
            fontFamily:   'serif',
            fontSize:     82,
            fontWeight:   300,
            color:        '#F5F0E8',
            lineHeight:   1.05,
            letterSpacing: '0.02em',
          }}>
            Alison
          </span>
          <span style={{
            fontFamily:   'serif',
            fontSize:     82,
            fontWeight:   300,
            color:        '#F5F0E8',
            lineHeight:   1.05,
            letterSpacing: '0.02em',
            marginBottom: 32,
          }}>
            Estevam.
          </span>

          <span style={{
            fontFamily:   'sans-serif',
            fontSize:     16,
            fontWeight:   300,
            color:        'rgba(245,240,232,0.38)',
            letterSpacing: '0.15em',
          }}>
            Um cliente por vez. Uma experiência que vai além do corte.
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
