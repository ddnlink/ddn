import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import ddn from '../../lib'
import node from '../../lib/test'

const debug = Debug('debug')
const expect = node.expect
const Bignum = DdnUtils.bignum

describe('Node SDK', () => {
  describe('crypto.js', () => {
    const crypto = ddn.crypto

    it('should be ok', () => {
      expect(crypto).to.be.ok
    })

    it('should be object', () => {
      expect(crypto).that.is.an('object')
    })

    it('should has properties', () => {
      const properties = ['getBytes', 'getHash', 'getId', 'getFee', 'sign', 'secondSign', 'getKeys', 'generateAddress', 'verify', 'verifySecondSignature', 'fixedPoint']
      properties.forEach(property => {
        expect(crypto).to.have.property(property)
      })
    })

    describe('#getBytes', () => {
      const getBytes = crypto.getBytes
      let bytes = null

      it('should be ok', () => {
        expect(getBytes).to.be.ok
      })

      it('should be a function', () => {
        expect(getBytes).to.be.a('function')
      })

      it('should return Buffer of simply transaction and buffer most be 117 length', async (done) => {
        const transaction = {
          nethash: '0ab796cd',
          type: 0,
          amount: '1000', // Bignum update
          recipientId: '58191285901858109',
          timestamp: 141738,
          asset: {},
          senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
          signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a',
          id: '13987348420913138422'
        }

        bytes = await getBytes(transaction)
        debug('#getBytes first, bytes: ', bytes)
        expect(bytes).to.be.ok
        // expect(bytes).that.is.an("object");
        // expect(bytes.length).to.equal(117);
        expect(bytes.length).to.equal(130)
        done()
      })

      it('should return Buffer of transaction with second signature and buffer most be 194 length', async (done) => {
        const transaction = {
          nethash: '0ab796cd',
          type: 0,
          amount: '1000', // Bignum update
          recipientId: '58191285901858109',
          timestamp: 141738,
          asset: {},
          senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
          signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a',
          sign_signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a',
          id: '13987348420913138422'
        }

        bytes = await getBytes(transaction)
        debug('#getBytes secend, bytes:', bytes)
        expect(bytes).to.be.ok
        // expect(bytes).that.is.an("object");
        // expect(bytes.length).to.equal(181);
        expect(bytes.length).to.equal(194)
        done()
      })
    })

    describe('#getHash', () => {
      const getHash = crypto.getHash

      it('should be ok', () => {
        expect(getHash).to.be.ok
      })

      it('should be a function', () => {
        expect(getHash).to.be.a('function')
      })

      it('should return Buffer and Buffer most be 32 bytes length', async (done) => {
        const transaction = {
          nethash: '0ab796cd',
          type: 0,
          amount: '1000', // Bignum update
          recipientId: '58191285901858109',
          timestamp: 141738,
          asset: {},
          senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
          signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a',
          id: '13987348420913138422'
        }

        const result = await getHash(transaction)
        debug('#getHash, hash:', result)

        expect(result).to.be.ok
        expect(Buffer.isBuffer(result)).be.true
        expect(result.length).to.equal(64)
        done()
      })
    })

    describe('#getId', () => {
      const getId = crypto.getId

      it('should be ok', () => {
        expect(getId).to.be.ok
      })

      it('should be a function', () => {
        expect(getId).to.be.a('function')
      })

      it('should return string id and be equal to 23e9d76cdaf4ad10c8f1a9a416a386ec5a19110c489b9ba0d9b00d5890fcfe92a060f28c19132f795c444ed7c2fc63c7e98bd855d67a46487db60df747c19830', async (done) => {
        const transaction = {
          nethash: '0ab796cd',
          type: 0,
          amount: '1000', // Bignum update
          recipientId: '58191285901858109',
          timestamp: 141738,
          asset: {},
          senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
          signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a'
        }

        const id = await getId(transaction)
        debug('#getId, id to hex:', id.toString('hex'))

        expect(id).to.be.a('string').be.equal('23e9d76cdaf4ad10c8f1a9a416a386ec5a19110c489b9ba0d9b00d5890fcfe92a060f28c19132f795c444ed7c2fc63c7e98bd855d67a46487db60df747c19830')
        // expect(id).to.be.a("string").be.equal("f60a26da470b1dc233fd526ed7306c1d84836f9e2ecee82c9ec47319e0910474");
        done()
      })
    })

    describe('#getFee', () => {
      const getFee = crypto.getFee

      it('should be ok', () => {
        expect(getFee).to.be.ok
      })

      it('should be a function', () => {
        expect(getFee).to.be.a('function')
      })

      it('should return BigNumber', async (done) => {
        const fee = await getFee({ amount: '100000', type: 0 }) // Bignum update

        debug('fee: ', fee)
        expect(Bignum.isBigNumber(fee)).to.be.true
        expect(fee).to.be.not.NaN
        done()
      })

      it('should return 10000000', async (done) => {
        const fee = await getFee({ amount: '100000', type: 0 }) // Bignum update
        expect(Bignum.isBigNumber(fee)).to.be.true
        expect(fee.toString()).to.equal('10000000')
        done()
      })

      it('should return 10000000000', async (done) => {
        const fee = await getFee({ type: 1 })
        expect(Bignum.isBigNumber(fee)).to.be.true
        expect(fee.toString()).to.equal('10000000000')
        done()
      })

      it('should be equal 1000000000000', async (done) => {
        const fee = await getFee({ type: 2 })
        expect(Bignum.isBigNumber(fee)).to.be.true
        expect(fee.toString()).to.equal('1000000000000')
        done()
      })

      it('should be equal 100000000', async (done) => {
        const fee = await getFee({ type: 3 })
        debug('fee: ', fee)
        expect(Bignum.isBigNumber(fee)).to.be.true
        expect(fee.toString()).to.equal('100000000')
        done()
      })
    })

    // todo: 这里是进率，数字是对的，当然因为使用大数据格式，使用字符串也可以
    describe('fixedPoint', () => {
      const fixedPoint = crypto.fixedPoint

      it('should be ok', () => {
        expect(fixedPoint).to.be.ok
      })

      it('should be number', () => {
        expect(fixedPoint).to.be.a('number').and.not.NaN
      })

      it('should be equal 100000000', () => {
        expect(fixedPoint).to.equal(100000000)
      })
    })

    describe('#sign', () => {
      const sign = crypto.sign

      it('should be ok', () => {
        expect(sign).to.be.ok
      })

      it('should be a function', () => {
        expect(sign).to.be.a('function')
      })

      it('should be ok', async () => {
        const kp = crypto.getKeys('test')
        const transaction = {
          nethash: '0ab796cd',
          type: 0,
          amount: '1000', // Bignum update
          recipientId: 'D9EWvxNF89StC8UAS3WHrgXX8fCGyAaoU',
          timestamp: 141738,
          asset: {},
          senderPublicKey: '5d036a858ce89f844491762eb89e2bfbd50a4a0a0da658e4b2628b25b117ae09',
          signature: '618a54975212ead93df8c881655c625544bce8ed7ccdfe6f08a42eecfb1adebd051307be5014bb051617baf7815d50f62129e70918190361e5d4dd4796541b0a'
        }

        transaction.id = await crypto.getId(transaction)

        const sig = await sign(transaction, kp)
        debug('sig', sig)
        expect(sig.length).to.equal(128) // 64 ??
      })
    })

    describe('#secondSign', () => {
      const secondSign = crypto.secondSign

      it('should be ok', () => {
        expect(secondSign).to.be.ok
      })

      it('should be a function', () => {
        expect(secondSign).to.be.a('function')
      })
    })

    describe('#getKeys', () => {
      const getKeys = crypto.getKeys

      it('should be ok', () => {
        expect(getKeys).to.be.ok
      })

      it('should be a function', () => {
        expect(getKeys).to.be.a('function')
      })

      it('should return two keys in hex', () => {
        const keys = getKeys('secret')

        expect(keys).to.be.ok
        expect(keys).that.is.an('object')
        expect(keys).to.have.property('publicKey')
        expect(keys).to.have.property('privateKey')
        expect(keys.publicKey).to.be.a('string')

        // .and.match(() => {
        // 	try {
        // 		Buffer.from(keys.publicKey, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // });

        expect(keys.privateKey).to.be.a('string')

        // .and.match(() => {
        // 	try {
        // 		Buffer.from(keys.privateKey, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // });
      })
    })

    describe('#generateAddress', () => {
      const generateAddress = crypto.generateAddress

      it('should be ok', () => {
        expect(generateAddress).to.be.ok
      })

      it('should be a function', () => {
        expect(generateAddress).to.be.a('function')
      })

      it('should generate address by publicKey', () => {
        const keys = crypto.getKeys('secret')
        const address = generateAddress(keys.publicKey)

        expect(address).to.be.ok
        expect(address).to.be.a('string')
        expect(address).to.equal('DFAZqQx6BxVyW63EqfZQBZYa1CTg7qH3oJ')
      })
    })

    describe('#verify', () => {
      const verify = crypto.verify

      it('should be ok', () => {
        expect(verify).to.be.ok
      })

      it('should be function', () => {
        expect(verify).to.be.a('function')
      })
    })

    describe('#verifySecondSignature', () => {
      const verifySecondSignature = crypto.verifySecondSignature

      it('should be ok', () => {
        expect(verifySecondSignature).to.be.ok
      })

      it('should be function', () => {
        expect(verifySecondSignature).to.be.a('function')
      })
    })
  })

  describe('crypto sha256 and address', () => {
    it('should be equal to the expected address', () => {
      const address = ddn.crypto.generateAddress('7a91b9bfc0ea185bf3ade9d264da273f7fe19bf71008210b1d7239c82dd3ad20')
      expect(address).to.equal('D6hS16kpFkVZv1TaBCrZQ3Wt7Tawa7MjuA')

      const publicKeyBuffer = Buffer.from('7a91b9bfc0ea185bf3ade9d264da273f7fe19bf71008210b1d7239c82dd3ad20', 'hex')
      const address2 = ddn.crypto.generateAddress(publicKeyBuffer)
      expect(address2).to.equal('D6hS16kpFkVZv1TaBCrZQ3Wt7Tawa7MjuA')
    })
  })
})
