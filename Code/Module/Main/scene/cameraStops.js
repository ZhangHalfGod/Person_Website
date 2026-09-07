import { CAM_Y, INNER_WIDTH } from './corridorLayout.js'

/** 四个停驻点的相机 Z。走廊沿 +Z。 */
export const STOP_SPACING = 7
export const STOP_COUNT = 4
export const DOOR_AHEAD = 3.25

export function getStopZ(stopIndex) {
  return stopIndex * STOP_SPACING
}

export function getDoorZ(stopIndex) {
  return getStopZ(stopIndex) + DOOR_AHEAD
}

export function getForwardLookAt(stopIndex) {
  const z = getStopZ(stopIndex)
  return [0, CAM_Y, z + 20]
}

export function getDoorLookAt(side, stopIndex) {
  const z = getDoorZ(stopIndex)
  const x = side === 'left' ? -(INNER_WIDTH / 2) + 0.2 : INNER_WIDTH / 2 - 0.2
  return [x, 1.22, z]
}
