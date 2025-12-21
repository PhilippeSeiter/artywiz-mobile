/**
 * VideoDirectionContext - Gère la direction de lecture de la vidéo de fond
 * Alterne entre avant et arrière à chaque changement d'écran
 * Note: Fonctionne uniquement sur le web (pas de video native)
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';

// Écrans où la vidéo doit être active
const AUTH_SCREENS = ['/', '/login', '/signup', '/sector-selection', '/profile-selection', '/theme-selection', '/onboarding-themes'];

interface VideoDirectionContextType {
  isForward: boolean;
  videoRef: React.MutableRefObject<any>;
  registerVideo: (video: any) => void;
}

const VideoDirectionContext = createContext<VideoDirectionContextType>({
  isForward: true,
  videoRef: { current: null },
  registerVideo: () => {},
});

export function useVideoDirection() {
  return useContext(VideoDirectionContext);
}

interface VideoDirectionProviderProps {
  children: React.ReactNode;
}

export function VideoDirectionProvider({ children }: VideoDirectionProviderProps) {
  const pathname = usePathname();
  const [isForward, setIsForward] = useState(true);
  const videoRef = useRef<any>(null);
  const previousPathname = useRef<string>(pathname);
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const registerVideo = useCallback((video: any) => {
    videoRef.current = video;
  }, []);

  // Skip video logic on native platforms
  if (Platform.OS !== 'web') {
    return (
      <VideoDirectionContext.Provider value={{ isForward: true, videoRef, registerVideo }}>
        {children}
      </VideoDirectionContext.Provider>
    );
  }

  // Fonction pour animer la vidéo en arrière (manipulation du currentTime)
  const animateBackward = useCallback(() => {
    if (!videoRef.current || isAnimatingRef.current) return;
    
    const video = videoRef.current;
    
    // Vérifier que la vidéo est prête et a une durée valide
    if (!video.duration || !isFinite(video.duration) || video.duration <= 0) {
      console.warn('Video not ready for backward animation');
      return;
    }
    
    isAnimatingRef.current = true;
    video.pause();
    
    const animate = () => {
      if (!videoRef.current || !isAnimatingRef.current) {
        isAnimatingRef.current = false;
        return;
      }
      
      // Reculer de ~0.033s par frame (équivalent ~30fps en arrière)
      video.currentTime -= 0.033;
      
      // Si on arrive au début, revenir à la fin pour boucler
      if (video.currentTime <= 0.1) {
        video.currentTime = video.duration - 0.1;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  }, []);

  // Fonction pour animer la vidéo en avant (lecture normale)
  const animateForward = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    // Arrêter l'animation manuelle en arrière
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAnimatingRef.current = false;
    
    // Reprendre la lecture normale
    video.play().catch(console.warn);
  }, []);

  // Détecter les changements d'écran et alterner la direction
  useEffect(() => {
    // Vérifier si on est sur un écran d'auth
    const isCurrentAuthScreen = AUTH_SCREENS.some(screen => pathname === screen || pathname.startsWith(screen + '/'));
    const wasPreviousAuthScreen = AUTH_SCREENS.some(screen => previousPathname.current === screen || previousPathname.current.startsWith(screen + '/'));
    
    // Si on navigue entre deux écrans d'auth, alterner la direction
    if (isCurrentAuthScreen && wasPreviousAuthScreen && pathname !== previousPathname.current) {
      setIsForward(prev => {
        const newDirection = !prev;
        
        // Appliquer le changement de direction à la vidéo
        setTimeout(() => {
          if (newDirection) {
            animateForward();
          } else {
            animateBackward();
          }
        }, 100);
        
        return newDirection;
      });
    }
    
    // Si on quitte les écrans d'auth, remettre en lecture normale
    if (!isCurrentAuthScreen && wasPreviousAuthScreen) {
      animateForward();
      setIsForward(true);
    }
    
    // Si on arrive sur un écran d'auth depuis ailleurs, démarrer en avant
    if (isCurrentAuthScreen && !wasPreviousAuthScreen) {
      animateForward();
      setIsForward(true);
    }
    
    previousPathname.current = pathname;
  }, [pathname, animateForward, animateBackward]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <VideoDirectionContext.Provider value={{ isForward, videoRef, registerVideo }}>
      {children}
    </VideoDirectionContext.Provider>
  );
}

export default VideoDirectionProvider;
