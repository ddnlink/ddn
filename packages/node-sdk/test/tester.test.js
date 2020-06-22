import Debug from 'debug'
import node from '@ddn/node-sdk/lib/test'
import _ from 'lodash'

const debug = Debug('debug')
const expect = node.expect

describe('An example of DDN test, please do test follow me', () => {
  it('should be ok', () => {
    const name = node.randomIssuerName('DDN.', 3)
    debug('name', name)
    expect(name).be.a('string')
  })
})

describe("Test all Utils, for example: _.isEmpty('')", () => {
  it("Should use _.isEmpty, not '' ", () => {
    const test = ' '

    debug('Blank is empty', !!test, _.isEmpty(test))

    expect(!!test).be.true
    expect(_.isEmpty(test)).be.false
    expect(!!test).be.not.equal(_.isEmpty(test))
  })
})

// D9DT21EowZTAQW3gqHTGXdMKf3HTqKJcTF

async function sendDDN (password, address, coin) {
  await node.onNewBlockAsync()

  const result = await new Promise((resolve, reject) => {
    const randomCoin = node.randomCoin()
    if (!coin) {
      coin = randomCoin
    }

    node.api.put('/transactions')
      .set('Accept', 'application/json')
      .send({
        secret: password,
        amount: `${coin}`,
        recipientId: address
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        debug(JSON.stringify(body))

        if (err) {
          return reject(err)
        }

        debug(`Sending ${coin} DDN to ${address}`)
        node.expect(body).to.have.property('success').to.be.true

        resolve(coin)
      })
  })

  await node.onNewBlockAsync()

  return result
}

describe('sendDDN is ok', () => {
  let MultisigAccount

  it('open account', async (done) => {
    MultisigAccount = node.randomAccount()
    MultisigAccount.name = 'multi'
    const res = await node.openAccountAsync({ secret: MultisigAccount.password })
    const body = res.body

    MultisigAccount.address = body.account.address
    MultisigAccount.publicKey = body.account.publicKey

    debug('MultisigAccount', MultisigAccount)
    done()
  })

  it('A -> B, Should be ok', async (done) => {
    const result = await sendDDN(node.Gaccount.password, MultisigAccount.address, '1000000000')

    debug('Coins', result)

    expect(result).be.not.equal(_.isEmpty(result))
    done()
  }, 30000)

  it('B -> A, Should be ok', async (done) => {
    const result = await sendDDN(MultisigAccount.password, node.Gaccount.address, '100000000')

    debug('Coins', result)

    expect(result).be.not.equal(_.isEmpty(result))
    done()
  }, 30000)
})
