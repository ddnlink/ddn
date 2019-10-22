/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 28 2018 9:28:20
 *
 *  Copyright (c) 2018 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const util = require('util');
const ByteBuffer = require('bytebuffer');
const Diff = require('../../lib/diff.js');
const bignum = require('@ddn/bignum-utils');


class Vote {

	constructor(context) {
        Object.assign(this, context);
        this._context = context;
	}

	async create(data, trs) {
		trs.recipient_id = null;    //wxm block database
		trs.asset.vote = {
			votes: data.votes
		};

		return trs;
	}

	async calculateFee(trs, sender) {
        // bignum update
        // return 0.1 * constants.fixedPoint;
        return bignum.multiply(0.1, this.tokenSetting.fixedPoint);
	}

	async verify(trs, sender) {
		if (!trs.asset.vote || !trs.asset.vote.votes || !trs.asset.vote.votes.length) {
            throw new Error('No votes sent');
		}

		if (trs.asset.vote.votes && trs.asset.vote.votes.length > 33) {
            throw new Error('Voting limit exceeded. Maximum is 33 votes per transaction');
		}

        await this.runtime.delegate.checkDelegates(trs.sender_public_key, trs.asset.vote.votes);

        return trs;
	}

	async process(trs, sender) {
        return trs;
	}

	async getBytes(trs) {
        if (!trs.asset.vote.votes) {
            return null;
        }

        var bb = new ByteBuffer();
        bb.writeUTF8String(trs.asset.vote.votes.join(''));
        bb.flip();
		return bb.toBuffer();
	}

    async isSupportLock() {
        return false;
    }

	async apply(trs, block, sender, dbTrans) {
		await this.runtime.account.merge(sender.address, {
            delegates: trs.asset.vote.votes,
            block_id: block.id,  //wxm block database
            round: await this.runtime.round.calc(block.height)
        }, dbTrans);
	}

	async undo(trs, block, sender, dbTrans) {
		if (trs.asset.vote.votes === null) return;

        const votesInvert = Diff.reverse(trs.asset.vote.votes);
        await this.runtime.account.merge(sender.address, {
            delegates: votesInvert,
            block_id: block.id,  //wxm block database
            round: await this.runtime.round.calc(block.height)
        }, dbTrans);
	}

	async applyUnconfirmed(trs, sender, dbTrans) {
		const key = `${sender.address}:${trs.type}`;
		if (this.oneoff.has(key)) {
            throw new Error('Double submit');
		}
        this.oneoff.set(key, true);
        return;
	}

	async undoUnconfirmed(trs, sender, dbTrans) {
		const key = `${sender.address}:${trs.type}`;
		this.oneoff.delete(key);
		return;
	}

	async objectNormalize(trs) {
        var validateErrors = await this.ddnSchema.validate({
            type: 'object',
            properties: {
                votes: {
                    type: 'array',
                    minLength: 1,
                    maxLength: 101,
                    uniqueItems: true
                }
            },
            required: ['votes']
        }, trs.asset.vote);
        if (validateErrors) {
            throw new Error(`Incorrect votes in transactions: ${validateErrors[0].message}`);
        }

		return trs;
	}

	async dbRead(raw) {
		if (!raw.v_votes) {
			return null;
		} else {
			const votes = raw.v_votes.split(',');
			const vote = {
				votes
			};
			return { vote };
		}
	}

	// 替换dbSave方法 ---wly
	/**
	 * 功能:新增一条vote数据
	*/
	async dbSave(trs, dbTrans) {
        return new Promise((resolve, reject) => {
            this.dao.insert('vote', {
                votes: util.isArray(trs.asset.vote.votes) ? trs.asset.vote.votes.join(',') : null,
                transaction_id: trs.id
            }, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
	}

	async ready(trs, sender) {
		if (util.isArray(sender.multisignatures) && sender.multisignatures.length) {
			if (!trs.signatures) {
				return false;
			}
			return trs.signatures.length >= sender.multimin - 1;
		} else {
			return true;
		}
	}
}

module.exports = Vote;
