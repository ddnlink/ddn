import ddn from '../../lib'
import node from '../../lib/test'
import Debug from 'debug'

const debug = Debug('debug')
const expect = node.expect

describe('node-sdk dapp.js', () => {
  const dapp = ddn.dapp

  it('should be object', () => {
    expect(dapp).that.is.an('object')
  })

  it('should have properties', () => {
    expect(dapp).to.have.property('createDApp')
  })

  describe('#createDApp', () => {
    const createDApp = dapp.createDApp
    let trs = null

    const options = {
      name: 'ddn-dapp-demo',
      link: 'https://github.com/ddnlink/ddn-dapp-demo/archive/master.zip',
      category: 1,
      description: 'Decentralized news channel',
      tags: 'ddn,dapp,demo',
      icon: 'http://o7dyh3w0x.bkt.clouddn.com/hello.png',
      type: 0,
      delegates: [
        '8b1c24a0b9ba9b9ccf5e35d0c848d582a2a22cca54d42de8ac7b2412e7dc63d4',
        'aa7dcc3afd151a549e826753b0547c90e61b022adb26938177904a73fc4fee36',
        'e29c75979ac834b871ce58dc52a6f604f8f565dea2b8925705883b8c001fe8ce',
        '55ad778a8ff0ce4c25cb7a45735c9e55cf1daca110cfddee30e789cb07c8c9f3',
        '982076258caab20f06feddc94b95ace89a2862f36fea73fa007916ab97e5946a'
      ],
      unlock_delegates: 3
    }

    it('should be a function', () => {
      expect(createDApp).to.be.a('function')
    })

    it('should create dapp without second signature', async () => {
      // options.delegates = options.delegates.join(',');
      trs = await createDApp(options, 'secret', null)
      debug('createDApp: ', trs)
      expect(trs).to.be.ok
    })

    it('should create delegate with second signature', async () => {
      // options.delegates = options.delegates.join(',');
      trs = await createDApp(options, 'secret', 'secret 2')
      debug('createDApp: ', trs)

      expect(trs).to.be.ok
    })

    describe('returned dapp', () => {
      const secondKeys = ddn.crypto.getKeys('secret 2')

      it('should be object', () => {
        expect(trs).that.is.an('object')
      })

      it('should have id as string', () => {
        expect(trs.id).to.be.a('string')
      })

      it('should have type as number and equal 9', () => {
        expect(trs.type).to.be.a('number').to.equal(5)
      })

      it('should have amount as number and eqaul 0', () => {
        expect(trs.amount).to.be.a('string').to.equal('0')
      })

      it('should have fee as number and equal 10000000000', () => {
        expect(trs.fee).to.be.a('string').to.equal('10000000000')
      })

      it('should have null recipientId', () => {
        expect(trs).to.have.property('recipientId').equal(null)
      })

      it('should have senderPublicKey as hex string', () => {
        expect(trs.senderPublicKey).to.be.a('string')
        // .match(() => {
        // 	try {
        // 		Buffer.from(trs.senderPublicKey, "hex")
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // })
      })

      it('should have timestamp as number', () => {
        expect(trs.timestamp).to.be.a('number').and.not.NaN
      })

      it('should have dapp inside asset', () => {
        expect(trs.asset).to.have.property('dapp')
      })

      describe('dapp asset', () => {
        it('should be ok', () => {
          expect(trs.asset.dapp).to.be.ok
        })

        it('should be object', () => {
          expect(trs.asset.dapp).that.is.an('object')
        })

        it('should have category property', () => {
          expect(trs.asset.dapp).to.have.property('category').to.equal(options.category)
        })

        it('should have name property', () => {
          expect(trs.asset.dapp).to.have.property('name').to.equal(options.name)
        })

        it('should have tags property', () => {
          expect(trs.asset.dapp).to.have.property('tags').to.equal(options.tags)
        })

        it('should have type property', () => {
          expect(trs.asset.dapp).to.have.property('type').to.equal(options.type)
        })

        it('should have link property', () => {
          expect(trs.asset.dapp).to.have.property('link').to.equal(options.link)
        })

        it('should have icon property', () => {
          expect(trs.asset.dapp).to.have.property('icon').to.equal(options.icon)
        })
      })

      it('should have signature as hex string', () => {
        expect(trs.signature).to.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.signature, "hex")
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // })
      })

      it('should have second signature in hex', () => {
        expect(trs).to.have.property('sign_signature').and.be.a('string')
        // .and.match(() => {
        // 	try {
        // 		Buffer.from(trs.sign_signature, "hex");
        // 	} catch (e) {
        // 		return false;
        // 	}

        // 	return true;
        // });
      })

      it('should be signed correctly', async () => {
        const result = await ddn.crypto.verify(trs)
        debug('signed result:', result)
        expect(result).to.be.ok
      })

      it('should not be signed correctly now', async () => {
        trs.amount = '10000'
        const result = await ddn.crypto.verify(trs)
        expect(result).to.be.not.ok
      })

      it('should be second signed correctly', async () => {
        trs.amount = '0'
        const result = await ddn.crypto.verifySecondSignature(trs, secondKeys.publicKey)
        expect(result).to.be.ok
      })

      it('should not be second signed correctly now', async () => {
        trs.amount = '10000'
        const result = await ddn.crypto.verifySecondSignature(trs, secondKeys.publicKey)
        expect(result).to.be.not.ok
      })

      it('should be ok to verify bytes', () => {
        const data1 = 'a1b2c3d4'
        const secret = 'secret1'
        const keys = ddn.crypto.getKeys(secret)
        let signature = ddn.crypto.signBytes(Buffer.from(data1), keys)
        let result = ddn.crypto.verifyBytes(data1, signature, keys.publicKey)
        expect(result).to.be.ok

        const data2 = Buffer.from('a1b2c3d4', 'hex')
        signature = ddn.crypto.signBytes(data2, keys)
        result = ddn.crypto.verifyBytes(data2, signature, keys.publicKey)
        expect(result).to.be.ok
      })
    })
  })
})
