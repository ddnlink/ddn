/**
 * Signatures
 * wangxm   2019-03-25
 */
import DdnUtils from "@ddn/utils";
import ByteBuffer from "bytebuffer";
import Diff from "../../utils/diff";

class Multisignature {
  constructor(context) {
    Object.assign(this, context);
    this._context = context;

    this._unconfirmedSignatures = {};
  }

  async create({ min, keysgroup, lifetime }, trs) {
    trs.recipientId = null; // wxm block database
    trs.amount = "0";
    trs.asset.multisignature = {
      min,
      keysgroup,
      lifetime
    };
    return trs;
  }

  async calculateFee({ asset }, sender) {
    return DdnUtils.bignum.multiply(
      DdnUtils.bignum.plus(asset.multisignature.keysgroup.length, 1),
      this.constants.net.fees.multiSignature,
      this.constants.fixedPoint
    );
  }

  async verify(trs, sender) {
    if (!trs.asset.multisignature) {
      throw new Error(`Invalid transaction asset: ${trs.id}`);
    }

    if (!Array.isArray(trs.asset.multisignature.keysgroup)) {
      throw new Error(`Invalid transaction asset: ${trs.id}`);
    }

    if (trs.asset.multisignature.keysgroup.length === 0) {
      throw new Error("Multisignature group must contain at least one member");
    }

    if (trs.asset.multisignature.min <= 1 || trs.asset.multisignature.min > 16) {
      throw new Error(`Invalid transaction asset: ${trs.id}`)
    }

    if (trs.asset.multisignature.min > trs.asset.multisignature.keysgroup.length + 1) {
      throw new Error('Invalid multisignature min')
    }

    if (
      trs.asset.multisignature.lifetime < 1 ||
      trs.asset.multisignature.lifetime > 24
    ) {
      throw new Error(`Invalid multisignature lifetime: ${trs.id}`);
    }

    // If it's ready
    if (await this.ready(trs, sender)) {
      try {
        for (let s = 0; s < trs.asset.multisignature.keysgroup.length; s++) {
          let verify = false;
          if (trs.signatures) {
            for (let d = 0; d < trs.signatures.length && !verify; d++) {
              if (
                trs.asset.multisignature.keysgroup[s][0] !== "-" &&
                trs.asset.multisignature.keysgroup[s][0] !== "+"
              ) {
                verify = false;
              } else {
                this.logger.debug(
                  `trs.asset.multisignature.keysgroup[s].substring(1): ${trs.asset.multisignature.keysgroup[
                    s
                  ].substring(1)}`
                )
                verify = await this.runtime.transaction.verifySignature(
                  trs,
                  trs.signatures[d],
                  trs.asset.multisignature.keysgroup[s].substring(1)
                );
              }
            }
          }

          if (!verify) {
            throw new Error(`Failed to verify multisignature: ${trs.id}`);
          }
        }
      } catch (e) {
        throw new Error(`Failed to verify multisignature: ${trs.id}`);
      }
    }

    if (trs.asset.multisignature.keysgroup.includes(`+${sender.publicKey}`)) {
      // wxm block database
      throw new Error("Unable to sign transaction using own public key");
    }

    const keysgroup = trs.asset.multisignature.keysgroup;
    for (let i = 0; i < keysgroup.length; i++) {
      const key = keysgroup[i];

      const math = key[0];
      const publicKey = key.slice(1);

      if (math !== "+") {
        throw new Error("Invalid math operator");
      }

      try {
        const b = Buffer.from(publicKey, "hex");
        if (b.length !== 32) {
          throw new Error("Invalid public key");
        }
      } catch (e) {
        throw new Error("Invalid public key");
      }
    }

    const keysgroup2 = trs.asset.multisignature.keysgroup.reduce((p, c) => {
      if (!p.includes(c)) p.push(c);
      return p;
    }, []);

    if (keysgroup2.length !== trs.asset.multisignature.keysgroup.length) {
      throw new Error("Multisignature group contains non-unique public keys");
    }

    return trs;
  }

  async process(trs, sender) {
    return trs;
  }

  async getBytes ({ asset }) {
    const keysgroupBuffer = Buffer.from(asset.multisignature.keysgroup.join(''), 'utf8')
    const bb = new ByteBuffer(1 + 1 + keysgroupBuffer.length, true)
    bb.writeByte(asset.multisignature.min)
    bb.writeByte(asset.multisignature.lifetime)
    for (let i = 0; i < keysgroupBuffer.length; i++) {
      bb.writeByte(keysgroupBuffer[i]);
    }
    bb.flip();
    return bb.toBuffer();
  }

