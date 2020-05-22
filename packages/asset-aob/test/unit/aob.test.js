// passed
import node from '@ddn/node-sdk/lib/test';

import Debug from 'debug';

const debug = Debug('debug');
const expect = node.expect;

// async function registerIssuerAsync(name, desc, {password}) {
//   const res = await node.submitTransactionAsync(node.ddn.aob.createIssuer(name, desc, password));
//   debug('register issuer response', res.body)
//   return res
// }

// async function registerAssetAsync(name, desc, maximum, precision, strategy, {password}) {
//   const res = await node.submitTransactionAsync(node.ddn.aob.createAsset(name, desc, maximum, precision, strategy, 1, 1, 1, password));
//   debug('register asset response', res.body)
//   return res
// }

// async function issueAssetAsync(currency, amount, {password}) {
//   const res = await node.submitTransactionAsync(node.ddn.aob.createIssue(currency, amount, password));
//   debug('issue asset response', res.body)
//   return res
// }

// async function writeoffAssetAsync(currency, {password}) {
//   const res = await node.submitTransactionAsync(node.ddn.aob.createFlags(currency, 2, 1, password));
//   debug('writeoff asset response', res.body)
//   return res
// }

// async function changeFlagsAsync(currency, flagType, flag, {password}) {
//   const res = await node.submitTransactionAsync(node.ddn.aob.createFlags(currency, flagType, flag, password));
//   debug('change flags response', res.body)
//   return res
// }

// async function updateAclAsync(currency, operator, flag, list, {password}) {
//   const res = await node.submitTransactionAsync(node.ddn.aob.createAcl(currency, operator, flag, list, password));
//   debug('update acl response', res.body)
//   return res
// }

// async function transferAsync(currency, amount, recipientId, {password}) {
//   const res = await node.submitTransactionAsync(node.ddn.aob.createTransfer(currency, amount, recipientId, '', password));
//   debug('transfer asset response', res.body)
//   return res
// }

