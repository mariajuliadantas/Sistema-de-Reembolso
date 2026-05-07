// src/tests/setup.ts
import { execSync } from 'child_process';
import { resolve } from 'path';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: resolve(__dirname, '../../.env.test'), override: true });
jest.setTimeout(30000);

async function cleanDatabase() {
  await prisma.attachment.deleteMany();
  await prisma.reimbursementHistory.deleteMany();
  await prisma.reimbursement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
}

async function seedDatabase() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.createMany({
    data: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Admin Test',
        email: 'admin@test.com',
        passwordHash,
        role: 'ADMIN',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Collaborator Test',
        email: 'collaborator@test.com',
        passwordHash,
        role: 'COLLABORATOR',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Manager Test',
        email: 'manager@test.com',
        passwordHash,
        role: 'MANAGER',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Financial Test',
        email: 'financial@test.com',
        passwordHash,
        role: 'FINANCIAL',
      }
    ]
  });

  await prisma.category.createMany({
    data: [
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Alimentação',
        active: true,
        maxAmount: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Transporte',
        active: true,
        maxAmount: 300,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'Inativa',
        active: false,
        maxAmount: null,
      }
    ]
  });
}

beforeAll(async () => {
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || 'file:./test.db',
      },
    });
  } catch (error) {
    console.error('Failed to apply Prisma migrations:', error);
    process.exit(1);
  }

  await cleanDatabase();
  await seedDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
  await seedDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});