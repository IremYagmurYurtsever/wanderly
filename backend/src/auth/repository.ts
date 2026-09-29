import type { PrismaClient, User } from '../generated/prisma/client.js';
import { AuthError } from './validation.js';

export interface AuthRepository {
  createUser(data: { email: string; name: string; passwordHash: string }): Promise<User>;
  findUser(email: string): Promise<User | null>;
  createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    now: Date,
    passwordHash: string,
  ): Promise<void>;
  sessionUser(tokenHash: string, now: Date): Promise<User | null>;
  revokeSession(tokenHash: string): Promise<void>;
}

export function createAuthRepository(database: PrismaClient): AuthRepository {
  return {
    createUser: (data) => database.user.create({ data }),
    findUser: (email) => database.user.findUnique({ where: { email } }),
    async createSession(userId, tokenHash, expiresAt, now, passwordHash) {
      await database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
        const user = await transaction.user.findUnique({ where: { id: userId } });
        if (!user || user.passwordHash !== passwordHash)
          throw new AuthError(401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.');
        await transaction.session.deleteMany({ where: { userId, expiresAt: { lte: now } } });
        await transaction.session.create({ data: { userId, tokenHash, expiresAt } });
      });
    },
    async sessionUser(tokenHash, now) {
      const session = await database.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      return session && session.expiresAt > now ? session.user : null;
    },
    async revokeSession(tokenHash) {
      await database.session.deleteMany({ where: { tokenHash } });
    },
  };
}