describe('Test AOB', () => {

  describe('Normal caces', () => {
    const ISSUER1 = {
      name: node.randomIssuerName(),
      desc: 'issuer1_desc'
    };

    // const ASSET1 = {
    //   name: 'BTC',
    //   desc: 'asset1_desc',
    //   maximum: '10000000000000',
    //   precision: 6,
    //   strategy: ''
    // };

    it('Get issuers should be ok', async () => {
      const [err, res] = await node.apiGetAsyncE('/aob/issuers');
      
      debug('get /aob/issuers/issuers response', err, res.body)
      expect(err).to.not.exist
      expect(res.body.success).to.be.true
      expect(res.body.result.total).to.be.a('number')
      expect(res.body.result.rows).to.be.instanceOf(Array)
    })

    it('Register issuer should be ok', async () => {
      const trs = await node.ddn.aob.createIssuer(ISSUER1.name, ISSUER1.desc, node.Gaccount.password);
      debug('create issuer trs', trs)
      
      const [err, res] = await node.submitTransactionAsyncE(trs)
      debug('submit issuer response', err, res.body)

      expect(err).to.not.exist
      expect(res.body).to.have.property('success').to.be.true

      await node.onNewBlockAsync()

      const [err2, res2] = await node.apiGetAsyncE(`/aob/issuers/name/${ISSUER1.name}`)
      debug('get /aob/issuers/name/:name response', err2, res2.body)
      expect(err2).to.not.exist
      // expect(res2.body).to.have.property('result')
      // expect(res2.body.result.name).to.equal(ISSUER1.name)
      // expect(res2.body.result.issuer_id).to.equal(node.Gaccount.address)
    })

    // it('Register asset should be ok', async () => {
    //   const currency = `${ISSUER1.name}.${ASSET1.name}`;
    //   const trs = node.ddn.aob.createAsset(
    //     currency,
    //     ASSET1.desc,
    //     ASSET1.maximum,
    //     ASSET1.precision,
    //     ASSET1.strategy,
    //     1,
    //     1,
    //     1,
    //     node.Gaccount.password);
    //   debug('create asset trs', trs)

    //   var [err, res] = await node.submitTransactionAsyncE(trs)
    //   debug('submit asset response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body).to.have.property('success').to.be.true

    //   await node.onNewBlockAsync()

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/issuers/${ISSUER1.name}/assets`)
    //   debug('get /aobasset/issuers/:name/assets response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body.result.total).to.be.a('number')
    //   expect(res.body.result.rows).to.be.instanceOf(Array)

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/${currency}`)
    //   debug('get /aobasset/:name response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body.result.name).to.equal(currency)
    //   expect(res.body.result.desc).to.equal(ASSET1.desc)
    //   expect(res.body.result.maximum).to.equal(ASSET1.maximum)
    //   expect(res.body.result.precision).to.equal(ASSET1.precision)
    //   expect(res.body.result.issuer_id).to.equal(node.Gaccount.address)
    //   expect(res.body.result.quantity).to.equal('0')
    //   expect(res.body.result.acl).to.equal(0)
    //   expect(res.body.result.writeoff).to.equal(0)
    // })

    // it('Issue and transfer asset should be ok', async () => {
    //   const currency = `${ISSUER1.name}.${ASSET1.name}`;
    //   const transferAddress = '12345';

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/balances/${node.Gaccount.address}`)
    //   debug('get issuer balance before issue response', err, res.body)
    //   expect(err).to.not.exist

    //   let issuerBalance = (res.body.result[0] && res.body.result[0].balance) || 0;

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/balances/${transferAddress}`)
    //   debug('get recipient balance before issue response', err, res.body)
    //   expect(err).to.not.exist

    //   let recipientBalance = (res.body.result.balances[0] && res.body.result.balances[0].balance) || 0;

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/${currency}`)
    //   debug('get asset before issue response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body.result.name).to.equal(currency)

    //   let quantity = res.body.asset.quantity;

    //   const amount = '10000000000';
    //   let trs = node.ddn.aob.createIssue(currency, amount, node.Gaccount.password);
    //   debug('create issue trs', trs)

    //   var [err, res] = await node.submitTransactionAsyncE(trs)
    //   debug('submit issue response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body).to.have.property('success').to.be.true

    //   await node.onNewBlockAsync()

    // //DdnUtils.bignum update   issuerBalance = DdnUtils.bignum(issuerBalance).plus(amount).toString()
    //   issuerBalance = DdnUtils.bignum.plus(issuerBalance, amount).toString();
    // //DdnUtils.bignum update   quantity = DdnUtils.bignum(quantity).plus(amount).toString()
    //   quantity = DdnUtils.bignum.plus(quantity, amount).toString();

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/${currency}`)
    //   debug('get asset after issue response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body.result.name).to.equal(currency)
    //   expect(res.body.result.quantity).to.equal(quantity)

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/balances/${node.Gaccount.address}`)
    //   debug('get issuer balance after issue response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body.result).to.be.instanceOf(Array)
    //   expect(res.body.result.length).to.equal(1)
    //   expect(res.body.result[0].currency).to.equal(currency)
    //   expect(res.body.result[0].balance).to.equal(issuerBalance)

    //   const transferAmount = '10';
    //   trs = node.ddn.aob.createTransfer(currency, transferAmount, transferAddress, '', node.Gaccount.password)
    //   debug('create transfer trs', trs)
    //   var [err, res] = await node.submitTransactionAsyncE(trs)
    //   debug('transfer asset response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body).to.have.property('success').to.be.true

    //   await node.onNewBlockAsyncE()

    // //DdnUtils.bignum update   issuerBalance = DdnUtils.bignum(issuerBalance).sub(transferAmount).toString()
    //   issuerBalance = DdnUtils.bignum.minus(issuerBalance, transferAmount).toString();

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/balances/${node.Gaccount.address}`)
    //   debug('get issuer balance response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body.result).to.be.instanceOf(Array)
    //   expect(res.body.result.length).to.equal(1)
    //   expect(res.body.result[0].currency).to.equal(currency)
    //   expect(res.body.result[0].balance).to.equal(issuerBalance)

    // //DdnUtils.bignum update   recipientBalance = DdnUtils.bignum(recipientBalance).plus(transferAmount).toString()
    //   recipientBalance = DdnUtils.bignum.plus(recipientBalance, transferAmount).toString();

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/balances/${transferAddress}`)
    //   debug('get recipient balance response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body.result).to.be.instanceOf(Array)
    //   expect(res.body.result.length).to.equal(1)
    //   expect(res.body.result[0].currency).to.equal(currency)
    //   expect(res.body.result[0].balance).to.equal(recipientBalance)

    // })

    // it('Update flags and acl should be ok', async () => {
    //   const currency = `${ISSUER1.name}.${ASSET1.name}`;

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/${currency}`)
    //   expect(err).to.not.exist
    //   expect(res.body.result.name).to.equal(currency)
    //   expect(res.body.result.acl).to.equal(0)

    //   // get white list before update acl
    //   res = await node.apiGetAsync(`/aobasset/${currency}/acl/1`)
    //   expect(res.body.result.total).to.be.a('number')
    //   expect(res.body.result.rows).to.be.instanceOf(Array)
    //   const origCount = res.body.count;
    //   expect(origCount >= 0).to.be.ok

    //   // change to white list mode
    //   let trs = node.ddn.aob.createFlags(currency, 1, 1, node.Gaccount.password);
    //   var [err, res] = await node.submitTransactionAsyncE(trs)
    //   debug('change flags response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body).to.have.property('success').to.be.true


    //   await node.onNewBlockAsyncE()

    //   var [err, res] = await node.apiGetAsyncE(`/aobasset/${currency}`)
    //   expect(err).to.not.exist
    //   expect(res.body.result.name).to.equal(currency)
    //   expect(res.body.result.acl).to.equal(1)

    //   // add address to white list
    //   const account1 = node.genNormalAccount();
    //   const account2 = node.genNormalAccount();
    //   const whiteList = [account1.address, account2.address];
    //   trs = node.ddn.aob.createAcl(currency, '+', 1, whiteList, node.Gaccount.password)
    //   var [err, res] = await node.submitTransactionAsyncE(trs)
    //   debug('update acl response', err, res.body)
    //   expect(err).to.not.exist
    //   expect(res.body).to.have.property('success').to.be.true

    //   await node.onNewBlockAsync()

    //   // get white list
    //   res = await node.apiGetAsync(`/aobasset/${currency}/acl/1`)
    //   expect(res.body.total).to.be.a('number')
    //   expect(res.body.result.rows).to.be.instanceOf(Array)
    //   expect(res.body.result.total == origCount + 2).to.be.ok

    //   trs = node.ddn.aob.createTransfer(currency, '10', account1.address, '', node.Gaccount.password)
    //   res = await node.submitTransactionAsync(trs)
    //   debug('transfer to account1 response', res.body)
    //   expect(res.body).to.have.property('success').to.be.true

    //   trs = node.ddn.aob.createTransfer(currency, '10', account2.address, '', node.Gaccount.password)
    //   res = await node.submitTransactionAsync(trs)
    //   debug('transfer to account2 response', res.body)
    //   expect(res.body).to.have.property('success').to.be.true

    //   trs = node.ddn.aob.createTransfer(currency, '10', node.genNormalAccount().address, '', node.Gaccount.password)
    //   res = await node.submitTransactionAsync(trs)
    //   debug('transfer to random account response', res.body)
    //   expect(res.body).to.have.property('success').to.be.false
    //   expect(res.body).to.have.property('error').to.match(/^Permission not allowed/)
    // })

  })

