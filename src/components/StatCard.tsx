import { Text, View } from 'react-native';

export function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <View className="flex-1 items-center rounded-[14px] border border-[#EFEFE7] bg-[#FFFEFA] py-4">
      <Text className="font-garamond text-[35px] text-[#203E35]">{value}</Text>
      <Text className="font-manrope text-[9px] text-[#8B9389]">{label}</Text>
    </View>
  );
}
