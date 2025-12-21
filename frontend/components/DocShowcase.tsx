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
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors, Spacing } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EFFECTIVE_WIDTH = Math.min(SCREEN_WIDTH, 500);
const IMAGE_HEIGHT = EFFECTIVE_WIDTH * 0.85;

const SWIPE_THRESHOLD = EFFECTIVE_WIDTH * 0.25;
const VELOCITY_THRESHOLD = 500;

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

// Composant Slide individuel pour éviter re-render du parent
const Slide = React.memo(({ 
  doc, 
  getMockup, 
  style,
  isActive,
  overlayOpacity,
  textOpacity,
  onPress,
}: {
  doc: Document;
  getMockup: (id: string) => any;
  style: any;
  isActive: boolean;
  overlayOpacity: Animated.SharedValue<number>;
  textOpacity: Animated.SharedValue<number>;
  onPress: () => void;
}) => {
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: isActive ? overlayOpacity.value : 0,
  }));
  
  const textStyle = useAnimatedStyle(() => ({
    opacity: isActive ? textOpacity.value : 0,
  }));

  const ligne2 = doc.ligne2 || doc.typeLabel || doc.title;
  const ligne3 = doc.ligne3 || doc.competitionLabel || '';
  const ligne4 = doc.ligne4 || doc.teamLabel || '';
  const dateFormatted = doc.date ? new Date(doc.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '';

  return (
    <Animated.View style={[styles.slideContainer, styles.slideAbsolute, style]}>
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

export const DocShowcase: React.FC<DocShowcaseProps> = ({
  documents,
  getMockup,
  getSponsoringPrice,
  isAutoSponsoringEnabled,
  onDocPress,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Position de défilement continue (en pixels)
  const scrollX = useSharedValue(0);
  const isAnimating = useSharedValue(false);
  
  // Opacité pour le slide sortant (évite le flash)
  const exitingOpacity = useSharedValue(1);
  
  const overlayOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(-10);
  const loadingOpacity = useSharedValue(1);
  
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  const isGestureActive = useRef(false);

  // Mettre à jour l'index actif basé sur scrollX
  const updateActiveIndex = useCallback((newIndex: number) => {
    setActiveIndex(newIndex);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadingOpacity.value = withTiming(0, { duration: 500 });
      setTimeout(() => {
        setIsLoading(false);
        startTextAnimation();
      }, 500);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);

  const startTextAnimation = useCallback(() => {
    overlayOpacity.value = withTiming(0.5, { duration: 600 });
    textOpacity.value = withTiming(1, { duration: 600 });
    
    // Animation bounce réduite : 2 rebonds
    badgeScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withDelay(200, withSpring(1.12, { damping: 10, stiffness: 200 })),
      withSpring(0.97, { damping: 12, stiffness: 180 }),
      withSpring(1, { damping: 14, stiffness: 150 })
    );
    badgeRotate.value = withSequence(
      withTiming(-8, { duration: 0 }),
      withDelay(200, withSpring(4, { damping: 10, stiffness: 180 })),
      withSpring(-1, { damping: 12, stiffness: 150 }),
      withSpring(0, { damping: 14, stiffness: 120 })
    );
  }, []);

  const hideTextAnimation = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 150 });
    textOpacity.value = withTiming(0, { duration: 150 });
    badgeScale.value = withTiming(0.9, { duration: 100 });
  }, []);

  // Opacity pour le fade durant la transition
  const slidesOpacity = useSharedValue(1);

  // Animation terminée - mettre à jour l'index React sans flash
  const onAnimationComplete = useCallback((targetIndex: number) => {
    // Reset immédiat pendant que le slide est hors écran
    scrollX.value = 0;
    exitingOpacity.value = 1; // Reset opacity for next transition
    // Mettre à jour l'index
    runOnJS(updateActiveIndex)(targetIndex);
    isAnimating.value = false;
    runOnJS(startTextAnimation)();
  }, [updateActiveIndex, startTextAnimation]);

  // Auto-play
  useEffect(() => {
    if (!isLoading && documents.length > 1 && !isGestureActive.current) {
      autoPlayTimer.current = setTimeout(() => {
        if (!isGestureActive.current && !isAnimating.value) {
          goToNext();
        }
      }, 5000);
    }
    
    return () => {
      if (autoPlayTimer.current) {
        clearTimeout(autoPlayTimer.current);
      }
    };
  }, [isLoading, documents.length, activeIndex]);

  const goToNext = useCallback(() => {
    if (documents.length <= 1 || isAnimating.value) return;
    
    isAnimating.value = true;
    hideTextAnimation();
    
    const nextIdx = (activeIndex + 1) % documents.length;
    
    // Reset exiting opacity
    exitingOpacity.value = 1;
    
    // Animer le slide sortant : glisse vers la gauche ET s'estompe progressivement
    exitingOpacity.value = withTiming(0, { 
      duration: 400, 
      easing: Easing.bezier(0.4, 0, 0.2, 1) 
    });
    
    // Animer vers la gauche
    scrollX.value = withTiming(
      -EFFECTIVE_WIDTH,
      { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)(nextIdx);
        }
      }
    );
  }, [activeIndex, documents.length, hideTextAnimation, onAnimationComplete]);

  const goToPrev = useCallback(() => {
    if (documents.length <= 1 || isAnimating.value) return;
    
    isAnimating.value = true;
    hideTextAnimation();
    
    const prevIdx = (activeIndex - 1 + documents.length) % documents.length;
    
    // Reset exiting opacity
    exitingOpacity.value = 1;
    
    // Animer le slide sortant : glisse vers la droite ET s'estompe progressivement
    exitingOpacity.value = withTiming(0, { 
      duration: 400, 
      easing: Easing.bezier(0.4, 0, 0.2, 1) 
    });
    
    // Animer vers la droite
    scrollX.value = withTiming(
      EFFECTIVE_WIDTH,
      { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)(prevIdx);
        }
      }
    );
  }, [activeIndex, documents.length, hideTextAnimation, onAnimationComplete]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.current = true;
    })
    .onUpdate((event) => {
      if (!isAnimating.value) {
        scrollX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      isGestureActive.current = false;
      
      if (isAnimating.value) return;
      
      const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD || event.velocityX < -VELOCITY_THRESHOLD;
      const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD || event.velocityX > VELOCITY_THRESHOLD;
      
      if (shouldSwipeLeft && documents.length > 1) {
        isAnimating.value = true;
        runOnJS(hideTextAnimation)();
        const nextIdx = (activeIndex + 1) % documents.length;
        
        scrollX.value = withTiming(
          -EFFECTIVE_WIDTH, 
          { duration: 250, easing: Easing.out(Easing.cubic) }, 
          (finished) => {
            if (finished) runOnJS(onAnimationComplete)(nextIdx);
          }
        );
      } else if (shouldSwipeRight && documents.length > 1) {
        isAnimating.value = true;
        runOnJS(hideTextAnimation)();
        const prevIdx = (activeIndex - 1 + documents.length) % documents.length;
        
        scrollX.value = withTiming(
          EFFECTIVE_WIDTH, 
          { duration: 250, easing: Easing.out(Easing.cubic) }, 
          (finished) => {
            if (finished) runOnJS(onAnimationComplete)(prevIdx);
          }
        );
      } else {
        // Retour
        scrollX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  // Styles animés pour les 3 slides
  // Le slide courant s'estompe progressivement quand il sort
  const currentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
    opacity: exitingOpacity.value,
    zIndex: 2,
  }));

  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value + EFFECTIVE_WIDTH }],
    zIndex: 1,
  }));

  const prevStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value - EFFECTIVE_WIDTH }],
    zIndex: 1,
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }, { rotate: `${badgeRotate.value}deg` }],
  }));
  
  const loadingStyle = useAnimatedStyle(() => ({ opacity: loadingOpacity.value }));

  if (documents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun document disponible</Text>
      </View>
    );
  }

  const currentDoc = documents[activeIndex];
  const nextIndex = (activeIndex + 1) % documents.length;
  const prevIndex = (activeIndex - 1 + documents.length) % documents.length;
  const nextDoc = documents[nextIndex];
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
                {/* Slide précédent */}
                <Slide
                  doc={prevDoc}
                  getMockup={getMockup}
                  style={prevStyle}
                  isActive={false}
                  overlayOpacity={overlayOpacity}
                  textOpacity={textOpacity}
                  onPress={() => {}}
                />

                {/* Slide courant */}
                <Slide
                  doc={currentDoc}
                  getMockup={getMockup}
                  style={currentStyle}
                  isActive={true}
                  overlayOpacity={overlayOpacity}
                  textOpacity={textOpacity}
                  onPress={() => onDocPress(currentDoc.id)}
                />

                {/* Slide suivant */}
                <Slide
                  doc={nextDoc}
                  getMockup={getMockup}
                  style={nextStyle}
                  isActive={false}
                  overlayOpacity={overlayOpacity}
                  textOpacity={textOpacity}
                  onPress={() => {}}
                />
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