//   describe('Register issuer fail cases', () => {

//     it('Invalid parameters', async () => {
//       const account = node.genNormalAccount();
//       let res = await registerIssuerAsync('', 'normal desc', account);
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await registerIssuerAsync('long_name-aaaaaaaaaaaaaa', 'normal desc', account)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await registerIssuerAsync('normalname', '', account)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       const largeString = Buffer.allocUnsafe(5000).toString();
//       res = await registerIssuerAsync('normalname', largeString, account)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await registerIssuerAsync('invalid_name', 'normal desc', account)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await registerIssuerAsync('invalid.name', 'normal desc', account)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)
//     })

//     it('Insufficient balance', async () => {
//       const account = node.genNormalAccount();
//       const res = await registerIssuerAsync(node.randomIssuerName(), 'normal desc', account);
//       expect(res.body).to.have.property('error').to.match(/^Insufficient balance/)
//     })

//     it('Double submit', async () => {
//       const account = node.genNormalAccount();
//       const anotherAccount = node.genNormalAccount();
//       await node.giveMoneyAndWaitAsync([account.address, anotherAccount.address])

//       const registeredName = node.randomIssuerName();
//       let res = await registerIssuerAsync(registeredName, 'normal desc', account);
//       expect(res.body).to.have.property('success').to.be.true

