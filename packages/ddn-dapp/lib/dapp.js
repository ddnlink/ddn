const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');
const ByteBuffer = require('bytebuffer');

const WITNESS_CLUB_DAPP_NAME = 'DDN-FOUNDATION'

class Dapp extends AssetBase {
  propsMapping() {
    return [{
      field: "str1",
      prop: "name",
      required: true
    },
    {
      field: "str6",
      prop: "description"
    },
    {
      field: "str7",
      prop: "tags"
    },
    {
      field: "str10",
      prop: "link"
    },
    {
      field: "int1",
      prop: "type"
    },
    {
      field: "int2",
      prop: "category"
    },
    {
      field: "str8",
      prop: "icon"
    },
    {
      field: "str9",
      prop: "delegates"
    },
    {
      field: "int2",
      prop: "unlock_delegates"
    },
    ];
  }

  create(data, trs) {
    trs.recipient_id = null;
    trs.amount = "0";
    trs.asset.dapp = {
      category: data.category,
      name: data.name,
      description: data.description,
      tags: data.tags,
      type: data.dapp_type,
      link: data.link,
      icon: data.icon,
      delegates: data.delegates,
      unlock_delegates: data.unlock_delegates
    };
    return trs;
  }

  async verify(trs, sender, cb) {
    const dapp = trs.asset.dapp;
    if (trs.recipient_id) {
      return setImmediate(cb, "Invalid recipient");
    }

    //bignum update if (trs.amount != 0) {
    if (!bignum.isZero(trs.amount)) {
      return setImmediate(cb, "Invalid transaction amount");
    }

    if (!dapp.category) {
      return setImmediate(cb, "Invalid dapp category");
    }

    let foundCategory = false;
    for (var i in dappCategory) {
      if (dappCategory[i] == dapp.category) {
        foundCategory = true;
        break;
      }
    }

    if (!foundCategory) {
      return setImmediate(cb, "Unknown dapp category");
    }

    if (dapp.icon) {
      if (!valid_url.isUri(dapp.icon)) {
        return setImmediate(cb, "Invalid icon link");
      }

      const length = dapp.icon.length;

      if (
        dapp.icon.indexOf('.png') != length - 4 &&
        dapp.icon.indexOf('.jpg') != length - 4 &&
        dapp.icon.indexOf('.jpeg') != length - 5
      ) {
        return setImmediate(cb, "Invalid icon file type")
      }

      if (dapp.icon.length > 160) {
        return setImmediate(cb, "Dapp icon url is too long. Maximum is 160 characters");
      }
    }

    if (dapp.type > 1 || dapp.type < 0) {
      return setImmediate(cb, "Invalid dapp type");
    }

    if (!valid_url.isUri(dapp.link)) {
      return setImmediate(cb, "Invalid dapp link");
    }

    if (dapp.link.indexOf(".zip") != dapp.link.length - 4) {
      return setImmediate(cb, "Invalid dapp file type")
    }

    if (dapp.link.length > 160) {
      return setImmediate(cb, "Dapp link is too long. Maximum is 160 characters");
    }

    if (!dapp.name || dapp.name.trim().length == 0 || dapp.name.trim() != dapp.name) {
      return setImmediate(cb, "Missing dapp name");
    }

    if (dapp.name.length > 32) {
      return setImmediate(cb, "Dapp name is too long. Maximum is 32 characters");
    }

    if (dapp.description && dapp.description.length > 160) {
      return setImmediate(cb, "Dapp description is too long. Maximum is 160 characters");
    }

    if (dapp.tags && dapp.tags.length > 160) {
      return setImmediate(cb, "Dapp tags is too long. Maximum is 160 characters");
    }

    if (dapp.tags) {
      let tags = dapp.tags.split(',');

      tags = tags.map(tag => tag.trim()).sort();

      for (var i = 0; i < tags.length - 1; i++) {
        if (tags[i + 1] == tags[i]) {
          return setImmediate(cb, `Encountered duplicate tags: ${tags[i]}`);
        }
      }
    }

    if (!dapp.delegates || dapp.delegates.length < 5 || dapp.delegates.length > 101) {
      return setImmediate(cb, "Invalid dapp delegates");
    }
    for (let i in dapp.delegates) {
      if (dapp.delegates[i].length != 64) {
        return setImmediate(cb, "Invalid dapp delegates format");
      }
    }

    if (!dapp.unlock_delegates || dapp.unlock_delegates < 3 || dapp.unlock_delegates > dapp.delegates.length) {
      return setImmediate(cb, "Invalid unlock delegates number")
    }

    const where = {
      '$or': [{ name: trs.asset.dapp.name }, {link: trs.asset.dapp.link || null}],
      transaction_id: { '$ne': trs.id }
    }
  
    result = await super.queryAsset(where, null, null, 1, 1);
    if (data.length > 0) {
      const dapp = data[0];
      if (dapp.name == trs.asset.dapp.name) {
        return cb(`Dapp name already exists: ${dapp.name}`);
      } else if (dapp.link == trs.asset.dapp.link) {
        return cb(`Dapp link already exists: ${dapp.link}`);
      } else {
        return cb("Unknown error");
      }
    } else {
      return cb();
    }
  }

