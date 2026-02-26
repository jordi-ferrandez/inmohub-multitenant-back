/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@generated/(.*)$': '<rootDir>/src/generated/$1'
  },
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
};
