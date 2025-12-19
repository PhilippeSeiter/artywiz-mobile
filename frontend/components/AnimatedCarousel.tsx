import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ViewToken,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<string>);

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
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

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
    return (
      <AnimatedCarouselItem
        image={item}
        index={index}
        scrollX={scrollX}
        itemWidth={itemWidth}
        itemHeight={itemHeight}
        gap={gap}
        borderRadius={borderRadius}
        imageStyle={imageStyle}
      />
    );
  };

  if (images.length === 0) return null;

  return (
    <View style={[styles.container, containerStyle]}>
      <AnimatedFlatList
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
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      
      {showPagination && images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              scrollX={scrollX}
              itemWidth={itemWidth}
              gap={gap}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Animated individual carousel item
interface AnimatedCarouselItemProps {
  image: string;
  index: number;
  scrollX: Animated.SharedValue<number>;
  itemWidth: number;
  itemHeight: number;
  gap: number;
  borderRadius: number;
  imageStyle?: ImageStyle;
}

function AnimatedCarouselItem({
  image,
  index,
  scrollX,
  itemWidth,
  itemHeight,
  gap,
  borderRadius,
  imageStyle,
}: AnimatedCarouselItemProps) {
  const inputRange = [
    (index - 1) * (itemWidth + gap),
    index * (itemWidth + gap),
    (index + 1) * (itemWidth + gap),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    // Scale effect - center item is larger
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.85, 1, 0.85],
      Extrapolation.CLAMP
    );

    // Opacity effect - items fade as they go away
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    // Rotation effect - subtle 3D rotation
    const rotateY = interpolate(
      scrollX.value,
      inputRange,
      [15, 0, -15],
      Extrapolation.CLAMP
    );

    // Vertical translation - items move down slightly when not centered
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { scale },
        { rotateY: `${rotateY}deg` },
        { translateY },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: itemWidth,
          height: itemHeight,
          borderRadius,
          overflow: 'hidden',
        },
        animatedStyle,
      ]}
    >
      <Image
        source={{ uri: image }}
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
}

// Animated pagination dot
interface PaginationDotProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
  itemWidth: number;
  gap: number;
}

function PaginationDot({ index, scrollX, itemWidth, gap }: PaginationDotProps) {
  const inputRange = [
    (index - 1) * (itemWidth + gap),
    index * (itemWidth + gap),
    (index + 1) * (itemWidth + gap),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
      ]}
    />
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
