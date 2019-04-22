const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const daoUtil = require('./daoUtil.js');

/**
  * 企业号、媒体号等交易
  *
  * 卖媒体号：
  * @orgId 自治组织号 5-20，5位以下逐年开放注册；媒体号 midiumId 是自治组织的一种，可以以M为后缀，其他的以此类推；
  * @price 卖的价格
  * @receivedAddress 买方的钱包地址（即将绑定媒体号的新的钱包地址）
  * @senderAddress 卖方的钱包地址
  * @state 0-发起卖，1-确认买（同时向org增加一条绑定记录）
  *
  * @exchangeTrsId - 确认买的时候记录卖的记录id，发起卖的时候为空
  * @amout 0-发起卖，确认买的数量=@price
  * @fee 交易费用
  */
class Exchange extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [{
      field: 'str1',
      prop: 'org_id',
      required: true,
    }, {
      field: 'str2',
      prop: 'name',
    }, {
      field: 'str4',
      prop: 'address',
    }, {
      field: 'str3',
      prop: 'tags',
      required: true,
    }, {
      field: 'str6',
      prop: 'url',
    }, {
      field: 'int1',
      prop: 'state',
      required: true,
    },
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  async create(data, trs) {
    const trans = trs;
    trans.amount = '0';
    trans.asset.exchange = {
      org_id: data.org_id.toLowerCase(),
      price: data.price || '0',
      state: data.state,
      exchange_trs_id: data.exchange_trs_id,
      sender_address: data.sender_address,
      received_address: data.received_address,
    };
    return trans;
  }

  async verify(trs, sender) {
    const asset = trs.asset.exchange;
    // check org id
    if (!daoUtil.isOrgId(asset.org_id.toLowerCase())) {
      throw new Error('exchange org id not allow');
    }
    if (!ddnUtils.Address.isAddress(sender.address)) {
      throw new Error('Invalid address');
    }
    if (!ddnUtils.Address.isAddress(asset.sender_address)) {
      throw new Error('senderAddress id not allow');
    }
    if (!ddnUtils.Address.isAddress(asset.received_address)) {
      throw new Error('receivedAddress id not allow');
    }
    if (asset.sender_address === asset.received_address) {
      throw new Error('senderAddress receivedAddress cat not equal');
    }
    if (asset.sender_address !== sender.address) {
      throw new Error('senderAddress and sender.address should be equal');
    }
    if (bignum.isNaN(asset.price)) {
      throw new Error("Invalid exchange' price.");
    }
    // check state right
    if (asset.state === 0) {
      // send exchange
      // bignum update   if (trs.amount != 0)
      if (!bignum.isZero(trs.amount)) {
        throw new Error('Invalid transaction amount');
      }
      if (asset.exchange_trs_id) {
        throw new Error('not need confirm exchange trs_id');
      } else {
        // TODO: 判断媒体号是否由 sender 注册
        this.modules.dao.__private.getEffectiveOrgByOrgId(asset.org_id, (err, org) => {
          // console.log(err, org)
          if (err) {
            return setImmediate(cb, err);
          }
          if (!org) {
            return setImmediate(cb, `Org "${asset.org_id}" not exists`);
          }
          if (org.address !== sender.address) {
            return setImmediate(cb, `Org "${asset.org_id}" not belong to you`);
          }
          return setImmediate(cb); // ok
        });
      }
    } else if (asset.state === 1) {
      if (!asset.exchange_trs_id) {
        return setImmediate(cb, 'must give confirm exchange trs_id');
      }
      // check exchangeTrsId for confirm
      library.model.getExchanges({ exchange_trs_id: asset.exchange_trs_id }, { limit: 1 }, (err, result) => {
        if (err) { return setImmediate(cb, err); }
        if (result && result.length) { return setImmediate(cb, 'confirm exchange already exists'); }
        // confirm
        library.model.getExchangeByTrsId(asset.exchange_trs_id, (err, result) => {
          if (err) return setImmediate(cb, err);
          if (!result) return setImmediate(cb, 'confirm exchange not find');
          // console.log(trs)
          // console.log(result)
          if (result.org_id.toLowerCase() !== asset.org_id.toLowerCase()) return setImmediate(cb, 'confirm exchange orgId atypism');
          // bignum update if (result.price !== trs.amount)
          if (!bignum.isEqualTo(result.price, trs.amount)) return setImmediate(cb, 'confirm exchange amount & price atypism');
          // address is ok
          if (result.receivedAddress !== asset.sender_address) return setImmediate(cb, 'confirm exchange senderAddress error');
          if (result.senderAddress !== asset.received_address) return setImmediate(cb, 'confirm exchange receivedAddress error');
          // orgid is ok
          if (result.org_id.toLowerCase() != asset.org_id.toLowerCase()) return setImmediate(cb, 'confirm exchange orgId should be equal');
          // to mark the exchange is confirm ok !!!
          trs.asset.is_confirm_ok = true; // next dbSave to deal
          return setImmediate(cb); // exchange is ok
        });
      });
    } else {
      throw new Error('not support dao exchange state');
    }
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  async process(trs) {
    const trans = trs;
    trans.asset.exchange.org_id = trs.asset.exchange.org_id.toLowerCase();
    return trans;
  }

  // eslint-disable-next-line class-methods-use-this
  async getBytes(trs) {
    // eslint-disable-next-line no-undef
    const bb = new ByteBuffer();
    const asset = trs.asset.exchange;
    bb.writeString(asset.org_id.toLowerCase());
    bb.writeString(asset.exchange_trs_id);
    bb.writeString(asset.price);
    bb.writeInt8(asset.state);
    bb.writeString(asset.sender_address);
    bb.writeString(asset.received_address);
    bb.flip();
    return bb.toBuffer();
  }

  dbSave(trs, dbTrans) {
    const asset = trs.asset.exchange;
    const values = {
      transaction_id: trs.id,
      org_id: asset.org_id.toLowerCase(),
      price: asset.price,
      state: asset.state,
      exchange_trs_id: asset.exchange_trs_id,
      sender_address: asset.sender_address,
      received_address: asset.received_address,
      timestamp: trs.timestamp,
    };
    this.library.model.add('exchange', values, dbTrans, (err, result) => {
      // check is_confirm_ok to add update org belong
      if (err) {
        return setImmediate(cb, err);
      }
      if (!trs.asset.is_confirm_ok) {
        return setImmediate(cb, null, result);
      }
      // update org belong
      modules.dao.__private.updateOrgInfoNotAnyCheck(asset.org_id, trs, {
        address: asset.sender_address,
      }, dbTrans, cb);
    });
  }
}
module.exports = Exchange;
