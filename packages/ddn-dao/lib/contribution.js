const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');

/**
 * 贡献（投稿）交易
 *
 * @receivedAddress 接收地址（媒体号的钱包地址）
 * @senderAddress 投稿者的钱包地址
 * @price 投稿者自定义价格，初期默认为 ‘0’；系统默认为 ‘0’；使用bignumber.js处理；
 * @url 文章的dat地址
 * @transactionId 交易id
 *
 * @fee 0.1EBT
 */
class Confirmation extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [{
      field: 'str2',
      prop: 'title',
    },
    {
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
      prop: 'price',
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
    trans.recipient_id = null; // wxm block database
    trans.amount = '0';
    trans.asset.daoContribution = data.daoContribution;
    return trans;
  }

  async verify(trs) {
    if (trs.recipient_id) {
      throw new Error('Invalid recipient');
    }
    if (!bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount');
    }
    if (!trs.asset || !trs.asset.daoContribution) {
      throw new Error('Invalid transaction asset "Contribution"');
    }
    if (!trs.asset.daoContribution.title || trs.asset.daoContribution.title.length > 128) {
      throw new Error('title is undefined or too long, don`t more than 128 characters.');
    }
    if (!trs.asset.daoContribution.received_address
      || trs.asset.daoContribution.received_address.length > 128) {
      throw new Error('received_address is undefined or too long, don`t more than 128 characters.');
    }
    if (!ddnUtils.Address.isAddress(trs.asset.daoContribution.received_address)) {
      throw new Error("Invalid contribution's received_address");
    }
    if (!trs.asset.daoContribution.sender_address
      || trs.asset.daoContribution.sender_address.length > 128) {
      throw new Error('sender_address is undefined or too long, don`t more than 128 characters.');
    }
    if (!ddnUtils.Address.isAddress(trs.asset.daoContribution.sender_address)) {
      throw new Error("Invalid contribution's sender_address");
    }
    if (!trs.asset.daoContribution.url
      || trs.asset.daoContribution.url.length > 256) {
      throw new Error('url is undefined or too long, don`t more than 256 characters.');
    }

    if (bignum.isNaN(trs.asset.daoContribution.price)) {
      throw new Error("Invalid contribution's price.");
    }

    this.dao.getOrgByOrgAddress(trs.asset.daoContribution.received_address,
      (err, org) => {
        if (err || !org) {
          throw new Error('no org was found based on received_address');
        }
        this.dao.getEffectiveOrgByOrgId(org.org_id, (err2, org2) => {
          if (err2) {
            throw new Error('no org was found based on orgId');
          }
          if (org2.address !== org.address) {
            throw new Error(`not an effective org: ${trs.asset.daoContribution.received_address}`);
          }
          throw new Error(null, trs);
        });
      });
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  async getBytes(trs) {
    const asset = trs.asset.daoContribution;
    // eslint-disable-next-line no-undef
    const bb = new ByteBuffer();
    bb.writeUTF8String(asset.title);
    bb.writeUTF8String(asset.received_address);
    bb.writeUTF8String(asset.sender_address);
    bb.writeUTF8String(asset.price);
    bb.writeUTF8String(asset.url);
    bb.flip();
    return bb.toBuffer();
  }

  // eslint-disable-next-line class-methods-use-this
  async dbRead(raw) {
    if (raw && raw.contribution_url) {
      const result = {
        title: raw.contribution_title,
        received_address: raw.contribution_receivedAddress,
        sender_address: raw.contribution_senderAddress,
        price: raw.contribution_price,
        url: raw.contribution_url,
        transaction_id: raw.contribution_transactionId,
        timestamp: raw.contribution_timestamp,
      };
      return {
        daoContribution: result,
      };
    }
    return null;
  }

  async dbSave(trs, dbTrans) {
    const newData = {
      title: trs.asset.daoContribution.title,
      received_address: trs.asset.daoContribution.received_address,
      sender_address: trs.asset.daoContribution.sender_address,
      price: trs.asset.daoContribution.price,
      url: (`${trs.asset.daoContribution.url}`).toLowerCase(),
      transaction_id: trs.id,
      timestamp: trs.timestamp,
    };
    const trans = trs;
    trans.asset.daoContribution = newData;
    await super.dbSave(trans, dbTrans);
  }
}
module.exports = Confirmation;
