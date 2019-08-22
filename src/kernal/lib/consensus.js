/**
 * Delegate
 * wangxm   2018-01-08
 */
const ByteBuffer = require("bytebuffer");
const crypto = require("crypto");
const ed = require('ed25519');
const assert = require('assert');
const ip = require('ip');

var _singleton;

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
        var bytes = new ByteBuffer();
  
        //bignum update   bytes.writeLong(propose.height);
        bytes.writeString(propose.height);
        
        bytes.writeString(propose.id);
        
        var generatorPublicKeyBuffer = new Buffer(propose.generator_public_key, "hex"); //wxm block database
        for (var i = 0; i < generatorPublicKeyBuffer.length; i++) {
            bytes.writeByte(generatorPublicKeyBuffer[i]);
        }
        
        bytes.writeInt(propose.timestamp);
        
        var parts = propose.address.split(':');
        assert(parts.length == 2);
        bytes.writeInt(ip.toLong(parts[0]));
        bytes.writeInt(Number(parts[1]));
        
        bytes.flip();

        return crypto.createHash('sha256').update(bytes.toBuffer()).digest();
    }

    createPropose(keypair, block, address) {
        assert(keypair.publicKey.toString("hex") == block.generator_public_key);
        var propose = {
            height: block.height,
            id: block.id,
            timestamp: block.timestamp,
            generator_public_key: block.generator_public_key,   //wxm block database
            address: address
        };
        var hash = this.getProposeHash(propose);
        propose.hash = hash.toString("hex");
        propose.signature = ed.Sign(hash, keypair).toString("hex");
        return propose;
    }

    acceptPropose(propose) {
        var hash = this.getProposeHash(propose);
        if (propose.hash != hash.toString("hex")) {
            throw new Error("Propose hash is not correct");
        }

        try {
            var signature = new Buffer(propose.signature, "hex");
            var publicKey = new Buffer(propose.generator_public_key, "hex");    //wxm block database
            if (ed.Verify(hash, signature, publicKey)) {
                return;
            } else {
                throw new Error("Vefify signature failed");
            }
        } catch (e) {
            throw new Error("Verify signature exception: " + e.toString());
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

    addPendingVotes(votes) {
        if (!this._pendingBlock || this._pendingBlock.height != votes.height || this._pendingBlock.id != votes.id) {
            return this._pendingVotes;
        }

        for (var i = 0; i < votes.signatures.length; ++i) {
            var item = votes.signatures[i];

            if (this._votesKeySet[item.key]) {
                continue;
            }

            if (this.verifyVote(votes.height, votes.id, item)) {
                this._votesKeySet[item.key] = true;
                if (!this._pendingVotes) {
                    this._pendingVotes = {
                        height: votes.height,
                        id: votes.id,
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
        var validateErrors = await this.ddnSchema.validate({
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
        var bytes = new ByteBuffer();
  
        //bignum update   bytes.writeLong(height);
        bytes.writeString(height + "");
        bytes.writeString(id)
        
        bytes.flip();
        return crypto.createHash('sha256').update(bytes.toBuffer()).digest();
    }

    createVotes(keypairs, block) {
        var hash = this.getVoteHash(block.height, block.id);
        var votes = {
            height: block.height,
            id: block.id,
            signatures: []
        };
        keypairs.forEach(function (el) {
            votes.signatures.push({
                key: el.publicKey.toString('hex'),
                sig: ed.Sign(hash, el).toString('hex')
            });
        });
        return votes;
    }

    verifyVote(height, id, voteItem) {
        try {
            var hash = this.getVoteHash(height, id);
            var signature = new Buffer(voteItem.sig, "hex");
            var publicKey = new Buffer(voteItem.key, "hex");
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

module.exports = Consensus;