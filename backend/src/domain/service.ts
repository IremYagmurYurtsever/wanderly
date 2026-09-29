import type { PrismaClient } from '../generated/prisma/client.js';
import { AuthError } from '../auth/validation.js';
import { readCredentials } from '../auth/validation.js';
import { verifyPassword } from '../auth/password.js';
import {
  object,
  text,
  uuid,
  boolean,
  profileInput,
  tripInput,
  memoryInput,
  visaInput,
} from './validation.js';

const profileFields = {
  name: true,
  bio: true,
  email: true,
  phone: true,
  avatarDataUrl: true,
  preferences: true,
  currency: true,
  updatedAt: true,
} as const;
const missing = () => new AuthError(404, 'NOT_FOUND', 'Kayıt bulunamadı.');

export function createDomainService(prisma: PrismaClient) {
  return {
    async getProfile(userId: string) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: profileFields });
      if (!user) throw new AuthError(401, 'UNAUTHORIZED', 'Yeniden giriş yap.');
      return { ...user, bio: user.bio ?? '' };
    },
    async updateProfile(userId: string, value: unknown) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: profileInput(value),
        select: profileFields,
      });
      return { ...user, bio: user.bio ?? '' };
    },
    async changeEmail(userId: string, value: unknown) {
      const data = object(value);
      const { email, password } = readCredentials({ email: data.email, password: data.password });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });
      if (!user || !(await verifyPassword(password, user.passwordHash)))
        throw new AuthError(401, 'INVALID_CREDENTIALS', 'Mevcut şifren hatalı.');
      try {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { email },
          select: profileFields,
        });
        return { ...updated, bio: updated.bio ?? '' };
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002')
          throw new AuthError(409, 'EMAIL_IN_USE', 'Bu e-posta ile kayıtlı bir hesap var.');
        throw error;
      }
    },
    getVisas(userId: string) {
      return prisma.visa.findMany({
        where: { userId },
        orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }],
      });
    },
    createVisa(userId: string, value: unknown) {
      return prisma.visa.create({ data: { userId, ...visaInput(value) } });
    },
    async updateVisa(userId: string, id: string, value: unknown) {
      const visaId = uuid(id);
      const result = await prisma.visa.updateMany({
        where: { id: visaId, userId },
        data: visaInput(value),
      });
      if (!result.count) throw missing();
      return prisma.visa.findUniqueOrThrow({ where: { id: visaId } });
    },
    async deleteVisa(userId: string, id: string) {
      const result = await prisma.visa.deleteMany({ where: { id: uuid(id), userId } });
      if (!result.count) throw missing();
      return { success: true };
    },
    getTrips(userId: string) {
      return prisma.trip.findMany({
        where: { userId },
        include: { stops: true },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
    },
    createTrip(userId: string, value: unknown) {
      const { stops, ...trip } = tripInput(value);
      return prisma.trip.create({
        data: { userId, ...trip, ...(stops?.length && { stops: { create: stops } }) },
        include: { stops: true },
      });
    },
    async updateTrip(userId: string, id: string, value: unknown) {
      const tripId = uuid(id);
      const { stops, ...trip } = tripInput(value);
      return prisma.$transaction(async (transaction) => {
        const result = await transaction.trip.updateMany({
          where: { id: tripId, userId },
          data: trip,
        });
        if (!result.count) throw missing();
        if (stops !== undefined) {
          await transaction.tripStop.deleteMany({ where: { tripId } });
          if (stops.length)
            await transaction.tripStop.createMany({
              data: stops.map((stop) => ({ tripId, ...stop })),
            });
        }
        return transaction.trip.findUniqueOrThrow({
          where: { id: tripId },
          include: { stops: true },
        });
      });
    },
    async deleteTrip(userId: string, id: string) {
      const result = await prisma.trip.deleteMany({ where: { id: uuid(id), userId } });
      if (!result.count) throw missing();
      return { success: true };
    },
    getMemories(userId: string) {
      return prisma.memory.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
    },
    async createMemory(userId: string, value: unknown) {
      const data = object(value);
      const input = memoryInput(data);
      const tripId = input.tripId ?? null;
      const isFavorite = data.isFavorite === undefined ? false : boolean(data.isFavorite);
      return prisma.$transaction(async (transaction) => {
        if (tripId) {
          const trips = await transaction.$queryRaw<
            { id: string }[]
          >`SELECT id FROM trips WHERE id = ${tripId}::uuid AND user_id = ${userId}::uuid FOR SHARE`;
          if (!trips.length) throw missing();
        }
        return transaction.memory.create({ data: { userId, ...input, tripId, isFavorite } });
      });
    },
    async updateMemory(userId: string, id: string, value: unknown) {
      const input = memoryInput(value);
      return prisma.$transaction(async (transaction) => {
        if (input.tripId) {
          const trips = await transaction.$queryRaw<
            { id: string }[]
          >`SELECT id FROM trips WHERE id = ${input.tripId}::uuid AND user_id = ${userId}::uuid FOR SHARE`;
          if (!trips.length) throw missing();
        }
        const result = await transaction.memory.updateMany({
          where: { id: uuid(id), userId },
          data: input,
        });
        if (!result.count) throw missing();
        return { success: true };
      });
    },
    async deleteMemory(userId: string, id: string) {
      const result = await prisma.memory.deleteMany({ where: { id: uuid(id), userId } });
      if (!result.count) throw missing();
      return { success: true };
    },
    async getFavorites(userId: string) {
      const [user, memories] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { journalFavorites: true } }),
        prisma.memory.findMany({ where: { userId, isFavorite: true }, select: { id: true } }),
      ]);
      return [
        ...(user?.journalFavorites ?? []),
        ...memories.map((memory) => `personal-${memory.id}`),
      ];
    },
    async setFavorite(userId: string, value: unknown) {
      const data = object(value);
      const entryId = text(data.entryId, 'Anı kimliği', 100);
      const selected = boolean(data.selected);
      if (entryId.startsWith('personal-')) {
        const result = await prisma.memory.updateMany({
          where: { id: uuid(entryId.slice(9)), userId },
          data: { isFavorite: selected },
        });
        if (!result.count) throw missing();
      } else {
        await prisma.$transaction(async (transaction) => {
          await transaction.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
          const user = await transaction.user.findUniqueOrThrow({
            where: { id: userId },
            select: { journalFavorites: true },
          });
          const next = user.journalFavorites.filter((id) => id !== entryId);
          if (selected) next.push(entryId);
          if (next.length > 1000)
            throw new AuthError(400, 'LIMIT_REACHED', 'Favori sınırına ulaştın.');
          await transaction.user.update({
            where: { id: userId },
            data: { journalFavorites: next },
          });
        });
      }
      return { success: true };
    },
    async getSavedPlaces(userId: string) {
      const saved = await prisma.savedPlace.findMany({
        where: { userId },
        select: { placeId: true },
      });
      return saved.map((place) => place.placeId);
    },
    async setSavedPlace(userId: string, value: unknown) {
      const data = object(value);
      const placeId = text(data.placeId, 'Mekan kimliği', 512);
      const selected = boolean(data.selected);
      if (selected)
        await prisma.savedPlace.createMany({ data: [{ userId, placeId }], skipDuplicates: true });
      else await prisma.savedPlace.deleteMany({ where: { userId, placeId } });
      return { saved: selected, placeId };
    },
  };
}
export type DomainService = ReturnType<typeof createDomainService>;
