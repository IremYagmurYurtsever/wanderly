import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { palette } from '../theme/tokens';

type ScreenHeaderProps = {
  name: string;
  onSearch: () => void;
  onProfile?: () => void;
  searchOpen?: boolean;
  searchLabel?: string;
  floating?: boolean;
};

export function ScreenHeader({
  name,
  onSearch,
  onProfile,
  searchOpen = false,
  searchLabel = 'Ara',
  floating = false,
}: ScreenHeaderProps) {
  const initial = name.trim().charAt(0).toLocaleUpperCase('tr-TR') || 'Y';
  return (
    <View
      className={`flex-row items-center justify-between gap-2 border-b border-b-[#E7E8DF] py-2 ${floating ? 'rounded-[30px] border border-[#FFFFFF75] bg-[#F8F9F1E8] pl-4 pr-1' : ''}`}
    >
      <View className="flex-shrink flex-row flex-wrap items-center gap-2">
        <Text className="font-garamond text-[27px] text-[#203E35]">Wanderly</Text>
      </View>
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? 'Aramayı kapat' : searchLabel}
          onPress={onSearch}
          className="h-11 w-10 items-center justify-center"
        >
          <Feather name={searchOpen ? 'x' : 'search'} size={16} color={palette.muted} />
        </Pressable>
        {onProfile ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profilim"
            onPress={onProfile}
            className="h-11 w-10 items-center justify-center"
          >
            <View className="h-[29px] w-[29px] items-center justify-center rounded-[15px] bg-[#DDE1CE]">
              <Text className="font-manrope text-[10px] text-[#203E35]">{initial}</Text>
            </View>
          </Pressable>
        ) : (
          <View className="h-[29px] w-[29px] items-center justify-center rounded-[15px] bg-[#DDE1CE]">
            <Text className="font-manrope text-[10px] text-[#203E35]">{initial}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
