import { useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { Screen } from '../../types';

export function useWelcomeAnimations(go: (screen: Screen) => void) {
  const { width: windowWidth } = useWindowDimensions();
  const isNavigatingRef = useRef(false);

  // Dynamic responsive off-screen boundaries
  const offscreenLeft = -windowWidth - 120;
  const offscreenRight = windowWidth + 120;

  // Shared Animation Values (Welcome Entrance)
  const globeOpacity = useSharedValue(0);
  const globeScale = useSharedValue(0.94);

  // 1. Plane (SOL → SAĞ)
  const planeX = useSharedValue(offscreenLeft);
  const planeY = useSharedValue(-4);

  // 2. Train (SAĞ → SOL)
  const trainX = useSharedValue(offscreenRight);

  // 3. Bus (SOL → SAĞ)
  const busX = useSharedValue(offscreenLeft);
  const busY = useSharedValue(0);

  // 4. Bicycle (SAĞ → SOL)
  const bikeX = useSharedValue(offscreenRight);

  // Branding Entrance Fade-in
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(10);

  // CTA Transition Shared Values (Arrow -> Plane Morph & Flyout)
  const arrowScale = useSharedValue(1);
  const arrowOpacity = useSharedValue(1);

  const ctaPlaneScale = useSharedValue(0);
  const ctaPlaneOpacity = useSharedValue(0);
  const ctaPlaneX = useSharedValue(0);
  const ctaPlaneY = useSharedValue(0);
  const ctaPlaneRotate = useSharedValue(0);

  const ctaTextOpacity = useSharedValue(1);
  const wholeScreenOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Fixed Globe Soft Fade-in & Scale (0 - 700ms)
    globeOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
    globeScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });

    // 2. Individual Vehicle Routes
    planeX.value = withDelay(
      900,
      withTiming(offscreenRight, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
    );
    planeY.value = withDelay(
      900,
      withTiming(12, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
    );

    trainX.value = withDelay(
      1500,
      withTiming(offscreenLeft, { duration: 5500, easing: Easing.linear }),
    );

    busX.value = withDelay(
      2200,
      withTiming(offscreenRight, { duration: 6000, easing: Easing.inOut(Easing.quad) }),
    );
    busY.value = withDelay(
      2200,
      withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.quad) }, () => {
        busY.value = withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.quad) });
      }),
    );

    bikeX.value = withDelay(
      2900,
      withTiming(offscreenLeft, { duration: 6000, easing: Easing.linear }),
    );

    // 3. Branding Entrance Fade-in at ~1400ms
    brandOpacity.value = withDelay(1400, withTiming(1, { duration: 800 }));
    brandTranslateY.value = withDelay(
      1400,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }),
    );
  }, [
    globeOpacity,
    globeScale,
    planeX,
    planeY,
    trainX,
    busX,
    busY,
    bikeX,
    brandOpacity,
    brandTranslateY,
    offscreenLeft,
    offscreenRight,
  ]);

  // Handle "Yolculuğuna başla" CTA Press & Transition
  function handleStartJourney() {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    ctaTextOpacity.value = withTiming(0.65, { duration: 375 });
    arrowScale.value = withTiming(0.3, { duration: 270, easing: Easing.out(Easing.quad) });
    arrowOpacity.value = withTiming(0, { duration: 270 });

    ctaPlaneScale.value = withDelay(
      150,
      withTiming(1, { duration: 270, easing: Easing.out(Easing.back(1.2)) }),
    );
    ctaPlaneOpacity.value = withDelay(150, withTiming(1, { duration: 270 }));

    const targetX = windowWidth * 0.85;
    ctaPlaneX.value = withDelay(
      525,
      withTiming(targetX, { duration: 1125, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
    );
    ctaPlaneY.value = withDelay(
      525,
      withTiming(-14, { duration: 1125, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
    );
    ctaPlaneRotate.value = withDelay(
      525,
      withTiming(-8, { duration: 1125, easing: Easing.out(Easing.quad) }),
    );

    // 4. Whole screen fades out as airplane reaches ~75% width
    wholeScreenOpacity.value = withDelay(
      1050,
      withTiming(0, { duration: 480, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(go)('signin');
        }
      }),
    );
  }

  // Animated Styles
  const screenStyle = useAnimatedStyle(() => ({
    opacity: wholeScreenOpacity.value,
  }));

  const globeStyle = useAnimatedStyle(() => ({
    opacity: globeOpacity.value,
    transform: [{ scale: globeScale.value }],
  }));

  const planeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: planeX.value }, { translateY: planeY.value }],
  }));

  const trainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: trainX.value }],
  }));

  const busStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: busX.value }, { translateY: busY.value }],
  }));

  const bikeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bikeX.value }],
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));

  const ctaTextStyle = useAnimatedStyle(() => ({
    opacity: ctaTextOpacity.value,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
    transform: [{ scale: arrowScale.value }],
  }));

  const ctaPlaneStyle = useAnimatedStyle(() => ({
    opacity: ctaPlaneOpacity.value,
    transform: [
      { translateX: ctaPlaneX.value },
      { translateY: ctaPlaneY.value },
      { scale: ctaPlaneScale.value },
      { rotate: `${ctaPlaneRotate.value}deg` },
    ],
  }));

  return {
    screenStyle,
    globeStyle,
    planeStyle,
    trainStyle,
    busStyle,
    bikeStyle,
    brandStyle,
    ctaTextStyle,
    arrowStyle,
    ctaPlaneStyle,
    handleStartJourney,
  };
}
