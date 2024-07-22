export default {
  testMatch: ['**/*.test.(t|j)s(x)?'], // testMatch: ['<rootDir>/packages/*/test/**/*.test.(t|j)s(x)?'],
  modulePathIgnorePatterns: ['<rootDir>/packages/.+/compiled', '<rootDir>/packages/.+/fixtures'],
  transformIgnorePatterns: ['/node_modules/', '/compiled/'],
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx}',
    '!**/examples/**/*.{js,jsx,ts,tsx}',
    '!**/compiled/**/*.{js,jsx}',
    '!**/fixtures/**/*.*'
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/config/', // in case of config.test.ts
    '<rootDir>/mock/',
    '<rootDir>/.ddnrc.test.ts'
  ],
  transform: {
    '^.+\\.(t|j)sx?$': 'esbuild-jest'
  },
  moduleNameMapper: {
    '^.+\\.(css|less|sass|scss|stylus)$': require.resolve('identity-obj-proxy')
  },
  testTimeout: 30000
}
