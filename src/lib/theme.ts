// Pro Parenting - World-Class Theme System
// Premium + Playful + Educationally Serious

export const colors = {
  // ============================================================
  // DARK MODE (DEFAULT EXPERIENCE)
  // ============================================================
  dark: {
    // Backgrounds & Surfaces
    background: '#0F1221',
    surfacePrimary: '#1A1F38',
    surfaceElevated: '#1E2445',
    border: '#2A2F4A',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B8D0',
    textMuted: '#8890A8',
    
    // Brand Colors
    purple: '#6A4CFF',
    purpleDark: '#3F1FAF',
    purpleLight: '#8B72FF',
    
    // Accent Colors
    green: '#22C55E',
    greenMuted: '#166534',
    teal: '#14B8A6',
    tealMuted: '#0F766E',
    amber: '#F59E0B',
    amberMuted: '#B45309',
    pink: '#EC4899',
    pinkMuted: '#BE185D',
    red: '#EF4444',
    redMuted: '#B91C1C',
    
    // Gradient
    gradientStart: '#6A4CFF',
    gradientEnd: '#3F1FAF',
    
    // Progress Bars
    progressTrack: '#2A2F4A',
    progressFill: '#6A4CFF',
    progressFillAlt: '#14B8A6',
  },
  
  // ============================================================
  // LIGHT MODE (SECONDARY EXPERIENCE)
  // ============================================================
  light: {
    // Backgrounds & Surfaces
    background: '#F6F7FB',
    surfacePrimary: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#EEF1F7',
    border: '#E2E6F0',
    
    // Text
    textPrimary: '#1A1F38',
    textSecondary: '#5A6178',
    textMuted: '#8890A8',
    
    // Brand Colors (KEEP SAME AS DARK)
    purple: '#6A4CFF',
    purpleDark: '#3F1FAF',
    purpleLight: '#8B72FF',
    
    // Accent Colors (KEEP SAME AS DARK)
    green: '#22C55E',
    greenMuted: '#166534',
    teal: '#14B8A6',
    tealMuted: '#0F766E',
    amber: '#F59E0B',
    amberMuted: '#B45309',
    pink: '#EC4899',
    pinkMuted: '#BE185D',
    red: '#EF4444',
    redMuted: '#B91C1C',
    
    // Gradient
    gradientStart: '#6A4CFF',
    gradientEnd: '#3F1FAF',
    
    // Progress Bars
    progressTrack: '#E2E6F0',
    progressFill: '#6A4CFF',
    progressFillAlt: '#14B8A6',
  },
} as const;

// Current theme (default to dark)
export const theme = colors.dark;

// ============================================================
// KIDS DASHBOARD GAMIFICATION TOKENS
// ============================================================
export const gamification = {
  // XP Progress Bar
  xp: {
    track: '#2A2F4A',
    fill: '#14B8A6', // Teal
    milestone: '#6A4CFF', // Purple
  },
  
  // Achievement Badge Categories
  badges: {
    learning: '#6A4CFF',    // Purple
    responsibility: '#22C55E', // Green
    consistency: '#14B8A6',  // Teal
    helping: '#F59E0B',     // Amber
  },
  
  // Reward Progress
  reward: {
    track: '#2A2F4A',
    fill: '#6A4CFF',
    complete: '#22C55E',
  },
  
  // Level Colors
  levels: {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
  },
} as const;

// ============================================================
// DASHBOARD DIFFERENTIATION
// ============================================================
export const dashboards = {
  // Parent Dashboard - Premium, calm, structured
  parent: {
    accentPrimary: '#6A4CFF',   // Purple only
    accentSecondary: '#2A2F4A', // Neutral
    animationIntensity: 'low',
    cardRadius: 16,
    density: 'dense',
  },
  
  // Kids Dashboard - Engaging, playful, motivational
  kids: {
    accentPrimary: '#6A4CFF',   // Purple
    accentSecondary: '#14B8A6', // Teal highlights
    animationIntensity: 'high',
    cardRadius: 20,
    density: 'comfortable',
  },
} as const;

export type ThemeColors = typeof colors.dark;
export type GamificationTokens = typeof gamification;
