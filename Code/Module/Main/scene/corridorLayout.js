/** 走廊尺寸（米）。沿 +Z 通向灭点。 */

export const CAM_Y = 1.56
export const INNER_WIDTH = 4.5
export const HEIGHT = 3.55
export const WALL_THICKNESS = 0.18
export const WAINSCOT_HEIGHT = 1.58
export const START_Z = -2.8
export const END_EXTRA = 18
export const DOOR_W = 0.96
export const DOOR_H = 2.18
export const DOOR_T = 0.07

export function getCorridorEndZ(lastDoorZ) {
  return lastDoorZ + END_EXTRA
}

export function getCorridorLength(endZ) {
  return endZ - START_Z
}

export function getCorridorCenterZ(endZ) {
  return (START_Z + endZ) / 2
}
