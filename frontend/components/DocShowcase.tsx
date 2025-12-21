import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors, Spacing } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EFFECTIVE_WIDTH = Math.min(SCREEN_WIDTH, 500);
const IMAGE_HEIGHT = EFFECTIVE_WIDTH * 0.85;

const SWIPE_THRESHOLD = EFFECTIVE_WIDTH * 0.25;
const VELOCITY_THRESHOLD = 500;

// ============================================
// TIMING CONSTANTS (en ms)
// ============================================
const SLIDE_DURATION = 450;        // Durée du glissement
const ZOOM_DURATION = 5000;        // Zoom continu pendant toute la durée (ne s'arrête jamais)
const ZOOM_AMOUNT = 1.12;          // Zoom 12% (2x plus visible qu'avant)
const TEXT_APPEAR_DELAY = 1500;    // 1.5 secondes de zoom avant le texte
const TEXT_APPEAR_DURATION = 500;  // Durée animation texte (glisse du bas)
const BADGE_APPEAR_DELAY = 200;    // Badge juste après le texte
const TEXT_VISIBLE_DURATION = 1500; // Texte reste 1.5 secondes
const TEXT_HIDE_DURATION = 400;    // Durée disparition texte
const DISPLAY_DURATION = 3800;     // 1.5s + 0.5s texte + 1.5s visible + marge

interface Document {
  id: string;
  title: string;
  typeLabel: string;
  teamLabel?: string;
  competitionLabel?: string;
  date: string;
  isSponsored: boolean;
  ligne2?: string;
  ligne3?: string;
  ligne4?: string;
}

interface DocShowcaseProps {
  documents: Document[];
  getMockup: (id: string) => any;
  getSponsoringPrice: (id: string) => number;
  isAutoSponsoringEnabled: boolean;
  onDocPress: (docId: string) => void;
}

