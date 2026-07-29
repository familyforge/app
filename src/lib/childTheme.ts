// Kids app palettes.
//
// Two, set per child by their parent:
//
//   vivid — the default. Saturated, warm, high contrast. Reads as a toy.
//   calm  — dark, desaturated, gentle. For children who find bright colour
//           genuinely difficult: sensory processing differences, autism,
//           photosensitivity, migraine.
//
// The calm palette is NOT simply the vivid one dimmed. Lowering brightness
// alone leaves the same aggressive hue relationships; what actually helps is
// dropping chroma and pulling the accents towards neutral, so nothing competes
// for attention. Text is a soft off-white rather than pure white, because
// maximum contrast on a dark field is itself a common trigger.
//
// Contrast was kept above WCAG AA for body text in both palettes — calm means
// gentler, not harder to read.

import { create } from 'zustand';

export type ChildThemeName = 'vivid' | 'calm';

export interface ChildPalette {
  ink: string;
  deep: string;
  teal: string;
  coral: string;
  sun: string;
  gold: string;
  cream: string;
  mint: string;
  sky: string;
  violet: string;
  dim: string;
  faint: string;
  /** Background sweep behind the header. */
  sky1: string;
  sky2: string;
}

const VIVID: ChildPalette = {
  ink: '#0A1922',
  deep: '#0F2A38',
  teal: '#174C5E',
  coral: '#FF7A6B',
  sun: '#FFA23D',
  gold: '#FFC94D',
  cream: '#FFF6E8',
  mint: '#4ADE9B',
  sky: '#63C7FF',
  violet: '#C084FC',
  dim: 'rgba(255,246,232,0.6)',
  faint: 'rgba(255,246,232,0.35)',
  sky1: '#FF7A6B',
  sky2: '#FFA23D',
};

const CALM: ChildPalette = {
  ink: '#0D1014',
  deep: '#141920',
  teal: '#1B2129',
  // Accents keep their identity — you can still tell mint from sky — but at a
  // fraction of the chroma, so none of them shout.
  coral: '#A08880',
  sun: '#93887A',
  gold: '#B4A582',
  cream: '#DDE2E6',
  mint: '#8AAE9C',
  sky: '#8399AC',
  violet: '#9A93AB',
  dim: 'rgba(221,226,230,0.58)',
  faint: 'rgba(221,226,230,0.3)',
  // No sunrise. A flat, near-neutral wash instead of warm-to-hot.
  sky1: '#242B33',
  sky2: '#1B2129',
};

export const PALETTES: Record<ChildThemeName, ChildPalette> = { vivid: VIVID, calm: CALM };

interface ChildThemeState {
  theme: ChildThemeName;
  /** Suppresses looping glows, spring bounces and the celebration overlay. */
  reduceMotion: boolean;
  palette: ChildPalette;
  setTheme: (theme: ChildThemeName, reduceMotion: boolean) => void;
}

/**
 * Not persisted deliberately. The preference lives on the child's row in the
 * database, so it follows them to any device and cannot drift out of step with
 * what the parent set. It is applied when the session loads.
 */
export const useChildTheme = create<ChildThemeState>((set) => ({
  theme: 'vivid',
  reduceMotion: false,
  palette: VIVID,
  setTheme: (theme, reduceMotion) =>
    set({ theme, reduceMotion, palette: PALETTES[theme] ?? VIVID }),
}));

/** Read the palette without subscribing — for use outside React. */
export const currentPalette = (): ChildPalette => useChildTheme.getState().palette;
