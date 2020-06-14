/*---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 28 2018 9:28:20
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import util from 'util';

import ByteBuffer from 'bytebuffer';
import Diff from '../../lib/diff.js';
import DdnUtils from '@ddn/utils';

class Vote {

	constructor(context) {
        Object.assign(this, context);
        this._context = context;
	}

	async create({votes}, trs) {
		trs.recipientId = null;    //wxm block database
		trs.asset.vote = {
			votes
		};

		return trs;
	}

	async calculateFee(trs, sender) {
        return DdnUtils.bignum.multiply(0.1, this.constants.fixedPoint);
	}

	async verify(trs, sender) {
		if (!trs.asset.vote || !trs.asset.vote.votes || !trs.asset.vote.votes.length) {
            throw new Error('No votes sent');
		}

		if (trs.asset.vote.votes && trs.asset.vote.votes.length > 33) {
            throw new Error('Voting limit exceeded. Maximum is 33 votes per transaction');
		}

        await this.runtime.delegate.checkDelegates(trs.senderPublicKey, trs.asset.vote.votes);

        return trs;
	}

	async process(trs, sender) {
        return trs;
	}

	async getBytes({asset}) {
        if (!asset.vote.votes) {
            return null;
        }

		const bb = new ByteBuffer();
		const votes = asset.vote.votes.join('');
		console.log('vote.js asset.vote.votes.join', votes);
		
        bb.writeUTF8String(votes);
        bb.flip();
		return bb.toBuffer();
	}

    async isSupportLock() {
        return false;
    }

	async apply({asset}, {id, height}, {address}, dbTrans) {
		await this.runtime.account.merge(address, {
            delegates: asset.vote.votes,
            block_id: id,  //wxm block database
            round: await this.runtime.round.calc(height)
        }, dbTrans);
	}

	async undo({asset}, {id, height}, {address}, dbTrans) {
		if (asset.vote.votes === null) return;

        const votesInvert = Diff.reverse(asset.vote.votes);
        await this.runtime.account.merge(address, {
            delegates: votesInvert,
            block_id: id,  //wxm block database
            round: await this.runtime.round.calc(height)
        }, dbTrans);
	}

	async applyUnconfirmed({type}, {address}, dbTrans) {
		const key = `${address}:${type}`;
		if (this.oneoff.has(key)) {
            throw new Error('Double submit');
		}
        this.oneoff.set(key, true);
        return;
	}

	async undoUnconfirmed({type}, {address}, dbTrans) {
		const key = `${address}:${type}`;
		this.oneoff.delete(key);
		return;
	}

	async objectNormalize(trs) {
        const validateErrors = await this.ddnSchema.validate({
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
            throw new Error(`Incorrect votes in transactions: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`);
        }

		return trs;
	}

	async dbRead({v_votes}) {
		if (!v_votes) {
			return null;
		} else {
			const votes = v_votes.split(',');
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
	async dbSave({asset, id}, dbTrans) {
        return new Promise((resolve, reject) => {
            this.dao.insert('vote', {
                votes: util.isArray(asset.vote.votes) ? asset.vote.votes.join(',') : null,
                transaction_id: id
            }, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
	}

	async ready({signatures}, {multisignatures, multimin}) {
		if (util.isArray(multisignatures) && multisignatures.length) {
			if (!signatures) {
				return false;
			}
			return signatures.length >= multimin - 1;
		} else {
			return true;
		}
	}
}

export default Vote;
