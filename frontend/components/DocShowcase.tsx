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
const ZOOM_DURATION = 4000;        // Durée totale du zoom (lent et continu)
const TEXT_APPEAR_DELAY = 1000;    // Délai avant apparition texte
const TEXT_APPEAR_DURATION = 400;  // Durée animation texte
const BADGE_APPEAR_DELAY = 400;    // Délai badge après texte
const DISPLAY_DURATION = 3000;     // Temps d'affichage total
const TEXT_HIDE_DURATION = 300;    // Durée disparition texte

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
// COMPOSANT SLIDE avec zoom intégré
// ============================================
const Slide = React.memo(({ 
  doc, 
  getMockup, 
  translateX,
  opacity,
  scale,
  isActive,
  overlayOpacity,
  textTranslateY,
  onPress,
}: {
  doc: Document;
  getMockup: (id: string) => any;
  translateX: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
  isActive: boolean;
  overlayOpacity: Animated.SharedValue<number>;
  textTranslateY: Animated.SharedValue<number>;
  onPress: () => void;
}) => {
  const slideStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: isActive ? scale.value : 1 },
    ],
    opacity: opacity.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: isActive ? overlayOpacity.value : 0,
  }));
  
  // Le texte glisse du bas vers le haut
  const textStyle = useAnimatedStyle(() => ({
    opacity: isActive ? interpolate(textTranslateY.value, [30, 0], [0, 1]) : 0,
    transform: [{ translateY: isActive ? textTranslateY.value : 30 }],
  }));

  const ligne2 = doc.ligne2 || doc.typeLabel || doc.title;
  const ligne3 = doc.ligne3 || doc.competitionLabel || '';
  const ligne4 = doc.ligne4 || doc.teamLabel || '';
  const dateFormatted = doc.date ? new Date(doc.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '';

  return (
    <Animated.View style={[styles.slideContainer, styles.slideAbsolute, slideStyle]}>
      <TouchableOpacity 
        style={styles.slide} 
        onPress={onPress}
        activeOpacity={0.95}
        disabled={!isActive}
      >
        <Image source={getMockup(doc.id)} style={styles.image} resizeMode="cover" />
        {isActive && (
          <>
            <Animated.View style={[styles.overlay, overlayStyle]} />
            <Animated.View style={[styles.titleContainer, textStyle]}>
              <Text style={styles.docType}>{ligne2}</Text>
              {ligne3 ? <Text style={styles.docCompetition} numberOfLines={2}>{ligne3}</Text> : null}
              {ligne4 ? <Text style={styles.docTeam}>{ligne4}</Text> : null}
              {dateFormatted ? <Text style={styles.docDate}>{dateFormatted}</Text> : null}
            </Animated.View>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

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
  
  // Animation values pour le slide actif
  const currentTranslateX = useSharedValue(EFFECTIVE_WIDTH); // Démarre hors écran à droite
  const currentOpacity = useSharedValue(1);
  const currentScale = useSharedValue(1);
  
  // Animation values pour le slide sortant
  const exitingTranslateX = useSharedValue(0);
  const exitingOpacity = useSharedValue(0);
  
  // Animation values pour le slide suivant (préchargé)
  const nextTranslateX = useSharedValue(EFFECTIVE_WIDTH);
  
  // Overlay et texte
  const overlayOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30); // Démarre en bas
  
  // Badge sponsoring
  const badgeScale = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);
  
  // Loading
  const loadingOpacity = useSharedValue(1);
  
  // State
  const isAnimating = useSharedValue(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  const isGestureActive = useRef(false);

  // ============================================
  // SÉQUENCE D'ANIMATION PRINCIPALE
  // ============================================
  
  // 1. Image arrive de droite avec rebond
  const animateSlideIn = useCallback(() => {
    // Reset
    currentTranslateX.value = EFFECTIVE_WIDTH;
    currentOpacity.value = 1;
    currentScale.value = 1;
    overlayOpacity.value = 0;
    textTranslateY.value = 30;
    badgeScale.value = 0;
    badgeOpacity.value = 0;
    
    // Slide in avec rebond léger
    currentTranslateX.value = withSpring(0, {
      damping: 18,      // Un seul rebond léger
      stiffness: 120,
      mass: 0.8,
    });
    
    // Démarre le zoom lent une fois en place
    setTimeout(() => {
      currentScale.value = withTiming(1.05, {
        duration: ZOOM_DURATION,
        easing: Easing.linear,
      });
    }, 300);
    
    // Après 1 seconde: overlay + texte glissent du bas
    setTimeout(() => {
      overlayOpacity.value = withTiming(0.45, { duration: TEXT_APPEAR_DURATION });
      textTranslateY.value = withTiming(0, { 
        duration: TEXT_APPEAR_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      
      // Badge sponsoring apparaît après le texte avec UN SEUL rebond
      setTimeout(() => {
        badgeOpacity.value = withTiming(1, { duration: 200 });
        badgeScale.value = withSpring(1, {
          damping: 12,     // Un seul rebond
          stiffness: 180,
          mass: 0.7,
        });
      }, BADGE_APPEAR_DELAY);
      
    }, TEXT_APPEAR_DELAY);
    
  }, []);

  // 2. Cache le texte (glisse vers le bas)
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

  // 3. Transition vers le prochain slide
  const transitionToNext = useCallback((nextIdx: number) => {
    if (isAnimating.value) return;
    isAnimating.value = true;
    
    // D'abord, cache le texte
    hideTextAnimation();
    
    // Après que le texte soit caché, lance la transition
    setTimeout(() => {
      // Le slide actuel devient "sortant"
      exitingTranslateX.value = currentTranslateX.value;
      exitingOpacity.value = 1;
      
      // Le nouveau slide arrive de la droite
      currentTranslateX.value = EFFECTIVE_WIDTH;
      currentOpacity.value = 1;
      currentScale.value = 1;
      
      // Animation simultanée:
      // - Ancien slide sort vers la gauche avec fade out
      exitingTranslateX.value = withTiming(-EFFECTIVE_WIDTH * 0.3, {
        duration: SLIDE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      exitingOpacity.value = withTiming(0, {
        duration: SLIDE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      });
      
      // - Nouveau slide entre avec rebond
      currentTranslateX.value = withSpring(0, {
        damping: 18,
        stiffness: 120,
        mass: 0.8,
      }, (finished) => {
        if (finished) {
          // Transition terminée
          exitingOpacity.value = 0;
          isAnimating.value = false;
          
          // Démarre le zoom et les animations du nouveau slide
          runOnJS(setActiveIndex)(nextIdx);
          
          // Zoom lent
          currentScale.value = withTiming(1.05, {
            duration: ZOOM_DURATION,
            easing: Easing.linear,
          });
          
          // Après 1 seconde: texte apparaît
          setTimeout(() => {
            overlayOpacity.value = withTiming(0.45, { duration: TEXT_APPEAR_DURATION });
            textTranslateY.value = withTiming(0, { 
              duration: TEXT_APPEAR_DURATION,
              easing: Easing.out(Easing.cubic),
            });
            
            // Badge après le texte
            setTimeout(() => {
              badgeOpacity.value = withTiming(1, { duration: 200 });
              badgeScale.value = withSpring(1, {
                damping: 12,
                stiffness: 180,
                mass: 0.7,
              });
            }, BADGE_APPEAR_DELAY);
          }, TEXT_APPEAR_DELAY);
        }
      });
      
    }, TEXT_HIDE_DURATION);
    
  }, [hideTextAnimation]);

  // Transition vers le précédent
  const transitionToPrev = useCallback((prevIdx: number) => {
    if (isAnimating.value) return;
    isAnimating.value = true;
    
    hideTextAnimation();
    
    setTimeout(() => {
      exitingTranslateX.value = currentTranslateX.value;
      exitingOpacity.value = 1;
      
      currentTranslateX.value = -EFFECTIVE_WIDTH;
      currentOpacity.value = 1;
      currentScale.value = 1;
      
      // Ancien sort vers la droite
      exitingTranslateX.value = withTiming(EFFECTIVE_WIDTH * 0.3, {
        duration: SLIDE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      exitingOpacity.value = withTiming(0, {
        duration: SLIDE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      });
      
      // Nouveau entre de la gauche
      currentTranslateX.value = withSpring(0, {
        damping: 18,
        stiffness: 120,
        mass: 0.8,
      }, (finished) => {
        if (finished) {
          exitingOpacity.value = 0;
          isAnimating.value = false;
          runOnJS(setActiveIndex)(prevIdx);
          
          currentScale.value = withTiming(1.05, {
            duration: ZOOM_DURATION,
            easing: Easing.linear,
          });
          
          setTimeout(() => {
            overlayOpacity.value = withTiming(0.45, { duration: TEXT_APPEAR_DURATION });
            textTranslateY.value = withTiming(0, { 
              duration: TEXT_APPEAR_DURATION,
              easing: Easing.out(Easing.cubic),
            });
            
            setTimeout(() => {
              badgeOpacity.value = withTiming(1, { duration: 200 });
              badgeScale.value = withSpring(1, {
                damping: 12,
                stiffness: 180,
                mass: 0.7,
              });
            }, BADGE_APPEAR_DELAY);
          }, TEXT_APPEAR_DELAY);
        }
      });
      
    }, TEXT_HIDE_DURATION);
  }, [hideTextAnimation]);

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      loadingOpacity.value = withTiming(0, { duration: 500 });
      setTimeout(() => {
        setIsLoading(false);
        // Première animation d'entrée
        animateSlideIn();
      }, 500);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [animateSlideIn]);

  // ============================================
  // AUTO-PLAY
  // ============================================
  useEffect(() => {
    if (!isLoading && documents.length > 1 && !isGestureActive.current) {
      autoPlayTimer.current = setTimeout(() => {
        if (!isGestureActive.current && !isAnimating.value) {
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
      if (!isAnimating.value) {
        currentTranslateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      isGestureActive.current = false;
      
      if (isAnimating.value) return;
      
      const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD || event.velocityX < -VELOCITY_THRESHOLD;
      const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD || event.velocityX > VELOCITY_THRESHOLD;
      
      if (shouldSwipeLeft && documents.length > 1) {
        const nextIdx = (activeIndex + 1) % documents.length;
        runOnJS(transitionToNext)(nextIdx);
      } else if (shouldSwipeRight && documents.length > 1) {
        const prevIdx = (activeIndex - 1 + documents.length) % documents.length;
        runOnJS(transitionToPrev)(prevIdx);
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
  const prevIndex = (activeIndex - 1 + documents.length) % documents.length;
  const prevDoc = documents[prevIndex];

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
                    <Image source={getMockup(prevDoc.id)} style={styles.image} resizeMode="cover" />
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
                    <Animated.View style={[styles.overlay, useAnimatedStyle(() => ({ opacity: overlayOpacity.value }))]} />
                    
                    {/* Texte qui glisse du bas */}
                    <Animated.View style={[
                      styles.titleContainer, 
                      useAnimatedStyle(() => ({
                        opacity: interpolate(textTranslateY.value, [30, 0], [0, 1]),
                        transform: [{ translateY: textTranslateY.value }],
                      }))
                    ]}>
                      <Text style={styles.docType}>{currentDoc.ligne2 || currentDoc.typeLabel || currentDoc.title}</Text>
                      {(currentDoc.ligne3 || currentDoc.competitionLabel) && (
                        <Text style={styles.docCompetition} numberOfLines={2}>
                          {currentDoc.ligne3 || currentDoc.competitionLabel}
                        </Text>
                      )}
                      {(currentDoc.ligne4 || currentDoc.teamLabel) && (
                        <Text style={styles.docTeam}>{currentDoc.ligne4 || currentDoc.teamLabel}</Text>
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
