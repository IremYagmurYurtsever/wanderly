import { createHash, randomBytes } from 'node:crypto';
import type { User } from '../generated/prisma/client.js';
import type { AuthRepository } from './repository.js';
import { dummyPasswordHash, hashPassword, verifyPassword } from './password.js';
import { AuthError, readCredentials } from './validation.js';

function publicUser(user: User) {
  return { id: user.id, email: user.email, name: user.name };
}

export function tokenDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createAuthService(repository: AuthRepository, now = () => new Date()) {
  function readToken(authorization: string | undefined) {
    const match = /^Bearer ([a-f0-9]{64})$/i.exec(authorization ?? '');
    if (!match) throw new AuthError(401, 'UNAUTHORIZED', 'Devam etmek için giriş yap.');
    return tokenDigest(match[1]);
  }
  return {
    async register(body: unknown) {
      const { email, name, password } = readCredentials(body, true);
      const passwordHash = await hashPassword(password);
      try {
        const user = await repository.createUser({ email, name, passwordHash });
        return { user: publicUser(user) };
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          throw new AuthError(409, 'EMAIL_IN_USE', 'Bu e-posta ile kayıtlı bir hesap var.');
        }
        throw error;
      }
    },
    async login(body: unknown) {
      const { email, password } = readCredentials(body);
      const user = await repository.findUser(email);
      const valid = await verifyPassword(password, user?.passwordHash ?? dummyPasswordHash);
      if (!user || !valid)
        throw new AuthError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.');
      const token = randomBytes(32).toString('hex');
      const issuedAt = now();
      const expiresAt = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      await repository.createSession(
        user.id,
        tokenDigest(token),
        expiresAt,
        issuedAt,
        user.passwordHash,
      );
      return { user: publicUser(user), token, expiresAt: expiresAt.toISOString() };
    },
    async me(authorization: string | undefined) {
      const user = await repository.sessionUser(readToken(authorization), now());
      if (!user) throw new AuthError(401, 'UNAUTHORIZED', 'Oturumun sona erdi. Yeniden giriş yap.');
      return { user: publicUser(user) };
    },
    async logout(authorization: string | undefined) {
      await repository.revokeSession(readToken(authorization));
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
