const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');

/**
  * 确认交易
  * @receivedAddress 接收地址（媒体号的钱包地址）
  * @senderAddress 投稿者的钱包地址
  * @url 文章的dat地址
  * @state 0-不接受，1-确认接收
  * @contributionTrsId 投稿的交易id
  * @transactionId 交易id
  *
  * @amout 等于投稿时作者设定的 @price 的数量
  * @fee 0EBT
  */
class Confirmation extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [{
      field: 'str4',
      prop: 'received_address',
    },
    {
      field: 'str5',
      prop: 'sender_address',
    },
    {
      field: 'str6',
      prop: 'url',
    },
    {
      field: 'int1',
      prop: 'state',
    },
    {
      field: 'str2',
      prop: 'contribution_trs_id',
    },
    {
      field: 'str3',
      prop: 'transaction_id',
    },
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  async create(data, trs) {
    const trans = trs;
    if (data.daoConfirmation.state === 0) {
      // 拒绝时没有转账交易
      trans.recipient_id = null; // wxm block database
      trans.amount = '0';
    } else if (data.daoConfirmation.state === 1) {
      trans.recipient_id = data.daoConfirmation.received_address; // wxm block database
      // 此处交易金额=投稿的price
      trans.amount = bignum.new((data.daoContribution.price || 0)).toString();
    }
    trans.asset.daoConfirmation = data.daoConfirmation;

    return trans;
  }

  async calculateFee(trs) {
    if (trs.asset.daoConfirmation.state === 0) {
      return '0'; // 拒绝稿件时手续费为0
    }
    return this.library.base.block.calculateFee();
  }

  async verify(trs, sender, cb) {
    if (trs.asset.daoConfirmation.state === 0) {
      if (trs.recipient_id) {
        return setImmediate(cb, 'Invalid recipient');
      }
    } else if (trs.asset.daoConfirmation.state === 1) {
      if (!trs.recipient_id) {
        return setImmediate(cb, 'Invalid recipient');
      }
    }

    if (trs.asset.daoConfirmation.state === 0) {
      if (trs.amount !== 0) {
        return setImmediate(cb, 'Invalid transaction amount');
      }
    }

    if (!trs.asset || !trs.asset.daoConfirmation) {
      return cb('Invalid transaction asset "Contribution"');
    }

    if (!trs.asset.daoConfirmation.received_address
      || trs.asset.daoConfirmation.received_address.length > 128) {
      return cb('received_address is undefined or too long, don`t more than 128 characters.');
    }

    if (!ddnUtils.Address.isAddress(trs.asset.daoConfirmation.received_address)) {
      return cb("Invalid confirmation's received_address");
    }

    if (!trs.asset.daoConfirmation.sender_address
      || trs.asset.daoConfirmation.sender_address.length > 128) {
      return cb('senderAddress is undefined or too long, don`t more than 128 characters.');
    }

    if (!ddnUtils.Address.isAddress(trs.asset.daoConfirmation.sender_address)) {
      return cb("Invalid confirmation's senderAddress");
    }

    if (!trs.asset.daoConfirmation.url
      || trs.asset.daoConfirmation.url.length > 256) {
      return cb('url is undefined or too long, don`t more than 256 characters.');
    }

    if (!trs.asset.daoConfirmation.contribution_trs_id
      || trs.asset.daoConfirmation.contribution_trs_id.length > 64) {
      return cb('url is undefined or too long, don`t more than 256 characters.');
    }

    if (trs.asset.daoConfirmation.state !== 0
      && trs.asset.daoConfirmation.state !== 1) {
      return cb('The value of state only can be: [0,1]');
    }

    // (1)查询getConfirmation是否存在

    // 判断是否确认过
    this.dao.__private.getConfirmationByContributionTrsId(trs.asset.daoConfirmation.contribution_trs_id, (err, confirmation) => {
      if (err) {
        return cb(err.toString());
      }

      if (!confirmation) {
        getContributions();
        // 判断要确认的投稿是否存在
        this.modules.dao.__private.getContribution(trs.asset.daoConfirmation.contribution_trs_id,
          (err2, contribution) => {
            if (err) {
              return cb(err.toString());
            }
            if (contribution) {
            // 确认的请求地址必须和投稿的接收地址一致
              if (trs.asset.daoConfirmation.sender_address != contribution.received_address) {
                return cb("confirmation's sender address must same as contribution's received address");
              }

              // 确认的接收地址必须和投稿的发送地址一致
              if (trs.asset.daoConfirmation.received_address != contribution.sender_address) {
                return cb("confirmation's received address must same as contribution's sender address");
              }

              // 判断交易的价格是否和投稿的价值一致
              if (trs.asset.daoConfirmation.state == 1) {
                if (trs.amount != contribution.price) {
                  return cb(`The transaction's amount must be equal contribution's price: ${contribution.price}`);
                }
              }
            } else {
              return cb(`The contribution is not find: ${trs.asset.daoConfirmation.contribution_trs_id}`);
            }
            return cb(null, trs);
          });
      } else {
        return cb(`The contribution has been confirmed: ${trs.asset.daoConfirmation.contribution_trs_id}`);
      }
    });
    return null;
  }

  // 新增事务dbTrans ---wly
  async apply(trs, block, sender, dbTrans) {
    if (trs.asset.daoConfirmation.state === 1) {
      this.accounts.setAccountAndGet({
        address: trs.recipient_id,
      }, dbTrans, (err, recipient) => { // wxm block database
        if (err) {
          return cb(err);
        }
        this.accounts.mergeAccountAndGet({
          address: trs.recipient_id, // wxm block database
          balance: trs.amount,
          u_balance: trs.amount,
          block_id: block.id, // wxm block database
          round: this.round.calc(block.height).toString(),
        },
        dbTrans,
        (err) => {
          cb(err);
        });
      });
    } else {
      setImmediate(cb);
    }
  }

  // 新增事务dbTrans ---wly
  async undo(trs, block, sender, dbTrans) {
    if (trs.asset.daoConfirmation.state === 1) {
      this.modules.accounts.setAccountAndGet({
        address: trs.recipient_id,
      }, dbTrans, (err, recipient) => { // wxm block database
        if (err) {
          return cb(err);
        }
        const amountStr = bignum.minus(0, trs.amount).toString();
        this.modules.accounts.mergeAccountAndGet({
          address: trs.recipient_id, // wxm block database
          balance: amountStr,
          u_balance: amountStr,
          block_id: block.id, // wxm block database
          round: this.modules.round.calc(block.height).toString(),
        },
        dbTrans,
        (err) => {
          cb(err);
        });
      });
    } else {
      return null;
    }
  }

  async dbSave(trs, dbTrans) {
    const params = {
      received_address: trs.asset.daoConfirmation.received_address,
      sender_address: trs.asset.daoConfirmation.sender_address,
      url: (`${trs.asset.daoConfirmation.url}`).toLowerCase(),
      state: trs.asset.daoConfirmation.state,
      contribution_trs_id: trs.asset.daoConfirmation.contribution_trs_id,
      transaction_id: trs.id,
      timestamp: trs.timestamp,
    };
    this.dao.insert('confirmation', params, dbTrans);
  }

  // eslint-disable-next-line class-methods-use-this
  async ready(trs, sender) {
    if (sender.multisignatures.length) {
      if (!trs.signatures) {
        return false;
      }
      return trs.signatures.length >= sender.multimin - 1;
    }
    return true;
  }
}
module.exports = Confirmation;
