const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const daoUtil = require('./daoUtil.js');
const ddnUtils = require('ddn-utils');
const valid_url = require('valid-url');
const ByteBuffer = require('bytebuffer');

// 10 秒内不允许重复处理
let processOrgIdList = {}

library.bus.on('newBlock', function () {
  // console.log("library.bus.on('newBlock'--------------processOrgIdList--------------------")
  processOrgIdList = {}
});

class Org extends AssetBase {
 /**
  * Org 自治组织中的组织
  * 自治组织可以包含媒体号、企业号等组织形态，为未来更多扩展留有余地。
  *
  * 规则：
  * 1、[a-zA-Z0-9_]，不分大小写，英文字符+数字+_ 加上‘M’等类别后缀；
  * 2、前期申请 >= 5个字符，5位以下逐年开放；
  * 3、必须英文开头；
  */
 propsMapping() {
  return [{
    field: "str1",
    prop: "org_id",
    required: true
  },
  {
    field: "str2",
    prop: "name"
  },
  {
    field: "str4",
    prop: "address"
  },
  {
    field: "str3",
    prop: "tags",
    required: true
  },
  {
    field: "str6",
    prop: "url"
  },
  {
    field: "int1",
    prop: "state",
    required: true
  },
  ];
}

  /**
   * 创建组织号
   * data.asset.org 字段 6 个：
   * @org_id 自治组织号（比如：媒体号） 5-20，5位以下逐年开放注册；媒体号 midiumId 是自治组织的一种，可以以M为后缀，其他的以此类推，必须；
   * @name 组织名称，支持汉字，可修改（需要花费fee, **修改的字段信息同步存储在trs交易表的冗余字段args里**)，允许空；
   * @address 绑定的钱包地址（用于接收投稿、转账等），允许空；
   * @url 自治组织主页、媒体号主页地址等，允许空；
   * @tags 类别标签，逗号或者空格分隔，必须；
   * @state 0-首次申请，1-转移，必须；
   *
   * @transaction_id 交易id
   * @fee 交易费用
   * - updated_count 修改次数，虚拟字段，是通过修改次数计算出来的信息
   *
   * @param {object} data 传回来的数据
   * @param {object} trs 交易
   */
  create(data, trs) {
    trs.recipient_id = null;
    trs.amount = "0";
    trs.asset.org = data.org;
    return trs;
  }

  calculateFee(trs, sender) {
    // register orgId fee x 100000000
    let feeBase = 1;
    const orgId = trs.asset.org.org_id;
    const olen = orgId.length;
    const feeLenMap = {
      '10': 50,
      '9': 100,
      '8': 200,
      '7': 400,
      '6': 800,
      '5': 1600,
    };
    if (olen > 10) {
      feeBase = 10
    } else if (olen <= 4) {
      feeBase = 99999999 // not allow
    } else {
      feeBase = feeLenMap[olen + '']
    }
    if (trs.asset.org.state == 1) {
      feeBase = parseInt(feeBase / 10); // change info
    }
    // bignum update
    // return feeBase * 100000000;
    return bignum.multiply(feeBase, 100000000).toString();
  }

