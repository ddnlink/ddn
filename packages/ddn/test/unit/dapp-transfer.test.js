let crypto = require('crypto')
let bignum = require('@ddn/bignum-utils');
let extend = require('extend')
let node = require('./../variables.js')
let DEBUG = require('debug')('dapp-transfer')
let expect = node.expect

let DAPP_CURRENCY = "DDN";

let DAPP_TEMPLATE = {
    "name": "ddn-hello-dapp",
    "link": "https://github.com/sqfasd/ddn-hello-dapp/archive/master.zip",
    "category": 1,
    "description": "A hello world demo for ddn dapp",
    "tags": "ddn,dapp,demo",
    "icon": "http://o7dyh3w0x.bkt.clouddn.com/hello.png",
    "type": 0
}

async function createPluginAsset(type, asset, secret, secondSecret) {
    return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret, secondSecret)
}

function genNormalAccounts(n) {
    let accounts = []
    for (let i = 0; i < n; ++i) {
        accounts.push(node.genNormalAccount())
    }
    return accounts
}

async function createTransfer(address, amount, secret, second_secret) {
    return await node.ddn.transaction.createTransaction(address, amount, null, secret, second_secret)
}

async function registerDAppAsync(options, account) {
    // node.ddn.init.init();
    options.fee = '10000000000';
    const dappData = await createPluginAsset(11, options, account.password)
    let res = await node.submitTransactionAsync(dappData);
    // let res = await node.submitTransactionAsync(node.ddn.dapp.createDApp(options, account.password))
    DEBUG('register dapp response', res.body)
    return res
}

async function inTransferAsync(options, account) {
    // node.ddn.init.init();
    const inTransferData = await createPluginAsset(12, options, account.password)
    let res = await node.submitTransactionAsync(inTransferData)
    DEBUG('in transfer response', res.body)
    return res
}

async function outTransferAsync(options, account) {
    let outTransferData = await createPluginAsset(13, options, account.password);
    // let trs = node.ddn.transfer.createOutTransfer(options.recipientId, options.dappId, options.transactionId, options.currency, options.amount, account.password)
    let res = await node.submitTransactionAsync(outTransferData)
    DEBUG('out transfer response', res.body)
    return res
}

async function getAssetBalanceAsync(address, currency) {
    let res = await node.apiGetAsync('/aobasset/balances/' + address + '/' + currency)
    DEBUG('get asset balance response', res.body)
    expect(res.body.result.currency).to.equal(currency)
    return res.body.result.balance
}

async function getDAppBalanceAsync(dappId, currency) {
    let res = await node.apiGetAsync('/dapp/balances/' + dappId + '/' + currency)
    DEBUG('get dapp balance response', res.body)
    expect(res.body).to.have.property('success').to.be.true
    return res.body.result.balance
}

