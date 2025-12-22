/**
 * Animation Configuration - Règles d'animation cohérentes pour Artywiz
 * À utiliser sur TOUS les écrans avant le tableau de bord
 * 
 * EFFETS STANDARD:
 * - Entrée: slide + fade avec spring bounce modéré
 * - Sortie: fade + légère translation
 * - Délai séquentiel entre éléments
 */

// ============================================
// CONSTANTES DE TIMING
// ============================================
export const ANIMATION_CONFIG = {
  // Durées
  DURATION_FAST: 200,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 450,
  
  // Délai entre éléments séquentiels
  STAGGER_DELAY: 60,
  
  // Spring configurations (bounce modéré)
  SPRING_GENTLE: {
    damping: 15,
    stiffness: 120,
    mass: 0.8,
  },
  SPRING_BOUNCY: {
    damping: 12,
    stiffness: 180,
    mass: 0.6,
  },
  SPRING_SNAPPY: {
    damping: 18,
    stiffness: 200,
    mass: 0.5,
  },
  
  // Easing pour timing animations
  EASE_IN: { easing: 'easeIn' },
  EASE_OUT: { easing: 'easeOut' },
  EASE_IN_OUT: { easing: 'easeInOut' },
};

// ============================================
// PRESETS D'ANIMATION (Reanimated)
// ============================================

// Entrée depuis le bas avec bounce
export const ENTER_FROM_BOTTOM = {
  initialValues: {
    opacity: 0,
    transform: [{ translateY: 30 }],
  },
  animations: {
    opacity: { duration: ANIMATION_CONFIG.DURATION_NORMAL },
    transform: [{ translateY: { type: 'spring', ...ANIMATION_CONFIG.SPRING_GENTLE } }],
  },
};

// Entrée depuis le haut
export const ENTER_FROM_TOP = {
  initialValues: {
    opacity: 0,
    transform: [{ translateY: -30 }],
  },
  animations: {
    opacity: { duration: ANIMATION_CONFIG.DURATION_NORMAL },
    transform: [{ translateY: { type: 'spring', ...ANIMATION_CONFIG.SPRING_GENTLE } }],
  },
};

// Entrée avec scale (zoom in)
export const ENTER_SCALE = {
  initialValues: {
    opacity: 0,
    transform: [{ scale: 0.9 }],
  },
  animations: {
    opacity: { duration: ANIMATION_CONFIG.DURATION_FAST },
    transform: [{ scale: { type: 'spring', ...ANIMATION_CONFIG.SPRING_BOUNCY } }],
  },
};

// Sortie fade out
export const EXIT_FADE = {
  animations: {
    opacity: { duration: ANIMATION_CONFIG.DURATION_FAST },
  },
  finalValues: {
    opacity: 0,
  },
};

// Sortie vers le bas
export const EXIT_TO_BOTTOM = {
  animations: {
    opacity: { duration: ANIMATION_CONFIG.DURATION_FAST },
    transform: [{ translateY: { duration: ANIMATION_CONFIG.DURATION_NORMAL } }],
  },
  finalValues: {
    opacity: 0,
    transform: [{ translateY: 20 }],
  },
};

// ============================================
// STYLES PARTAGÉS
// ============================================
export const CARD_OPACITY = 0.90; // 90% opacité = 10% transparence

export const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 10,
};

// ============================================
// HELPER FUNCTIONS pour animations séquentielles
// ============================================
export const getStaggerDelay = (index: number) => index * ANIMATION_CONFIG.STAGGER_DELAY;
