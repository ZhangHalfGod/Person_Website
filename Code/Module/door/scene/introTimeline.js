/** 入场时间轴（秒）。见 System_doc/door_Page/入场交互时序.md */

export const DOOR_OPEN_DURATION = 2.5
export const FLICKER_DURATION = 10
export const DOOR_OPEN_RAD = 1.82
export const DOOR_START_RAD = 0.045

export function easeOutCubic(t) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 3
}

export function introTime(startedAt) {
  return (performance.now() - startedAt) / 1000
}

/** 0～1 开门进度，easeOut，约 2.5s。 */
export function doorOpenAmount(t) {
  return easeOutCubic(t / DOOR_OPEN_DURATION)
}

/** 平均亮度从暗抬到正常室内暖光。 */
export function lightBase(t) {
  const rise = easeOutCubic(Math.min(1, t / 3.1))
  const settle = Math.min(1, t / FLICKER_DURATION)
  return 0.06 + 0.94 * rise * (0.7 + 0.3 * settle)
}

/**
 * 闪烁乘数。envelope 从约 0.8 降到 0；噪声避开 50Hz 硬闪。
 * intensity = target * lightBase(t) * flickerFactor(t, phase)
 */
export function flickerFactor(t, phase) {
  const u = Math.min(1, Math.max(0, t / FLICKER_DURATION))
  if (u >= 1) return 1
  const envelope = 0.8 * (1 - u) * (1 - u)
  const n =
    0.52 * Math.sin(t * 19.4 + phase) +
    0.31 * Math.sin(t * 11.7 + phase * 1.6) +
    0.17 * Math.sin(t * 6.3 + phase * 0.55)
  const noise = Math.min(1, Math.max(0, 0.5 + 0.55 * n))
  return 1 - envelope * noise
}