//       res = await registerIssuerAsync(node.randomIssuerName(), 'normal desc', account)
//       expect(res.body).to.have.property('error').to.match(/^Double submit/)

//       res = await registerIssuerAsync(registeredName, 'normal desc', anotherAccount)
//       expect(res.body).to.have.property('error').to.match(/^Double submit/)
//     })

//     it('Double register', async () => {
//       const account = node.genNormalAccount();
//       const anotherAccount = node.genNormalAccount();
//       await node.giveMoneyAndWaitAsync([account.address, anotherAccount.address])

//       const registeredName = node.randomIssuerName();
//       let res = await registerIssuerAsync(registeredName, 'normal desc', account);
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()

//       res = await registerIssuerAsync(node.randomIssuerName(), 'normal desc', account)
//       expect(res.body).to.have.property('error').to.match(/^Double register/)

//       res = await registerIssuerAsync(registeredName, 'normal desc', anotherAccount)
//       expect(res.body).to.have.property('error').to.match(/^Double register/)
//     })
//   })

//   describe('Register asset fail cases', () => {
//     const ISSUER_ACCOUNT = node.genNormalAccount();
//     const ISSUER_NAME = node.randomIssuerName();
//     const VALID_ASSET_NAME = `${ISSUER_NAME}.BTC`;
//     const VALID_DESC = 'valid desc';
//     const VALID_MAXIMUM = '10000000';
//     const VALID_PRECISION = 3;
//     const VALID_STRATEGY = '';

//     beforeAll(async () => {
//       await node.giveMoneyAndWaitAsync([ISSUER_ACCOUNT.address])
//     })

//     it('Invalid asset name', async () => {
//       const INVALID_NAME_CASES = [
//         {
//           error: /^Invalid transaction body/,
//           cases: [
//             '',
//             'ab',
//             '12345678901234567890123'
//           ]
//         },
//         {
//           error: /^Invalid asset full name/,
//           cases: [
//             'huoding_BTC',
//             'ddn BTC',
//             'huo.ding.BTC'
//           ]
//         },
//         {
//           error: /^Invalid asset currency name/,
//           cases: [
//             'ddn.',
//             'ddn.B',
//             'ddn.BT',
//             'ddn.BTC1',
//             'ddn.btc',
//             'ddn.BT-C',
//             'ddn.LONGNAME',
//           ]
//         }
//       ];
//       for (let i = 0; i < INVALID_NAME_CASES.length; ++i) {
//         let error = INVALID_NAME_CASES[i].error

//         for (let name of INVALID_NAME_CASES[i].cases) {
//           let res = await registerAssetAsync(name, VALID_DESC, VALID_MAXIMUM, VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//           debug('register asset fail case', name, res.body)
//           expect(res.body).to.have.property('error').to.match(error)
//         }
//       }
//     })

