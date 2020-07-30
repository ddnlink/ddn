import bignum from './bignumber'

export function calculateFee (trs) {
  const feeBase = '0'
  const fixedPoint = '100000000'
  return bignum.multiply(feeBase, fixedPoint)
}
