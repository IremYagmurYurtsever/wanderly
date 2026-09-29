import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { palette } from '../theme/tokens';

type AppModalProps = {
  visible?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
};

export function AppModal({
  visible = true,
  title,
  onClose,
  children,
  footer,
  busy = false,
}: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <SafeAreaView className="flex-1 bg-[#183D3866]">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 items-center justify-center p-6"
        >
          <View
            className="max-h-full w-full max-w-[420px] flex-shrink rounded-[24px] bg-[#F8F7F2] p-6"
            accessibilityViewIsModal
          >
            <View className="flex-row items-center gap-2 pb-4">
              <Text
                accessibilityRole="header"
                className="flex-1 font-garamond text-[29px] text-[#203E35]"
              >
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pencereyi kapat"
                disabled={busy}
                onPress={onClose}
                className="h-11 w-11 items-center justify-center"
              >
                <Feather name="x" size={20} color={palette.ink} />
              </Pressable>
            </View>
            <ScrollView
              className="flex-shrink"
              contentContainerClassName="pb-4"
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {footer && <View className="pt-2">{footer}</View>}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
