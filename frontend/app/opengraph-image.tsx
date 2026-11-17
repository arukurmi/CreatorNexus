import { ImageResponse } from 'next/og'

export const alt = 'Creator Nexus — influencer budgets, allocated intelligently'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** No emoji or custom fonts: either makes next/og fetch assets over the network at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 96,
          background: '#FDFBF7',
          color: '#1F2937',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: '#AD4A35',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            CN
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2 }}>Creator Nexus</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, color: '#5B6472', maxWidth: 900 }}>
          Influencer budgets, allocated intelligently for Indian D2C brands.
        </div>
        <div style={{ marginTop: 56, width: 160, height: 8, borderRadius: 4, background: '#AD4A35' }} />
      </div>
    ),
    size,
  )
}
