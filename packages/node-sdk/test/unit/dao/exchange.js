// no pass
import Debug from 'debug'
import DdnUtil from '@ddn/utils'
import Tester from '@ddn/test-utils'
import DdnJS from '../../ddn-js'

const debug = Debug('debug')

const Account1 = Tester.randomTxAccount()
const Account2 = Tester.randomTxAccount()
let transaction
let exchange
let Account1Balance
const exchangePrice = '700000000'

jest.setTimeout(50000)

export const Exchange = () => {
  async function openAccount (account) {
    await new Promise((resolve, reject) => {
      Tester.api.post('/accounts/open')
        .set('Accept', 'application/json')
        .send({
          secret: account.password,
          secondSecret: account.secondPassword
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

          // eslint-disable-next-line no-unused-expressions
          Tester.expect(body).to.have.property('success').to.be.true

          if (body.account !== null) {
            account.address = body.account.address
            account.publicKey = body.account.publicKey
            account.balance = body.account.balance
          }

          console.log(`Open Account [${account.address}] with password: ${account.password}`)

          resolve()
        })
    })
  }

  async function sendDDN ({
    address
  }, coin) {
    await Tester.onNewBlockAsync()

    const result = await new Promise((resolve, reject) => {
      const randomCoin = Tester.randomCoin()
      if (!coin) {
        coin = randomCoin
      }

      Tester.api.put('/transactions')
        .set('Accept', 'application/json')
        .send({
          secret: Tester.Gaccount.password,
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

          console.log(`Sending ${coin} DDN to ${address}`)
          Tester.expect(body).to.have.property('success').to.be.true

          resolve(coin)
        })
    })

    await Tester.onNewBlockAsync()

    return result
  }

  describe('Put /transactions', () => {
    let org_id = ''

    beforeAll(async (done) => {
      await openAccount(Account1)
      await openAccount(Account2)

      // 给账户转费用
      Account1Balance = await sendDDN(Account1)

      debug('Account1Balance', Account1Balance)

      // 获取 org_id
      const getOrgIdUrl = `/dao/orgs?pagesize=1&address=${Tester.Gaccount.address}`
      Tester.api.get(getOrgIdUrl)
        .set('Accept', 'application/json')
        .set('version', Tester.version)
        .set('nethash', Tester.config.nethash)
        .set('port', Tester.config.port)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('getOrgIdUrl', getOrgIdUrl, JSON.stringify(body))
          Tester.expect(err).to.be.not.ok
          Tester.expect(body).to.have.property('success').to.be.true
          org_id = body.result.rows[0].org_id

          done()
        })
    })

    // 0 状态 - 发起出售交易
    it('Create exchange to sell with state = 0, Should be ok', async (done) => {
      exchange = {
        org_id: org_id,
        price: exchangePrice,
        state: 0,
        exchange_trs_id: '',
        received_address: Account1.address,
        sender_address: Tester.Gaccount.address
      }

      transaction = await DdnJS.assetPlugin.createPluginAsset(DdnUtil.assetTypes.DAO_EXCHANGE, exchange, Tester.Gaccount.password) // 41
      Tester.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', Tester.version)
        .set('nethash', Tester.config.nethash)
        .set('port', Tester.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('exchange with state = 0, ok', JSON.stringify(body))

          Tester.expect(err).to.be.not.ok

          Tester.expect(body).to.have.property('success').to.be.true
          Tester.expect(body).to.have.property('transactionId')

          // 为下面的买操作准备
          exchange.exchange_trs_id = body.transactionId

          done()
        })
    })

    // 1状态 - 确认买 交易
    it('Create exchange to buy with state = 1, Should be ok', async (done) => {
      await Tester.onNewBlockAsync()

      const temp = exchange.received_address
      exchange.received_address = exchange.sender_address
      exchange.sender_address = temp
      exchange.amount = exchange.price
      exchange.recipientId = exchange.received_address
      exchange.state = 1

      debug('exchange to buy ', exchange)

      transaction = await DdnJS.assetPlugin.createPluginAsset(DdnUtil.assetTypes.DAO_EXCHANGE, exchange, Account1.password)
      Tester.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', Tester.version)
        .set('nethash', Tester.config.nethash)
        .set('port', Tester.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('exchange with state = 1, ok', JSON.stringify(body))

          Tester.expect(err).to.be.not.ok

          Tester.expect(body).to.have.property('success').to.be.true
          Tester.expect(body).to.have.property('transactionId')

          done()
        })
    })

    // fixme: 2020.6.20
    it('Create exchange to buy with state = 1 again, Should be fail', async (done) => {
      await Tester.onNewBlockAsync()

      exchange.amount = exchange.price
      exchange.recipientId = exchange.received_address

      transaction = await DdnJS.assetPlugin.createPluginAsset(DdnUtil.assetTypes.DAO_EXCHANGE, exchange, Account1.password)
      debug('exchange to buy again, fail, transaction', transaction)

      Tester.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', Tester.version)
        .set('nethash', Tester.config.nethash)
        .set('port', Tester.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('exchange with state = 1 again, fail', JSON.stringify(body))

          Tester.expect(err).to.be.not.ok
          Tester.expect(body).to.have.property('success').to.be.false
          Tester.expect(body).to.have.property('error').to.contain('confirm exchange already exists')

          done()
        })
    })
  })

  // describe('PUT /dao/exchanges', () => {
  //     let org_id = "";

  //     beforeAll(async (done) => {
  //         const getOrgIdUrl = `/dao/orgs/all?pagesize=1&address=${Tester.Gaccount.address}`;
  //         Tester.api.get(getOrgIdUrl)
  //             .set("Accept", "application/json")
  //             .set("version", Tester.version)
  //             .set("nethash", Tester.config.nethash)
  //             .set("port", Tester.config.port)
  //             .expect(200)
  //             .end((err, {
  //                 body
  //             }) => {
  //                 debug("get /dao/orgs/all? ok", JSON.stringify(body));

  //                 Tester.expect(err).to.be.not.ok;

  //                 Tester.expect(body).to.have.property("success").to.be.true;

  //                 org_id = body.result.rows[0].org_id;

  //                 done();
  //             });
  //     });

  //     it("Using invalid parameters, no parameters, should be fail.", (done) => {
  //         Tester.api.put("/dao/exchanges")
  //             .set('Accept', 'application/json')
  //             .send({
  //                 secret: Tester.Gaccount.password
  //             })
  //             .expect('Content-Type', /json/)
  //             .expect(200)
  //             .end((err, {
  //                 body
  //             }) => {
  //                 debug("put /dao/exchanges no parameters, fail", JSON.stringify(body));

  //                 Tester.expect(err).to.be.not.ok;

  //                 Tester.expect(body).to.have.property("success").to.be.false;
  //                 Tester.expect(body).to.have.property("error").to.include("Invalid parameters");

  //                 done();
  //             });
  //     });

  //     it("State=0, Using valid parameters, should be ok.", (done) => {
  //         Tester.api.put("/dao/exchanges")
  //             .set('Accept', 'application/json')
  //             .send({
  //                 secret: Tester.Gaccount.password,
  //                 org_id,
  //                 price: exchangePrice,
  //                 receivedAddress: Account2.address
  //             })
  //             .expect('Content-Type', /json/)
  //             .expect(200)
  //             .end((err, {
  //                 body
  //             }) => {
  //                 debug("put /dao/exchanges, State=0, valid parameters, ok", JSON.stringify(body));

  //                 Tester.expect(err).to.be.not.ok;

  //                 Tester.expect(body).to.have.property("success").to.be.true;
  //                 Tester.expect(body).to.have.property("transactionId");

  //                 exchange = exchange || {};
  //                 exchange.exchange_trs_id = body.transactionId;

  //                 done();
  //             });
  //     });

  //     it("State=1, Account2 no exists, should be fail.", async (done) => {
  //         await Tester.onNewBlockAsync();

  //         Tester.api.put("/dao/exchanges")
  //             .set('Accept', 'application/json')
  //             .send({
  //                 secret: Account2.password,
  //                 org_id,
  //                 price: exchangePrice,
  //                 exchangeTrsId: exchange.exchange_trs_id,
  //                 receivedAddress: Tester.Gaccount.address,
  //                 state: 1
  //             })
  //             .expect('Content-Type', /json/)
  //             .expect(200)
  //             .end((err, {
  //                 body
  //             }) => {
  //                 debug("State=1, Account2 no exists, fail", JSON.stringify(body));

  //                 Tester.expect(err).to.be.not.ok;

  //                 Tester.expect(body).to.have.property("success").to.be.false;
  //                 Tester.expect(body).to.have.property("error").to.equal("Account not found");

  //                 done();
  //             });
  //     })

  //     it("Send 1 DDN to Account2, should be ok.", async () => {
  //         await sendDDN(Account2, "100000000");
  //     });

  //     it("State=1, Account2 balance < 700000000, should be fail.", async (done) => {
  //         await Tester.onNewBlockAsync();

  //         Tester.api.put("/dao/exchanges")
  //             .set('Accept', 'application/json')
  //             .send({
  //                 secret: Account2.password,
  //                 org_id,
  //                 price: exchangePrice,
  //                 exchangeTrsId: exchange.exchange_trs_id,
  //                 receivedAddress: Tester.Gaccount.address,
  //                 state: 1
  //             })
  //             .expect('Content-Type', /json/)
  //             .expect(200)
  //             .end((err, {
  //                 body
  //             }) => {
  //                 debug("Account2 balance < 700000000, fail", JSON.stringify(body));

  //                 Tester.expect(err).to.be.not.ok;

  //                 Tester.expect(body).to.have.property("success").to.be.false;
  //                 Tester.expect(body).to.have.property("error").to.contain("Insufficient balance");

  //                 done();
  //             });
  //     })

  //     it("State=1, Account2 balance > 700000000, should be ok.", async (done) => {
  //         await sendDDN(Account2);

  //         // await Tester.onNewBlockAsync();

  //         Tester.api.put("/dao/exchanges")
  //             .set('Accept', 'application/json')
  //             .send({
  //                 secret: Account2.password,
  //                 org_id,
  //                 price: exchangePrice,
  //                 exchangeTrsId: exchange.exchange_trs_id,
  //                 receivedAddress: Tester.Gaccount.address,
  //                 state: 1
  //             })
  //             .expect('Content-Type', /json/)
  //             .expect(200)
  //             .end((err, {
  //                 body
  //             }) => {
  //                 debug("Account2 balance > 700000000, ok", JSON.stringify(body));

  //                 Tester.expect(err).to.be.not.ok;

  //                 Tester.expect(body).to.have.property("success").to.be.true;
  //                 Tester.expect(body).to.have.property("transactionId");

//                 done();
//             });
//     }, 30000)
// });
}
