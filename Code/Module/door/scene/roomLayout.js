/** 房间尺寸（米）。进门朝 +Z。
 *  朝 +Z 时画面左边是世界 +X：画在画面左，黑板在画面右。
 */

export const CAM_Y = 1.56
export const ROOM_W = 6.6
export const ROOM_D = 8.0
export const ROOM_H = 3.18
export const WALL_T = 0.16
export const WAINSCOT_H = 1.48
export const HALF_W = ROOM_W / 2
export const HALF_D = ROOM_D / 2

export const DOOR_W = 0.96
export const DOOR_H = 2.18
export const DOOR_T = 0.07
export const DOOR_X = 1.58
export const DOOR_Z = -HALF_D

export const TABLE = { x: 0.18, z: 1.48, w: 1.72, d: 0.86, h: 0.76 }
/**
 * Poly Haven desk_lamp_arm_01 (clamp lamp): seat upper jaw on the
 * near table edge (-Z).
 */
export const TABLE_LAMP = {
  x: TABLE.x + 0.62,
  z: TABLE.z - TABLE.d / 2 + 0.03,
  y: TABLE.h - 0.055,
  rotY: Math.PI * 0.5
}

/** Default room overview — push shots live in roomCameraStops.js. */
export const CAM_POS = [0.55, CAM_Y, -HALF_D + 0.62]
export const CAM_LOOK = [0.08, 1.13, 2.05]
export const PAINTING = { z: 0.28, y: 1.58, w: 0.78, h: 1.08 }
export const BOARD = { z: 0.72, y: 1.52, w: 1.78, h: 0.98 }
