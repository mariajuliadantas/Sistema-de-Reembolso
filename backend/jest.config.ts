// jest.config.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', 
    '!src/app.ts', 
    '!src/utils/prisma.ts', 
    '!src/types/**/*.ts', 
    '!src/schemas/**/*.ts', 
    '!src/middlewares/**/*.ts', 
    '!src/routes/**/*.ts', 
    '!src/tests/**/*.ts', 
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
};

export default config;