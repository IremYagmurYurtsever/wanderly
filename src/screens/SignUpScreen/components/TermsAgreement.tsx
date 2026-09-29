import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { Notice } from '../../../types';

type TermsAgreementProps = {
  agreed: boolean;
  setAgreed: (value: boolean) => void;
  setNotice: (notice: Notice) => void;
};

export function TermsAgreement({ agreed, setAgreed, setNotice }: TermsAgreementProps) {
  return (
    <View className="flex-row items-center gap-2 mb-[21px]">
      <Pressable
        onPress={() => setAgreed(!agreed)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        accessibilityLabel="Kullanım koşullarını ve gizlilik politikasını kabul ediyorum"
        hitSlop={10}
        className={`w-[15px] h-[15px] rounded border border-brandGreen items-center justify-center ${agreed ? 'bg-ink' : ''}`}
      >
        {agreed && <Feather name="check" size={12} color="white" />}
      </Pressable>
      <Text className="flex-1 font-manrope text-muted text-[10px] leading-[18px]">
        <Text
          className="underline"
          onPress={() =>
            setNotice({
              title: 'Kullanım Koşulları',
              body: 'Wanderly bir sunum projesidir. Hesabın, profilin, kaydettiğin geziler, günlük ve favorilerin proje sunucusundaki PostgreSQL veritabanında saklanır. E-posta doğrulaması yoktur. Demo şifre sıfırlama bağlantısı yalnızca backend terminalinde gösterilir; e-posta gönderilmez. Öneriler ve rezervasyon bilgileri örnektir. Satın alma yapılmaz.',
            })
          }
        >
          Kullanım Koşulları
        </Text>{' '}
        ve{' '}
        <Text
          className="underline"
          onPress={() =>
            setNotice({
              title: 'Gizlilik Politikası',
              body: 'Hesap bilgilerin proje backend’ine gönderilir; şifren PostgreSQL’de düz metin yerine güvenli özet olarak tutulur. Telefonda oturum anahtarı güvenli cihaz depolamasında, web’de yalnızca bellekte saklanır. Profil, gezi, günlük ve favoriler sunucuda hesabına özel tutulur; form taslakları cihazda kalır. Yerel sunumda bağlantı HTTP olabilir: yalnızca sahte test bilgileri ve başka yerde kullanmadığın bir şifre kullan. Hesap silme talebi için proje yöneticisine başvurabilirsin.',
            })
          }
        >
          Gizlilik Politikası
        </Text>
        ’nı kabul ediyorum.
      </Text>
    </View>
  );
}
