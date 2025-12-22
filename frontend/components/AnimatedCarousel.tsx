import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ViewToken,
  ImageStyle,
  ViewStyle,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedCarouselProps {
  images: string[];
  itemWidth?: number;
  itemHeight?: number;
  gap?: number;
  showPagination?: boolean;
  borderRadius?: number;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
}

export function AnimatedCarousel({
  images,
  itemWidth = SCREEN_WIDTH * 0.75,
  itemHeight = 200,
  gap = Spacing.md,
  showPagination = true,
  borderRadius = 16,
  containerStyle,
  imageStyle,
}: AnimatedCarouselProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const inputRange = [
      (index - 1) * (itemWidth + gap),
      index * (itemWidth + gap),
      (index + 1) * (itemWidth + gap),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          {
            width: itemWidth,
            height: itemHeight,
            borderRadius,
            overflow: 'hidden',
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <Image
          source={{ uri: item }}
          style={[
            {
              width: '100%',
              height: '100%',
              borderRadius,
            },
            imageStyle,
          ]}
          contentFit="cover"
          transition={300}
        />
      </Animated.View>
    );
  };

  if (images.length === 0) return null;

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth + gap}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: (SCREEN_WIDTH - itemWidth) / 2,
          gap: gap,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      
      {showPagination && images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => {
            const inputRange = [
              (index - 1) * (itemWidth + gap),
              index * (itemWidth + gap),
              (index + 1) * (itemWidth + gap),
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
