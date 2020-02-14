/**
 * Delegate
 * wangxm   2018-01-08
 */
import ByteBuffer from "bytebuffer";

import crypto from "crypto";
import ed from 'ed25519';
import assert from 'assert';
import ip from 'ip';

let _singleton;

class Consensus {

    static singleton(context) {
        if (!_singleton) {
            _singleton = new Consensus(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    clearState() {
        this._pendingVotes = null;
        this._votesKeySet = {};
        this._pendingBlock = null;
    }

    getProposeHash(propose) {
        const bytes = new ByteBuffer();

        //Bignum update   bytes.writeLong(propose.height);
        bytes.writeString(propose.height);

        bytes.writeString(propose.id);

        const generatorPublicKeyBuffer = Buffer.from(propose.generator_public_key, "hex"); //wxm block database
        for (let i = 0; i < generatorPublicKeyBuffer.length; i++) {
            bytes.writeByte(generatorPublicKeyBuffer[i]);
        }

        bytes.writeInt(propose.timestamp);

        const parts = propose.address.split(':');
        assert(parts.length == 2);
        bytes.writeInt(ip.toLong(parts[0]));
        bytes.writeInt(Number(parts[1]));

        bytes.flip();

        return crypto.createHash('sha256').update(bytes.toBuffer()).digest();
    }

    createPropose(keypair, {generator_public_key, height, id, timestamp}, address) {
        assert(keypair.publicKey.toString("hex") == generator_public_key);
        const propose = {
            height,
            id,
            timestamp,
            generator_public_key,   //wxm block database
            address
        };
        const hash = this.getProposeHash(propose);
        propose.hash = hash.toString("hex");
        propose.signature = ed.Sign(hash, keypair).toString("hex");
        return propose;
    }

    acceptPropose(propose) {
        const hash = this.getProposeHash(propose);
        if (propose.hash != hash.toString("hex")) {
            throw new Error("Propose hash is not correct");
        }

        try {
            const signature = Buffer.from(propose.signature, "hex");
            const publicKey = Buffer.from(propose.generator_public_key, "hex");    //wxm block database
            if (ed.Verify(hash, signature, publicKey)) {
                return;
            } else {
                throw new Error("Vefify signature failed");
            }
        } catch (e) {
            throw new Error(`Verify signature exception: ${e.toString()}`);
        }
    }

    setPendingBlock(block) {
        this._pendingVotes = null;
        this._votesKeySet = {};
        this._pendingBlock = block;
    }

    getPendingBlock() {
        return this._pendingBlock;
    }

    addPendingVotes({height, id, signatures}) {
        if (!this._pendingBlock || this._pendingBlock.height != height || this._pendingBlock.id != id) {
            return this._pendingVotes;
        }

        for (let i = 0; i < signatures.length; ++i) {
            const item = signatures[i];

            if (this._votesKeySet[item.key]) {
                continue;
            }

            if (this.verifyVote(height, id, item)) {
                this._votesKeySet[item.key] = true;
                if (!this._pendingVotes) {
                    this._pendingVotes = {
                        height,
                        id,
                        signatures: []
                    };
                }
                this._pendingVotes.signatures.push(item);
            }
        }
        return this._pendingVotes;
    }

    hasPendingBlock(timestamp) {
        if (!this._pendingBlock) {
            return false;
        }
        return this.runtime.slot.getSlotNumber(this._pendingBlock.timestamp) == this.runtime.slot.getSlotNumber(timestamp);
    }

    async normalizeVotes(votes) {
        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                height: {
                    type: "string"
                },
                id: {
                    type: "string"
                },
                signatures: {
                    type: "array",
                    minLength: 1,
                    maxLength: 101
                }
            },
            required: ["height", "id", "signatures"]
        }, votes);
        if (validateErrors) {
            this.logger.error(`Consensus.normalizeVotes: ${validateErrors[0].message}`);
            throw new Error(validateErrors[0].message);
        }

        return votes;
    }

    getVoteHash(height, id) {
        const bytes = new ByteBuffer();

        //Bignum update   bytes.writeLong(height);
        bytes.writeString(`${height}`);
        bytes.writeString(id)

        bytes.flip();
        return crypto.createHash('sha256').update(bytes.toBuffer()).digest();
    }

    createVotes(keypairs, {height, id}) {
        const hash = this.getVoteHash(height, id);
        const votes = {
            height,
            id,
            signatures: []
        };
        keypairs.forEach(el => {
            votes.signatures.push({
                key: el.publicKey.toString('hex'),
                sig: ed.Sign(hash, el).toString('hex')
            });
        });
        return votes;
    }

    verifyVote(height, id, {sig, key}) {
        try {
            const hash = this.getVoteHash(height, id);
            const signature = Buffer.from(sig, "hex");
            const publicKey = Buffer.from(key, "hex");
            return ed.Verify(hash, signature, publicKey);
        } catch (e) {
            return false;
        }
    }

    /**
     * 判断投票基于本地是否足够，需要2/3
     * @param {*} votes
     */
    hasEnoughVotes(votes) {
        return votes && votes.signatures && (votes.signatures.length > (this.config.settings.delegateNumber * 2 / 3));
    }

    /**
     * 判断投票基于分布节点是否足够，需要至少6个
     * @param {*} votes
     */
    hasEnoughVotesRemote(votes) {
        return votes && votes.signatures && votes.signatures.length >= 6;
    }
}

export default Consensus;
