var node = require("./../variables.js")
var address = require('../../src/lib/address.js')

describe('address', function () {
  it('old 64bit address should be ok', function (done) {
    node.expect(address.isAddress('a')).to.be.false
    node.expect(address.isAddress('')).to.be.false
    node.expect(address.isAddress()).to.be.false
    node.expect(address.isAddress(1)).to.be.false
    node.expect(address.isAddress('1a')).to.be.false
    node.expect(address.isAddress('1234567890123456789012')).to.be.false

    node.expect(address.isAddress('1')).to.be.true
    node.expect(address.isAddress('123456')).to.be.true

    done()
  })

  it('bitcoin address should be invalid', function (done) {
    node.expect(address.isAddress('14VXPK3foDitWdv132rb3dZJkJUMrMSscp')).to.be.false
    done()
  })

  it('normal address should be ok', function (done) {
    node.expect(address.isAddress('EDaYcsGrwpPnR5SJK6AFBC6tMavGhBAkFD')).to.be.true

    var addr1 = address.generateBase58CheckAddress(node.genNormalAccount().public_key)
    node.expect(address.isAddress(addr1)).to.be.true

    done()
  })
})