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
    return this.tokenSetting.fixedPoint;
  }

  async verify(trs) {
    if (trs.asset.daoConfirmation.state === 0) {
      if (trs.recipient_id) {
        throw new Error('Invalid recipient');
      }
    } else if (trs.asset.daoConfirmation.state === 1) {
      if (!trs.recipient_id) {
        throw new Error('Invalid recipient');
      }
    }
    if (trs.asset.daoConfirmation.state === 0) {
      if (trs.amount !== 0) {
        throw new Error('Invalid transaction amount');
      }
    }
    if (!trs.asset || !trs.asset.daoConfirmation) {
      throw new Error('Invalid transaction asset "Contribution"');
    }
    if (!trs.asset.daoConfirmation.received_address
      || trs.asset.daoConfirmation.received_address.length > 128) {
      throw new Error('received_address is undefined or too long, don`t more than 128 characters.');
    }
    if (!ddnUtils.Address.isAddress(trs.asset.daoConfirmation.received_address)) {
      throw new Error("Invalid confirmation's received_address");
    }
    if (!trs.asset.daoConfirmation.sender_address
      || trs.asset.daoConfirmation.sender_address.length > 128) {
      throw new Error('senderAddress is undefined or too long, don`t more than 128 characters.');
    }
    if (!ddnUtils.Address.isAddress(trs.asset.daoConfirmation.sender_address)) {
      throw new Error("Invalid confirmation's senderAddress");
    }
    if (!trs.asset.daoConfirmation.url
      || trs.asset.daoConfirmation.url.length > 256) {
      throw new Error('url is undefined or too long, don`t more than 256 characters.');
    }
    if (!trs.asset.daoConfirmation.contribution_trs_id
      || trs.asset.daoConfirmation.contribution_trs_id.length > 64) {
      throw new Error('url is undefined or too long, don`t more than 256 characters.');
    }
    if (trs.asset.daoConfirmation.state !== 0
      && trs.asset.daoConfirmation.state !== 1) {
      throw new Error('The value of state only can be: [0,1]');
    }
    // (1)查询getConfirmation是否存在
    const dataArr = await super.queryAsset({
      contribution_trs_id: trs.asset.daoConfirmation.contribution_trs_id,
    }, null, null, 1, 1, 43);
    if (dataArr && dataArr.length >= 1) {
      throw new Error(`The contribution has been confirmed: ${trs.asset.daoConfirmation.contribution_trs_id}`);
    }
    // (2)如果不存在则继续查询
    const dataArr2 = await super.queryAsset({
      transaction_id: trs.asset.daoConfirmation.contribution_trs_id,
    }, null, null, 1, 1, 42);
    if (dataArr2 && dataArr2.length >= 1) {
      const contribution = dataArr[0];
      // 确认的请求地址必须和投稿的接收地址一致
      if (trs.asset.daoConfirmation.sender_address !== contribution.received_address) {
        throw new Error("confirmation's sender address must same as contribution's received address");
      }
      // 确认的接收地址必须和投稿的发送地址一致
      if (trs.asset.daoConfirmation.received_address !== contribution.sender_address) {
        throw new Error("confirmation's received address must same as contribution's sender address");
      }
      // 判断交易的价格是否和投稿的价值一致
      if (trs.asset.daoConfirmation.state === 1) {
        if (trs.amount !== contribution.price) {
          throw new Error(`The transaction's amount must be equal contribution's price: ${contribution.price}`);
        }
      }
    } else {
      throw new Error(`The contribution has been confirmed: ${trs.asset.daoConfirmation.contribution_trs_id}`);
    }
    return null;
  }

  // 新增事务dbTrans ---wly
  async apply(trs, block, sender, dbTrans) {
    if (trs.asset.daoConfirmation.state === 1) {
      await this.runtime.account.setAccount({ address: trs.recipient_id }, dbTrans);
      await this.runtime.account.merge(trs.recipient_id, {
        address: trs.recipient_id,
        balance: trs.amount,
        u_balance: trs.amount,
        block_id: block.id,
        round: this.round.calc(block.height).toString(),
      }, dbTrans);
    }
  }

  // 新增事务dbTrans ---wly
  async undo(trs, block, sender, dbTrans) {
    if (trs.asset.daoConfirmation.state === 1) {
      await this.runtime.account.setAccount({
        address: trs.recipient_id,
      }, dbTrans);
      const amountStr = bignum.minus(0, trs.amount).toString();
      await this.runtime.account.merge(trs.recipient_id, {
        address: trs.recipient_id,
        balance: amountStr,
        u_balance: amountStr,
        block_id: block.id,
        round: this.modules.round.calc(block.height).toString(),
      }, dbTrans);
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
    const trans = trs;
    trans.asset.daoConfirmation = params;
    super.dbSave(trans, dbTrans);
  }
}
module.exports = Confirmation;
