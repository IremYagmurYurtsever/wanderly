import { randomBytes } from 'node:crypto';
import type { ActionKind, User } from '../generated/prisma/client.js';
import type { ActionRepository } from './action-repository.js';
import type { ActionDelivery } from './delivery.js';
import { tokenDigest } from './service.js';
import { hashPassword } from './password.js';
import { AuthError } from './validation.js';

export const demoActionMessage =
  'Demo modu: E-posta gönderilmedi. Uygun bir hesap varsa bağlantı backend terminalinde gösterilir. Tekrar istemek için en az 1 dakika bekle.';

export function readActionToken(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new AuthError(
      400,
      'INVALID_ACTION',
      'Bağlantı geçersiz veya süresi dolmuş. Yeni bağlantı iste.',
    );
  }
  return value;
}

export function createActionService(
  repository: ActionRepository,
  delivery: ActionDelivery,
  baseUrl: string,
  now = () => new Date(),
) {
  async function issue(user: User, kind: ActionKind) {
    const token = randomBytes(32).toString('hex');
    const createdAt = now();
    const expiresAt = new Date(createdAt.getTime() + 30 * 60000);
    if (
      await repository.issue({
        userId: user.id,
        kind,
        tokenHash: tokenDigest(token),
        createdAt,
        expiresAt,
      })
    ) {
      await delivery.send({
        email: user.email,
        kind,
        link: `${baseUrl}/account/reset?token=${token}`,
      });
    }
    return { message: demoActionMessage, delivery: 'demo' };
  }
  return {
    async requestReset(body: unknown) {
      const email =
        body && typeof body === 'object' && 'email' in body && typeof body.email === 'string'
          ? body.email.trim().toLowerCase()
          : '';
      if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new AuthError(400, 'INVALID_EMAIL', 'Geçerli bir e-posta adresi gir.');
      const user = await repository.findUser(email);
      if (user) return issue(user, 'RESET_PASSWORD');
      return { message: demoActionMessage, delivery: 'demo' };
    },
    async reset(value: unknown, password: unknown) {
      const token = readActionToken(value);
      if (typeof password !== 'string' || password.length < 8 || password.length > 128)
        throw new AuthError(400, 'INVALID_PASSWORD', 'Şifren 8–128 karakter arasında olmalı.');
      const passwordHash = await hashPassword(password);
      if (!(await repository.consume(tokenDigest(token), 'RESET_PASSWORD', now(), passwordHash)))
        throw new AuthError(
          400,
          'INVALID_ACTION',
          'Bağlantı kullanılmış veya süresi dolmuş. Yeni bağlantı iste.',
        );
      return {
        message:
          'Şifren yenilendi ve eski oturumların kapatıldı. Yeni şifrenle giriş yapabilirsin.',
      };
    },
  };
}

export type ActionService = ReturnType<typeof createActionService>;
