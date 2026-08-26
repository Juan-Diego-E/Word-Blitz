import { create } from 'zustand';
import { loadPrefs, savePrefs, type Prefs } from '../lib/persistence';

interface SettingsState extends Prefs {
  setSonido(v: boolean): void;
  setVibracion(v: boolean): void;
  setReducirMovimiento(v: boolean | null): void;
  setSincronizarPartidas(v: boolean): void;
  /** true si hay que reducir animaciones (override del usuario o sistema). */
  motionReduced(): boolean;
}

const initial = loadPrefs();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initial,
  setSonido: (sonido) => set({ sonido }),
  setVibracion: (vibracion) => set({ vibracion }),
  setReducirMovimiento: (reducirMovimiento) => set({ reducirMovimiento }),
  setSincronizarPartidas: (sincronizarPartidas) => set({ sincronizarPartidas }),
  motionReduced: () => {
    const o = get().reducirMovimiento;
    if (o != null) return o;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
}));

useSettingsStore.subscribe((s) =>
  savePrefs({
    sonido: s.sonido,
    vibracion: s.vibracion,
    reducirMovimiento: s.reducirMovimiento,
    sincronizarPartidas: s.sincronizarPartidas,
  }),
);
