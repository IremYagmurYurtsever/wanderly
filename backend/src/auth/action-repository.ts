import type { ActionKind, PrismaClient, User } from '../generated/prisma/client.js';

export interface ActionRepository {
  findUser(email: string): Promise<User | null>;
  issue(data: {
    userId: string;
    kind: ActionKind;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }): Promise<boolean>;
  consume(tokenHash: string, kind: ActionKind, now: Date, passwordHash?: string): Promise<boolean>;
}

export function createActionRepository(database: PrismaClient): ActionRepository {
  return {
    findUser: (email) => database.user.findUnique({ where: { email } }),
    issue: (data) =>
      database.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM users WHERE id = ${data.userId}::uuid FOR UPDATE`;
        const recent = await transaction.actionToken.findFirst({
          where: {
            userId: data.userId,
            kind: data.kind,
            createdAt: { gt: new Date(data.createdAt.getTime() - 60000) },
          },
        });
        if (recent) return false;
        await transaction.actionToken.deleteMany({
          where: { userId: data.userId, kind: data.kind },
        });
        await transaction.actionToken.create({ data });
        return true;
      }),
    consume: (tokenHash, kind, now, passwordHash) =>
      database.$transaction(async (transaction) => {
        const action = await transaction.actionToken.findUnique({ where: { tokenHash } });
        if (!action || action.kind !== kind || action.expiresAt <= now) return false;
        await transaction.$queryRaw`SELECT id FROM users WHERE id = ${action.userId}::uuid FOR UPDATE`;
        const consumed = await transaction.actionToken.deleteMany({
          where: { id: action.id, kind, expiresAt: { gt: now } },
        });
        if (consumed.count !== 1) return false;
        if (!passwordHash) throw new Error('Parola özeti eksik.');
        await transaction.user.update({ where: { id: action.userId }, data: { passwordHash } });
        await transaction.session.deleteMany({ where: { userId: action.userId } });
        await transaction.actionToken.deleteMany({ where: { userId: action.userId, kind } });
        return true;
      }),
  };
}
