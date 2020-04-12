import node from "@ddn/node-sdk/lib/test";
import ddnCrypto from '../lib';

describe('address', () => {
  it('old 64bit address should be ok', done => {
    node.expect(ddnCrypto.isAddress('a')).to.be.false
    node.expect(ddnCrypto.isAddress('')).to.be.false
    node.expect(ddnCrypto.isAddress()).to.be.false
    node.expect(ddnCrypto.isAddress(1)).to.be.false
    node.expect(ddnCrypto.isAddress('1a')).to.be.false
    node.expect(ddnCrypto.isAddress('1234567890123456789012')).to.be.false

    node.expect(ddnCrypto.isAddress('1')).to.be.false
    node.expect(ddnCrypto.isAddress('123456')).to.be.false

    done()
  })

  it('bitcoin Address should be invalid', done => {
    node.expect(ddnCrypto.isAddress('14VXPK3foDitWdv132rb3dZJkJUMrMSscp')).to.be.false
    done()
  })

  it('normal Address should be ok', done => {
    // node.expect(ddnCrypto.isAddress('DDaYcsGrwpPnR5SJK6AFBC6tMavGhBAkFD')).to.be.true

    const addr = ddnCrypto.generateAddress(node.genNormalAccount().public_key);
    node.expect(ddnCrypto.isAddress(addr)).to.be.true

    done()
  })
})
