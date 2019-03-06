const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
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
  propsMapping() {
    return [{
        field: "str2",
        prop: "title",
      },
      {
        field: "str4",
        prop: "received_address",
      },
      {
        field: "str5",
        prop: "sender_address",
      },
      {
        field: "str6",
        prop: "url",
      },
      {
        field: "int1",
        prop: "price",
      },
      {
        field: "str3",
        prop: "transaction_id"
      }
    ];
  }

  create(data, trs) {
    trs.recipient_id = null //wxm block database
    trs.amount = "0"
    trs.asset.daoContribution = data.daoContribution;

    return trs;
  }

  calculateFee(trs, sender) {
    return self.library.base.block.calculateFee();
  }

  verify(trs, sender, cb) {
    trs.asset.daoContribution = trs.asset.daoContribution;

    if (trs.recipient_id) {
      return setImmediate(cb, 'Invalid recipient');
    }

    //bignum update if (trs.amount != 0) {
    if (!bignum.isZero(trs.amount)) {
      return setImmediate(cb, 'Invalid transaction amount');
    }

    if (!trs.asset || !trs.asset.daoContribution) {
      return cb('Invalid transaction asset "Contribution"');
    }

    if (!trs.asset.daoContribution.title ||
      trs.asset.daoContribution.title.length > 128) {
      return cb('title is undefined or too long, don`t more than 128 characters.');
    }

    if (!trs.asset.daoContribution.received_address ||
      trs.asset.daoContribution.received_address.length > 128) {
      return cb('received_address is undefined or too long, don`t more than 128 characters.');
    }

    if (!addressUtil.isAddress(trs.asset.daoContribution.received_address)) {
      return cb("Invalid contribution's received_address");
    }

    if (!trs.asset.daoContribution.sender_address ||
      trs.asset.daoContribution.sender_address.length > 128) {
      return cb('sender_address is undefined or too long, don`t more than 128 characters.');
    }

    if (!addressUtil.isAddress(trs.asset.daoContribution.sender_address)) {
      return cb("Invalid contribution's sender_address");
    }

    if (!trs.asset.daoContribution.url ||
      trs.asset.daoContribution.url.length > 256) {
      return cb('url is undefined or too long, don`t more than 256 characters.');
    }

    if (bignum.isNaN(trs.asset.daoContribution.price)) {
      return cb("Invalid contribution's price.");
    }

    modules.dao.__private.getOrgByOrgAddress(trs.asset.daoContribution.received_address, (err, org) => {

      if (err || !org) {
        return cb("no org was found based on received_address");
      }

      modules.dao.__private.getEffectiveOrgByOrgId(org.org_id, (err2, org2) => {
        if (err2) {
          return cb("no org was found based on orgId");
        }

        if (org2.address != org.address) {
          return cb("not an effective org: " + trs.asset.daoContribution.received_address);
        }

        return cb(null, trs);
      })

    })
  }

  process(trs, sender, cb) {
    setImmediate(cb, null, trs);
  }

  getBytes(trs) {
    // const asset = trs.asset.daoContribution;
    const asset = trs.asset.daoContribution;
    // const asset = trs.asset.daoContribution;

    const bb = new ByteBuffer();
    bb.writeUTF8String(asset.title);
    bb.writeUTF8String(asset.received_address);
    bb.writeUTF8String(asset.sender_address);
    // bb.writeUTF8String(asset.receivedAddress);
    // bb.writeUTF8String(asset.senderAddress);
    bb.writeUTF8String(asset.price);
    bb.writeUTF8String(asset.url);
    bb.flip();

    return bb.toBuffer();
  }
  // 新增事务dbTrans ---wly
  apply(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    setImmediate(cb);
  }
  // 新增事务dbTrans ---wly
  undo(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    setImmediate(cb);
  }
  // 新增事务dbTrans ---wly
  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    setImmediate(cb);
  }
  // 新增事务dbTrans ---wly
  undoUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    setImmediate(cb);
  }

  objectNormalize(trs) {
    const isValid = self.library.scheme.validate({
      type: 'object',
      properties: {
        title: {
          type: 'string'
        },
        received_address: {
          type: 'string'
        },
        sender_address: {
          type: 'string'
        },
        url: {
          type: 'string'
        }
      },
      required: ['title', 'received_address', 'sender_address', 'url']
    }, trs.asset.daoContribution);

    if (!isValid) {
      console.log('library.scheme.errors', library.scheme.errors, trs)
      const err = library.scheme.errors[0];
      const msg = err.dataPath + " " + err.message;
      throw Error(`Can't parse contribution: ${msg}`);
    }

    return trs;
  }

  dbRead(raw) {
    if (raw && raw.contribution_url) {
      const result = {
        title: raw.contribution_title,
        received_address: raw.contribution_receivedAddress,
        sender_address: raw.contribution_senderAddress,
        price: raw.contribution_price,
        url: raw.contribution_url,
        transaction_id: raw.contribution_transactionId,
        timestamp: raw.contribution_timestamp
      };

      return {
        daoContribution: result
      }
    } else {
      return null;
    }
  }

  dbSave(trs, dbTrans, cb) {
    if (typeof dbTrans === 'function') {
      cb = dbTrans;
      dbTrans = null
    }
    // var cmd = "INSERT INTO contribution (title, receivedAddress, senderAddress, price, url, transactionId, timestamp) VALUES($title, $rcvAddr, $sndAddr, $price, $url, $trsId, $timestamp)";
    var newData = {
      title: trs.asset.daoContribution.title,
      received_address: trs.asset.daoContribution.received_address,
      sender_address: trs.asset.daoContribution.sender_address,
      price: trs.asset.daoContribution.price,
      url: (trs.asset.daoContribution.url + "").toLowerCase(),
      // title: trs.asset.daoContribution.title,
      // received_address: trs.asset.daoContribution.receivedAddress,
      // sender_address: trs.asset.daoContribution.senderAddress,
      // price: trs.asset.daoContribution.price,
      // url: (trs.asset.daoContribution.url + "").toLowerCase(),
      transaction_id: trs.id,
      timestamp: trs.timestamp
    };

    // self.library.dbLite.query(cmd, params, cb);
    self.library.dao.insert('contribution', newData, dbTrans, cb)
  }

  ready(trs, sender) {
    if (sender.multisignatures.length) {
      if (!trs.signatures) {
        return false;
      }

      return trs.signatures.length >= sender.multimin - 1;
    } else {
      return true;
    }
  }


}
module.exports = Confirmation;
