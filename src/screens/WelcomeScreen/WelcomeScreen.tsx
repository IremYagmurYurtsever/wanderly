import { useWindowDimensions, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useWelcomeAnimations } from './useWelcomeAnimations';
import Feather from '@expo/vector-icons/Feather';
import type { Screen } from '../../types';
import { colors } from '../../theme/colors';
import { PlaneGraphic } from './components/VehicleGraphic';
import { WelcomeIllustration } from './components/WelcomeIllustration';

export function WelcomeScreen({ go }: { go: (screen: Screen) => void }) {
  const { height: windowHeight } = useWindowDimensions();
  const {
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
  } = useWelcomeAnimations(go);

  // Responsive percentage calculations for height
  const illustrationHeight = Math.min(265, windowHeight * 0.36);
  const gapGlobeToWanderly = Math.max(48, Math.min(75, windowHeight * 0.08));

  return (
    <Animated.View style={screenStyle} className="flex-1 bg-[#F8F6F0]">
      <SafeAreaView className="flex-1 justify-between items-center px-4 pt-1 pb-3">
        {/* 1. HEADER SECTION (~6% Screen Height) */}
        <View className="flex-row items-center gap-2 border border-[#EFEBE3] rounded-full px-[15px] py-[6px] bg-[#FAF8F4]/80 mt-2">
          <View className="w-[4px] h-[4px] rounded-full bg-coral" />
          <Text className="font-manrope-semibold text-[#A5A295] text-[8.5px] tracking-[2px]">
            ATÖLYE & YOLCULUKLAR
          </Text>
        </View>

        {/* MAIN BODY WRAPPER (Illustration + Branding) */}
        <View className="w-full max-w-[440px] items-center justify-center my-auto">
          {/* 2. ILLUSTRATION SECTION (Globe Center at ~36% Screen Height) */}
          <WelcomeIllustration
            {...{ illustrationHeight, globeStyle, planeStyle, trainStyle, busStyle, bikeStyle }}
          />

          {/* 3. BRANDING SECTION (Wanderly at ~58% Screen Height, Gap ~55-70px from Globe) */}
          <Animated.View
            style={[brandStyle, { marginTop: gapGlobeToWanderly }]}
            className="items-center w-full px-4"
          >
            <Pressable
              className="items-center w-full"
              onPress={handleStartJourney}
              accessibilityRole="button"
              accessibilityLabel="Yolculuğuna başla"
            >
              <Text className="font-garamond text-[52px] text-ink tracking-[-1.5px] text-center leading-[54px]">
                Wanderly
              </Text>

              {/* Compact Sub-elements with controlled spacing */}
              <View className="flex-row items-center w-[160px] gap-[11px] mt-[14px] mb-[18px]">
                <View className="flex-1 h-[1px] bg-line" />
                <View className="w-[4px] h-[4px] border border-coral rotate-45" />
                <View className="flex-1 h-[1px] bg-line" />
              </View>

              <Text className="font-manrope-semibold text-[9.5px] tracking-[2.6px] text-ink text-center mb-[24px]">
                PLANLA <Text className="text-coral"> · </Text> KEŞFET{' '}
                <Text className="text-coral"> · </Text> HATIRLA
              </Text>

              {/* Animated CTA Button (Ok -> Airplane Morph + Flight + Fade-Out) */}
              <View className="flex-row items-center gap-[9px] min-h-[24px] relative">
                <Animated.Text
                  style={ctaTextStyle}
                  className="font-manrope-semibold text-[13.5px] text-brandGreen"
                >
                  Yolculuğa başla
                </Animated.Text>

                {/* Static Arrow / Morph Target Container */}
                <View className="w-5 h-5 items-center justify-center relative">
                  <Animated.View className="absolute" style={arrowStyle}>
                    <Feather name="arrow-right" size={13} color={colors.green} />
                  </Animated.View>

                  <Animated.View className="absolute" style={ctaPlaneStyle}>
                    <PlaneGraphic size={18} color={colors.green} />
                  </Animated.View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* 4. FOOTER SECTION (~92% Screen Height, above bottom safe area with ~30px spacing) */}
        <Text className="font-manrope text-[7.5px] tracking-[1.8px] text-[#969184] text-center mb-4">
          KİŞİSEL SEYAHAT GÜNLÜĞÜ
        </Text>
      </SafeAreaView>
    </Animated.View>
  );
}