// Étoile qui tourne
const RotatingStarContinuous = ({ size, color }: { size: number; color: string }) => {
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <Text style={{ fontSize: size, color }}>★</Text>
    </Animated.View>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export const DocShowcase: React.FC<DocShowcaseProps> = ({
  documents,
  getMockup,
  getSponsoringPrice,
  isAutoSponsoringEnabled,
  onDocPress,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [exitingIndex, setExitingIndex] = useState(0);
  
  // Animation values pour le slide actif
  const currentTranslateX = useSharedValue(EFFECTIVE_WIDTH);
  const currentOpacity = useSharedValue(1);
  const currentScale = useSharedValue(1);
  
  // Animation values pour le slide sortant
  const exitingTranslateX = useSharedValue(-EFFECTIVE_WIDTH);
  const exitingOpacity = useSharedValue(0);
  
  // Overlay et texte
  const overlayOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  
  // Badge sponsoring
  const badgeScale = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);
  
  // Loading
  const loadingOpacity = useSharedValue(1);
  
  // State
  const isAnimating = useRef(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  const isGestureActive = useRef(false);
  const animationTimers = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timers
  const clearAllTimers = useCallback(() => {
    animationTimers.current.forEach(t => clearTimeout(t));
    animationTimers.current = [];
    if (autoPlayTimer.current) {
      clearTimeout(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }
  }, []);

  // ============================================
  // ANIMATION: Image entre avec rebond, puis zoom CONTINU
  // ============================================
  const animateNewSlideIn = useCallback(() => {
    // Reset
    currentTranslateX.value = EFFECTIVE_WIDTH;
    currentOpacity.value = 1;
    currentScale.value = 1;
    overlayOpacity.value = 0;
    textTranslateY.value = 30;
    badgeScale.value = 0;
    badgeOpacity.value = 0;
    
    // 1. Slide in avec UN rebond léger
    currentTranslateX.value = withSpring(0, {
      damping: 16,
      stiffness: 100,
      mass: 0.8,
    });
    
    // 2. Zoom CONTINU qui ne s'arrête jamais (2x plus rapide = zoom plus visible)
    setTimeout(() => {
      currentScale.value = withTiming(ZOOM_AMOUNT, {
        duration: ZOOM_DURATION,
        easing: Easing.linear,
      });
    }, 300);
    
    // 3. Après 1.5 seconde: overlay + texte glissent du bas vers le haut
    const textTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(0.45, { duration: TEXT_APPEAR_DURATION });
      textTranslateY.value = withTiming(0, { 
        duration: TEXT_APPEAR_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      
      // 4. Badge sponsoring avec UN SEUL rebond
      const badgeTimer = setTimeout(() => {
        badgeOpacity.value = withTiming(1, { duration: 150 });
        badgeScale.value = withSpring(1, {
          damping: 10,
          stiffness: 200,
          mass: 0.5,
        });
      }, BADGE_APPEAR_DELAY);
      animationTimers.current.push(badgeTimer);
      
    }, TEXT_APPEAR_DELAY);
    animationTimers.current.push(textTimer);
    
  }, []);

  // ============================================
  // ANIMATION: Cache le texte (glisse vers le bas)
  // ============================================
  const hideTextAnimation = useCallback(() => {
    // Texte et overlay disparaissent vers le bas
    textTranslateY.value = withTiming(30, { 
      duration: TEXT_HIDE_DURATION,
      easing: Easing.in(Easing.cubic),
    });
    overlayOpacity.value = withTiming(0, { duration: TEXT_HIDE_DURATION });
    
    // Badge disparaît
    badgeOpacity.value = withTiming(0, { duration: 150 });
    badgeScale.value = withTiming(0.8, { duration: 150 });
  }, []);

  // ============================================
  // TRANSITION: Vers le slide suivant
  // ============================================
  const transitionToNext = useCallback((nextIdx: number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    clearAllTimers();
    
    // Mémoriser l'ancien index pour le slide sortant
    setExitingIndex(activeIndex);
    
    // D'abord, cache le texte (300ms)
    hideTextAnimation();
    
    // Après que le texte soit caché, lance la transition
    const transitionTimer = setTimeout(() => {
      // Prépare le slide sortant
      exitingTranslateX.value = 0;
      exitingOpacity.value = 1;
      
      // Prépare le nouveau slide (hors écran à droite)
      currentTranslateX.value = EFFECTIVE_WIDTH;
      currentOpacity.value = 1;
      currentScale.value = 1;
      
      // Animation simultanée:
      // - Ancien slide sort vers la gauche avec fade out progressif
      exitingTranslateX.value = withTiming(-EFFECTIVE_WIDTH * 0.4, {
        duration: SLIDE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      exitingOpacity.value = withTiming(0, {
        duration: SLIDE_DURATION,
        easing: Easing.bezier(0.3, 0, 0.7, 1),
      });
      
      // - Nouveau slide entre avec UN rebond
      currentTranslateX.value = withSpring(0, {
        damping: 16,
        stiffness: 100,
        mass: 0.8,
      });
      
      // Met à jour l'index après le début de l'animation
      setActiveIndex(nextIdx);
      
      // Après le rebond (~500ms), démarre le zoom et texte
      const postSlideTimer = setTimeout(() => {
        exitingOpacity.value = 0;
        isAnimating.current = false;
        
        // Zoom lent
        currentScale.value = withTiming(1.06, {
          duration: ZOOM_DURATION,
          easing: Easing.linear,
        });
        
        // Après 1 seconde: texte apparaît
        const textTimer = setTimeout(() => {
          overlayOpacity.value = withTiming(0.45, { duration: TEXT_APPEAR_DURATION });
          textTranslateY.value = withTiming(0, { 
            duration: TEXT_APPEAR_DURATION,
            easing: Easing.out(Easing.cubic),
          });
          
          // Badge après le texte
          const badgeTimer = setTimeout(() => {
            badgeOpacity.value = withTiming(1, { duration: 200 });
            badgeScale.value = withSpring(1, {
              damping: 14,
              stiffness: 200,
              mass: 0.6,
            });
          }, BADGE_APPEAR_DELAY);
          animationTimers.current.push(badgeTimer);
        }, TEXT_APPEAR_DELAY);
        animationTimers.current.push(textTimer);
      }, 500);
      animationTimers.current.push(postSlideTimer);
      
    }, TEXT_HIDE_DURATION);
    animationTimers.current.push(transitionTimer);
    
  }, [activeIndex, hideTextAnimation, clearAllTimers]);

  // ============================================
  // TRANSITION: Vers le slide précédent
  // ============================================
  const transitionToPrev = useCallback((prevIdx: number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    clearAllTimers();
    setExitingIndex(activeIndex);
    hideTextAnimation();
    
    const transitionTimer = setTimeout(() => {
      exitingTranslateX.value = 0;
      exitingOpacity.value = 1;
      
      currentTranslateX.value = -EFFECTIVE_WIDTH;
      currentOpacity.value = 1;
      currentScale.value = 1;
      
      // Ancien sort vers la droite avec fade
      exitingTranslateX.value = withTiming(EFFECTIVE_WIDTH * 0.4, {
        duration: SLIDE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      exitingOpacity.value = withTiming(0, {
        duration: SLIDE_DURATION,
        easing: Easing.bezier(0.3, 0, 0.7, 1),
      });
      
      // Nouveau entre de la gauche avec rebond
      currentTranslateX.value = withSpring(0, {
        damping: 16,
        stiffness: 100,
        mass: 0.8,
      });
      
      setActiveIndex(prevIdx);
      
      const postSlideTimer = setTimeout(() => {
        exitingOpacity.value = 0;
        isAnimating.current = false;
        
        currentScale.value = withTiming(1.06, {
          duration: ZOOM_DURATION,
          easing: Easing.linear,
        });
        
        const textTimer = setTimeout(() => {
          overlayOpacity.value = withTiming(0.45, { duration: TEXT_APPEAR_DURATION });
          textTranslateY.value = withTiming(0, { 
            duration: TEXT_APPEAR_DURATION,
            easing: Easing.out(Easing.cubic),
          });
          
          const badgeTimer = setTimeout(() => {
            badgeOpacity.value = withTiming(1, { duration: 200 });
            badgeScale.value = withSpring(1, {
              damping: 14,
              stiffness: 200,
              mass: 0.6,
            });
          }, BADGE_APPEAR_DELAY);
          animationTimers.current.push(badgeTimer);
        }, TEXT_APPEAR_DELAY);
        animationTimers.current.push(textTimer);
      }, 500);
      animationTimers.current.push(postSlideTimer);
      
    }, TEXT_HIDE_DURATION);
    animationTimers.current.push(transitionTimer);
  }, [activeIndex, hideTextAnimation, clearAllTimers]);

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      loadingOpacity.value = withTiming(0, { duration: 500 });
      setTimeout(() => {
        setIsLoading(false);
        animateNewSlideIn();
      }, 500);
    }, 4000);
    
    return () => {
      clearTimeout(timer);
      clearAllTimers();
    };
  }, [animateNewSlideIn, clearAllTimers]);

  // ============================================
  // AUTO-PLAY
  // ============================================
  useEffect(() => {
    if (!isLoading && documents.length > 1 && !isGestureActive.current) {
      autoPlayTimer.current = setTimeout(() => {
        if (!isGestureActive.current && !isAnimating.current) {
          const nextIdx = (activeIndex + 1) % documents.length;
          transitionToNext(nextIdx);
        }
      }, DISPLAY_DURATION);
    }
    
    return () => {
      if (autoPlayTimer.current) {
        clearTimeout(autoPlayTimer.current);
      }
    };
  }, [isLoading, documents.length, activeIndex, transitionToNext]);

  // ============================================
  // GESTURE HANDLING
  // ============================================
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.current = true;
      if (autoPlayTimer.current) {
        clearTimeout(autoPlayTimer.current);
      }
    })
    .onUpdate((event) => {
      if (!isAnimating.current) {
        currentTranslateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      isGestureActive.current = false;
      
      if (isAnimating.current) return;
      
      const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD || event.velocityX < -VELOCITY_THRESHOLD;
      const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD || event.velocityX > VELOCITY_THRESHOLD;
      
      if (shouldSwipeLeft && documents.length > 1) {
        const nextIdx = (activeIndex + 1) % documents.length;
        transitionToNext(nextIdx);
      } else if (shouldSwipeRight && documents.length > 1) {
        const prevIdx = (activeIndex - 1 + documents.length) % documents.length;
        transitionToPrev(prevIdx);
      } else {
        // Retour avec rebond
        currentTranslateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  // ============================================
  // ANIMATED STYLES
  // ============================================
  const currentSlideStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: currentTranslateX.value },
      { scale: currentScale.value },
    ],
    opacity: currentOpacity.value,
    zIndex: 2,
  }));

  const exitingSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: exitingTranslateX.value }],
    opacity: exitingOpacity.value,
    zIndex: 1,
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(textTranslateY.value, [30, 0], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: textTranslateY.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeOpacity.value,
  }));
  
  const loadingStyle = useAnimatedStyle(() => ({ opacity: loadingOpacity.value }));

  // ============================================
  // RENDER
  // ============================================
  if (documents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun document disponible</Text>
      </View>
    );
  }

  const currentDoc = documents[activeIndex];
  const exitingDoc = documents[exitingIndex] || currentDoc;

  return (
    <View style={styles.container}>
      {isLoading && (
        <Animated.View style={[styles.loadingContainer, loadingStyle]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des documents...</Text>
        </Animated.View>
      )}

      {!isLoading && (
        <>
          {/* Badge sponsoring flottant */}
          {currentDoc.isSponsored && isAutoSponsoringEnabled && (
            <Animated.View style={[styles.sponsorBadgeFloating, badgeAnimatedStyle]}>
              <Text style={styles.sponsorBadgeTitle}>Sponsoring</Text>
              <View style={styles.sponsorBadgeRow}>
                <RotatingStarContinuous size={16} color={Colors.white} />
                <Text style={styles.sponsorBadgeText}>
                  {getSponsoringPrice(currentDoc.id)} ATC
                </Text>
              </View>
            </Animated.View>
          )}

          <GestureHandlerRootView style={styles.gestureContainer}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.slidesWrapper}>
                {/* Slide sortant (ancien) */}
                <Animated.View style={[styles.slideContainer, styles.slideAbsolute, exitingSlideStyle]}>
                  <View style={styles.slide}>
                    <Image source={getMockup(exitingDoc.id)} style={styles.image} resizeMode="cover" />
                  </View>
                </Animated.View>

                {/* Slide courant */}
                <Animated.View style={[styles.slideContainer, styles.slideAbsolute, currentSlideStyle]}>
                  <TouchableOpacity 
                    style={styles.slide} 
                    onPress={() => onDocPress(currentDoc.id)}
                    activeOpacity={0.95}
                  >
                    <Image source={getMockup(currentDoc.id)} style={styles.image} resizeMode="cover" />
                    
                    {/* Overlay */}
                    <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
                    
                    {/* Texte qui glisse du bas */}
                    <Animated.View style={[styles.titleContainer, textAnimatedStyle]}>
                      <Text style={styles.docType}>
                        {currentDoc.ligne2 || currentDoc.typeLabel || currentDoc.title}
                      </Text>
                      {(currentDoc.ligne3 || currentDoc.competitionLabel) && (
                        <Text style={styles.docCompetition} numberOfLines={2}>
                          {currentDoc.ligne3 || currentDoc.competitionLabel}
                        </Text>
                      )}
                      {(currentDoc.ligne4 || currentDoc.teamLabel) && (
                        <Text style={styles.docTeam}>
                          {currentDoc.ligne4 || currentDoc.teamLabel}
                        </Text>
                      )}
                      {currentDoc.date && (
                        <Text style={styles.docDate}>
                          {new Date(currentDoc.date).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </Text>
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: IMAGE_HEIGHT + 20,
    overflow: 'visible',
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    position: 'relative',
  },
  gestureContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  slidesWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: Spacing.md,
  },
  emptyContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  slideContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  slideAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  slide: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    borderRadius: 16,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  docType: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docCompetition: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  docTeam: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  docDate: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  sponsorBadgeFloating: {
    position: 'absolute',
    top: -8,
    right: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    zIndex: 1000,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  sponsorBadgeTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sponsorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sponsorBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default DocShowcase;
