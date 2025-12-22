import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Text,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { Colors, Spacing } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EFFECTIVE_WIDTH = Math.min(SCREEN_WIDTH, 500);
const IMAGE_HEIGHT = EFFECTIVE_WIDTH * 0.85;

const SWIPE_THRESHOLD = EFFECTIVE_WIDTH * 0.25;

// ============================================
// TIMING CONSTANTS (en ms)
// ============================================
const SLIDE_DURATION = 450;
const ZOOM_DURATION = 4000;
const ZOOM_AMOUNT = 1.10;
const TEXT_APPEAR_DELAY = 1500;
const TEXT_APPEAR_DURATION = 500;
const BADGE_APPEAR_DELAY = 200;
const TEXT_HIDE_DURATION = 400;
const DISPLAY_DURATION = 4000;

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
  const rotation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
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
  const currentTranslateX = useRef(new Animated.Value(EFFECTIVE_WIDTH)).current;
  const currentOpacity = useRef(new Animated.Value(1)).current;
  const currentScale = useRef(new Animated.Value(1)).current;
  
  // Animation values pour le slide sortant
  const exitingTranslateX = useRef(new Animated.Value(-EFFECTIVE_WIDTH)).current;
  const exitingOpacity = useRef(new Animated.Value(0)).current;
  
  // Overlay et texte
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  
  // Badge sponsoring
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  
  // Loading
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  
  // State
  const isAnimating = useRef(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
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
    currentTranslateX.setValue(EFFECTIVE_WIDTH);
    currentOpacity.setValue(1);
    currentScale.setValue(1);
    overlayOpacity.setValue(0);
    textTranslateY.setValue(30);
    textOpacity.setValue(0);
    badgeScale.setValue(0);
    badgeOpacity.setValue(0);
    
    // 1. Slide in avec rebond
    Animated.spring(currentTranslateX, {
      toValue: 0,
      damping: 16,
      stiffness: 100,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
    
    // 2. Zoom CONTINU de 10%
    setTimeout(() => {
      Animated.timing(currentScale, {
        toValue: ZOOM_AMOUNT,
        duration: ZOOM_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    }, 400);
    
    // 3. Après 1.5 seconde: overlay + texte
    const textTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0.45, duration: TEXT_APPEAR_DURATION, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: TEXT_APPEAR_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: TEXT_APPEAR_DURATION, useNativeDriver: true }),
      ]).start();
      
      // 4. Badge sponsoring
      const badgeTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(badgeOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.spring(badgeScale, { toValue: 1, damping: 10, stiffness: 200, mass: 0.5, useNativeDriver: true }),
        ]).start();
      }, BADGE_APPEAR_DELAY);
      animationTimers.current.push(badgeTimer);
      
    }, TEXT_APPEAR_DELAY);
    animationTimers.current.push(textTimer);
    
  }, []);

  // ============================================
  // ANIMATION: Cache le texte
  // ============================================
  const hideTextAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(textTranslateY, { toValue: 30, duration: TEXT_HIDE_DURATION, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0, duration: TEXT_HIDE_DURATION, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: TEXT_HIDE_DURATION, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 0, damping: 8, stiffness: 300, mass: 0.4, useNativeDriver: true }),
      Animated.timing(badgeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  // ============================================
  // TRANSITION: Vers le slide suivant
  // ============================================
  const transitionToNext = useCallback((nextIdx: number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    
    clearAllTimers();
    setExitingIndex(activeIndex);
    hideTextAnimation();
    
    const transitionTimer = setTimeout(() => {
      exitingTranslateX.setValue(0);
      exitingOpacity.setValue(1);
      currentTranslateX.setValue(EFFECTIVE_WIDTH);
      currentOpacity.setValue(1);
      currentScale.setValue(1);
      
      // Ancien slide sort vers la gauche
      Animated.parallel([
        Animated.timing(exitingTranslateX, { toValue: -EFFECTIVE_WIDTH * 0.4, duration: SLIDE_DURATION, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(exitingOpacity, { toValue: 0, duration: SLIDE_DURATION, easing: Easing.bezier(0.3, 0, 0.7, 1), useNativeDriver: true }),
      ]).start();
      
      // Nouveau slide entre avec rebond
      Animated.spring(currentTranslateX, { toValue: 0, damping: 16, stiffness: 100, mass: 0.8, useNativeDriver: true }).start();
      
      setActiveIndex(nextIdx);
      
      const postSlideTimer = setTimeout(() => {
        exitingOpacity.setValue(0);
        isAnimating.current = false;
        
        Animated.timing(currentScale, { toValue: 1.06, duration: ZOOM_DURATION, easing: Easing.linear, useNativeDriver: true }).start();
        
        const textTimer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0.45, duration: TEXT_APPEAR_DURATION, useNativeDriver: true }),
            Animated.timing(textTranslateY, { toValue: 0, duration: TEXT_APPEAR_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(textOpacity, { toValue: 1, duration: TEXT_APPEAR_DURATION, useNativeDriver: true }),
          ]).start();
          
          const badgeTimer = setTimeout(() => {
            Animated.parallel([
              Animated.timing(badgeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.spring(badgeScale, { toValue: 1, damping: 14, stiffness: 200, mass: 0.6, useNativeDriver: true }),
            ]).start();
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
  // PAN RESPONDER for gestures
  // ============================================
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderGrant: () => {
        if (autoPlayTimer.current) {
          clearTimeout(autoPlayTimer.current);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isAnimating.current) {
          currentTranslateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating.current) return;
        
        const shouldSwipeLeft = gestureState.dx < -SWIPE_THRESHOLD;
        const shouldSwipeRight = gestureState.dx > SWIPE_THRESHOLD;
        
        if (shouldSwipeLeft && documents.length > 1) {
          const nextIdx = (activeIndex + 1) % documents.length;
          transitionToNext(nextIdx);
        } else if (shouldSwipeRight && documents.length > 1) {
          const prevIdx = (activeIndex - 1 + documents.length) % documents.length;
          transitionToNext(prevIdx);
        } else {
          Animated.spring(currentTranslateX, { toValue: 0, damping: 15, stiffness: 150, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(loadingOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
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
    if (!isLoading && documents.length > 1) {
      autoPlayTimer.current = setTimeout(() => {
        if (!isAnimating.current) {
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
        <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des documents...</Text>
        </Animated.View>
      )}

      {!isLoading && (
        <>
          {/* Badge sponsoring flottant */}
          {currentDoc.isSponsored && isAutoSponsoringEnabled && (
            <Animated.View style={[styles.sponsorBadgeFloating, { transform: [{ scale: badgeScale }], opacity: badgeOpacity }]}>
              <Text style={styles.sponsorBadgeTitle}>Sponsoring</Text>
              <View style={styles.sponsorBadgeRow}>
                <RotatingStarContinuous size={16} color={Colors.white} />
                <Text style={styles.sponsorBadgeText}>
                  {getSponsoringPrice(currentDoc.id)} ATC
                </Text>
              </View>
            </Animated.View>
          )}

          <View style={styles.gestureContainer} {...panResponder.panHandlers}>
            <View style={styles.slidesWrapper}>
              {/* Slide sortant (ancien) */}
              <Animated.View style={[styles.slideContainer, styles.slideAbsolute, { transform: [{ translateX: exitingTranslateX }], opacity: exitingOpacity }]}>
                <View style={styles.slide}>
                  <Image source={getMockup(exitingDoc.id)} style={styles.image} resizeMode="cover" />
                </View>
              </Animated.View>

              {/* Slide courant */}
              <Animated.View style={[styles.slideContainer, styles.slideAbsolute, { transform: [{ translateX: currentTranslateX }, { scale: currentScale }], opacity: currentOpacity, zIndex: 2 }]}>
                <TouchableOpacity 
                  style={styles.slide} 
                  onPress={() => onDocPress(currentDoc.id)}
                  activeOpacity={0.95}
                >
                  <Image source={getMockup(currentDoc.id)} style={styles.image} resizeMode="cover" />
                  
                  {/* Overlay */}
                  <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
                  
                  {/* Texte qui glisse du bas */}
                  <Animated.View style={[styles.titleContainer, { transform: [{ translateY: textTranslateY }], opacity: textOpacity }]}>
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
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: 'transparent',
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
    overflow: 'hidden',
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
