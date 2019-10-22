/**
 * RootRouter接口
 * wangxm   2019-01-16
 */
class RootRouter {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async post(req) {
        const peerIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const peerStr = peerIp ? `${peerIp}:${isNaN(parseInt(req.headers['port'])) ? 'unkwnown' : parseInt(req.headers['port'])}` : 'unknown';
        if (typeof req.body.block == 'string') {
            req.body.block = this.protobuf.decodeBlock(new Buffer(req.body.block, 'base64'));
        }
        if (typeof req.body.votes == 'string') {
            req.body.votes = this.protobuf.decodeBlockVotes(new Buffer(req.body.votes, 'base64'));
        }
        try {
            var block = await this.runtime.block.objectNormalize(req.body.block);
            var votes = await this.runtime.consensus.normalizeVotes(req.body.votes);
        } catch (e) {
            this.logger.error(`normalize block or votes object error: ${e.toString()}`);
            this.logger.error(`Block ${block ? block.id : 'null'} is not valid, ban 60 min`, peerStr);
    
            if (peerIp && req.headers['port'] > 0 && req.headers['port'] < 65536) {
                await this.runtime.peer.changeState(ip.toLong(peerIp), parseInt(req.headers['port']), 0, 3600);
            }

            return {succ: false, error: e};
        }

        setImmediate(async () => {
            try
            {
                await this.runtime.block.receiveNewBlock(block, votes);
            }
            catch (err)
            {
                this.logger.error("Process received new block failed: " + err);
            }
        });
    
        return {succ: true}
    }

    async get(req) {
        var validateErrors = await this.ddnSchema.validate({
            type: 'object',
            properties: { 
                lastBlockId: { 
                    type: 'string' 
                } 
            }
        }, req.query);
        if (validateErrors) {
            return {success: false, error: validateErrors[0].message};
        }

        let limit = 200;
        if (req.query.limit) {
            limit = Math.min(limit, Number(req.query.limit));
        }

        return new Promise((resolve, reject) => {
            this.sequence.add((cb) => {
                this.dao.findOne('block', {
                    id: req.query.lastBlockId || null
                }, ['height'], async (err, row) => {
                    if (err) {
                        return reject(err);
                    }

                    var where = {};
                    if (req.query.id) {
                        where.id = req.query.id;
                    }
                    if (req.query.lastBlockId) {
                        where.height = {
                            "$gt": row ? row.height : 0
                        }
                    }
            
                    var data = await this.runtime.dataquery.queryFullBlockData(where, limit, 0, [['height', 'asc']]);
                    cb(null, {blocks: data});
                });
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        });
    }

    async getCommon(req) {
        var validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                max: {
                    type: 'integer'
                },
                min: {
                    type: 'integer'
                },
                ids: {
                    type: 'string',
                    format: 'splitarray'
                }
            }, required: ['max', 'min', 'ids']
        }, req.query);
        if (validateErrors) {
            return {success: false, error: validateErrors[0].message};
        }

        var query = req.query;

        const max = query.max;
        const min = query.min;
        const ids = query.ids ? query.ids.split(",") : [];
        const escapedIds = ids.map(id => `'${id}'`);

        if (!escapedIds.length) {
            var validateErrors = await this.ddnSchema.validate({
                type: "object",
                properties: {
                    port: {
                        type: "integer",
                        minimum: 1,
                        maximum: 65535
                    },
                    nethash: {
                        type: "string",
                        maxLength: 8
                    }
                },
                required: ['port', 'nethash']
            }, req.headers);

            const peerIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const peerPort = parseInt(req.headers['port']);
            const peerStr = peerIp ? `${peerIp}:${isNaN(peerPort) ? 'unkwnown' : peerPort}` : 'unknown';
            this.logger.log('Invalid common block request, ban 60 min', peerStr);
  
            if (!validateErrors && peerIp && !isNaN(peerPort)) {
                await this.runtime.peer.changeState(ip.toLong(peerIp), peerPort, 0, 3600);
            }
  
            return {success: false, error: "Invalid block id sequence"};
        }

        return new Promise((resolve, reject) => {
            // shuai 2018-12-01
            this.dao.findList('block', {
                id: { '$in': ids },
                height: { '$gte': min, '$lte': max },
            }, ["id", "timestamp", "previous_block", "height"],
            [['height', 'DESC']], (err, rows) => {
                if (err) {
                    resolve({success: false, error: "Database error"});
                }
    
                const commonBlock = rows.length ? rows[0] : null;
                resolve({success: true, common: commonBlock});
            })
        })
    }

}

module.exports = RootRouter;