import React, { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { MECHASSIST_EMBED_URL } from '@app/config/site.js'

/**
 * M2: MechAssist Console iframe aligned to the painting opening (world w×h).
 * drei Html transform: worldMeters ≈ cssPx * (distanceFactor / 400).
 * M3/M4 count: roomStore zoom while focus==='painting' (see advanceFocus).
 */
const CSS_W = 960

export default function PaintingEmbed({ width, height, position, rotation }) {
  const cssH = useMemo(() => Math.round(CSS_W * (height / width)), [width, height])
  const distanceFactor = useMemo(() => (width * 400) / CSS_W, [width])

  return (
    <Html
      transform
      distanceFactor={distanceFactor}
      position={position}
      rotation={rotation}
      pointerEvents="auto"
      zIndexRange={[120, 8]}
      style={{
        width: CSS_W,
        height: cssH,
        overflow: 'hidden',
        border: 'none',
        background: '#0a0a0a',
        borderRadius: 2
      }}
    >
      <iframe
        title="MechAssist Console"
        src={MECHASSIST_EMBED_URL}
        width={CSS_W}
        height={cssH}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          background: '#0a0a0a',
          /* Fill the UV rect; page scrolls/zooms inside iframe (object-fit equiv). */
          objectFit: 'contain'
        }}
        allow="fullscreen"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </Html>
  )
}
