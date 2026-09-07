import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { introTime } from './introTimeline.js'

/** useFrame 在后台标签可能暂停；用墙钟补齐入场 2.5s 开门 / 10s 闪灯。 */
export function useIntroTick(startedAt, onTick) {
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  useEffect(() => {
    const tick = () => {
      const t = introTime(startedAt)
      if (import.meta.env.DEV) window.__roomIntroT = t
      onTickRef.current(t)
    }
    tick()
    const id = window.setInterval(tick, 50)
    return () => window.clearInterval(id)
  }, [startedAt])

  useFrame(() => {
    onTickRef.current(introTime(startedAt))
  })
}
