import React from 'react'
import { useRoomStore } from '../store/roomStore.js'

/** Invisible click volume: left-click pushes camera toward `focusId`. */
export default function FocusHit({
  focusId,
  position = [0, 0, 0],
  args = [0.6, 0.6, 0.2],
  rotation = [0, 0, 0]
}) {
  const advanceFocus = useRoomStore((s) => s.advanceFocus)

  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation()
        advanceFocus(focusId)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      <boxGeometry args={args} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
