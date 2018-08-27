/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Sun May 06 2017 11:39:6
 *
 *  Copyright (c) 2018 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * 这是资产模型的基类
 *
 * 需要包含如下12个基本方法：
 * create，getBytes，calculateFee，verify，objectNormalize，dbRead，apply，undo，applyUnconfirmed，
 * undoUnconfirmed，ready，process
 */
let self;

class AssetBase {

    constructor(library, modules) {
        self = this;
        self.library = library;
        self.modules = modules;
    }

    /**
     * transaction创建时调用，用来对输入参数根据资产进行个性化处理
     * @param {*} data 
     * @param {*} trs 
     */
    create(data, trs) {
        return trs;
    }

    /**
     * 计算该类型资产交易的手续费
     * @param {*} trs 
     * @param {*} sender 
     */
    calculateFee(trs, sender) {
        return self.library.base.block.calculateFee();
    }

    propsMapping() {
        throw new Error("Subclasses must implement this method.");

        //抽象资产最多支持自定义15个属性
        //字符串类型10个，名称分别是str1,str2,str3...str10，长度分别是32,64,64,128,128,256,256,512,512,1024，前4个有索引
        //整数类型3个，名称分别是int1,int2,int3，类型为INT，前2个有索引
        //时间戳类型2个，分别是timestamp1,timestamp2
        //使用时根据根据自定义属性的类型进行映射

        //例：资产类型有name、age、address两个自定义属性，对应预设字段如下：
        // return [
        //     {"field": "str1", "prop": "name"},
        //     {"field": "int1", "prop": "age"},
        //     {"field": "str2", "prop": "addr"}
        // ];
    }

    /**
     * 
     * @param {*} trs 
     * @param {*} sender 
     * @param {*} cb 
     */
    verify(trs, sender, cb) {
        cb(null, trs);
    }

    process(trs, sender, cb) {
        setImmediate(cb, null, trs);
    }

    getBytes(trs) {
        return null;
    }

    apply(trs, block, sender, cb) {
        setImmediate(cb);
    }

    undo(trs, block, sender, cb) {
        setImmediate(cb);
    }

    applyUnconfirmed(trs, sender, cb) {
        setImmediate(cb);
    }

    undoUnconfirmed(trs, sender, cb) {
        setImmediate(cb);
    }

    objectNormalize(trs) {
        return trs;
    }

    hasJsonExt() {
        return false;
    }

    getJsonExt() {
        return null;
    }

    dbRead(raw) {
        if (raw && raw.asset_trs_id) {
            var result = {
                transactionId: raw.asset_trs_id,
                transactionType: raw.asset_trs_type,
                timestamp: raw.asset_timestamp
            };

            var props = this.propsMapping();
            if (props && props.length > 0) {
                for (var i = 0; i < props.length; i++) {
                    var mapping = props[i];
                    result[mapping.prop] = raw["asset_" + mapping.field];
                }
            }

            var json = raw.asset_ext_json;
            if (json != null && json != "") {
                try
                {
                    var jsonObj =  JSON.parse(json);
                    Object.assign(result, jsonObj);
                }
                catch(err2)
                {
                    ;
                }
            }

            return {
                daoConfirmation: result
            }
        } else {
            return null;
        }
    }

    //此方法应该直接写在，transaction的dbSave里，减轻资产的内容和理解难度
    dbSave(trs, cb) {
        //将mapping里能对应到的弄完后，剩下的那些都应该是json里的

        setImmediate(cb);
    }

    ready(trs, sender) {
        if (sender.multisignatures.length) {
            if (!trs.signatures) {
                return false;
            }

            return trs.signatures.length >= sender.multimin - 1;
        } else {
            return true;
        }
    }
}

module.exports = AssetBase;
