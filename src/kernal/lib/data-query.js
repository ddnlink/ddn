/**
 * Delegate
 * wangxm   2019-03-25
 */
const { AssetTypes } = require('@ddn/ddn-utils');

var _singleton;

class DataQuery {

    static singleton(context) {
        if (!_singleton) {
            _singleton = new DataQuery(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async loadSimpleBlocksData(where, limit, offset, orders) {
        return new Promise((resolve, reject) => {
            this.dao.findPage("block", where, limit, offset, false, [
                ['id', 'b_id'],
                ['height', 'b_height'],
                ['number_of_transactions', 'b_numberOfTransactions'],
                ['total_amount', 'b_totalAmount'],
                ['total_fee', 'b_totalFee'],
                ['reward', 'b_reward'],
                ['payload_length', 'b_payloadLength'],
                ['payload_hash', 'b_payloadHash'],
                ['generator_public_key', 'b_generatorPublicKey'],
                ['block_signature', 'b_blockSignature'],
                ['previous_block', 'b_previousBlock'],
                ['timestamp', 'b_timestamp'],
                ['version', 'b_version']
            ], orders, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    async loadTransactionsWithBlockIds(blockIds) {
        if (blockIds && blockIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("tr", {
                    block_id: {
                        "$in": blockIds
                    }
                }, [['id', 't_id'],
                    ['type', 't_type'],
                    ['sender_public_key', 't_senderPublicKey'],
                    ['sender_id', 't_senderId'],
                    ['recipient_id', 't_recipientId'],
                    ['amount', 't_amount'],
                    ['fee', 't_fee'],
                    ['signature', 't_signature'],
                    ['sign_signature', 't_signSignature'],
                    ['args', 't_args'],
                    ['message', 't_message'],
                    ['timestamp', 't_timestamp'],
                    ['block_id', 'b_id']
                ], [['timestamp', 'asc']], (err, rows) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: blockIds");
        }
    }
    
    async loadDelegatesWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("delegate", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['username', 'd_username'],
                    ['transaction_id', 't_id']
                ], null, (err, rows) => {
                    if (err) {
                        resolve(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    };
    
    async loadVotesWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("vote", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['votes', 'v_votes'],
                    ['transaction_id', 't_id']
                ], null, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    }
    
    async loadAssetsWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("trs_asset", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['transaction_id', 't_id'],
                    ['transaction_id', 'asset_trs_id'],
                    ['transaction_type', 'asset_trs_type'],
                    ['str1', 'asset_str1'],
                    ['str2', 'asset_str2'],
                    ['str3', 'asset_str3'],
                    ['str4', 'asset_str4'],
                    ['str5', 'asset_str5'],
                    ['str6', 'asset_str6'],
                    ['str7', 'asset_str7'],
                    ['str8', 'asset_str8'],
                    ['str9', 'asset_str9'],
                    ['str10', 'asset_str10'],
                    ['int1', 'asset_int1'],
                    ['int2', 'asset_int2'],
                    ['int3', 'asset_int3'],
                    ['timestamp1', 'asset_timestamp1'],
                    ['timestamp2', 'asset_timestamp2'],
                    ['timestamp', 'asset_timestamp']
                ], null, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    };
    
    async loadAssetExtsWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("trs_asset_ext", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['transaction_id', 't_id'],
                    ["json_ext", "asset_ext_json"]
                ], null, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    };
    
    async loadSignaturesWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("signature", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['public_key', 's_publicKey'],
                    ['transaction_id', 't_id']
                ], null, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    };
    
    async loadMultiSignaturesWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("multisignature", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['min', 'm_min'],
                    ['lifetime', 'm_lifetime'],
                    ['keysgroup', 'm_keysgroup'],
                    ['transactionId', 't_id']
                ], null, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    }
    
    async loadDappsWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("dapp", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['name', 'dapp_name'],
                    ['description', 'dapp_description'],
                    ['tags', 'dapp_tags'],
                    ['type', 'dapp_type'],
                    ['link', 'dapp_link'],
                    ['category', 'dapp_category'],
                    ['icon', 'dapp_icon'],
                    ['delegates', 'dapp_delegates'],
                    ['unlockDelegates', 'dapp_unlockDelegates'],
                    ['transaction_id', 't_id']
                ], null, (err, rows) => {
                    if (dappErr) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    }

    async loadDappIntransfersWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("intransfer", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['dapp_id', 'it_dappId'],
                    ['currency', 'it_currency'],
                    ['amount', 'it_amount'],
                    ['transaction_id', 't_id']
                ], null, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    }

    async loadDappOuttransfersWithTransactionIds(transactionIds) {
        if (transactionIds && transactionIds.length > 0) {
            return new Promise((resolve, reject) => {
                this.dao.findList("outtransfer", {
                    transaction_id: {
                        "$in": transactionIds
                    }
                }, [['dapp_id', 'ot_dappId'],
                    ['outtransaction_id', 'ot_outTransactionId'],
                    ['currency', 'ot_currency'],
                    ['amount', 'ot_amount'],
                    ['transaction_id', 't_id']
                ], null, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            throw new Error("Invalid params: transactionIds");
        }
    }

    async queryFullBlockData(where, limit, offset, orders) {
        var blockRows = await this.loadSimpleBlocksData(where, limit, offset, orders);
    
        var blockIds = [];
        for (var i = 0; i < blockRows.length; i++) {
            blockIds.push(blockRows[i].b_id);
        }
    
        if (blockIds.length > 0) {
            var trsRows = await this.loadTransactionsWithBlockIds(blockIds);
            if (trsRows && trsRows.length) {
                var blocksResult = [];
                var blocksResultMap = {};
    
                var trsIds = [];
                var delegateTrsIds = [];
                var voteTrsIds = [];
                var signatureTrsIds = [];
                var multiSignatureTrsIds = [];
                var dappTrsIds = [];
                var dappIntransferTrsIds = [];
                var dappOuttransferTrsIds = [];
    
                for (var i = 0; i < blockRows.length; i++) {
                    let blockItem = blockRows[i];
    
                    let hasTransaction = false;
                    let newTrsRows = [];
                    for (var j = 0; j < trsRows.length; j++) {
                        let trsItem = trsRows[j];
    
                        if (trsItem.b_id == blockItem.b_id) {
                            blocksResult.push(Object.assign(trsItem, blockItem || null));
                            blocksResultMap[trsItem.t_id] = blocksResult[blocksResult.length - 1];
    
                            trsIds.push(trsItem.t_id);
    
                            if (trsItem.t_type == AssetTypes.DELEGATE) {
                                delegateTrsIds.push(trsItem.t_id);
                            }
                            if (trsItem.t_type == AssetTypes.VOTE) {
                                voteTrsIds.push(trsItem.t_id);
                            }
                            if (trsItem.t_type == AssetTypes.SIGNATURE) {
                                signatureTrsIds.push(trsItem.t_id);
                            }
                            if (trsItem.t_type == AssetTypes.MULTI) {
                                multiSignatureTrsIds.push(trsItem.t_id);
                            }
                            if (trsItem.t_type == AssetTypes.DAPP) {
                                dappTrsIds.push(trsItem.t_id);
                            }
                            if (trsItem.t_type == AssetTypes.IN_TRANSFER) {
                                dappIntransferTrsIds.push(trsItem.t_id);
                            }
                            if (trsItem.t_type == AssetTypes.OUT_TRANSFER) {
                                dappOuttransferTrsIds.push(trsItem.t_id);
                            }
                        } else {
                            newTrsRows.push(trsItem);
                        }
                    }
    
                    if (!hasTransaction) {
                        blocksResult.push(blockItem);
                    } else {
                        trsRows = newTrsRows;
                    }
                }
    
                var combineBlockData = function (trsExtRows) {
                    if (trsExtRows && trsExtRows.length > 0) {
                        for (var i = 0; i < trsExtRows.length; i++) {
                            let dataObj = trsExtRows[i];
                            let blocksResultObj = blocksResultMap[dataObj.t_id];
                            if (blocksResultObj) {
                                Object.assign(blocksResultObj, dataObj);
                            }
                        }
                    }
                }
    
                //受托人数据
                if (delegateTrsIds.length > 0) {
                    var delegatesRows = await this.loadDelegatesWithTransactionIds(delegateTrsIds);
                    combineBlockData(delegatesRows);
                }
    
                //投票交易数据
                if (voteTrsIds.length > 0) {
                    var votesRows = await this.loadVotesWithTransactionIds(voteTrsIds);
                    combineBlockData(votesRows);
                }
    
                //签名交易数据
                if (signatureTrsIds.length > 0) {
                    var signaturesRows = await this.loadSignaturesWithTransactionIds(signatureTrsIds);
                    combineBlockData(signaturesRows);
                }

                //多重签名交易数据
                if (multiSignatureTrsIds.length > 0) {
                    var multisignaturesRows = await this.loadMultiSignaturesWithTransactionIds(multiSignatureTrsIds);
                    combineBlockData(multisignaturesRows);
                }
    
                // //Dapp交易数据
                // if (dappTrsIds.length > 0) {
                //     var dappsRows = await this.loadDappsWithTransactionIds(dappTrsIds);
                //     combineBlockData(dappsRows);
                // }
    
                // //Dapp转入交易数据
                // if (dappIntransferTrsIds.length > 0) {
                //     var dappIntransfersRows = await this.loadDappIntransfersWithTransactionIds(dappIntransferTrsIds);
                //     combineBlockData(dappIntransfersRows);
                // }
    
                // //Dapp转出交易数据
                // if (dappOuttransferTrsIds.length > 0) {
                //     var dappOuttransfersRows = await this.loadDappOuttransfersWithTransactionIds(dappOuttransferTrsIds);
                //     combineBlockData(dappOuttransfersRows);
                // }
    
                //扩展资产数据
                var assetsRows = await this.loadAssetsWithTransactionIds(trsIds);
                combineBlockData(assetsRows);
    
                //扩展资产的扩展JSON数据
                var assetExtsRows = await this.loadAssetExtsWithTransactionIds(trsIds);
                combineBlockData(assetExtsRows);
    
                return blocksResult;
            } else {
                return blockRows;
            }
        } else {
            return [];
        }
    }

    async loadSimpleTransactionData(where, limit, offset, orders, returnTotal) {
        return new Promise((resolve, reject) => {
            this.dao.findPage("block", null, 1, 0, false,
                [[this.dao.db_fnMax('height'), 'maxHeight']],    //wxm block database  library.dao.db_fn('MAX', library.dao.db_col('height'))
                null, (err, rows) => {
                    if (err || !rows) {
                        return reject(err || "Get Block Error.");
                    }

                    var maxHeight = 2;
                    if (rows.length > 0) {
                        maxHeight = rows[0].maxHeight + 1;
                    }

                    this.dao.findPage("tr", where, limit, offset, returnTotal || false, [
                        ['id', 't_id'],
                        ['type', 't_type'],
                        ['sender_public_key', 't_senderPublicKey'],
                        ['sender_id', 't_senderId'],
                        ['recipient_id', 't_recipientId'],
                        ['amount', 't_amount'],
                        ['fee', 't_fee'],
                        ['signature', 't_signature'],
                        ['sign_signature', 't_signSignature'],
                        ['args', 't_args'],
                        ['message', 't_message'],
                        ['timestamp', 't_timestamp'],
                        ['block_id', 'b_id'],
                        ['block_height', 'b_height'],
                        [this.dao.db_str(maxHeight + '-block_height'), 'confirmations']
                    ], orders, (err, rows) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    });
            });
        });
    }

    async queryFullTransactionData(where, limit, offset, orders, returnTotal) {
        var queryData = await this.loadSimpleTransactionData(where, limit, offset, orders, returnTotal);
        
        var transactionRows = queryData;
        var count = 0;
        if (returnTotal) {
            transactionRows = queryData.rows;
            count = queryData.total;
        }

        if (transactionRows && transactionRows.length) {
            var transactionsMap = {};

            var trsIds = [];
            var delegateTrsIds = [];
            var voteTrsIds = [];
            var signatureTrsIds = [];
            var multiSignatureTrsIds = [];
            var dappTrsIds = [];
            var dappIntransferTrsIds = [];
            var dappOuttransferTrsIds = [];

            for (var i = 0; i < transactionRows.length; i++) {
                var trsItem = transactionRows[i];

                transactionsMap[trsItem.t_id] = trsItem;
                trsIds.push(trsItem.t_id);

                if (trsItem.t_type == AssetTypes.DELEGATE) {
                    delegateTrsIds.push(trsItem.t_id);
                }
                if (trsItem.t_type == AssetTypes.VOTE) {
                    voteTrsIds.push(trsItem.t_id);
                }
                if (trsItem.t_type == AssetTypes.SIGNATURE) {
                    signatureTrsIds.push(trsItem.t_id);
                }
                if (trsItem.t_type == AssetTypes.MULTI) {
                    multiSignatureTrsIds.push(trsItem.t_id);
                }
                if (trsItem.t_type == AssetTypes.DAPP) {
                    dappTrsIds.push(trsItem.t_id);
                }
                if (trsItem.t_type == AssetTypes.IN_TRANSFER) {
                    dappIntransferTrsIds.push(trsItem.t_id);
                }
                if (trsItem.t_type == AssetTypes.OUT_TRANSFER) {
                    dappOuttransferTrsIds.push(trsItem.t_id);
                }
            }

            var combineTransactionData = function (trsExtRows) {
                if (trsExtRows && trsExtRows.length > 0) {
                    for (var i = 0; i < trsExtRows.length; i++) {
                        let dataObj = trsExtRows[i];
                        let transactionObj = transactionsMap[dataObj.t_id];
                        if (transactionObj) {
                            Object.assign(transactionObj, dataObj);
                        }
                    }
                }
            }

            //受托人数据
            if (delegateTrsIds.length > 0) {
                var delegatesRows = await this.loadDelegatesWithTransactionIds(delegateTrsIds);
                combineTransactionData(delegatesRows);
            }
    
            //投票交易数据
            if (voteTrsIds.length > 0) {
                var votesRows = await this.loadVotesWithTransactionIds(voteTrsIds);
                combineTransactionData(votesRows);
            }

            //签名交易数据
            if (signatureTrsIds.length > 0) {
                var signaturesRows = await this.loadSignaturesWithTransactionIds(signatureTrsIds);
                combineTransactionData(signaturesRows);
            }

            //多重签名交易数据
            if (multiSignatureTrsIds.length > 0) {
                var multisignaturesRows = await this.loadMultiSignaturesWithTransactionIds(multiSignatureTrsIds);
                combineTransactionData(multisignaturesRows);
            }

            // //Dapp交易数据
            // if (dappTrsIds.length > 0) {
            //     var dappsRows = await this.loadDappsWithTransactionIds(dappTrsIds);
            //     combineTransactionData(dappsRows);
            // }

            // //Dapp转入交易数据
            // if (dappIntransferTrsIds.length > 0) {
            //     var dappIntransfersRows = await this.loadDappIntransfersWithTransactionIds(dappIntransferTrsIds);
            //     combineTransactionData(dappIntransfersRows);
            // }

            // //Dapp转出交易数据
            // if (dappOuttransferTrsIds.length > 0) {
            //     var dappOuttransfersRows = await this.loadDappOuttransfersWithTransactionIds(dappOuttransferTrsIds);
            //     combineTransactionData(dappOuttransfersRows);
            // }

            //扩展资产数据
            var assetsRows = await this.loadAssetsWithTransactionIds(trsIds);
            combineTransactionData(assetsRows);

            //扩展资产的扩展JSON数据
            var assetExtsRows = await this.loadAssetExtsWithTransactionIds(trsIds);
            combineTransactionData(assetExtsRows);

            if (returnTotal) {
                return {
                    transactions: transactionRows,
                    count
                }
            } else {
                return transactionRows;
            }
        } else {
            if (returnTotal) {
                return {
                    transactions: [],
                    count: 0
                }
            } else {
                return [];
            }
        }
    }

}

module.exports = DataQuery;