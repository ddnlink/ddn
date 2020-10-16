import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import {DdnJS, node} from '../../ddn-js'

const debug = Debug('debug')

async function createPluginAsset(type, asset, secret, secondSecret) {
  return await DdnJS.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
}

export const ACL = () => {
  describe('Modify permission', () => {
    const ISSUE_ACCOUNT = node.genNormalAccount()
    const ISSUER_NAME = node.randomIssuerName()
    const ASSET_NAME = `${ISSUER_NAME}.CNY`
    const MAX_AMOUNT = '100000'

    async function registerIssuerAsync(name, desc, {password}) {
      const trs = await DdnJS.aob.createIssuer(name, desc, password)
      const res = await node.submitTransactionAsync(trs)
      debug('register issuer response', res.body)
      return res
    }

    // 只能在注册的时候开启/关闭黑白名单
    async function registerAssetWithAllowParameters(allowWriteoff, allowWhitelist, allowBlacklist) {
      const trs = await DdnJS.aob.createAsset(
        ASSET_NAME,
        'valid desc',
        MAX_AMOUNT,
        1,
        '',
        allowWriteoff + '',
        allowWhitelist + '',
        allowBlacklist + '',
        ISSUE_ACCOUNT.password
      )
      const res = await node.submitTransactionAsync(trs)
      debug('registerAssetWithAllowParameters', res.body)
      return res
    }

    async function writeoffAssetAsync(currency, {password}) {
      const trs = await DdnJS.aob.createFlags(currency, 2, 1, password)
      const res = await node.submitTransactionAsync(trs)
      debug('writeoff asset response', res.body)
      return res
    }

    async function changeFlagsAsync(currency, flagType, flag, {password}) {
      const trs = await DdnJS.aob.createFlags(currency, flagType, flag, password)

      const res = await node.submitTransactionAsync(trs)
      debug('change flags response', res.body)
      return res
    }

    async function updateAclAsync(currency, operator, flag, list, {password}) {
      const trs = await DdnJS.aob.createAcl(currency, operator, flag, list, password)
      const res = await node.submitTransactionAsync(trs)
      debug('update acl response', res.body)
      return res
    }

    it('Invalid allow parameters', async done => {
      let res = await registerAssetWithAllowParameters(-1, 1, 1)
      expect(res.body)
        .to.have.property('error')
        .to.match(/^Asset allowWriteoff is not valid/)

      res = await registerAssetWithAllowParameters(1, 2, 1)
      expect(res.body)
        .to.have.property('error')
        .to.match(/^Asset allowWhitelist is not valid form asset-aob/)

      res = await registerAssetWithAllowParameters(1, 1, 999)
      expect(res.body)
        .to.have.property('error')
        .to.match(/^Asset allowBlacklist is not valid form asset-aob/)

      done()
    })

    // 仅仅改变 flag 是无法启用黑白名单的，需要在创建资产的时候就要决定是否开启
    it('Flags modifing should be denied with special asset parameters', async done => {
      const ISSUE_ACCOUNT = node.genNormalAccount()
      const ISSUER_NAME = node.randomIssuerName()
      const ASSET_NAME = `${ISSUER_NAME}.CNY`

      async function registerAssetWithAllowParameters(allowWriteoff, allowWhitelist, allowBlacklist) {
        const trs = await DdnJS.aob.createAsset(
          ASSET_NAME,
          'valid desc',
          MAX_AMOUNT,
          1,
          '',
          allowWriteoff + '',
          allowWhitelist + '',
          allowBlacklist + '',
          ISSUE_ACCOUNT.password
        )
        const res = await node.submitTransactionAsync(trs)
        debug('registerAssetWithAllowParameters 2', res.body)
        return res
      }

      await node.giveMoneyAndWaitAsync([ISSUE_ACCOUNT.address])
      let res = await registerIssuerAsync(ISSUER_NAME, 'valid desc', ISSUE_ACCOUNT)
      expect(res.body).to.have.property('success').to.be.true

      await node.onNewBlockAsync()

      res = registerAssetWithAllowParameters(0, 0, 0)
      await node.onNewBlockAsync()

      res = await node.apiGetAsync(`/aob/assets/${ASSET_NAME}`)
      debug('get assets response', ASSET_NAME, res.body)
      expect(res.body.result.allow_writeoff).to.equal('0')
      expect(res.body.result.allow_whitelist).to.equal('0')
      expect(res.body.result.allow_blacklist).to.equal('0')

      // 开启注销或黑白名单功能
      res = await writeoffAssetAsync(ASSET_NAME, ISSUE_ACCOUNT)
      expect(res.body)
        .to.have.property('error')
        .to.match(/^Writeoff not allowed/)

      res = await changeFlagsAsync(ASSET_NAME, 1, 1, ISSUE_ACCOUNT)
      expect(res.body)
        .to.have.property('error')
        .to.match(/^Whitelist not allowed/)

      // 改变用户权限
      res = await updateAclAsync(ASSET_NAME, '+', 0, [node.genNormalAccount().address].join(','), ISSUE_ACCOUNT)
      expect(res.body)
        .to.have.property('error')
        .to.match(/^Blacklist not allowed/)

      res = await updateAclAsync(ASSET_NAME, '+', 1, [node.genNormalAccount().address].join(','), ISSUE_ACCOUNT)
      expect(res.body)
        .to.have.property('error')
        .to.match(/^Whitelist not allowed/)

      done()
    }, 50000) // 这里运行了多个 onNewBlockAsync 时间超过了 30s 所以必然超时（20000ms），只能修改时间

    // 白名单开关，开启白名单
    describe('use whitelist to set acl', () => {
      const IssuerAccountWhitelist = node.genNormalAccount()
      const ISSUER_NAME = node.randomIssuerName()
      const currency = `${ISSUER_NAME}.CNY`
      const MAX_AMOUNT = '100000'

      async function registerAssetWithAllowParameters(allowWriteoff, allowWhitelist, allowBlacklist) {
        const trs = await DdnJS.aob.createAsset(
          currency,
          'valid desc',
          MAX_AMOUNT,
          1,
          '',
          allowWriteoff + '',
          allowWhitelist + '',
          allowBlacklist + '',
          IssuerAccountWhitelist.password
        )
        const res = await node.submitTransactionAsync(trs)
        debug('registerAssetWithAllowParameters 3', res.body)
        return res
      }

      it('Valid allow parameters', async () => {
        await node.giveMoneyAndWaitAsync([IssuerAccountWhitelist.address])
        let res = await registerIssuerAsync(ISSUER_NAME, 'valid desc', IssuerAccountWhitelist)
        expect(res.body).to.have.property('success').to.be.true

        await node.onNewBlockAsync()

        // 开启
        res = await registerAssetWithAllowParameters(1, 1, 1)
        debug('Valid allow parameters', res.body)
        expect(res.body).to.have.property('success')
      }, 50000)

      // 发行资产，即增加市场流通数量
      it('Add asset issues, Should be ok', async done => {
        // 等 1 次确认
        await node.onNewBlockAsync()

        const obj = {
          currency,
          aobAmount: '100000'
        }

        const transaction = await createPluginAsset(DdnUtils.assetTypes.AOB_ISSUE, obj, IssuerAccountWhitelist.password)

        // const transaction = await DdnJS.aob.createIssue(currency, "100000", IssuerAccount1.password);
        debug('Add issue transaction 2:', transaction)

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
          .end((err, {body}) => {
            debug('Add issue 2', body)

            expect(err).to.be.not.ok
            expect(body).to.have.property('success').to.be.true

            done()
          })
      })

      it('take on whitelist, Should be ok', async done => {
        await node.onNewBlockAsync()

        const obj = {
          currency,
          flag: 1, // 开启白名单
          flag_type: 1 // 黑白名单
        }
        const transaction = await createPluginAsset(DdnUtils.assetTypes.AOB_FLAG, obj, IssuerAccountWhitelist.password)
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
          .end((err, {body}) => {
            debug('take on whitelist ok', body)

            expect(err).be.not.ok
            expect(body).to.have.property('success').to.be.true

            done()
          })
      })

      // 不在白名单里，所以没有权限
      it('Transfer outside whitelist firstly, Should be fail', async done => {
        await node.onNewBlockAsync()

        const obj = {
          recipientId: node.Daccount.address,
          currency,
          aobAmount: '10',
          message: '测试转账失败'
        }

        const transaction = await createPluginAsset(
          DdnUtils.assetTypes.AOB_TRANSFER,
          obj,
          IssuerAccountWhitelist.password
        )

        // var transaction = DdnJS.aob.createTransfer(randomCurrencName(), "10", IssuerAccountWhitelist.address, "测试转账", IssuerAccountWhitelist.password);
        debug('transaction', transaction)

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
          .end((err, {body}) => {
            debug('No permission fail', body)

            expect(err).to.be.not.ok

            expect(body).to.have.property('success').to.be.false
            expect(body).to.have.property('error').equal('Permission not allowed.')

            done()
          })
      })

      it(`Add ${node.Daccount.address} to whitelist, Should be ok`, async done => {
        const obj = {
          currency,
          flag: 1,
          operator: '+',
          list: [node.Daccount.address].join(',')
        }
        const transaction = await createPluginAsset(63, obj, IssuerAccountWhitelist.password) // AobAcl - 63
        node.peer
          .post('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({transaction})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, {body}) => {
            debug('add to whitelist ok', body)

            expect(err).be.not.ok

            expect(body).to.have.property('success').to.be.true

            done()
          })
      })

      it('Transfer in whitelist, Should be ok', async done => {
        await node.onNewBlockAsync()

        const obj = {
          recipientId: node.Daccount.address,
          currency,
          aobAmount: '10',
          message: '测试转账'
        }

        const transaction = await createPluginAsset(65, obj, IssuerAccountWhitelist.password)
        node.peer
          .post('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({transaction})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, {body}) => {
            debug('Transfer in whitelist', body)
            expect(err).be.not.ok

            expect(body).to.have.property('success').to.be.true

            done()
          })
      })

      it('Delete from whitelist, Should be ok', async done => {
        const obj = {
          currency,
          flag: 1,
          operator: '-',
          list: [node.Daccount.address].join(',')
        }
        const transaction = await createPluginAsset(63, obj, IssuerAccountWhitelist.password)

        node.peer
          .post('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({transaction})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, {body}) => {
            debug('Delete from whitelist', body)

            expect(err).be.not.ok

            expect(body).to.have.property('success').to.be.true

            done()
          })
      })

      it('Transfer outside whitelist, Should be fail again', async done => {
        await node.onNewBlockAsync()

        const obj = {
          recipientId: node.Daccount.address,
          currency,
          aobAmount: '10',
          message: '测试转账'
        }

        const transaction = await createPluginAsset(65, obj, IssuerAccountWhitelist.password)

        node.peer
          .post('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({transaction})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, {body}) => {
            debug('Transfer outside whitelist', body)

            expect(err).be.not.ok

            expect(body).to.have.property('success').to.be.false
            expect(body).to.have.property('error').equal('Permission not allowed.')

            done()
          })
      })

      it('Take off whitelist, Should be ok', async done => {
        const obj = {
          currency,
          flag: 0, // 关闭
          flag_type: 1
        }
        const transaction = await createPluginAsset(DdnUtils.assetTypes.AOB_FLAG, obj, IssuerAccountWhitelist.password)

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
          .end((err, {body}) => {
            debug('Take off whitelist', body)

            expect(err).be.not.ok
            expect(body).to.have.property('success').to.be.true

            done()
          })
      })

      it('资产转账 Should be ok', async done => {
        await node.onNewBlockAsync()

        const obj = {
          recipientId: node.Daccount.address,
          currency,
          aobAmount: '10',
          message: '测试转账'
        }

        const transaction = await createPluginAsset(65, obj, IssuerAccountWhitelist.password)

        node.peer
          .post('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({transaction})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, {body}) => {
            debug(body)

            expect(err).be.not.ok

            expect(body).to.have.property('success').to.be.true

            done()
          })
      })
    })
  })
}
