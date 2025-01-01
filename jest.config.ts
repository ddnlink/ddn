export default {
  bail: 1,
  verbose: true,
  testMatch: ['<rootDir>/**/*/test/**/*.test.(t|j)s(x)?', '<rootDir>/**/*/tests/**/*.test.(t|j)s(x)?'],
  modulePathIgnorePatterns: ['<rootDir>/packages/.+/compiled', '<rootDir>/packages/.+/fixtures'],
  transformIgnorePatterns: ['/node_modules/', '/compiled/'],
  collectCoverageFrom: [
    '**/*/node_modules/(?!(@ddn)/)',
    '**/src/**/*.{ts,tsx}',
    '!**/examples/**/*.{js,jsx,ts,tsx}',
    '!**/compiled/**/*.{js,jsx}',
    '!**/fixtures/**/*.*'
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/config/', // in case of config.test.ts
    '<rootDir>/mock/'
  ],
  transform: {
    '^.+\\.(t|j)sx?$': 'jest-esm-transformer'
  },
  moduleNameMapper: {
    '^.+\\.(css|less|sass|scss|stylus)$': require.resolve('identity-obj-proxy')
  },
  testTimeout: 30000
}
