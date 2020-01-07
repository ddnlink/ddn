var node = require("./../variables.js")
var { Address } = require('@ddn/ddn-utils')

describe('address', function () {
  it('old 64bit address should be ok', function (done) {
    node.expect(Address.isAddress('a')).to.be.false
    node.expect(Address.isAddress('')).to.be.false
    node.expect(Address.isAddress()).to.be.false
    node.expect(Address.isAddress(1)).to.be.false
    node.expect(Address.isAddress('1a')).to.be.false
    node.expect(Address.isAddress('1234567890123456789012')).to.be.false

    node.expect(Address.isAddress('1')).to.be.true
    node.expect(Address.isAddress('123456')).to.be.true

    done()
  })

  it('bitcoin Address should be invalid', function (done) {
    node.expect(Address.isAddress('14VXPK3foDitWdv132rb3dZJkJUMrMSscp')).to.be.false
    done()
  })

  it('normal Address should be ok', function (done) {
    node.expect(Address.isAddress('DDaYcsGrwpPnR5SJK6AFBC6tMavGhBAkFD')).to.be.true

    var addr1 = Address.generateBase58CheckAddress(node.genNormalAccount().public_key)
    node.expect(Address.isAddress(addr1)).to.be.true

    done()
  })
})
