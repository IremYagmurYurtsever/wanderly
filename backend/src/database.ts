import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export function createDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString?.trim()) {
    throw new Error('backend/.env dosyasında DATABASE_URL ayarlanmalı.');
  }
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    max: 5,
  });
  return new PrismaClient({ adapter });
}