//     it('Invalid asset desc', async () => {
//       let res = await registerAssetAsync(VALID_ASSET_NAME, '', VALID_MAXIMUM, VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       const largeDesc = Buffer.allocUnsafe(5000).toString();
//       res = await registerAssetAsync(VALID_ASSET_NAME, largeDesc, VALID_MAXIMUM, VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)
//     })

//     it('Invalid asset maximum', async () => {
//       let res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, '', VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, '0', VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)

//       res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, '-1', VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)

//       res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, '1e49', VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)

//       res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, 'NaN', VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)

//       res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, '1000000000000000000000000000000000000000000000001', VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid amount range/)

//       res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, 'invalid_number', VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)

//       res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, '1000.5', VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)
//     })

//     it('Invalid asset precision', async () => {
//       let res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, VALID_MAXIMUM, -1, VALID_STRATEGY, ISSUER_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, VALID_MAXIMUM, 17, VALID_STRATEGY, ISSUER_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)
//     })

//     it('Invalid asset strategy', async () => {
//       const largeString = Buffer.allocUnsafe(300).toString();
//       const res = await registerAssetAsync(VALID_ASSET_NAME, VALID_DESC, VALID_MAXIMUM, VALID_PRECISION, largeString, ISSUER_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)
//     })

//     it('Issuer not exist', async () => {
//       const account = node.genNormalAccount();
//       const name = `${node.randomIssuerName()}.BTC`;
//       const res = await registerAssetAsync(name, VALID_DESC, VALID_MAXIMUM, VALID_PRECISION, VALID_STRATEGY, ISSUER_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Issuer not exists/)
//     })

//     it('Double submit and double register', async () => {
//       const account = node.genNormalAccount();
//       await node.giveMoneyAndWaitAsync([account.address])

//       const issuerName = node.randomIssuerName();
//       const assetName = `${issuerName}.BTC`;
//       let res = await registerIssuerAsync(issuerName, 'normal desc', account);
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()

//       res = await registerAssetAsync(assetName, VALID_DESC, VALID_MAXIMUM, VALID_PRECISION, VALID_STRATEGY, account)
//       expect(res.body).to.have.property('success').to.be.true

//       res = await registerAssetAsync(assetName, VALID_DESC, VALID_MAXIMUM, VALID_PRECISION + 1, VALID_STRATEGY, account)
//       expect(res.body).to.have.property('error').to.match(/^Double submit/)
//       await node.onNewBlockAsync()
//       res = await registerAssetAsync(assetName, VALID_DESC, VALID_MAXIMUM, VALID_PRECISION, VALID_STRATEGY, account)
//       expect(res.body).to.have.property('error').to.match(/^Double register/)
//     })
//   })

//   describe('Parameter validate fail cases', () => {
//     const ISSUE_ACCOUNT = node.genNormalAccount();
//     const ASSET_NAME = 'NotExistName.BTC';

//     it('should fail to issue if amount is invalid', async () => {
//       let res = await issueAssetAsync(ASSET_NAME, '', ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await issueAssetAsync(ASSET_NAME, '0', ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)

//       res = await issueAssetAsync(ASSET_NAME, 'invalid_number', ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)

//       res = await issueAssetAsync(ASSET_NAME, '1000.5', ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Amount should be integer/)
//     })

//     it('should fail to change flags if parameters is invalid', async () => {
//       let res = await changeFlagsAsync(ASSET_NAME, -1, 1, ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Invalid asset flag type/)

//       res = await changeFlagsAsync(ASSET_NAME, 1, -1, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid asset flag/)

//       res = await changeFlagsAsync(ASSET_NAME, 2, -1, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid asset flag/)
//     })

//     it('should fail to update acl if parameters is invalid', async () => {
//       const validFlag = 0;
//       const validOperator = '+';
//       const validList = [node.genNormalAccount().address];
//       let res = await updateAclAsync(ASSET_NAME, '+-', validFlag, validList, ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await updateAclAsync(ASSET_NAME, '|', validFlag, validList, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid acl operator/)

//       res = await updateAclAsync(ASSET_NAME, validOperator, -1, validList, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid acl flag/)

