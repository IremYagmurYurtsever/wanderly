import { Pressable, Text } from 'react-native';
import { AppModal } from './AppModal';
import type { Notice } from '../types';

type NoticeModalProps = { notice: Notice | null; onClose: () => void };

export function NoticeModal({ notice, onClose }: NoticeModalProps) {
  return (
    <AppModal
      visible={!!notice}
      title={notice?.title || ''}
      onClose={onClose}
      footer={
        <Pressable
          accessibilityRole="button"
          className="bg-brandGreen rounded-[11px] min-h-[49px] px-5 items-center justify-center"
          onPress={onClose}
        >
          <Text className="font-manrope-semibold text-[13px] text-white">Tamam</Text>
        </Pressable>
      }
    >
      <Text className="font-manrope text-[13px] leading-[23px] text-[#778078] mt-3 mb-[23px]">
        {notice?.body}
      </Text>
    </AppModal>
  );
}
