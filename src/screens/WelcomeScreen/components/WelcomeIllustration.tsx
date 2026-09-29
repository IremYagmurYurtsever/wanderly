import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { PastelGlobeSvg, PastelCloudSvg, PastelBirdsSvg } from './GlobeGraphic';
import { PlaneGraphic, TrainGraphic, BusGraphic, BicycleGraphic } from './VehicleGraphic';
import type { useWelcomeAnimations } from '../useWelcomeAnimations';

type WelcomeIllustrationProps = Pick<
  ReturnType<typeof useWelcomeAnimations>,
  'globeStyle' | 'planeStyle' | 'trainStyle' | 'busStyle' | 'bikeStyle'
> & { illustrationHeight: number };

export function WelcomeIllustration({
  illustrationHeight,
  globeStyle,
  planeStyle,
  trainStyle,
  busStyle,
  bikeStyle,
}: WelcomeIllustrationProps) {
  return (
    <View
      style={{ height: illustrationHeight }}
      className="w-full items-center justify-center relative overflow-hidden"
    >
      {/* Soft Background Clouds */}
      <View className="absolute top-1 left-5">
        <PastelCloudSvg width={75} height={30} opacity={0.65} />
      </View>
      <View className="absolute top-8 right-6">
        <PastelCloudSvg width={90} height={35} opacity={0.75} />
      </View>
      <View className="absolute bottom-4 right-8">
        <PastelCloudSvg width={80} height={30} opacity={0.5} />
      </View>

      {/* Small Bird Line Art */}
      <View className="absolute top-16 right-16">
        <PastelBirdsSvg size={24} />
      </View>

      {/* Fixed Stationary Soft Pastel Globe */}
      <Animated.View style={globeStyle} className="items-center justify-center z-10">
        <PastelGlobeSvg size={245} color="#385B54" />
      </Animated.View>

      {/* ✈️ 1. UÇAK (SOL → SAĞ) */}
      <Animated.View style={planeStyle} className="absolute left-0 top-[6px] z-20">
        <PlaneGraphic size={44} color="#385B54" />
      </Animated.View>

      {/* 🚆 2. TREN (SAĞ → SOL) */}
      <Animated.View style={trainStyle} className="absolute left-0 top-[70px] z-20">
        <TrainGraphic size={40} color="#385B54" />
      </Animated.View>

      {/* 🚌 3. OTOBÜS (SOL → SAĞ) */}
      <Animated.View style={busStyle} className="absolute left-0 top-[142px] z-20">
        <BusGraphic size={40} color="#385B54" />
      </Animated.View>

      {/* 🚲 4. BİSİKLET (SAĞ → SOL) */}
      <Animated.View style={bikeStyle} className="absolute left-0 top-[198px] z-20">
        <BicycleGraphic size={36} color="#385B54" />
      </Animated.View>
    </View>
  );
}
