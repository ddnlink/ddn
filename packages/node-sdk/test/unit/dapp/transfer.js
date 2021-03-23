import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import { DdnJS, node } from '../../ddn-js'

const expect = node.expect
const debug = Debug('debug')

const DAPP_CURRENCY = 'DDN'

const DAPP_TEMPLATE = {
  name: 'ddn-hello-dapp',
  link: 'https://github.com/ddnlink/ddn-hello-dapp/archive/master.zip',
  category: 1,
  description: 'A hello world demo for ddn dapp',
  tags: 'ddn,dapp,demo',
  icon: 'http://o7dyh3w0x.bkt.clouddn.com/hello.png',
  type: 0
}

async function createPluginAsset (type, asset, secret, secondSecret) {
  return await DdnJS.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
}

function genNormalAccounts (n) {
  const accounts = []
  for (let i = 0; i < n; ++i) {
    accounts.push(node.genNormalAccount())
  }
  return accounts
}

async function createTransfer (address, amount, secret, second_secret) {
  return await DdnJS.transaction.createTransaction(address, amount, null, secret, second_secret)
}

async function registerDAppAsync (options, { password }) {
  options.fee = '10000000000'
  const dappData = await createPluginAsset(DdnUtils.assetTypes.DAPP, options, password)
  const res = await node.submitTransactionAsync(dappData)
  // let res = await node.submitTransactionAsync(DdnJS.dapp.createDApp(options, account.password))
  return res
}

async function inTransferAsync (options, { password }) {
  // DdnJS.init();
  const inTransferData = await createPluginAsset(DdnUtils.assetTypes.DAPP_IN_TRANSFER, options, password)
  const res = await node.submitTransactionAsync(inTransferData)
  debug('in transfer response', res.body)
  return res
}

// async function outTransferAsync(options, {password}) {
//     let outTransferData = await createPluginAsset(DdnUtils.assetTypes.DAPP_OUT, options, password);
//     // let trs = DdnJS.transfer.createOutTransfer(options.recipientId, options.dappId, options.transactionId, options.currency, options.amount, account.password)
//     let res = await node.submitTransactionAsync(outTransferData)
//     debug('out transfer response', res.body)
//     return res
// }

async function getAssetBalanceAsync (address, currency) {
  const res = await node.apiGetAsync(`/aob/assets/balances/${address}/${currency}`)
  debug('get asset balance response', res.body)
  expect(res.body.result.currency).to.equal(currency)
  return res.body.result.balance
}

async function getDAppBalanceAsync (dappId, currency) {
  const res = await node.apiGetAsync(`/dapps/balances/${dappId}/${currency}`)
  debug('/dapps/balances', res.body)
  expect(res.body).to.have.property('success').to.be.true
  return res.body.result.balance
}

