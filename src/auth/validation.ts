export function validateCredentials(
  email: string,
  password: string,
  signup: boolean,
  name = '',
  agreed = false,
) {
  if (signup && (name.trim().length < 2 || name.trim().length > 100))
    return 'Adın 2–100 karakter arasında olmalı.';
  if (!validEmail(email)) return 'Lütfen geçerli bir e-posta adresi gir.';
  if (!password) return 'Lütfen şifreni gir.';
  if (password.length > 128) return 'Şifren en fazla 128 karakter olabilir.';
  if (signup && password.length < 8) return 'Şifren en az 8 karakter olmalı.';
  if (signup && !agreed) return 'Devam etmek için uygulama bilgilerini okuyup onayla.';
  return '';
}

export function validEmail(email: string) {
  return email.trim().length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function authErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: 'E-posta veya şifre hatalı. Lütfen tekrar dene.',
    INVALID_EMAIL: 'Geçerli bir e-posta adresi gir.',
    INVALID_PASSWORD: 'Şifren 8–128 karakter arasında olmalı.',
    INVALID_NAME: 'Adın 2–100 karakter arasında olmalı.',
    CONSENT_REQUIRED: 'Uygulama bilgilerini okuyup onayla.',
    EMAIL_IN_USE:
      'Bu e-posta ile kayıtlı bir hesap var. Giriş yapabilir veya şifreni sıfırlayabilirsin.',
    UNAUTHORIZED: 'Oturumun sona erdi. Yeniden giriş yap.',
    RATE_LIMITED: 'Çok fazla deneme yapıldı. 15 dakika sonra tekrar dene.',
    NETWORK_ERROR:
      'Backend’e ulaşılamadı. Bilgisayarda sunucunun açık olduğunu ve aynı Wi-Fi ağına bağlı olduğunu kontrol et.',
    TIMEOUT: 'Sunucu yanıt vermedi. Bağlantını kontrol edip yeniden dene.',
    API_CONFIG: 'Backend adresi ayarlanmamış. EXPO_PUBLIC_API_URL ayarını kontrol et.',
    INVALID_RESPONSE: 'Sunucudan beklenmeyen yanıt geldi. Backend adresini kontrol et.',
    STORAGE_ERROR: 'Oturum güvenli depolamaya kaydedilemedi. Yeniden dene.',
    SERVER_ERROR: 'Sunucu işlemi tamamlayamadı. Backend’in çalıştığını kontrol edip yeniden dene.',
  };
  return messages[code] || 'İşlem tamamlanamadı. Lütfen tekrar dene.';
}