//       res = await updateAclAsync(ASSET_NAME, validOperator, validFlag, [], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid acl list/)

//       const bigList = [];
//       for (let i = 0; i < 11; ++i) {
//         bigList.push(node.genNormalAccount().address)
//       }
//       res = await updateAclAsync(ASSET_NAME, validOperator, validFlag, bigList, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid acl list/)

//       const unUniqList = ['123', '123'];
//       res = await updateAclAsync(ASSET_NAME, validOperator, validFlag, unUniqList, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await updateAclAsync(ASSET_NAME, validOperator, validFlag, [ISSUE_ACCOUNT.address], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Issuer should not be in ACL list/)

//       res = await updateAclAsync(ASSET_NAME, validOperator, validFlag, ['invalid address'], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Acl contains invalid address/)
//     })

//     it('should fail to do anything if asset not exists', async () => {
//       const notExistAssetName = 'NotExistName.CNY';
//       let res = await issueAssetAsync(notExistAssetName, '1', ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Asset not exists/)

//       res = await changeFlagsAsync(notExistAssetName, 1, 1, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Asset not exists/)

//       res = await updateAclAsync(notExistAssetName, '+', 0, ['123'], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Asset not exists/)

//       res = await transferAsync(notExistAssetName, '1', '123', ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Asset not exists/)
//     })
//   })

//   describe('Asset operation fail cases', () => {
//     const ISSUE_ACCOUNT = node.genNormalAccount();
//     const ISSUER_NAME = node.randomIssuerName();
//     const ASSET_NAME = `${ISSUER_NAME}.GOLD`;
//     const MAX_AMOUNT = '100000';

//     beforeAll(async () => {
//       await node.giveMoneyAndWaitAsync([ISSUE_ACCOUNT.address])
//       let res = await registerIssuerAsync(ISSUER_NAME, 'valid desc', ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()

//       res = await registerAssetAsync(ASSET_NAME, 'valid desc', MAX_AMOUNT, 1, '', ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()
//     })

//     it('should have no permission to operate if asset belongs to other account', async () => {
//       const account = node.genNormalAccount();
//       let res = await issueAssetAsync(ASSET_NAME, '1', account);
//       expect(res.body).to.have.property('error').to.match(/^Permission not allowed/)

//       res = await changeFlagsAsync(ASSET_NAME, 1, 1, account)
//       expect(res.body).to.have.property('error').to.match(/^Permission not allowed/)

//       res = await updateAclAsync(ASSET_NAME, '+', 0, [node.genNormalAccount().address], account)
//       expect(res.body).to.have.property('error').to.match(/^Permission not allowed/)
//     })

//     it('should fail to issue if amount exceed the limit', async () => {
//     //DdnUtils.bignum update   var res = await issueAssetAsync(ASSET_NAME, DdnUtils.bignum(MAX_AMOUNT).plus(1).toString(), ISSUE_ACCOUNT)
//       const res = await issueAssetAsync(ASSET_NAME,
//         DdnUtils.bignum.plus(MAX_AMOUNT, 1).toString(), ISSUE_ACCOUNT);

//       expect(res.body).to.have.property('error').to.match(/^Exceed issue limit/)
//     })

//     it('should fail to double submit issuing', async () => {
//       let res = await issueAssetAsync(ASSET_NAME, '1', ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('success').to.be.true
//       res = await issueAssetAsync(ASSET_NAME, '2', ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Double submit/)

//       await node.onNewBlockAsync()
//     })

//     it('should fail to double set flag', async () => {
//       // default acl flag is 0
//       const res = await changeFlagsAsync(ASSET_NAME, 1, 0, ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('error').to.match(/^Flag double set/)
//     })

//     it('should fail to double submit flags', async () => {
//       let res = await changeFlagsAsync(ASSET_NAME, 1, 1, ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('success').to.be.true
//       res = await changeFlagsAsync(ASSET_NAME, 2, 1, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Double submit/)

//       await node.onNewBlockAsync()
//     })

