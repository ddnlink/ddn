import { generateSecret, isValidSecret } from '../../../dist/crypto/'
import Debug from 'debug'
const debug = Debug('debug')

describe('Secret Functions', () => {
  describe('generateSecret', () => {
    it('should generate a valid mnemonic with default strength', () => {
      debug('Generating mnemonic with default strength (128 bits)')
      const mnemonic = generateSecret()
      debug('Generated mnemonic:', mnemonic)
      expect(mnemonic.split(' ').length).toBe(12)
      expect(isValidSecret(mnemonic)).toBe(true)
    })

    it('should generate a valid mnemonic with 128 strength', () => {
      debug('Generating mnemonic with 128 bits strength')
      const mnemonic = generateSecret(128)
      debug('Generated mnemonic:', mnemonic)
      expect(mnemonic.split(' ').length).toBe(12)
      expect(isValidSecret(mnemonic)).toBe(true)
    })

    it('should generate a valid mnemonic with 256 strength', () => {
      debug('Generating mnemonic with 256 bits strength')
      const mnemonic = generateSecret(256)
      debug('Generated mnemonic:', mnemonic)
      expect(mnemonic.split(' ').length).toBe(24)
      expect(isValidSecret(mnemonic)).toBe(true)
    })
  })

  describe('isValidSecret', () => {
    const validMnemonic = 'legal winner thank year wave sausage worth useful legal winner thank yellow'
    const invalidMnemonic = 'this is not a valid mnemonic phrase'

    it('should return true for valid mnemonic', () => {
      debug('Testing valid mnemonic:', validMnemonic)
      const result = isValidSecret(validMnemonic)
      debug('Validation result:', result)
      expect(result).toBe(true)
    })

    it('should return false for invalid mnemonic', () => {
      debug('Testing invalid mnemonic:', invalidMnemonic)
      const result = isValidSecret(invalidMnemonic)
      debug('Validation result:', result)
      expect(result).toBe(false)
    })

    it('should return false for empty string', () => {
      debug('Testing empty string')
      const result = isValidSecret('')
      debug('Validation result:', result)
      expect(result).toBe(false)
    })
  })
})