import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL?.replace('file:', '') || './dev.db' });
export const prisma = new PrismaClient({ adapter });