//     it('should fail to doulbe submit acl', async () => {
//       let res = await updateAclAsync(ASSET_NAME, '+', 0, [node.genNormalAccount().address], ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('success').to.be.true
//       res = await updateAclAsync(ASSET_NAME, '+', 0, [node.genNormalAccount().address], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Double submit/)

//       await node.onNewBlockAsync()
//     })

//     it('should fail to add acl if some address is already in acl', async () => {
//       const address1 = node.genNormalAccount().address;
//       const address2 = node.genNormalAccount().address;
//       let res = await updateAclAsync(ASSET_NAME, '+', 0, [address1], ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()

//       res = await updateAclAsync(ASSET_NAME, '+', 0, [address1, address2], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Double add acl address/)

//       res = await updateAclAsync(ASSET_NAME, '+', 1, [address1, address2], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('success').to.be.true

//       await node.onNewBlockAsync()

//       res = await updateAclAsync(ASSET_NAME, '-', 0, [address1, address2], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('success').to.be.true

//       await node.onNewBlockAsync()
//     })

//     it('should fail to do anything if asset is writeoff', async () => {
//       let res = await writeoffAssetAsync(ASSET_NAME, ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()

//       res = await issueAssetAsync(ASSET_NAME, '1', ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Asset already writeoff/)

//       res = await changeFlagsAsync(ASSET_NAME, 1, 1, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Asset already writeoff/)
//       await node.onNewBlockAsync()

//       res = await updateAclAsync(ASSET_NAME, '+', 0, [node.genNormalAccount().address], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Asset already writeoff/)

//       res = await transferAsync(ASSET_NAME, '1', node.genNormalAccount().address, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Asset already writeoff/)
//     })
//   })

//   describe('Test issue strategy', () => {
//     async function registerAssetWithStrategyAsync(maximum, strategy) {
//       const account = node.genNormalAccount();
//       const issuerName = node.randomIssuerName();
//       const assetName = `${issuerName}.NAME`;
//       await node.giveMoneyAndWaitAsync([account.address])
//       let res = await registerIssuerAsync(issuerName, 'valid desc', account);
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()

//       res = await registerAssetAsync(assetName, 'valid desc', maximum, 1, strategy, account)
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()
//       return {
//         account,
//         issuerName,
//         assetName
//       };
//     }
//     it('normal cases should be ok', async () => {
//       const assetInfo = await registerAssetWithStrategyAsync('10000', 'quantity <= maximum / 10 * (height - genesisHeight)');
//       console.log(assetInfo)
//       const account = assetInfo.account;
//       const assetName = assetInfo.assetName;

//       let res = await issueAssetAsync(assetName, '1001', account);
//       expect(res.body).to.have.property('error').to.match(/^Strategy not allowed/)

//       res = await issueAssetAsync(assetName, '1000', account)
//       expect(res.body).to.have.property('success').to.be.true

//       await node.onNewBlockAsync()
//       res = await issueAssetAsync(assetName, '1001', account)
//       expect(res.body).to.have.property('error').to.match(/^Strategy not allowed/)

//       await node.onNewBlockAsync()
//       res = await issueAssetAsync(assetName, '2000', account)
//       expect(res.body).to.have.property('success').to.be.true

//       await node.onNewBlockAsync()

//       const anotherAccount = node.genNormalAccount();
//       await node.giveMoneyAndWaitAsync([anotherAccount.address])
//       res = await transferAsync(assetName, '3001', anotherAccount.address, account)
//       expect(res.body).to.have.property('error').to.match(/^Insufficient asset balance/)

//       res = await transferAsync(assetName, '3000', anotherAccount.address, account)
//       expect(res.body).to.have.property('success').to.be.true
//       res = await transferAsync(assetName, '1', anotherAccount.address, account)
//       expect(res.body).to.have.property('error').to.match(/^Insufficient asset balance/)

//       await node.onNewBlockAsync()

