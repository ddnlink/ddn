import { generateSecret, isValidSecret } from '../src/secret.js'
// import crypto from 'crypto'

// crypto.getRandomValues = crypto.randomBytes

describe('generateSecret', () => {
  it('should generate a secret with default parameters', () => {
    const secret = generateSecret()
    expect(secret).toBeDefined()
    expect(isValidSecret(secret)).toBeTruthy()
  })

  it('should generate a secret with specific entropy', () => {
    const secret = generateSecret(128)
    console.log('secret: ', secret);

    expect(secret).toBeDefined()
    expect(isValidSecret(secret)).toBeTruthy()
  })

  // it('should generate a secret with specific language', () => {
  //   const secret = generateSecret(Mnemonic.Words.ENGLISH)
  //   expect(secret).toBeDefined()
  //   expect(isValidSecret(secret)).toBeTruthy()
  // })
})

describe('isValidSecret', () => {
  it('should return true for valid secret', () => {
    const secret = generateSecret()
    expect(isValidSecret(secret)).toBeTruthy()
  })

  it('should return false for invalid secret', () => {
    expect(isValidSecret('invalid secret')).toBeFalsy()
  })
})