export const Transfer = () => {
  describe('dapp transfer', () => {
    const delegateAccounts = genNormalAccounts(5)
    const publicKeys = delegateAccounts.map(a => a.publicKey)
    const dapp = { delegates: publicKeys, unlock_delegates: 3, ...DAPP_TEMPLATE }
    dapp.name = node.randomUsername()
    dapp.link = dapp.link.replace('ddn', node.randomUsername())
    debug('dapp', dapp)
    let dappId = ''

    const issuerName = node.randomIssuerName()
    const assetName = 'CNY'

    // it('should fail to register dapp with invalid params', async () => {
    //   let dapp1 = extend(true, {}, dapp)
    //   dapp1.delegates.push(dapp1.delegates[0])
    //   let res = await registerDAppAsync(dapp1, node.Gaccount)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

    //   let dapp2 = extend(true, {}, dapp)
    //   dapp2.delegates[0] = dapp2.delegates[0].slice(1)
    //   res = await registerDAppAsync(dapp2, node.Gaccount)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid dapp delegates format/)

    //   let dapp3 = extend(true, {}, dapp)
    //   dapp3.delegates = []
    //   res = await registerDAppAsync(dapp3, node.Gaccount)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid dapp delegates/)

    //   let dapp4 = extend(true, {}, dapp)
    //   dapp4.delegates.pop()
    //   res = await registerDAppAsync(dapp4, node.Gaccount)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid dapp delegates/)

    //   let dapp5 = extend(true, {}, dapp)
    //   dapp5.unlock_delegates = 102
    //   res = await registerDAppAsync(dapp5, node.Gaccount)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

    //   let dapp6 = extend(true, {}, dapp)
    //   dapp6.unlock_delegates = dapp6.delegates.length + 1
    //   res = await registerDAppAsync(dapp6, node.Gaccount)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid unlock delegates number/)

    //   let dapp7 = extend(true, {}, dapp)
    //   dapp7.unlock_delegates = 2
    //   res = await registerDAppAsync(dapp7, node.Gaccount)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)
    // })

    it('should be ok to register dapp with valid params', async done => {
      dapp.delegates = dapp.delegates.join(',')

      const res = await registerDAppAsync(dapp, node.Gaccount)

      expect(res.body).to.have.property('success').to.be.true
      dappId = res.body.transactionId
      debug('dappId', dappId)
      done()
    })

    it(`should be ok to transfer ${DAPP_CURRENCY} to an app`, async done => {
      const account = node.genNormalAccount()
      await node.giveMoneyAndWaitAsync([account.address])

      let res = await node.apiGetAsync(`/accounts/getBalance?address=${account.address}`)

      debug('/accounts/getBalance', res.body)
      expect(res.body).to.have.property('success').to.be.true

      const balance1 = res.body.balance
      const inTransferAmount = '100000000'
      const options = {
        dapp_id: dappId,
        currency: DAPP_CURRENCY,
        amount: inTransferAmount
      }
      res = await inTransferAsync(options, account)
      debug('inTransferAsync', res.body)
      expect(res.body).to.have.property('success').to.be.true

      await node.onNewBlockAsync()
      res = await node.apiGetAsync(`/accounts/getBalance?address=${account.address}`)

      debug('/accounts/getBalance', res.body)
      expect(res.body).to.have.property('success').to.be.true

      const balance2 = res.body.balance
      const balance = DdnUtils.bignum.minus(balance1, inTransferAmount, node.constants.net.fees.transfer)
      expect(balance).to.equal(balance2)

      const dappBalance = getDAppBalanceAsync(dappId, DAPP_CURRENCY)

      expect(dappBalance).to.equal(String(inTransferAmount))
      done()
    })

    it('should be ok to transfer assets to an app', async done => {
      const account = node.genNormalAccount()
      await node.giveMoneyAndWaitAsync([account.address])

      const currency = `${issuerName}.${assetName}`
      const maximum = '10000000000'
      const issueAmount = '1000000000'

      // (1)加载插件
      // DdnJS.init();
      // (2)注册资产商
      const issuer = {
        name: issuerName,
        desc: 'issuer desc',
        // issuer_id: account.address,
        fee: '10000000000'
      }
      const transaction_aob_issuer = await createPluginAsset(60, issuer, account.password)
      let res = await node.submitTransactionAsync(transaction_aob_issuer)
      // let res = await node.submitTransactionAsync(DdnJS.aob.createIssuer(issuerName, 'issuer desc', account.password))
      expect(res.body).to.have.property('success').to.be.true
      await node.onNewBlockAsync()

      // （3）注册资产
      const obj = {
        name: currency,
        desc: 'asset desc',
        maximum,
        precision: 6,
        strategy: '',
        allow_blacklist: '1',
        allow_whitelist: '1',
        allow_writeoff: '1',
        fee: '50000000000'
      }
      const transaction_aob_asset = await createPluginAsset(61, obj, account.password)
      // let trs = DdnJS.aob.createAsset(
      //   currency,
      //   'asset desc',
      //   maximum,
      //   6,
      //   '',
      //   1, 1, 1,
      //   account.password)
      res = await node.submitTransactionAsync(transaction_aob_asset)
      expect(res.body).to.have.property('success').to.be.true
      await node.onNewBlockAsync()

      // （3）注册资产
      const obj2 = {
        currency,
        aobAmount: issueAmount
      }
      const transaction_aob_issue = await createPluginAsset(64, obj2, account.password)
      res = await node.submitTransactionAsync(transaction_aob_issue)
      // res = await node.submitTransactionAsync(DdnJS.aob.createIssue(currency, issueAmount, account.password))
      expect(res.body).to.have.property('success').to.be.true
      await node.onNewBlockAsync()

      const balance1 = await getAssetBalanceAsync(account.address, currency)
      expect(balance1).to.equal(issueAmount)

      const transferOptions = {
        dapp_id: dappId,
        currency,
        aobAmount: '100000000'
      }
      const transaction_dapp_in_transfer = await createPluginAsset(12, transferOptions, account.password)
      res = await node.submitTransactionAsync(transaction_dapp_in_transfer)
      // res = await inTransferAsync(transferOptions, account)
      expect(res.body).to.have.property('success').to.be.true

      await node.onNewBlockAsync()

      const balance2 = await getAssetBalanceAsync(account.address, currency)

      // DdnUtils.bignum update expect(DdnUtils.bignum(balance1).sub(transferOptions.amount).toString()).to.equal(balance2)
      expect(DdnUtils.bignum.minus(balance1, transferOptions.amount).toString()).to.equal(balance2)

      const dappBalance = getDAppBalanceAsync(dappId, currency)

      expect(dappBalance).to.equal(String(transferOptions.amount))
      done()
    })

    // it('should be failed to transfer from app to account with invalid params', async () => {
    //   let recipientAccount = node.genNormalAccount()
    //   let dappBalance = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
    //   let transferOptions = {
    //     recipientId: recipientAccount.address,
    //     dapp_id: dappId,
    //     transaction_id: node.randomTid(),
    //     currency: DAPP_CURRENCY,
    //     aobAmount: DdnUtils.bignum.plus(dappBalance, 1).toString()
    //   }
    //   let res = await outTransferAsync(transferOptions, recipientAccount)
    //   expect(res.body).to.have.property('error').to.match(/^Sender must be dapp delegate/)

    //   let trs = DdnJS.transfer.createOutTransfer(recipientAccount.address, dappId, node.randomTid(), DAPP_CURRENCY, '1', delegateAccounts[0].password)
    //   res = await node.submitTransactionAsync(trs)
    //   debug('submit out transfer response', res.body)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid signature number/)

    //   trs.signatures = []
    //   for (let i = 0; i < delegateAccounts.length; ++i) {
    //     trs.signatures.push(DdnJS.transfer.signOutTransfer(trs, delegateAccounts[i].password))
    //   }
    //   trs.signatures.push(DdnJS.transfer.signOutTransfer(trs, recipientAccount.password))
    //   res = await node.submitTransactionAsync(trs)
    //   debug('submito out transfer response', res.body)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid signature number/)
    //   trs.signatures = []
    //   for (let i = 0; i < dapp.unlockDelegates; ++i) {
    //     trs.signatures.push(DdnJS.transfer.signOutTransfer(trs, node.genNormalAccount().password))
    //   }
    //   res =await node.submitTransactionAsync(trs)
    //   debug('submit out transfer response', res.body)
    //   expect(res.body).to.have.property('error').to.match(/^Valid signatures not enough/)
    // })

    it(`should be ok to transfer ${DAPP_CURRENCY} from app to account`, async done => {
      const transaction = await createTransfer(delegateAccounts[0].address, '50000000', node.Gaccount.password)

      node.peer
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, { body }) => {
          // console.log(res.body);
          node.expect(body).to.have.property('success').to.be.true
        })

      await node.onNewBlockAsync()

      const recipientAccount = node.genNormalAccount()
      const amount = '10000000'
      const dappBalance1 = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
      // let trs = DdnJS.transfer.createOutTransfer(recipientAccount.address, dappId, node.randomTid(), DAPP_CURRENCY, amount, delegateAccounts[0].password)
      const outTransferData = {
        // receive_address: recipientAccount.address,
        recipientId: recipientAccount.address,
        dapp_id: dappId,
        transaction_id: node.randomTid(),
        currency: DAPP_CURRENCY,
        aobAmount: amount
      }

      const trs = await createPluginAsset(13, outTransferData, delegateAccounts[0].password)

      // let trs = await outTransferAsync(outTransferData, delegateAccounts[0]);

      trs.signatures = []
      for (let i = 0; i < dapp.unlock_delegates; i++) {
        trs.signatures.push(await DdnJS.transfer.signOutTransfer(trs, delegateAccounts[i].password))
      }

      let res = await node.submitTransactionAsync(trs)
      debug('submit out transfer response', res.body)
      expect(res.body).to.have.property('success').to.be.true

      await node.onNewBlockAsync()

      const dappBalance2 = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
      // DdnUtils.bignum update expect(DdnUtils.bignum(dappBalance1).sub(amount).sub(node.constants.net.fees.transfer).toString()).to.equal(dappBalance2)
      expect(DdnUtils.bignum.minus(dappBalance1, amount, node.constants.net.fees.transfer).toString()).to.equal(
        dappBalance2
      )

      res = await node.apiGetAsync(`/accounts/getBalance?address=${recipientAccount.address}`)
      expect(res.body).to.have.property('success').to.be.true
      const recipientBalance = res.body.balance
      expect(String(recipientBalance)).to.equal(amount)
      done()
    })

    // it('should be ok to transfer assets from app to account', async () => {
    //   let recipientAccount = node.genNormalAccount()
    //   let currency = issuerName + '.' + assetName
    //   let amount = '10000000'
    //   let dappBalance1 = await getDAppBalanceAsync(dappId, currency)
    //   let dappDdnBalance1 = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
    //   let trs = DdnJS.transfer.createOutTransfer(recipientAccount.address, dappId, node.randomTid(), currency, amount, delegateAccounts[0].password)
    //   trs.signatures = []
    //   for (let i = 0; i < dapp.unlockDelegates; ++i) {
    //     trs.signatures.push(DdnJS.transfer.signOutTransfer(trs, delegateAccounts[i].password))
    //   }
    //   let res = await node.submitTransactionAsync(trs)
    //   debug('submit out transfer response', res.body)
    //   expect(res.body).to.have.property('success').to.be.true

    //   await node.onNewBlockAsync()

    //   let dappBalance2 = await getDAppBalanceAsync(dappId, currency)
    //   let dappDdnBalance2 = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
    //   //DdnUtils.bignum update expect(DdnUtils.bignum(dappBalance1).sub(amount).toString()).to.equal(dappBalance2)
    //   //DdnUtils.bignum update expect(DdnUtils.bignum(dappDdnBalance1).sub(node.constants.net.fees.transfer).toString()).to.equal(dappDdnBalance2)
    //   expect(DdnUtils.bignum.minus(dappBalance1, amount).toString()).to.equal(dappBalance2)
    //   expect(DdnUtils.bignum.minus(dappDdnBalance1, node.constants.net.fees.transfer).toString()).to.equal(dappDdnBalance2)

    //   res = await node.apiGetAsync('/accounts/getBalance?address=' + recipientAccount.address)
    //   expect(res.body).to.have.property('success').to.be.true
    //   let recipientBalance = await getAssetBalanceAsync(recipientAccount.address, currency)
    //   expect(String(recipientBalance)).to.equal(amount)
    // })
  })
}
