const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const crypto = require('crypto');
const ed = require('ed25519');
const _ = require('lodash');

class Transfer extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [
      {
        field: 'str1',
        prop: 'currency',
      },
      {
        field: 'str2',
        prop: 'amount',
      },
    ];
  }

  async verify(trs, sender) {
    if (!ddnUtils.Address.isAddress(trs.recipient_id)) {
      throw new Error('Invalid recipient');
    }
    if (!bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount');
    }
    const asset = trs.asset.aobTransfer;
    const error = ddnUtils.Amount.validate(asset.amount);
    if (error) {
      throw new Error(error);
    }
    const data = await super.queryAsset({
      name: asset.currency,
      trs_type: '61',
    }, null, null, 1, 1, 61);
    const assetDetail = data[0];
    if (!assetDetail) {
      throw new Error('Asset not exists');
    }
    if (assetDetail.writeoff) {
      throw new Error('Asset already writeoff');
    }
    if (!assetDetail.allow_whitelist && !assetDetail.allow_blacklist) {
      return null;
    }
    // 检查黑白名单
    const aclTable = assetDetail.acl === 0 ? 'acl_black' : 'acl_white';
    const count1 = await new Promise((resolve) => {
      this.dao.count(aclTable, {
        address: sender.address,
        currency: asset.currency,
      }, (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
    const count2 = await new Promise((resolve) => {
      this.dao.count(aclTable, {
        address: trs.recipient_id,
        currency: asset.currency,
      }, (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
    const isInList = (count1 + count2) !== 0;
    if ((assetDetail.acl === 0) === isInList) {
      throw new Error('Permission not allowed');
    }
    return null;
  }

  // 新增事务dbTrans ---wly
  async apply(trs, block, sender, dbTrans) {
    const transfer = trs.asset.aobTransfer;
    this.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, transfer.amount);
    // (1)
    const assetBalancedata = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
    const balance = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0';
    const newBalance = bignum.plus(balance, `-${transfer.amount}`);
    if (bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (assetBalancedata) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance.toString(),
      }, {
        address: sender.address,
        currency: transfer.currency,
      }, dbTrans);
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString(),
      }, dbTrans);
    }
    // (2)
    const assetBalancedata2 = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: trs.recipient_id,
        currency: transfer.currency,
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
    const balance2 = (assetBalancedata2 && assetBalancedata2.balance) ? assetBalancedata2.balance : '0';
    const newBalance2 = bignum.plus(balance2, transfer.amount);
    if (bignum.isLessThan(newBalance2, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (assetBalancedata2) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance2.toString(),
      }, {
        address: sender.address,
        currency: transfer.currency,
      }, dbTrans);
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString(),
      }, dbTrans);
    }
  }

  async undo(trs, block, sender, dbTrans) {
    const transfer = trs.asset.aobTransfer;
    this.balanceCache.addAssetBalance(trs.recipient_id, transfer.currency, `-${transfer.amount}`);

    // (1)
    const assetBalancedata = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
    const balance = (assetBalancedata && assetBalancedata.balance) ? assetBalancedata.balance : '0';
    const newBalance = bignum.plus(balance, transfer.amount);
    if (bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (assetBalancedata) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance.toString(),
      }, {
        address: sender.address,
        currency: transfer.currency,
      }, dbTrans);
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString(),
      }, dbTrans);
    }
    // (2)
    const assetBalancedata2 = await new Promise((resolve) => {
      this.dao.findOne('mem_asset_balance', {
        address: trs.recipient_id,
        currency: transfer.currency,
      }, ['balance'], (err, rows) => {
        if (err) {
          resolve(err);
        } else {
          resolve(rows);
        }
      });
    });
    const balance2 = (assetBalancedata2 && assetBalancedata2.balance) ? assetBalancedata2.balance : '0';
    const newBalance2 = bignum.plus(balance2, `-${transfer.amount}`);
    if (bignum.isLessThan(newBalance2, 0)) {
      throw new Error('Asset balance not enough');
    }
    if (assetBalancedata2) {
      this.dao.update('mem_asset_balance', {
        balance: newBalance2.toString(),
      }, {
        address: sender.address,
        currency: transfer.currency,
      }, dbTrans);
    } else {
      this.dao.insert('mem_asset_balance', {
        address: sender.address,
        currency: transfer.currency,
        balance: newBalance.toString(),
      }, dbTrans);
    }
  }

  async applyUnconfirmed(trs, sender) {
    const transfer = trs.asset.aobTransfer;
    const balance = this.balanceCache.getAssetBalance(
      sender.address, transfer.currency,
    ) || 0;
    const surplus = bignum.minus(balance, transfer.amount);
    if (bignum.isLessThan(surplus, 0)) {
      throw new Error('Insufficient asset balance');
    }
    this.balanceCache.setAssetBalance(sender.address, transfer.currency, surplus.toString());
    return null;
  }

  async undoUnconfirmed(trs, sender) {
    const transfer = trs.asset.aobTransfer;
    this.balanceCache.addAssetBalance(sender.address, transfer.currency, transfer.amount);
    return null;
  }

  /**
   * 自定义资产Api
   */
  async attachApi(router) {
    router.put('/transfers', async (req, res) => {
      try {
        const result = await this.getList(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });
    router.get('/transactions/my/:address/', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
      try {
        const result = await this.getMyTransactions(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });
    router.get('/transactions/my/:address/:currency', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
      try {
        const result = await this.getMyTransactions(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });
    router.get('/transactions/:currency', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
      try {
        const result = await this.getTransactions(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });
  }

  async transferAsset(req) {
    const { body } = req;
    const validateErrors = await this.ddnSchema.validate({
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
        currency: {
          type: 'string',
          maxLength: 22,
        },
        amount: {
          type: 'string',
          maxLength: 50,
        },
        recipientId: {
          type: 'string',
          minLength: 1,
        },
        publicKey: {
          type: 'string',
          format: 'publicKey',
        },
        secondSecret: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
        multisigAccountPublicKey: {
          type: 'string',
          format: 'publicKey',
        },
        message: {
          type: 'string',
          maxLength: 256,
        },
      },
      required: ['secret', 'amount', 'recipientId', 'currency'],
    }, body);
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
    }

    const hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
    const keypair = ed.MakeKeypair(hash);
    if (body.publicKey) {
      if (keypair.publicKey.toString('hex') !== body.publicKey) {
        return 'Invalid passphrase';
      }
    }
    const promise = new Promise((resolve, reject) => {
      // eslint-disable-next-line consistent-return
      this.balancesSequence.add(async (cb) => {
        if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey.toString('hex')) {
          let account;
          try {
            account = await this.runtime.account.getAccountByPublicKey(
              body.multisigAccountPublicKey,
            );
          } catch (e) {
            return cb(e);
          }
          if (!account) {
            return cb('Multisignature account not found');
          }
          if (!account.multisignatures) {
            return cb('Account does not have multisignatures enabled');
          }
          if (account.multisignatures.indexOf(keypair.publicKey.toString('hex')) < 0) {
            return cb('Account does not belong to multisignature group');
          }
          let requester;
          try {
            requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey);
          } catch (e) {
            return cb(e);
          }
          if (!requester || !requester.public_key) {
            return cb('Invalid requester');
          }
          if (requester.second_signature && !body.secondSecret) {
            return cb('Invalid second passphrase');
          }

          if (requester.public_key === account.public_key) {
            return cb('Invalid requester');
          }

          let secondKeypair = null;

          if (requester.secondSignature) {
            const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
            secondKeypair = ed.MakeKeypair(secondHash);
          }
          let transaction;
          try {
            transaction = await this.runtime.transaction.create({
              type: 65,
              amount: body.amount,
              currency: body.currency,
              sender: account,
              recipientId: body.recipientId,
              keypair,
              requester: keypair,
              secondKeypair,
              message: body.message,
            });
          } catch (e) {
            return cb(e.toString());
          }
          await this.runtime.transaction.receiveTransactions([transaction], cb);
        } else {
          let account;
          try {
            account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'));
          } catch (e) {
            return cb(e);
          }
          if (!account) {
            return cb('Account not found');
          }
          if (account.secondSignature && !body.secondSecret) {
            return cb('Invalid second passphrase');
          }
          let secondKeypair = null;
          if (account.secondSignature) {
            const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
            secondKeypair = ed.MakeKeypair(secondHash);
          }
          let transaction;
          try {
            transaction = this.runtime.transaction.create({
              type: 65,
              currency: body.currency,
              amount: body.amount,
              sender: account,
              recipientId: body.recipientId,
              keypair,
              secondKeypair,
              message: body.message,
            });
          } catch (e) {
            return cb(e.toString());
          }
          this.runtime.transactions.receiveTransactions([transaction], cb);
        }
      }, (err, transactions) => {
        if (err) {
          return reject(err);
        }
        resolve({ success: true, transactionId: transactions[0].id });
      });
    });
    return promise;
  }

  async getMyTransactions(req) {
    const { url } = req;
    const address = url.split('/')[3];
    const currency = url.split('/')[4];
    const { limit, offset } = req.query;
    if (!address) {
      return '无效参数';
    }
    // (1)先查询到对应的transfer中的相关数据表查询到对应数据
    const trsType = await super.getTransactionType();
    const where1 = { trs_type: trsType };
    if (currency) {
      where1.currency = currency;
    }
    const transfer = await super.queryAsset(where1, null, null, offset, limit);
    const tids = _.map(transfer, 'transaction_id');
    const where2 = { id: { $in: tids }, sender_id: address };
    const result = await this.runtime.dataquery.queryFullTransactionData(
      where2, null, null, null, null,
    );
    return {
      transactions: result,
      success: true,
    };
  }

  async getTransactions(req) {
    const { url } = req;
    const currency = url.split('/')[2];
    const { limit, offset } = req.query;
    if (!currency) {
      return '无效参数';
    }
    // (1)先查询到对应的transfer中的相关数据表查询到对应数据
    const trsType = await super.getTransactionType();
    const where1 = { trs_type: trsType, currency };
    const transfer = await super.queryAsset(where1, null, null, offset, limit);
    const tids = _.map(transfer, 'transaction_id');
    const where2 = { id: { $in: tids } };
    const result = await this.runtime.dataquery.queryFullTransactionData(
      where2, null, null, null, null,
    );
    return {
      transactions: result,
      success: true,
    };
  }
}

module.exports = Transfer;