  getBytes (trs) {
    const dapp = trs.asset.dapp;
    let buf;
    try {
      buf = new Buffer([]);
      const nameBuf = new Buffer(dapp.name, 'utf8');
      buf = Buffer.concat([buf, nameBuf]);

      if (dapp.description) {
        const descriptionBuf = new Buffer(dapp.description, 'utf8');
        buf = Buffer.concat([buf, descriptionBuf]);
      }

      if (dapp.tags) {
        const tagsBuf = new Buffer(dapp.tags, 'utf8');
        buf = Buffer.concat([buf, tagsBuf]);
      }

      if (dapp.link) {
        buf = Buffer.concat([buf, new Buffer(dapp.link, 'utf8')]);
      }

      if (dapp.icon) {
        buf = Buffer.concat([buf, new Buffer(dapp.icon, 'utf8')]);
      }

      const bb = new ByteBuffer(1, true);
      bb.writeInt(dapp.type);
      bb.writeInt(dapp.category);
      bb.writeString(dapp.delegates.join(','))
      bb.writeInt(dapp.unlock_delegates)
      bb.flip();

      buf = Buffer.concat([buf, bb.toBuffer()]);
    } catch (e) {
      library.logger.error(e);
      throw Error(e.toString());
    }

    return buf;
  }

  // 新增事务dbTrans ---wly
  apply(trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    if (trs.asset.dapp.name === WITNESS_CLUB_DAPP_NAME) {
      global.state.clubInfo = trs.asset.dapp
      global.state.clubInfo.transactionId = trs.id
    }
    setImmediate(cb);
  }
  // 新增事务dbTrans ---wly
  undo(trs, block, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    if (trs.asset.dapp.name === WITNESS_CLUB_DAPP_NAME) {
      global.state.clubInfo = null
    }
    setImmediate(cb);
  }
  // 新增事务dbTrans ---wly
  applyUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    //bignum update if (privated.unconfirmedNames[trs.asset.dapp.name]) {
    if (library.oneoff.has(trs.asset.dapp.name)) {
      return setImmediate(cb, "Dapp name already exists");
    }

    //bignum update if (trs.asset.dapp.link && privated.unconfirmedLinks[trs.asset.dapp.link]) {
    if (trs.asset.dapp.link && self.library.oneoff.has(trs.asset.dapp.link)) {
      return setImmediate(cb, "Dapp link already exists");
    }

    //bignum update privated.unconfirmedNames[trs.asset.dapp.name] = true;
    library.oneoff.set(trs.asset.dapp.name, true);
    //bignum update privated.unconfirmedLinks[trs.asset.dapp.link] = true;
    library.oneoff.set(trs.asset.dapp.link, true);

    setImmediate(cb)
  }
  // 新增事务dbTrans ---wly
  undoUnconfirmed(trs, sender, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    //bignum update delete privated.unconfirmedNames[trs.asset.dapp.name];
    library.oneoff.delete(trs.asset.dapp.name);
    //bignum update delete privated.unconfirmedLinks[trs.asset.dapp.link];
    library.oneoff.delete(trs.asset.dapp.link);

    setImmediate(cb);
  }

  dbRead (raw) {
    if (!raw.dapp_name) {
      return null;
    } else {
      const dapp = {
        name: raw.dapp_name,
        description: raw.dapp_description,
        tags: raw.dapp_tags,
        type: raw.dapp_type,
        link: raw.dapp_link,
        category: raw.dapp_category,
        icon: raw.dapp_icon,
        delegates: raw.dapp_delegates.split(','),
        unlock_delegates: raw.dapp_unlockDelegates
      };

      return { dapp };
    }
  }

  dbSave(trs, dbTrans, cb) {
    if (typeof(cb) == "undefined" && typeof(dbTrans) == "function") {
			cb = dbTrans;
			dbTrans = null;
    };
    const dapp = trs.asset.dapp;
    const values = {
      type: dapp.type,
      name: dapp.name,
      description: dapp.description || null,
      tags: dapp.tags || null,
      link: dapp.link || null,
      icon: dapp.icon || null,
      category: dapp.category,
      delegates: dapp.delegates.join(','),
      unlock_delegates: dapp.unlock_delegates,
      transaction_id: trs.id
    };

    trs.asset.dapp = values;
    super.dbSave(trs, dbTrans, err => {
      if (err) {
        return cb(err);
      } else {
        library.network.io.sockets.emit('dapps/change', {});
        return cb();
      }    
    });
  }
}
module.exports = Dapp;