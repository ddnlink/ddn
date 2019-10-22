var bignum = require('@ddn/bignum-utils');
var { RuntimeState } = require('@ddn/ddn-utils');

/**
 * RootRouter接口
 * wangxm   2019-03-15
 */
class RootRouter {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async get(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                limit: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100
                },
                orderBy: {
                    type: "string"
                },
                offset: {
                    type: "integer",
                    minimum: 0
                },
                generatorPublicKey: {
                    type: "string",
                    format: "publicKey"
                },
                totalAmount: {
                    "type": "string"
                },
                totalFee: {
                    "type": "string"
                },
                reward: {
                    "type": "string"
                },
                previousBlock: {
                    type: "string"
                },
                height: {
                    "type": "string"
                }
            }
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var where = {};
        if (query.generatorPublicKey) {
            where.generator_public_key = query.generatorPublicKey;
        }
        if (query.numberOfTransactions) {
            where.number_of_transactions = query.numberOfTransactions;
        }
        if (query.previousBlock) {
            where.previous_block = query.previousBlock;
        }
        if (bignum.isGreaterThanOrEqualTo(query.height, 0)) {
            where.height = query.height;
        }
        if (bignum.isGreaterThanOrEqualTo(query.totalAmount, 0)) {
            where.total_amount = query.totalAmount;
        }
        if (bignum.isGreaterThanOrEqualTo(query.totalFee, 0)) {
            where.total_fee = query.totalFee;
        }
        if (bignum.isGreaterThanOrEqualTo(query.reward, 0)) {
            where.reward = query.reward;
        }

        var sorts = null;
        if (query.orderBy) {
            sorts = [[]];

            var sortItems = query.orderBy.split(':');

            var sortField = sortItems[0].replace(/[^\w\s]/gi, '');
            sorts[0].push(sortField);

            var sortMethod = "desc";
            if (sortItems.length == 2) {
                sortMethod = sortItems[1] == 'desc' ? 'desc' : 'asc'
            }
            sorts[0].push(sortMethod);

            sortField = `b.${sortField}`;
            var sortFields = ['b.id', 'b.timestamp', 'b.height', 'b.previousBlock', 'b.totalAmount', 'b.totalFee', 'b.reward', 'b.numberOfTransactions', 'b.generatorPublicKey'];
            if (sortFields.indexOf(sortField) < 0) {
                throw new Error("Invalid sort field");
            }
        }

        var offset = query.offset;
        var limit = query.limit;

        return new Promise((resolve, reject) => {
            this.dbSequence.add(async (cb) => {
                try
                {
                    var result = await this.runtime.block.queryBlockData(where, sorts, offset, limit, true);
                    cb(null, result);
                }
                catch (e)
                {
                    cb(e);
                }
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(Object.assign({success: true}, result));
                }
            });
        });
    }

    async getGet(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                id: {
                    type: 'string',
                    minLength: 1
                },
                height: {
                    type: "string",
                    minLength: 1
                },
                hash: {
                    type: 'string',
                    minLength: 1
                }
            }
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var block = await this.runtime.block.querySimpleBlockData(query);
        return {
            success: true,
            block
        };
    }

    async getFull(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var query = Object.assign({}, req.body, req.query);
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                id: {
                    type: 'string',
                    minLength: 1
                },
                height: {
                    type: 'string',
                    minimum: 1
                }
            }
        }, query);
        if (validateErrors) {
            throw new Error(validateErrors[0].message);
        }

        var blocksData = await this.runtime.dataquery.queryFullBlockData(query, 1, 0, null);
        if (blocksData && blocksData.length) {
            var blocks = await this.runtime.block._parseObjectFromFullBlocksData(blocksData);
            return {
                success: true,
                block: blocks[0]
            }
        } else {
            throw new Error("Block not found");
        }
    }

    async getGetFee(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var fee = await this.runtime.block.calculateFee();
        return {fee};
    }

    async getGetMilestone(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var height = this.runtime.block.getLastBlock().height;
        var milestone = this.runtime.block.getBlockStatus().calcMilestone(height);
        return {milestone};
    }

    async getGetReward(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var height = this.runtime.block.getLastBlock().height;
        var reward = this.runtime.block.getBlockStatus().calcReward(height);
        return {reward};
    }

    async getGetSupply(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var height = this.runtime.block.getLastBlock().height;
        var supply = this.runtime.block.getBlockStatus().calcSupply(height);
        return {supply};
    }

    async getGetHeight(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var lastBlock = this.runtime.block.getLastBlock();
        return { 
            success: true,
            height: lastBlock && lastBlock.height ? lastBlock.height : 0
        };
    }

    async getGetStatus(req) {
        if (this.runtime.state != RuntimeState.Ready) {
            throw new Error("Blockchain is loading");
        }

        var lastBlock = this.runtime.block.getLastBlock();
        var height = lastBlock.height;

        return {
            success: true,
            height: height, //bignum update
            fee: await this.runtime.block.calculateFee(),
            milestone: this.runtime.block.getBlockStatus().calcMilestone(height),
            reward: this.runtime.block.getBlockStatus().calcReward(height) + "",   //bignum update
            supply: this.runtime.block.getBlockStatus().calcSupply(height)
        }        
    }

}

module.exports = RootRouter;