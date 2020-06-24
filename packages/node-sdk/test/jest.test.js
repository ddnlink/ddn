// Jest mothods
import node from '@ddn/node-sdk/lib/test'

const expect = node.expect

describe('jest', () => {
  it('should be be.equal, not to.be.equal', (done) => {
    const a = 10
    const b = 10
    expect(a).be.equal(b)
    done()
  })

  it('don`t use and, but it`s not error', (done) => {
    const a = 10
    const b = 10
    expect(a).be.a('number')
    expect(a).to.be.a('number').be.equal(b)
    expect(a).to.be.a('number').and.be.equal(b)
    done()
  })

  it("should use 'be.a', can use 'to.be.a' too.", (done) => {
    const a = 10
    expect(a).be.a('number')
    expect(a).to.be.a('number')
    done()
  })

  it("should use 'have.property', can use 'to.have.property' too.", (done) => {
    const a = { b: 10 }
    expect(a).to.have.property('b')
    expect(a).have.property('b')
    done()
  })

  it("should use 'be.ok', can use 'to.be.ok' too.", (done) => {
    const a = true
    expect(a).to.be.ok
    expect(a).be.ok
    done()
  })

  it("should use 'not.NaN', can use 'to.not.NaN' too.", (done) => {
    const a = 10
    expect(a).not.NaN
    expect(a).to.not.NaN
    done()
  })

  it("should use 'be.empty', can use 'to.not.NaN' too.", (done) => {
    const a = {}
    expect(a).that.is.an('object').be.empty
    done()
  })

  it("should use 'be.empty', can use 'to.not.NaN' too.", (done) => {
    const a = { b: 10 }
    expect(a).that.is.an('object').not.empty
    done()
  })

  it('should have senderPublicKey as hex string', () => {
    const trs = 'test publicKey'
    expect(trs).be.a('string')
    // 该方法用什么替代？
    // .match(() => {
    //     try {
    //         Buffer.from(trs, "hex");
    //     } catch (e) {
    //         return false;
    //     }

    //     return true;
    // })
  })
})
