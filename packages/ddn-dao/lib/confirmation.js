const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ByteBuffer = require('bytebuffer');
const bignum = require('bignum-utils');
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
  propsMapping() {
    return [{
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
        prop: "state",
      },
      {
        field: "str2",
        prop: "contribution_trs_id"
      },
      {
        field: "str3",
        prop: "transaction_id"
      }
    ];
  }

  create(data, trs) {
    if (data.daoConfirmation.state == 0) {
      //拒绝时没有转账交易
      trs.recipient_id = null //wxm block database
      trs.amount = "0";
    } else if (data.daoConfirmation.state == 1) {
      trs.recipient_id = data.daoConfirmation.received_address; //wxm block database
      //此处交易金额=投稿的price
      trs.amount = bignum.new((data.daoContribution.price || 0)).toString();
    }
    trs.asset.daoConfirmation = data.daoConfirmation;

    return trs;
  }

  calculateFee(trs, sender) {
    if (trs.asset.daoConfirmation.state == 0) {
      return "0"; // 拒绝稿件时手续费为0
    } else {
      return self.library.base.block.calculateFee();
    }
  }

  verify(trs, sender, cb) {
    if (trs.asset.daoConfirmation.state == 0) {
      if (trs.recipient_id) {
        return setImmediate(cb, 'Invalid recipient');
      }
    } else if (trs.asset.daoConfirmation.state == 1) {
      if (!trs.recipient_id) {
        return setImmediate(cb, 'Invalid recipient');
      }
    }

    if (trs.asset.daoConfirmation.state == 0) {
      if (trs.amount != 0) {
        return setImmediate(cb, 'Invalid transaction amount');
      }
    }

    if (!trs.asset || !trs.asset.daoConfirmation) {
      return cb('Invalid transaction asset "Contribution"');
    }

    if (!trs.asset.daoConfirmation.received_address ||
      trs.asset.daoConfirmation.received_address.length > 128) {
      return cb('received_address is undefined or too long, don`t more than 128 characters.');
    }

    if (!addressUtil.isAddress(trs.asset.daoConfirmation.received_address)) {
      return cb("Invalid confirmation's received_address");
    }

    if (!trs.asset.daoConfirmation.sender_address ||
      trs.asset.daoConfirmation.sender_address.length > 128) {
      return cb('senderAddress is undefined or too long, don`t more than 128 characters.');
    }

    if (!addressUtil.isAddress(trs.asset.daoConfirmation.sender_address)) {
      return cb("Invalid confirmation's senderAddress");
    }

    if (!trs.asset.daoConfirmation.url ||
      trs.asset.daoConfirmation.url.length > 256) {
      return cb('url is undefined or too long, don`t more than 256 characters.');
    }

    if (!trs.asset.daoConfirmation.contribution_trs_id ||
      trs.asset.daoConfirmation.contribution_trs_id.length > 64) {
      return cb('url is undefined or too long, don`t more than 256 characters.');
    }

    if (trs.asset.daoConfirmation.state != 0 &&
      trs.asset.daoConfirmation.state != 1) {
      return cb("The value of state only can be: [0,1]");
    }

    //判断是否确认过
    modules.dao.__private.getConfirmationByContributionTrsId(trs.asset.daoConfirmation.contribution_trs_id, (err, confirmation) => {

      if (err) {
        return cb(err.toString())
      }

      if (!confirmation) {

        //判断要确认的投稿是否存在
        modules.dao.__private.getContribution(trs.asset.daoConfirmation.contribution_trs_id, (err2, contribution) => {
          if (err) {
            return cb(err.toString());
          }

          if (contribution) {
            //确认的请求地址必须和投稿的接收地址一致
            if (trs.asset.daoConfirmation.sender_address != contribution.received_address) {
              return cb("confirmation's sender address must same as contribution's received address");
            }

            //确认的接收地址必须和投稿的发送地址一致
            if (trs.asset.daoConfirmation.received_address != contribution.sender_address) {
              return cb("confirmation's received address must same as contribution's sender address");
            }

            //判断交易的价格是否和投稿的价值一致
            if (trs.asset.daoConfirmation.state == 1) {
              if (trs.amount != contribution.price) {
                return cb("The transaction's amount must be equal contribution's price: " + contribution.price);
              }
            }
          } else {
            return cb("The contribution is not find: " + trs.asset.daoConfirmation.contribution_trs_id);
          }

          return cb(null, trs);
        })
      } else {
        return cb("The contribution has been confirmed: " + trs.asset.daoConfirmation.contribution_trs_id);
      }

    });
  }

  process(trs, sender, cb) {
    setImmediate(cb, null, trs);
  }

  getBytes(trs) {
    const asset = trs.asset.daoConfirmation;

    const bb = new ByteBuffer();
    bb.writeUTF8String(asset.received_address);
    bb.writeUTF8String(asset.sender_address);
    bb.writeUTF8String(asset.contribution_trs_id);
    bb.writeUTF8String(asset.url);
    bb.writeInt32(asset.state);
    bb.flip();

    return bb.toBuffer();
  }
  // 新增事务dbTrans ---wly
  apply(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    if (trs.asset.daoConfirmation.state == 1) {
      self.modules.accounts.setAccountAndGet({
        address: trs.recipient_id
      }, dbTrans, (err, recipient) => { //wxm block database
        if (err) {
          return cb(err);
        }
        self.modules.accounts.mergeAccountAndGet({
            address: trs.recipient_id, //wxm block database
            balance: trs.amount,
            u_balance: trs.amount,
            block_id: block.id, //wxm block database
            round: self.modules.round.calc(block.height).toString()
          },
          dbTrans,
          (err) => {
            cb(err);
          }
        );
      });
    } else {
      setImmediate(cb);
    }
  }
  // 新增事务dbTrans ---wly
  undo(trs, block, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    if (trs.asset.daoConfirmation.state == 1) {
      self.modules.accounts.setAccountAndGet({
        address: trs.recipient_id
      }, dbTrans, (err, recipient) => { //wxm block database
        if (err) {
          return cb(err);
        }
        var amountStr = bignum.minus(0, trs.amount).toString();
        self.modules.accounts.mergeAccountAndGet({
            address: trs.recipient_id, //wxm block database
            balance: amountStr,
            u_balance: amountStr,
            block_id: block.id, //wxm block database
            round: self.modules.round.calc(block.height).toString()
          },
          dbTrans,
          (err) => {
            cb(err);
          }
        );
      });
    } else {
      setImmediate(cb);
    }
  }
  // 新增事务dbTrans ---wly
  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const key = trs.type + ":" + trs.asset.daoConfirmation.contribution_trs_id;
    if (self.library.oneoff.has(key)) {
      return setImmediate(cb, "The contribution has been confirmed: " + trs.asset.daoConfirmation.contribution_trs_id + ".");
    }
    self.library.oneoff.set(key, true);
    setImmediate(cb);
  }
  // 新增事务dbTrans ---wly
  undoUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    };
    const key = trs.type + ":" + trs.asset.daoConfirmation.contribution_trs_id;
    self.library.oneoff.delete(key);
    setImmediate(cb);
  }

  objectNormalize(trs) {
    const isValid = self.library.scheme.validate({
      type: 'object',
      properties: {
        received_address: {
          type: 'string'
        },
        sender_address: {
          type: 'string'
        },
        contribution_trs_id: {
          type: 'string'
        },
        // receivedAddress: {
        //     type: 'string'
        // },
        // senderAddress: {
        //     type: 'string'
        // },
        // contributionTrsId: {
        //     type: 'string'
        // },
        url: {
          type: 'string'
        },
        state: {
          type: 'integer'
        }
      },
      required: ['received_address', 'sender_address', 'contribution_trs_id', 'state']
      // required: ['receivedAddress','senderAddress', 'contributionTrsId', 'state']
    }, trs.asset.daoConfirmation);

    if (!isValid) {
      const err = library.scheme.errors[0];
      const msg = err.dataPath + " " + err.message;
      throw Error(`Can't parse confirmation: ${msg}`);
    }

    return trs;
  }

  dbRead(raw) {
    if (raw && raw.confirmation_url) {
      const result = {
        received_address: raw.confirmation_receivedAddress,
        sender_address: raw.confirmation_senderAddress,
        contribution_trs_id: raw.confirmation_contributionTrsId,
        url: raw.confirmation_url,
        state: raw.confirmation_state,
        transaction_id: raw.confirmation_transactionId,
        timestamp: raw.confirmation_timestamp
      };

      return {
        daoConfirmation: result
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
    // var cmd = "INSERT INTO confirmation (receivedAddress, senderAddress, url, state, contributionTrsId, transactionId, timestamp) VALUES($rcvAddr, $sndAddr, $url, $state, $cTrsId, $trsId, $timestamp)";
    var params = {
      received_address: trs.asset.daoConfirmation.received_address,
      sender_address: trs.asset.daoConfirmation.sender_address,
      url: (trs.asset.daoConfirmation.url + "").toLowerCase(),
      state: trs.asset.daoConfirmation.state,
      contribution_trs_id: trs.asset.daoConfirmation.contribution_trs_id,
      transaction_id: trs.id,
      timestamp: trs.timestamp
    };

    // self.library.dbLite.query(cmd, params, cb);
    self.library.dao.insert('confirmation', params, dbTrans, cb)
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
