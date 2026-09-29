export class AuthError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function readCredentials(body: unknown, signup = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AuthError(400, 'INVALID_INPUT', 'Geçerli hesap bilgileri gönder.');
  }
  const input = body as Record<string, unknown>;
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError(400, 'INVALID_EMAIL', 'Geçerli bir e-posta adresi gir.');
  }
  if (password.length < (signup ? 8 : 1) || password.length > 128) {
    throw new AuthError(
      400,
      'INVALID_PASSWORD',
      signup ? 'Şifren 8–128 karakter arasında olmalı.' : 'Geçerli bir şifre gir.',
    );
  }
  if (signup && (name.length < 2 || name.length > 100)) {
    throw new AuthError(400, 'INVALID_NAME', 'Adın 2–100 karakter arasında olmalı.');
  }
  if (signup && input.agreed !== true) {
    throw new AuthError(
      400,
      'CONSENT_REQUIRED',
      'Devam etmek için uygulama bilgilerini okuyup onayla.',
    );
  }
  return { email, password, name };
}