  verify(trs, sender, cb) {

    const org = trs.asset.org;

    if (trs.recipient_id) {
      return setImmediate(cb, 'Invalid recipient');
    }

    if (org.state == 0) {
      if (!org.name || !org.url) {
        return setImmediate(cb, 'Invalid asset data');
      }
    } else if (org.state == 1) {
      if (!org.name && !org.url && !org.tags) {
        return setImmediate(cb, 'Invalid asset update no param' + JSON.stringify(org));
      }
    } else {
      return setImmediate(cb, 'Invalid asset state type: ' + org.state);
    }


    if (!ddnUtils.Address.isAddress(sender.address)) {
      return setImmediate(cb, "Invalid address");
    } 

    //bignum update if (trs.amount != 0) {
    if (!bignum.isZero(trs.amount)) {
      return setImmediate(cb, 'Invalid transaction amount');
    }

    if (!trs.asset || !org) {
      return setImmediate(cb, 'Expect asset org, got invalid transaction asset');
    }

    // check org id
    org.org_id = org.org_id.toLowerCase();
    if (!daoUtil.isOrgId(org.org_id)) {
      return setImmediate(cb, 'exchange org id not allow');
    }

    if (org.name && org.name.lenght > 64) {
      return setImmediate(cb, 'Name is too long，don`t more than 64 bit.');
    }
    if (!ddnUtils.Address.isAddress(org.address)) {
      return setImmediate(cb, 'Invalid org address');
    }
    if (org.url && !valid_url.isUri(org.url)) {
      return setImmediate(cb, "Invalid org url");
    }

    if (org.url && org.url.lenght > 256) {
      return setImmediate(cb, 'Url is undefined or too long，don`t more than 256 bit.');
    }
    if (org.tags && org.tags.length > 40) {
      return setImmediate(cb, "Org tags is too long. Maximum is 40 characters");
    }

    if (org.tags) {
      let tags = org.tags.split(',');

      tags = tags.map(tag => tag.trim()).sort();

      for (var i = 0; i < tags.length - 1; i++) {
        if (tags[i + 1] == tags[i]) {
          return setImmediate(cb, `Encountered duplicate tags: ${tags[i]}`);
        }
      }
    }

    // orgId length open by year
    let olen = org.org_id.length,
      yyyyNum = parseInt(new Date().getFullYear())
    if (olen <= 4) {
      return setImmediate(cb, "Org id with 4 length not open in this year");
    } else if (olen == 5) {
      if (yyyyNum < 2019)
        return setImmediate(cb, "Org id with 5 length will open in year 2019");
    }

    // fixme
    // state = 0, !state = true
    // if (org.state == 0) {
    //   return setImmediate(cb, 'State is undefined.');
    // }

    self.modules.dao.__private.getEffectiveOrgByOrgId(org.org_id, (err, orgRow) => {
      if (err) {
        return setImmediate(cb, err);
      }
      if (org.state == 0) {
        if (orgRow) {
          return setImmediate(cb, `Org ${org.org_id} already exists`);
        }
      } else if (org.state == 1) {
        if (!orgRow) {
          return setImmediate(cb, `Org ${org.org_id} not exists`);
        }
        if (sender.address !== orgRow.address) {
          return setImmediate(cb, `Org ${org.org_id} not belong to you`);
        }
      }
      return setImmediate(cb, null, trs);
    });
  }

  process(trs, sender, cb) {
    const org = trs.asset.org
    if (!org.address) {
      org.address = sender.address;
    }
    if (org.org_id) {
      org.org_id = org.org_id.toLowerCase()
    }

    // process cache
    let oldOrg = processOrgIdList[org.org_id]
    if (oldOrg) {
      let error = `Org ${org.org_id} being process for ` + (oldOrg.state ? 'change' : 'apply')
      return cb(error);
    }
    processOrgIdList[org.org_id] = org

    cb && cb(null, trs);
  }

  getBytes(trs) {
    const org = trs.asset.org;
    const bb = new ByteBuffer();

    if (!org) {
      return null;
    }

    try {
      bb.writeUTF8String(org.org_id.toLowerCase());
      bb.writeUTF8String(org.name ? org.name : '');
      bb.writeUTF8String(org.address ? org.address : '');
      bb.writeUTF8String(org.url ? org.url : '');
      bb.writeUTF8String(org.tags ? org.tags : '');
      bb.writeInt8(org.state);

      bb.flip();
    } catch (e) {
      throw Error(e.toString());
    }

    return bb.toBuffer();
  }

  dbRead(raw) {
    if (!raw.org_org_id) {
      return null;
    }
    return {
      org_id: raw.org_id.toLowerCase(),
      name: raw.name,
      tags: raw.tags,
      address: raw.address,
      state: raw.state,
      url: raw.url,
      timestamp: raw.timestamp,
    };
  }

  dbSave(trs, dbTrans, cb) {
    if (typeof (cb) == "undefined" && typeof (dbTrans) == "function") {
      cb = dbTrans;
      dbTrans = null;
    }
    const org = trs.asset.org;
    org.transaction_id = trs.id;
    org.timestamp = trs.timestamp;
    if (org.org_id) {
      org.org_id = org.org_id.toLowerCase();
    }

    if (org.state === 0) {
      super.dbSave(trs, dbTrans, (err)=>{
        if (err) return cb(err);
        // fix
        library.model.add('mem_org', org, dbTrans, cb);
      });
    } else if (org.state == 1) {
      modules.dao.__private.updateOrgInfoNotAnyCheck(org.org_id, trs, org, dbTrans, cb)
    }

  }

}
module.exports = Org;