describe('dapp transfer', function () {

    // (1)加载插件
    node.ddn.init.init();
    
    let delegateAccounts = genNormalAccounts(5)
    let public_key = delegateAccounts.map((a) => {
        return a.public_key
    })
    let dapp = extend(true, { delegates: public_key, unlock_delegates: 3 }, DAPP_TEMPLATE)
    dapp.name = node.randomUsername()
    dapp.link = dapp.link.replace('ddn', node.randomUsername())
    let dappId = ''

    let issuerName = node.randomIssuerName()
    let assetName = 'CNY'

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

    it('should be ok to register dapp with valid params', async () => {
        dapp.delegates = dapp.delegates.join(',');
        let res = await registerDAppAsync(dapp, node.Gaccount)
        // console.log(JSON.stringify(res));
        expect(res.body).to.have.property('success').to.be.true
        dappId = res.body.transactionId
        await node.onNewBlockAsync()
    })

    it('should be ok to transfer ' + DAPP_CURRENCY + ' to an app', async () => {
        let account = node.genNormalAccount()
        await node.giveMoneyAndWaitAsync([account.address])

        let res = await node.apiGetAsync('/accounts/getBalance?address=' + account.address)
        expect(res.body).to.have.property('success').to.be.true

        let balance1 = res.body.balance
        const inTransferAmount = '100000000';
        const options = {
            dapp_id: dappId,
            currency: DAPP_CURRENCY,
            amount: inTransferAmount
        }
        res = await inTransferAsync(options, account)
        expect(res.body).to.have.property('success').to.be.true

        await node.onNewBlockAsync()
        res = await node.apiGetAsync('/accounts/getBalance?address=' + account.address)
        expect(res.body).to.have.property('success').to.be.true

        let balance2 = res.body.balance
        expect(balance1 - parseInt(inTransferAmount) - node.Fees.transactionFee).to.equal(balance2)

        res = await node.apiGetAsync('/dapp/balances/' + dappId + '/' + DAPP_CURRENCY)
        DEBUG('get dapp balance response', res.body)
        expect(res.body).to.have.property('success').to.be.true

        let dappBalance = res.body.result.balance
        expect(dappBalance).to.equal(String(inTransferAmount))
    })

    it('should be ok to transfer assets to an app', async () => {
        let account = node.genNormalAccount()
        await node.giveMoneyAndWaitAsync([account.address])

        let currency = issuerName + '.' + assetName
        let maximum = '10000000000'
        let issueAmount = '1000000000'

        // (1)加载插件
        // node.ddn.init.init();
        // (2)注册资产商
        var issuer = {
            name: issuerName,
            desc: 'issuer desc',
            // issuer_id: account.address,
            fee: '10000000000',
        }
        var transaction_aob_issuer = await createPluginAsset(60, issuer, account.password);
        let res = await node.submitTransactionAsync(transaction_aob_issuer)
        // let res = await node.submitTransactionAsync(node.ddn.aob.createIssuer(issuerName, 'issuer desc', account.password))
        expect(res.body).to.have.property('success').to.be.true
        await node.onNewBlockAsync()

        //（3）注册资产
        var obj = {
            name: currency,
            desc: 'asset desc',
            maximum: maximum,
            precision: 6,
            strategy: '',
            allow_blacklist: '1',
            allow_whitelist: '1',
            allow_writeoff: '1',
            fee: '50000000000'
        }
        var transaction_aob_asset = await createPluginAsset(61, obj, account.password);
        // let trs = node.ddn.aob.createAsset(
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
        var obj = {
            currency: currency,
            aobAmount: issueAmount
        }
        var transaction_aob_issue = await createPluginAsset(64, obj, account.password);
        res = await node.submitTransactionAsync(transaction_aob_issue)
        // res = await node.submitTransactionAsync(node.ddn.aob.createIssue(currency, issueAmount, account.password))
        expect(res.body).to.have.property('success').to.be.true
        await node.onNewBlockAsync()

        let balance1 = await getAssetBalanceAsync(account.address, currency)
        expect(balance1).to.equal(issueAmount)

        let transferOptions = {
            dapp_id: dappId,
            currency: currency,
            aobAmount: '100000000'
        }
        var transaction_dapp_in_transfer = await createPluginAsset(12, transferOptions, account.password);
        res = await node.submitTransactionAsync(transaction_dapp_in_transfer)
        // res = await inTransferAsync(transferOptions, account)
        expect(res.body).to.have.property('success').to.be.true

        await node.onNewBlockAsync()

        let balance2 = await getAssetBalanceAsync(account.address, currency)

        //bignum update expect(bignum(balance1).sub(transferOptions.amount).toString()).to.equal(balance2)
        expect(bignum.minus(balance1, transferOptions.amount).toString()).to.equal(balance2)

        res = await node.apiGetAsync('/dapp/balances/' + dappId + '/' + currency)
        DEBUG('get dapp balance response', res.body)
        expect(res.body).to.have.property('success').to.be.true
        let dappBalance = res.body.result.balance
        expect(dappBalance).to.equal(String(transferOptions.amount))
    })

    // it('should be failed to transfer from app to account with invalid params', async () => {
    //   let recipientAccount = node.genNormalAccount()
    //   let dappBalance = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
    //   let transferOptions = {
    //     recipient_id: recipientAccount.address,
    //     dapp_id: dappId,
    //     transaction_id: node.randomTid(),
    //     currency: DAPP_CURRENCY,
    //     aobAmount: bignum.plus(dappBalance, 1).toString()
    //   }
    //   let res = await outTransferAsync(transferOptions, recipientAccount)
    //   expect(res.body).to.have.property('error').to.match(/^Sender must be dapp delegate/)

    //   let trs = node.ddn.transfer.createOutTransfer(recipientAccount.address, dappId, node.randomTid(), DAPP_CURRENCY, '1', delegateAccounts[0].password)
    //   res = await node.submitTransactionAsync(trs)
    //   DEBUG('submit out transfer response', res.body)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid signature number/)

    //   trs.signatures = []
    //   for (let i = 0; i < delegateAccounts.length; ++i) {
    //     trs.signatures.push(node.ddn.transfer.signOutTransfer(trs, delegateAccounts[i].password))
    //   }
    //   trs.signatures.push(node.ddn.transfer.signOutTransfer(trs, recipientAccount.password))
    //   res = await node.submitTransactionAsync(trs)
    //   DEBUG('submito out transfer response', res.body)
    //   expect(res.body).to.have.property('error').to.match(/^Invalid signature number/)
    //   trs.signatures = []
    //   for (let i = 0; i < dapp.unlockDelegates; ++i) {
    //     trs.signatures.push(node.ddn.transfer.signOutTransfer(trs, node.genNormalAccount().password))
    //   }
    //   res =await node.submitTransactionAsync(trs)
    //   DEBUG('submit out transfer response', res.body)
    //   expect(res.body).to.have.property('error').to.match(/^Valid signatures not enough/)
    // })

    it('should be ok to transfer ' + DAPP_CURRENCY + ' from app to account', async () => {
        var transaction = await createTransfer(delegateAccounts[0].address, "50000000", node.Gaccount.password);

        node.peer.post("/transactions")
            .set("Accept", "application/json")
            .set("version", node.version)
            .set("nethash", node.config.nethash)
            .set("port", node.config.port)
            .send({
                transaction: transaction
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .end(function (err, res) {
                // console.log(res.body);
                node.expect(res.body).to.have.property("success").to.be.true;
            });

        await node.onNewBlockAsync()

        let recipientAccount = node.genNormalAccount()
        let amount = '10000000'
        let dappBalance1 = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
        // let trs = node.ddn.transfer.createOutTransfer(recipientAccount.address, dappId, node.randomTid(), DAPP_CURRENCY, amount, delegateAccounts[0].password)
        let outTransferData = {
            // receive_address: recipientAccount.address,
            recipient_id: recipientAccount.address,
            dapp_id: dappId,
            transaction_id: node.randomTid(),
            currency: DAPP_CURRENCY,
            aobAmount: amount
        }

        let trs = await createPluginAsset(13, outTransferData, delegateAccounts[0].password);

        // let trs = await outTransferAsync(outTransferData, delegateAccounts[0]);

        trs.signatures = [];
        for (let i = 0; i < dapp.unlock_delegates; i++) {
            trs.signatures.push(await node.ddn.transfer.signOutTransfer(trs, delegateAccounts[i].password))
        }

        let res = await node.submitTransactionAsync(trs)
        DEBUG('submit out transfer response', res.body)
        expect(res.body).to.have.property('success').to.be.true

        await node.onNewBlockAsync()

        let dappBalance2 = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
        //bignum update expect(bignum(dappBalance1).sub(amount).sub(node.Fees.transactionFee).toString()).to.equal(dappBalance2)
        expect(bignum.minus(dappBalance1, amount, node.Fees.transactionFee).toString()).to.equal(dappBalance2)

        res = await node.apiGetAsync('/accounts/getBalance?address=' + recipientAccount.address)
        expect(res.body).to.have.property('success').to.be.true
        let recipientBalance = res.body.balance
        expect(String(recipientBalance)).to.equal(amount)
    })

    // it('should be ok to transfer assets from app to account', async () => {
    //   let recipientAccount = node.genNormalAccount()
    //   let currency = issuerName + '.' + assetName
    //   let amount = '10000000'
    //   let dappBalance1 = await getDAppBalanceAsync(dappId, currency)
    //   let dappDdnBalance1 = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
    //   let trs = node.ddn.transfer.createOutTransfer(recipientAccount.address, dappId, node.randomTid(), currency, amount, delegateAccounts[0].password)
    //   trs.signatures = []
    //   for (let i = 0; i < dapp.unlockDelegates; ++i) {
    //     trs.signatures.push(node.ddn.transfer.signOutTransfer(trs, delegateAccounts[i].password))
    //   }
    //   let res = await node.submitTransactionAsync(trs)
    //   DEBUG('submit out transfer response', res.body)
    //   expect(res.body).to.have.property('success').to.be.true

    //   await node.onNewBlockAsync()

    //   let dappBalance2 = await getDAppBalanceAsync(dappId, currency)
    //   let dappDdnBalance2 = await getDAppBalanceAsync(dappId, DAPP_CURRENCY)
    //   //bignum update expect(bignum(dappBalance1).sub(amount).toString()).to.equal(dappBalance2)
    //   //bignum update expect(bignum(dappDdnBalance1).sub(node.Fees.transactionFee).toString()).to.equal(dappDdnBalance2)
    //   expect(bignum.minus(dappBalance1, amount).toString()).to.equal(dappBalance2)
    //   expect(bignum.minus(dappDdnBalance1, node.Fees.transactionFee).toString()).to.equal(dappDdnBalance2)

    //   res = await node.apiGetAsync('/accounts/getBalance?address=' + recipientAccount.address)
    //   expect(res.body).to.have.property('success').to.be.true
    //   let recipientBalance = await getAssetBalanceAsync(recipientAccount.address, currency)
    //   expect(String(recipientBalance)).to.equal(amount)
    // })
})