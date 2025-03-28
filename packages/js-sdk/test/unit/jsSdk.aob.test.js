// passed
import Debug from 'debug'

import { DdnJS, node } from '../ddn-js'
import { ACL } from './aob/5.acl'

const expect = node.expect
const debug = Debug('debug')

debug('DdnJS.constants.nethash: ', DdnJS.constants.nethash)
debug('node.constants.nethash: ', node.constants.nethash)

async function createTransfer (address, amount, secret) {
  return await DdnJS.transaction.createTransaction(address, amount, null, secret)
}

// async function createPluginAsset (type, asset, secret, secondSecret) {
//   return await DdnJS.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
// }

jest.setTimeout(30000)

describe('AOB Test', () => {
  // 先创建两个发行商账户
  const IssuerAccount1 = node.randomAccount()
  const IssuerAccount2 = node.randomAccount()
  debug('IssuerAccount', IssuerAccount1)
  debug('IssuerAccount2', IssuerAccount2)

  // 先给发行商想个名字
  const issuerName = node.randomIssuerName('', 5)
  const issuerName2 = node.randomIssuerName()
  debug('issuerName', issuerName)
  debug('issuerName2', issuerName2)

  // 开始前，得把发行商账号 IssuerAccount 注册到链上(登录一下即可)
  beforeAll(async () => {
    try {
      const response = await node.api
        .post('/accounts/open')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          secret: IssuerAccount1.password
        })
        .expect('Content-Type', /json/)
        .expect(200)

      debug('create account', JSON.stringify(response.body))
      expect(response.body).to.have.property('success').to.be.true
      IssuerAccount1.address = response.body.account.address
      IssuerAccount1.publicKey = response.body.account.publicKey
    } catch (err) {
      debug('Error creating account', err)
      expect(err).be.not.ok
    }
  })

  // // 注册发行商要花钱
  beforeAll(async () => {
    // 转账给它
    const transaction = await createTransfer(IssuerAccount1.address, '1000', node.Gaccount.password)
    const response = await node.api
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.constants.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)

    debug('transfer', transaction)
    debug('transfer body', response.body)
    expect(response.body).to.have.property('success').to.be.true
    expect(response.body).to.have.property('transactionId').to.be.a('string')
  })

  // 1. 注册发行商
  describe('Register Issuer', () => {
    it('Should be ok', async () => {
      await node.onNewBlockAsync()

      const transaction = await DdnJS.aob.createIssuer(issuerName, 'An issuer', IssuerAccount1.password)
      debug('注册发行商创建的transaction 1', transaction)
      const { body } = await node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)

      debug('Register Issuer ok', body)

      expect(body).to.have.property('success').to.be.true
    })

    it('with the same name again, Should be fail', async () => {
      await node.onNewBlockAsync()

      const transaction = await DdnJS.aob.createIssuer(issuerName, 'An issuer', IssuerAccount2.password)
      debug('注册发行商创建的transaction 2', transaction)

      node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }) => {
          debug('Register Issuer with same name fail', body)

          expect(body).to.have.property('success').to.be.false
          expect(body).to.have.property('error').to.contain('Issuer name/issuer_id already exists')
        })
        .catch(err => {
          debug('Register Issuer with same name fail error', err)
          expect(err).be.not.ok
        })
    })

    it('with the same IssuerAccount1 again, Should be fail', async () => {
      await node.onNewBlockAsync()

      const transaction = await DdnJS.aob.createIssuer(issuerName2, 'An issuer', IssuerAccount1.password)
      debug('注册发行商创建的transaction 3', transaction)

      node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }) => {
          debug('Register Issuer with same IssuerAccount1 fail', body)

          expect(body).to.have.property('success').to.be.false
          expect(body).to.have.property('error').to.contain('Issuer name/issuer_id already exists')
        })
        .catch(err => {
          debug('Register Issuer with same IssuerAccount1 fail error', err)
          expect(err).be.not.ok
        })
    })

    it('with IssuerAccount2 who no money, Should be fail', async () => {
      await node.onNewBlockAsync()

      const transaction = await DdnJS.aob.createIssuer(issuerName2, 'An issuer', IssuerAccount2.password)
      debug('注册发行商创建的transaction 4', transaction)
      const { body } = await node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)

      debug('Register Issuer with no money IssuerAccount2 fail', body)
      expect(body).to.have.property('success').to.be.false
      expect(body).to.have.property('error').to.contain('Insufficient balance')
    })
  })

  // 1.1 检索发行商
  describe('Get issuers', () => {
    it('Get issuers should be ok', async () => {
      const [err, res] = await node.apiGetAsyncE('/aob/issuers')

      debug('get /aob/issuers/issuers response', err, res.body)
      expect(err).to.not.ok
      expect(res.body.success).to.be.true
      if (res.body.data) {
        expect(res.body.data.total).to.be.a('number')
        expect(res.body.data.rows).to.be.instanceOf(Array)
      }
    })

    it('Get issuer by name should be ok', async () => {
      const [err, res] = await node.apiGetAsyncE(`/aob/issuers/name/${issuerName}`)
      debug('issuerName', issuerName)
      debug('get /aob/issuers/name/:name response', err, res.body)
      expect(err).to.not.ok
      expect(res.body).to.have.property('result')
      if (res.body.result) {
        expect(res.body.result.name).to.equal(issuerName)
        expect(res.body.result.issuer_id).to.equal(IssuerAccount1.address)
      }
    })
  })

  // // 2. 注册资产 比如：DDN.CNY
  let currency // 名字本就是 assetName;
  describe('Register Asset', () => {
    it('Should be ok', async () => {
      await node.onNewBlockAsync()
      // 必须有 发行商(并且与IssuerAccount1对应)
      currency = issuerName + '.' + node.randomIssuerName('', 3).toUpperCase()
      debug('Asset currency', currency)

      var transaction = await DdnJS.aob.createAsset(
        currency,
        'DDD新币种',
        '100000000',
        2,
        '',
        '0',
        '0',
        '0',
        IssuerAccount1.password
      )

      debug('Asset transaction:', transaction)

      const { body } = await node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)

      debug('asset register ok', body)

      expect(body).to.have.property('success').to.be.true
    })
  })

  // 3. 发行资产，即增加市场流通数量
  describe('Add asset issues', () => {
    it('Should be ok', async () => {
      // 等 1 次确认
      await node.onNewBlockAsync()

      // const transaction = await createPluginAsset(assetTypes.AOB_ISSUE, asset, IssuerAccount1.password)
      const transaction = await DdnJS.aob.createIssue(currency, '100000', IssuerAccount1.password)
      debug('Add issue transaction:', transaction)

      const { body } = await node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)

      debug('Add issue ', body)

      expect(body).to.have.property('success').to.be.true
    })
  })

  // 4. 资产转账
  describe('Transfer Issue', () => {
    it('Should be ok', async () => {
      // 等 1 次确认
      await node.onNewBlockAsync()

      // const transaction = await createPluginAsset(assetTypes.AOB_TRANSFER, obj, IssuerAccount1.password)
      const transaction = await DdnJS.aob.createTransfer(
        currency,
        '10',
        node.Gaccount.address,
        '主交易备注',
        '资产交易备注',
        IssuerAccount1.password
      )
      debug('aob transfer: ', transaction)

      const { body } = await node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)

      debug('Transfer issue should be ok', body)

      expect(body).to.have.property('success').to.be.true
    })

    it('if aob amount is 0 should be fail', async () => {
      // 等 1 次确认
      await node.onNewBlockAsync()

      // const transaction = await createPluginAsset(assetTypes.AOB_TRANSFER, obj, IssuerAccount1.password)
      const transaction = await DdnJS.aob.createTransfer(
        currency,
        '10',
        node.Gaccount.address,
        '主交易备注',
        '资产交易备注',
        IssuerAccount2.password
      )
      debug('aob transfer: ', transaction)

      const { body } = await node.api
        .post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.constants.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)

      debug('Transfer issue should be ok', body)

      expect(body).to.have.property('success').to.be.false
      expect(body).to.have.property('error').to.contain('Insufficient AoB balance')
    })
  })
})

// 5. 测试权限
// ACL()
