// passed
import Debug from 'debug'
import { DdnJS, node } from '../ddn-js'
// import { ACL } from './aob/5.acl'

const expect = node.expect
const debug = Debug('debug')

async function createTransfer (address, amount, secret) {
  return await DdnJS.transaction.createTransaction(address, amount, null, secret)
}

// async function createPluginAsset (type, asset, secret, secondSecret) {
//   return await DdnJS.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
// }

jest.setTimeout(50000)

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
  beforeAll((done) => {
    node.api.post('/accounts/open')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        secret: IssuerAccount1.password
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, { body }) {
        debug('create account', JSON.stringify(body))
        expect(err).be.not.ok
        expect(body).to.have.property('success').to.be.true
        IssuerAccount1.address = body.account.address
        IssuerAccount1.publicKey = body.account.publicKey

        done()
      })
  })

  // 注册发行商要花钱
  beforeAll(async (done) => {
    // 转账给它
    const transaction = await createTransfer(IssuerAccount1.address, node.randomCoin(), node.Gaccount.password)

    node.peer.post('/transactions')
      .set('Accept', 'application/json')
      .set('version', node.version)
      .set('nethash', node.config.nethash)
      .set('port', node.config.port)
      .send({
        transaction
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        debug('transfer', transaction)
        debug('transfer body', body)
        expect(err).be.not.ok

        expect(body).to.have.property('success').to.be.true
        expect(body).to.have.property('transactionId').to.be.a('string')

        done()
      })
  })

  // 1. 注册发行商
  describe('Register Issuer', () => {
    it('Should be ok', async (done) => {
      await node.onNewBlockAsync()

      const transaction = await DdnJS.aob.createIssuer(issuerName, 'An issuer', IssuerAccount1.password)
      debug('注册发行商创建的transaction 1', transaction)

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('Register Issuer ok', body)

          expect(err).be.not.ok
          expect(body).to.have.property('success').to.be.true

          done()
        })
    })

    it('with the same name again, Should be fail', async (done) => {
      await node.onNewBlockAsync()

      const transaction = await DdnJS.aob.createIssuer(issuerName, 'An issuer', IssuerAccount2.password)
      debug('注册发行商创建的transaction 2', transaction)

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('Register Issuer with same name fail', body)

          expect(err).be.not.ok
          expect(body).to.have.property('success').to.be.false
          expect(body).to.have.property('error').to.contain('Issuer name/issuer_id already exists')

          done()
        })
    })

    it('with the same IssuerAccount1 again, Should be fail', async (done) => {
      await node.onNewBlockAsync()

      const transaction = await DdnJS.aob.createIssuer(issuerName2, 'An issuer', IssuerAccount1.password)
      debug('注册发行商创建的transaction 3', transaction)

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('Register Issuer with same IssuerAccount1 fail', body)

          expect(err).be.not.ok
          expect(body).to.have.property('success').to.be.false
          expect(body).to.have.property('error').to.contain('Issuer name/issuer_id already exists')

          done()
        })
    })

    it('with IssuerAccount2 who no money, Should be fail', async (done) => {
      await node.onNewBlockAsync()

      const transaction = await DdnJS.aob.createIssuer(issuerName2, 'An issuer', IssuerAccount2.password)
      debug('注册发行商创建的transaction 4', transaction)

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('Register Issuer with no money IssuerAccount2 fail', body)

          expect(err).be.not.ok
          expect(body).to.have.property('success').to.be.false
          expect(body).to.have.property('error').to.contain('Insufficient balance')

          done()
        })
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

  // 2. 注册资产 比如：DDN.CNY
  let currency // 名字本就是 assetName;
  describe('Register Asset', () => {
    it('Should be ok', async (done) => {
      // 必须有 发行商(并且与IssuerAccount1对应)
      currency = issuerName + '.' + node.randomIssuerName('', 3).toUpperCase()
      debug('Asset currency', currency)

      var transaction = await DdnJS.aob.createAsset(currency, 'DDD新币种', '100000000', 2, '', '0', '0', '0', IssuerAccount1.password)

      debug('Asset transaction:', transaction)

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('asset register ok', body)

          expect(err).to.be.not.ok
          expect(body).to.have.property('success').to.be.true

          done()
        })
    })
  })

  // 3. 发行资产，即增加市场流通数量
  describe('Add asset issues', () => {
    it('Should be ok', async (done) => {
      // 等 1 次确认
      await node.onNewBlockAsync()

      // const transaction = await createPluginAsset(DdnUtils.assetTypes.AOB_ISSUE, asset, IssuerAccount1.password)
      const transaction = await DdnJS.aob.createIssue(currency, '100000', IssuerAccount1.password)
      debug('Add issue transaction:', transaction)

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('Add issue ', body)

          expect(err).to.be.not.ok
          expect(body).to.have.property('success').to.be.true

          done()
        })
    })
  })

  // 4. 资产转账
  describe('Transfer Issue', () => {
    it('Should be ok', async (done) => {
      // 等 1 次确认
      await node.onNewBlockAsync()

      // const transaction = await createPluginAsset(DdnUtils.assetTypes.AOB_TRANSFER, obj, IssuerAccount1.password)
      const transaction = await DdnJS.aob.createTransfer(currency, '10', node.Gaccount.address,'主交易备注', '资产交易备注', IssuerAccount1.password)
      debug('aob transfer: ', transaction)

      node.peer.post('/transactions')
        .set('Accept', 'application/json')
        .set('version', node.version)
        .set('nethash', node.config.nethash)
        .set('port', node.config.port)
        .send({
          transaction
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, {
          body
        }) => {
          debug('Transfer issue should be ok', body)

          expect(err).to.be.not.ok
          expect(body).to.have.property('success').to.be.true

          done()
        })
    })
  })
})

// 5. 测试权限
// ACL()