  async apply({ asset }, { id, height }, sender, dbTrans) {
    this._unconfirmedSignatures[sender.address] = false;

    await this.runtime.account.merge(
      sender.address,
      {
        multisignatures: asset.multisignature.keysgroup,
        multimin: asset.multisignature.min,
        multilifetime: asset.multisignature.lifetime,
        block_id: id, // wxm block database
        round: await this.runtime.round.getRound(height)
      },
      dbTrans
    );

    const keysgroup = asset.multisignature.keysgroup;
    for (let i = 0; i < keysgroup.length; i++) {
      const item = keysgroup[i];

      const key = item.substring(1);
      const address = this.runtime.account.generateAddressByPublicKey(key);

      await this.runtime.account.setAccount(
        {
          address,
          publicKey: key, // wxm block database
          block_id: id // wxm 这里要直接将block_id更新进去，否则的话，如果不进行转账操作，将出现block_id为空，导致重启失败的问题
        },
        dbTrans
      );
    }
  }

  async undo ({ asset, id: trsId }, { id, height }, { address }, dbTrans) {
    const multiInvert = Diff.reverse(asset.multisignature.keysgroup)

    this._unconfirmedSignatures[address] = true;

    await this.runtime.account.merge(
      address,
      {
        multisignatures: multiInvert,
        multimin: -asset.multisignature.min,
        multilifetime: -asset.multisignature.lifetime,
        block_id: id, // wxm block database
        round: await this.runtime.round.getRound(height)
      },
      dbTrans
    )
    await this.deleteMultisignature(trsId, dbTrans)
  }

  /**
   * @description 回滚时删除对应的多重签名
   * @author created by wly
   * @param {*} transaction_id 交易id
   * @param {*} dbTrans 事物
   */
  async deleteMultisignature (transaction_id, dbTrans) {
		await this.dao.remove('multisignature', { transaction_id }, dbTrans);
		return true;
  }

  async applyUnconfirmed ({ asset }, { address, multisignatures }, dbTrans) {
    if (this._unconfirmedSignatures[address]) {
      this.logger.debug(
        `Signature on this account ${address} is pending confirmation`
      );
      return;
    }

    if (multisignatures.length) {
      throw new Error("Account already has multisignatures enabled");
    }

    this._unconfirmedSignatures[address] = true;

    await this.runtime.account.merge(
      address,
      {
        u_multisignatures: asset.multisignature.keysgroup,
        u_multimin: asset.multisignature.min,
        u_multilifetime: asset.multisignature.lifetime
      },
      dbTrans
    );
  }

  async undoUnconfirmed({ asset }, { address }, dbTrans) {
    const multiInvert = Diff.reverse(asset.multisignature.keysgroup);

    this._unconfirmedSignatures[address] = false;

    await this.runtime.account.merge(
      address,
      {
        u_multisignatures: multiInvert,
        u_multimin: -asset.multisignature.min,
        u_multilifetime: -asset.multisignature.lifetime
      },
      dbTrans
    );
  }

  async objectNormalize(trs) {
    const validateErros = await this.ddnSchema.validate(
      {
        type: "object",
        properties: {
          min: {
            type: "integer",
            minimum: 1,
            maximum: 15
          },
          keysgroup: {
            type: "array",
            minLength: 1,
            maxLength: 16
          },
          lifetime: {
            type: "integer",
            minimum: 1,
            maximum: 24
          }
        },
        required: ["min", "keysgroup", "lifetime"]
      },
      trs.asset.multisignature
    );
    if (validateErros) {
      throw new Error(`Invalid multisignature parameters: ${validateErros[0].message}`)
    }
    return trs;
  }

  async dbRead({ m_keysgroup, m_min, m_lifetime }) {
    if (!m_keysgroup) {
      return null;
    } else {
      const multisignature = {
        min: m_min,
        lifetime: m_lifetime,
        keysgroup: m_keysgroup.split(",")
      };

      return {
        multisignature
      };
    }
  }

  async dbSave({ asset, id }, dbTrans) {
    const result = await this.dao.insert(
      "multisignature",
      {
        min: asset.multisignature.min,
        lifetime: asset.multisignature.lifetime,
        keysgroup: asset.multisignature.keysgroup.join(","),
        transaction_id: id
      },
      dbTrans
    );
    setImmediate(async () => {
      try {
        await this.runtime.socketio.emit("multisignatures/change", {});
      } catch (err2) {
        this.logger.warn("socket emit error: multisignatures/change");
      }
    });
    return result;
  }

  async ready({ signatures, asset }, { multisignatures, multimin }) {
    this.logger.debug(`multisignature's signatures: ${signatures}`);
    if (!signatures) {
      this.logger.debug(
        "The multisignature is waiting for other account signatures."
      );
      return false;
    }

    if (Array.isArray(multisignatures) && !multisignatures.length) {
      const ready = signatures.length === asset.multisignature.keysgroup.length;
      if (!ready) {
        this.logger.warn(
          `The number of multisignature signatures is less than ${asset.multisignature.keysgroup.length}`
        );
      }
      return ready;
    } else {
      return signatures.length >= multimin - 1;
    }
  }
}

export default Multisignature;
