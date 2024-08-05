import Mnemonic from 'bitcore-mnemonic'

/**
 * 生成助记词
 * @param {*} ent 该参数可以是 语言词汇表，比如：Mnemonic.Words.ENGLISH(默认)，可以是位数，128 ~ 256 并 ent % 32 == 0
 */
function generateSecret (ent) {
  const param = ent || Mnemonic.Words.ENGLISH
  return new Mnemonic(param).toString()
}

// ddn-cli 使用
function isValidSecret (secret) {
  return Mnemonic.isValid(secret)
}

export { Mnemonic, generateSecret, isValidSecret }
