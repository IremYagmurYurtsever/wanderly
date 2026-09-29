import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';

export function Field({
  label,
  value,
  onChange,
  password,
  onForgot,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  password?: boolean;
  onForgot?: () => void;
} & Omit<React.ComponentProps<typeof TextInput>, 'onChange'>) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-[17px]">
      <View className="flex-row justify-between mb-2 px-[2px]">
        <Text className="font-manrope text-[10px] text-[#7D898C] tracking-[0.4px]">{label}</Text>
        {onForgot && (
          <Pressable accessibilityRole="button" onPress={onForgot} hitSlop={10}>
            <Text className="font-manrope text-[11px] text-coral">Şifremi unuttum</Text>
          </Pressable>
        )}
      </View>
      <View
        className={`flex-row items-center border ${focused ? 'border-brandGreen' : 'border-line'} bg-white rounded-xl min-h-[51px]`}
      >
        <TextInput
          {...props}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          secureTextEntry={password && !visible}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor="#A8ABA4"
          className="flex-1 min-w-0 px-4 py-[15px] font-manrope text-[12px] text-ink"
          selectionColor={colors.green}
        />
        {password && (
          <Pressable
            onPress={() => setVisible(!visible)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            className="p-[15px]"
          >
            <Feather name={visible ? 'eye-off' : 'eye'} size={17} color="#ADB2AA" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
