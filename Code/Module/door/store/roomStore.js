import { create } from 'zustand'

export const ROOM_PHASE = {
  ENTER_DARK: 'ENTER_DARK',
  DOOR_REVEAL: 'DOOR_REVEAL',
  LIGHTS_FLICKER: 'LIGHTS_FLICKER',
  LIGHTS_STABLE: 'LIGHTS_STABLE'
}

export const useRoomStore = create((set) => ({
  phase: ROOM_PHASE.ENTER_DARK,
  tableLampOn: true,
  setPhase: (phase) => set({ phase }),
  toggleTableLamp: () => set((s) => ({ tableLampOn: !s.tableLampOn })),
  resetIntro: () => set({ phase: ROOM_PHASE.ENTER_DARK, tableLampOn: true })
}))

if (import.meta.env.DEV) {
  window.__roomStore = useRoomStore
}