//       res = await node.apiGetAsync(`/aobasset/balances/${account.address}`)
//       debug('get sender\'s balances first time', res.body)
//       expect(res.body.result[0].currency).to.equal(assetName)
//       expect(res.body.result[0].balance).to.equal('0')

//       res = await node.apiGetAsync(`/aobasset/balances/${anotherAccount.address}`)
//       debug('get recipient\'s balances first time', res.body)
//       expect(res.body.result[0].currency).to.equal(assetName)
//       expect(res.body.result[0].balance).to.equal('3000')

//       res = await transferAsync(assetName, '1000', account.address, anotherAccount)
//       expect(res.body).to.have.property('success').to.be.true
//       res = await transferAsync(assetName, '2001', account.address, anotherAccount)
//       expect(res.body).to.have.property('error').to.match(/^Insufficient asset balance/)
//       await node.onNewBlockAsync()

//       res = await node.apiGetAsync(`/aobasset/balances/${account.address}`)
//       debug('get sender\'s balances second time', res.body)
//       expect(res.body.result[0].currency).to.equal(assetName)
//       expect(res.body.result[0].balance).to.equal('1000')

//       res = await node.apiGetAsync(`/aobasset/balances/${anotherAccount.address}`)
//       debug('get recipient\'s balances second time', res.body)
//       expect(res.body.result[0].currency).to.equal(assetName)
//       expect(res.body.result[0].balance).to.equal('2000')
//     })
//   })

//   describe('Test modify permission', () => {
//     const ISSUE_ACCOUNT = node.genNormalAccount();
//     const ISSUER_NAME = node.randomIssuerName();
//     const ASSET_NAME = `${ISSUER_NAME}.SILVER`;
//     const MAX_AMOUNT = '100000';

//     async function registerAssetWithAllowParameters(allowWriteoff, allowWhitelist, allowBlacklist) {
//       const trs = node.ddn.aob.createAsset(ASSET_NAME, 'valid desc', MAX_AMOUNT, 1, '', allowWriteoff, allowWhitelist, allowBlacklist, ISSUE_ACCOUNT.password);
//       const res = await node.submitTransactionAsync(trs);
//       debug('registerAssetWithAllowParameters', res.body)
//       return res
//     }

//     it('Invalid allow parameters', async () => {
//       let res = await registerAssetWithAllowParameters(-1, 1, 1);
//       expect(res.body).to.have.property('error').to.match(/^Asset allowWriteoff is not valid/)

//       res = await registerAssetWithAllowParameters(1, 2, 1)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)

//       res = await registerAssetWithAllowParameters(1, 1, 999)
//       expect(res.body).to.have.property('error').to.match(/^Invalid transaction body/)
//     })

//     it('Flags modifing should be denied with special asset parameters', async () => {
//       await node.giveMoneyAndWaitAsync([ISSUE_ACCOUNT.address])
//       let res = await registerIssuerAsync(ISSUER_NAME, 'valid desc', ISSUE_ACCOUNT);
//       expect(res.body).to.have.property('success').to.be.true
//       await node.onNewBlockAsync()

//       res = registerAssetWithAllowParameters(0, 0, 0)
//       await node.onNewBlockAsync()

//       res = await node.apiGetAsync(`/aobasset/${ASSET_NAME}`)
//       debug('get assets response', res.body)
//       expect(res.body.result.allow_writeoff).to.equal(0)
//       expect(res.body.result.allow_whitelist).to.equal(0)
//       expect(res.body.result.allow_blacklist).to.equal(0)

//       res = await writeoffAssetAsync(ASSET_NAME, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Writeoff not allowed/)

//       res = await changeFlagsAsync(ASSET_NAME, 1, 1, ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Whitelist not allowed/)

//       res = await updateAclAsync(ASSET_NAME, '+', 0, [node.genNormalAccount().address], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Blacklist not allowed/)

//       res = await updateAclAsync(ASSET_NAME, '+', 1, [node.genNormalAccount().address], ISSUE_ACCOUNT)
//       expect(res.body).to.have.property('error').to.match(/^Whitelist not allowed/)
//     })
//   })

})
