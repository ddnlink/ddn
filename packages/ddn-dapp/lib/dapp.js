const { AssetBase } = require('ddn-asset-base');
const valid_url = require('valid-url');
const bignum = require('bignum-utils');
const ByteBuffer = require('bytebuffer');
const dappCategory = require('./dapp/dapp-category.js');
const crypto = require('crypto');
const ed = require('ed25519');
const path = require('path');
const fs = require('fs');
const request = require('request');
const DecompressZip = require('decompress-zip');
const { Sandbox } = require('ddn-sandbox');

const WITNESS_CLUB_DAPP_NAME = 'DDN-FOUNDATION'

const _dappInstalling = {};
const _dappRemoving = {};
const _dappLaunched = {};
const _dappLaunchedLastError = {};

class Dapp extends AssetBase {
    async propsMapping() {
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
            field: "str8",
            prop: "link",
            required: true
        },
        {
            field: "int1",
            prop: "type",
            required: true
        },
        {
            field: "int2",
            prop: "category",
            required: true
        },
        {
            field: "str9",
            prop: "icon"
        },
        {
            field: "str_ext",
            prop: "delegates"
        },
        {
            field: "int3",
            prop: "unlock_delegates"
        },
        ];
    }

    async create(data, trs) {
        trs.recipient_id = null;
        trs.amount = "0";

        const assetJsonName = await this.getAssetJsonName(trs.type);
        trs.asset[assetJsonName] = data[assetJsonName];

        // {
        //     category: data.category,
        //     name: data.name,
        //     description: data.description,
        //     tags: data.tags,
        //     type: data.dapp_type,
        //     link: data.link,
        //     icon: data.icon,
        //     delegates: data.delegates,
        //     unlock_delegates: data.unlock_delegates
        // };
        return trs;
    }

    async calculateFee(trs, sender) {
        return bignum.multiply(100, this.tokenSetting.fixedPoint);
    }

    async verify(trs, sender) {
        const dapp = await this.getAssetObject(trs);
        if (trs.recipient_id) {
            throw new Error("Invalid recipient");
        }

        //bignum update if (trs.amount != 0) {
        if (!bignum.isZero(trs.amount)) {
            throw new Error("Invalid transaction amount");
        }

        if (!dapp.category) {
            throw new Error("Invalid dapp category");
        }

        let foundCategory = false;
        for (var i in dappCategory) {
            if (dappCategory[i] == dapp.category) {
                foundCategory = true;
                break;
            }
        }

        if (!foundCategory) {
            throw new Error("Unknown dapp category");
        }

        if (dapp.icon) {
            if (!valid_url.isUri(dapp.icon)) {
                throw new Error("Invalid icon link")
            }

            const length = dapp.icon.length;

            if (
                dapp.icon.indexOf('.png') != length - 4 &&
                dapp.icon.indexOf('.jpg') != length - 4 &&
                dapp.icon.indexOf('.jpeg') != length - 5
            ) {
                throw new Error("Invalid icon file type")
            }

            if (dapp.icon.length > 160) {
                throw new Error("Dapp icon url is too long. Maximum is 160 characters")
            }
        }

        if (dapp.type > 1 || dapp.type < 0) {
            throw new Error("Invalid dapp type")
        }

        if (!valid_url.isUri(dapp.link)) {
            throw new Error("Invalid dapp link")
        }

        if (dapp.link.indexOf(".zip") != dapp.link.length - 4) {
            throw new Error("Invalid dapp file type")
        }

        if (dapp.link.length > 160) {
            throw new Error("Dapp link is too long. Maximum is 160 characters")
        }

        if (!dapp.name || dapp.name.trim().length == 0 || dapp.name.trim() != dapp.name) {
            throw new Error("Missing dapp name")
        }

        if (dapp.name.length > 32) {
            throw new Error("Dapp name is too long. Maximum is 32 characters")
        }

        if (dapp.description && dapp.description.length > 160) {
            throw new Error("Dapp description is too long. Maximum is 160 characters")
        }

        if (dapp.tags && dapp.tags.length > 160) {
            throw new Error("Dapp tags is too long. Maximum is 160 characters")
        }

        if (dapp.tags) {
            let tags = dapp.tags.split(',');

            tags = tags.map(tag => tag.trim()).sort();

            for (var i = 0; i < tags.length - 1; i++) {
                if (tags[i + 1] == tags[i]) {
                    throw new Error(`Encountered duplicate tags: ${tags[i]}`)
                }
            }
        }

        if (dapp.delegates) {
            const arr = dapp.delegates.split(',');
            if (!arr || arr.length < 5 || arr.length > 101) {
                throw new Error("Invalid dapp delegates")
            }
            for (let i in arr) {
                if (arr[i].length != 64) {
                    throw new Error("Invalid dapp delegates format")
                }
            }
        }

        if (dapp.unlock_delegates) {
            if (!dapp.unlock_delegates || dapp.unlock_delegates < 3 || dapp.unlock_delegates > dapp.delegates.length) {
                throw new Error("Invalid unlock delegates number")
            }
        }

        const data1 = await super.queryAsset({ name: dapp.name }, false, false, 1, 1);
        if (data1.length > 0) {
            throw new Error(`Dapp name already exists: ${dapp.name}`);
        }

        const data2 = await super.queryAsset({ link: dapp.link }, false, false, 1, 1);
        if (data2.length > 0) {
            throw new Error(`Dapp link already exists: ${dapp.link}`);
        }

        return trs;
    }

    async getBytes(trs) {
        const dapp = trs.asset.dapp;
        let buf = new Buffer([]);
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
        if (dapp.delegates) {
            bb.writeString(dapp.delegates)
        }
        if (dapp.unlock_delegates || dapp.unlock_delegates === 0) {
            bb.writeInt(dapp.unlock_delegates)
        }
        bb.flip();

        buf = Buffer.concat([buf, bb.toBuffer()]);

        return buf;
    }

    async apply(trs, block, sender, dbTrans) {
        const assetObj = await this.getAssetObject(trs);
        if (assetObj.name === WITNESS_CLUB_DAPP_NAME) {
            global.state.clubInfo = assetObj
            global.state.clubInfo.transactionId = trs.id
        }
    }

    async undo(trs, block, sender, dbTrans) {
        const assetObj = await this.getAssetObject(trs);
        if (assetObj.name === WITNESS_CLUB_DAPP_NAME) {
            global.state.clubInfo = null
        }
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
        const assetObj = await this.getAssetObject(trs);

        //bignum update if (privated.unconfirmedNames[trs.asset.dapp.name]) {
        if (this.oneoff.has(assetObj.name.toLowerCase())) {
            throw new Error("Dapp name already exists")
        }

        //bignum update if (trs.asset.dapp.link && privated.unconfirmedLinks[trs.asset.dapp.link]) {
        if (assetObj.link && this.oneoff.has(assetObj.link.toLowerCase())) {
            throw new Error(cb, "Dapp link already exists");
        }

        //bignum update privated.unconfirmedNames[trs.asset.dapp.name] = true;
        this.oneoff.set(assetObj.name.toLowerCase(), true);
        //bignum update privated.unconfirmedLinks[trs.asset.dapp.link] = true;
        this.oneoff.set(assetObj.link.toLowerCase(), true);
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
        const assetObj = await this.getAssetObject(trs);
        //bignum update delete privated.unconfirmedNames[trs.asset.dapp.name];
        this.oneoff.delete(assetObj.name.toLowerCase());
        //bignum update delete privated.unconfirmedLinks[trs.asset.dapp.link];
        this.oneoff.delete(assetObj.link.toLowerCase());
    }

    async dbSave(trs, dbTrans) {
        await super.dbSave(trs, dbTrans);
        await this.runtime.socketio.emit('dapps/change', {});
    }

    async attachApi(router) {
        router.put("/", async (req, res) => {
            try {
                const result = await this.putDapp(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/", async (req, res) => {
            try {
                const result = await this.getDappList(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/get", async (req, res) => {
            try {
                const result = await this.getDappById(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/installedIds", async (req, res) => {
            try {
                const result = await this.getInstalledDappIds();
                res.json({ success: true, ids: result });
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/installed", async (req, res) => {
            try {
                const result = await this.getInstalled(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.post("/install", async (req, res) => {
            try {
                const result = await this.postInstallDapp(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.post("/uninstall", async (req, res) => {
            try {
                const result = await this.postUninstallDapp(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.post("/launch", async (req, res) => {
            try {
                const result = await this.postLaunchDapp(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/launch/lasterror", async (req, res) => {
            try {
                const result = await this.getLaunchDappLastError(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.post("/stop", async (req, res) => {
            try {
                const result = await this.postStopDapp(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/installing", async (req, res) => {
            try {
                const ids = [];
                for (var dappId in _dappInstalling) {
                    ids.push(dappId);
                }

                return res.json({ success: true, installing: ids });
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/removing", async (req, res) => {
            try {
                const ids = [];
                for (var dappId in _dappRemoving) {
                    ids.push(dappId);
                }

                return res.json({ success: true, removing: ids });
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/launched", async (req, res) => {
            try {
                const ids = [];
                for (var dappId in _dappLaunched) {
                    ids.push(dappId);
                }

                return res.json({ success: true, launched: ids });
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/categories", async (req, res) => {
            try {
                res.json({ success: true, categories: dappCategory });
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/balances/:dappid", async (req, res) => {
            try {
                const result = await this.getDappBalances(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get("/balances/:dappid/:currency", async (req, res) => {
            try {
                const result = await this.getDappBalance(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });
    }

    async getDappBalances(req, res) {
        const dappId = req.params.dappid;
        const limit = req.query.limit || 100;
        const offset = req.query.offset || 0;

        return new Promise((resolve, reject) => {
            this.dao.findPage("mem_asset_balance", { address: dappId }, limit, offset, true,
                ['currency', 'balance'], null, (err, rows) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve({ success: true, result: rows });
                });
        });
    }

    async getDappBalance(req, res) {
        const dappId = req.params.dappid;
        const currency = req.params.currency;

        return new Promise((resolve, reject) => {
            this.dao.findOne("mem_asset_balance", { address: dappId, currency }, 
                ['balance'], (err, row) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve({ success: true, result: { currency, balance: row.balance } });
                });
        });
    }

    async getLaunchDappLastError(req, res) {
        const query = req.query;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                id: {
                    type: 'string',
                    minLength: 1
                },
                master: {
                    type: "string",
                    minLength: 0
                }
            },
            required: ["id"]
        }, query);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        if (this.config.dapp.masterpassword &&
            query.master !== this.config.dapp.masterpassword) {
            throw new Error("Invalid master password");
        }

        if (_dappLaunchedLastError[query.id]) {
            return { success: true, error: _dappLaunchedLastError[query.id] };
        } else {
            return { success: true };
        }
    }

    async postLaunchDapp(req, res) {
        const body = req.body;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                id: {
                    type: 'string',
                    minLength: 1
                },
                params: {
                    type: "array",
                    minLength: 1
                },
                master: {
                    type: "string",
                    minLength: 0
                }
            },
            required: ["id"]
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        if (this.config.dapp.masterpassword &&
            body.master !== this.config.dapp.masterpassword) {
            throw new Error("Invalid master password");
        }

        await this.runDapp(body.id, body.params);
        await this.runtime.socketio.emit('dapps/change', {});

        return { success: true };
    }

    async _readDappConfig(dappPath) {
        const configFile = path.join(dappPath, "config.json");

        return new Promise((resolve, reject) => {
            fs.readFile(configFile, "utf8", (err, data) => {
                if (err) {
                    return reject(err);
                } else {
                    try {
                        const configObj = JSON.parse(data);
                        return resolve(configObj);
                    } catch (err2) {
                        return reject(err2);
                    }
                }
            });
        });
    }

    async runDapp(id, args) {
        if (_dappLaunched[id]) {
            throw new Error("Dapp already launched");
        }

        delete _dappLaunchedLastError[id];

        args = args || [];

        const dapp = await this.getDappByTransactionId(id);

        const installedIds = await this.getInstalledDappIds();
        if (installedIds.indexOf(id) < 0) {
            throw new Error('Dapp not installed');
        }

        const dappPath = path.join(this.config.dappsDir, id);

        var dappConfig;
        try {
            dappConfig = await this._readDappConfig(dappPath);
        }
        catch (err) {
            throw new Error(`Failed to read config.json file for: ${id}`)
        }

        if (dappConfig.peers && dappConfig.peers.length) {
            for (var i = 0; i < dappConfig.peers.length; i++) {
                const peerItem = dappConfig.peers[i];
                await this.runtime.peer.addDapp(peerItem);
            }
        }

        const sandbox = new Sandbox(this._context, id, async (type, data) => {
            if (type == "close" || type == "error") {
                try {
                    await this.stopDapp(dapp);
                } catch (err) {
                    ;
                }
            }

            if (type == "error" || type == "stderr_data") {
                _dappLaunchedLastError[id] = data && data.message ? data.message : data.toString();
            }
        });

        const cp = sandbox.run(args);

        console.log("wxm ======================================================================  ")

        console.log("wxm       pid: " + cp.pid + "   ppid: " + cp.ppid);

        console.log("wxm **********************************************************************")


        _dappLaunched[id] = sandbox;

        await this._attachDappApi(id);

        await this._addLaunchedMarkFile(dappPath);
    }

    async _getLaunchedMarkFile(dappPath) {
        const file = path.join(dappPath, "dapp.pid");
        return file;
    }

    /**
     * 增加运行标记文件
     */
    async _addLaunchedMarkFile(dappPath) {
        const file = await this._getLaunchedMarkFile(dappPath);
        if (!fs.existsSync(file)) {
            try {
                var fd = fs.openSync(file, 'wx');
                fs.writeSync(fd, process.pid);
                fs.closeSync(fd);
            }
            catch (err) {
                this.logger.warn(err);
            }
        }
    }

    /**
     * 移除运行标记文件
     */
    async _removeLaunchedMarkFile(dappPath) {
        const file = await this._getLaunchedMarkFile(dappPath);
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
            }
            catch (err) {
                this.logger.warn(err);
            }
        }
    }

    async _readDappRouters(dappPath) {
        const routerFile = path.join(dappPath, "routers.json");

        return new Promise((resolve, reject) => {
            fs.readFile(routerFile, "utf8", (err, data) => {
                if (err) {
                    return reject(err);
                } else {
                    try {
                        const routersObj = JSON.parse(data);
                        return resolve(routersObj);
                    } catch (err2) {
                        return reject(err2);
                    }
                }
            });
        });
    }

    async _attachDappApi(id) {
        try {
            const dappPath = path.join(this.config.dappsDir, id);
            const routers = await this._readDappRouters(dappPath);
            if (routers && routers.length > 0) {
                const router = await this.runtime.httpserver.addApiRouter("/dapp/" + id);

                for (var i = 0; i < routers.length; i++) {
                    const subRouter = routers[i];
                    if (subRouter.method && subRouter.path) {
                        router[subRouter.method](subRouter.path, async (req, res) => {
                            try {
                                const result = await new Promise((resolve, reject) => {
                                    const sandbox = _dappLaunched[id];
                                    if (sandbox) {
                                        sandbox.request({
                                            method: subRouter.method,
                                            path: subRouter.path,
                                            query: req.query,
                                            body: req.body
                                        }, (err, data) => {
                                            if (err) {
                                                return reject(err);
                                            }

                                            resolve(data);
                                        });
                                    } else {
                                        reject("DApp not launched");
                                    }
                                })
                                res.json({ success: true, result });
                            }
                            catch (err) {
                                res.json({ success: false, error: err + "" });
                            }
                        });
                    }
                }
            }
        }
        catch (err) {
            this.logger.error(err);
        }
    }

    async postStopDapp(req, res) {
        const body = req.body;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                id: {
                    type: 'string',
                    minLength: 1
                },
                master: {
                    type: "string",
                    minLength: 0
                }
            },
            required: ["id"]
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        if (this.config.dapp.masterpassword &&
            body.master !== this.config.dapp.masterpassword) {
            throw new Error("Invalid master password");
        }

        const dapp = await this.getDappByTransactionId(body.id);
        await this.stopDapp(dapp);

        return { success: true };
    }

    async stopDapp(dapp) {
        if (!_dappLaunched[dapp.transaction_id]) {
            throw new Error("DApp not launched");
        }

        _dappLaunched[dapp.transaction_id].stop();
        this.runtime.socketio.emit('dapps/change', {});

        _dappLaunched[dapp.transaction_id] = null;
        delete _dappLaunched[dapp.transaction_id];

        await this._detachDappApi(dapp.transaction_id);

        const dappPath = path.join(this.config.dappsDir, dapp.transaction_id);
        await this._removeLaunchedMarkFile(dappPath)
    }

    async _detachDappApi(id) {
        await this.runtime.httpserver.removeApiRouter("/dapp/" + id);
    }

    async getDappByTransactionId(trsId) {
        const result = await this.queryAsset({ trs_id: trsId }, null, false, 1, 1);
        if (result && result.length) {
            return result[0];
        }
        throw new Error("DApp not found: " + trsId);
    }

    async getDappList(req, res) {
        var query = req.query;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                category: {
                    type: "string",
                    minLength: 1
                },
                name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 32
                },
                type: {
                    type: "integer",
                    minimum: 0
                },
                link: {
                    type: "string",
                    maxLength: 2000,
                    minLength: 1
                },
                icon: {
                    type: "string",
                    minLength: 1
                },
                sort: {
                    type: "string",
                    minLength: 1
                },
                pagesize: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100
                },
                pageindex: {
                    type: "integer",
                    minimum: 1
                }
            }
        }, query);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        const orders = [];

        const sort = query.sort;
        if (sort) {
            const sortItems = sort.split(",");
            if (sortItems.length > 0) {
                for (var i = 0; i < sortItems.length; i++) {
                    const sortItem = sortItems[i];
                    const sortItemExprs = sortItem.split(" ");
                    if (sortItemExprs.length == 1) {
                        if (sortItemExprs[0].trim() == "") {
                            throw new Error("Invalid sort params: " + sortItem);
                        }
                        else {
                            orders.push(sortItemExprs[0].trim());
                        }
                    }
                    else if (sortItemExprs.length == 2) {
                        if (sortItemExprs[0].trim() == "" ||
                            sortItemExprs[1].trim() == "") {
                            throw new Error("Invalid sort params: " + sortItem);
                        }
                        else {
                            orders.push([sortItemExprs[0].trim(), sortItemExprs[1].trim()]);
                        }
                    }
                    else {
                        throw new Error("Invalid sort params: " + sortItem);
                    }
                }
            }
        }
        console.log("wxm SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS: " + orders);

        const pageindex = query.pageindex || 1;
        const pagesize = query.pagesize || 100;

        delete query.sort;
        delete query.pageindex;
        delete query.pagesize;

        const result = await this.queryAsset(query, orders, true, pageindex, pagesize);
        return { success: true, result };
    }

    async getDappById(req, res) {
        const query = req.query;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                id: {
                    type: 'string',
                    minLength: 1
                }
            },
            required: ["id"]
        }, query);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        const dapp = await this.getDappByTransactionId(query.id);

        return { success: true, dapp };
    }

    async checkDappPath() {
        if (!fs.existsSync(this.config.dappsDir)) {
            fs.mkdirSync(this.config.dappsDir);
        }
    }

    delDir(path) {
        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    delDir(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    async getInstalledDappIds() {
        const self = this;

        return new Promise((resolve, reject) => {
            try {
                self.checkDappPath();
            }
            catch (err) {
                return reject(err);
            }

            fs.readdir(self.config.dappsDir, (err, files) => {
                if (err) {
                    return reject(err);
                }

                resolve(files);
            });
        });
    }

    async getInstalled(req, res) {
        const ids = await this.getInstalledDappIds();
        if (ids && ids.length) {
            const dapps = await this.queryAsset({ trs_id: { "$in": ids } }, null, false, 1, ids.length);
            return { success: true, dapps };
        }
        return { success: true, dapps: [] };
    }

    async downloadDapp(source, target) {
        const downloadErr = await new Promise((resolve, reject) => {
            request(source, (err, res, body) => {
                if (err) {
                    return reject(err);
                }

                const downloadRequest = request.get({
                    url: source,
                    timeout: 3000
                });

                downloadRequest.on("response", (res) => {
                    if (res.statusCode != 200) {
                        return reject(`Faile to download dapp ${source} with err code: ${res.statusCode}`)
                    }
                });

                downloadRequest.on("error", (err) => {
                    return reject(`Failed to download dapp ${source} with error: ${err.message}`);
                });

                const file = fs.createWriteStream(target);
                file.on("finish", () => {
                    file.close();
                    resolve();
                });

                downloadRequest.pipe(file);
            })
        });

        return new Promise((resolve, reject) => {
            if (downloadErr) {
                if (fs.existsSync(target)) {
                    fs.unlinkSync(target);
                }
                return reject(err);
            }
            resolve();
        });
    }

    async decompressDappZip(zippath, extractpath) {
        return new Promise((resolve, reject) => {
            const unzipper = new DecompressZip(zippath);

            unzipper.on("error", err => {
                return reject(`Failed to decompress zip file: ${err}`);
            });

            unzipper.on("extract", log => {
                resolve();
            });

            unzipper.extract({
                path: extractpath,
                strip: 1
            });
        });
    }

    async installDApp(dapp) {
        const dappPath = path.join(this.config.dappsDir, dapp.transaction_id);

        await new Promise((resolve, reject) => {
            fs.exists(dappPath, (exists) => {
                if (exists) {
                    return reject("Dapp is already installed");
                }
                resolve();
            });
        });

        await new Promise((resolve, reject) => {
            fs.mkdir(dappPath, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        })

        const dappPackage = path.join(dappPath, dapp.transaction_id + ".zip");

        try {
            await this.downloadDapp(dapp.link, dappPackage);
        }
        catch (err) {
            this.delDir(dappPath);
            throw err;
        }

        try {
            await this.decompressDappZip(dappPackage, dappPath);
        }
        catch (err) {
            this.delDir(dappPath);
            throw err;
        }

        return dappPath;
    }

    async removeDapp(dapp) {
        const dappPath = path.join(this.config.dappsDir, dapp.transaction_id);

        if (!fs.existsSync(dappPath)) {
            throw new Error("Dapp not installed: " + dapp.transaction_id);
        }

        this.delDir(dappPath);
    }

    async postUninstallDapp(req, res) {
        const body = req.body;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                id: {
                    type: 'string',
                    minLength: 1
                },
                master: {
                    type: 'string',
                    minLength: 1
                }
            },
            required: ["id"]
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        if (this.config.dapp.masterpassword && body.master !== this.config.dapp.masterpassword) {
            throw new Error("Invalid master password")
        }

        if (_dappRemoving[body.id] || _dappInstalling[body.id]) {
            throw new Error("This DApp already on uninstall/loading");
        }

        _dappRemoving[body.id] = true;

        const dapp = await this.getDappByTransactionId(body.id);

        if (_dappLaunched[body.id]) {
            await this.stopDapp(dapp);
            _dappLaunched[body.id] = false;
        }

        try {
            await this.removeDapp(dapp);

            await this.runtime.socketio.emit('dapps/change', {});
            return res.json({ success: true });
        } finally {
            _dappRemoving[body.id] = false;
        }
    }

    async postInstallDapp(req, res) {
        const body = req.body;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                id: {
                    type: 'string',
                    minLength: 1
                },
                master: {
                    type: 'string',
                    minLength: 1
                }
            },
            required: ["id"]
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        if (this.config.dapp.masterpassword && body.master !== this.config.dapp.masterpassword) {
            throw new Error("Invalid master password")
        }

        const installedDappIds = await this.getInstalledDappIds();
        if (installedDappIds.indexOf(body.id) >= 0) {
            throw new Error("This dapp already installed")
        }

        if (_dappRemoving[body.id] || _dappInstalling[body.id]) {
            throw new Error("This DApp already on downloading/removing")
        }

        _dappInstalling[body.id] = true;

        try {
            const dapp = await this.getDappByTransactionId(body.id);
            const dappPath = await this.installDApp(dapp);

            if (dapp.type == 0) {
                // no need to install node dependencies
            } else {
            }

            await this._removeLaunchedMarkFile(dappPath);

            await this.runtime.socketio.emit('dapps/change', {});
            return res.json({ success: true, path: dappPath });
        } finally {
            _dappInstalling[body.id] = false;
        }
    }

    async putDapp(req, res) {
        const body = req.body;

        const validateErrors = await this.ddnSchema.validate({
            type: "object",
            properties: {
                secret: {
                    type: "string",
                    minLength: 1
                },
                secondSecret: {
                    type: "string",
                    minLength: 1
                },
                publicKey: {
                    type: "string",
                    format: "publicKey"
                },
                category: {
                    type: "integer",
                    minimum: 0
                },
                name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 32
                },
                description: {
                    type: "string",
                    minLength: 0,
                    maxLength: 160
                },
                tags: {
                    type: "string",
                    minLength: 0,
                    maxLength: 160
                },
                type: {
                    type: "integer",
                    minimum: 0
                },
                link: {
                    type: "string",
                    maxLength: 2000,
                    minLength: 1
                },
                icon: {
                    type: "string",
                    minLength: 1,
                    maxLength: 2000
                }
            },
            required: ["secret", "type", "name", "category"]
        }, body);
        if (validateErrors) {
            throw new Error(`Invalid parameters: ${validateErrors[0].message}`);
        }

        const hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
        const keypair = ed.MakeKeypair(hash);

        if (body.publicKey) {
            if (keypair.publicKey.toString('hex') != body.publicKey) {
                throw new Error("Invalid passphrase");
            }
        }

        return new Promise((resolve, reject) => {
            this.balancesSequence.add(async (cb) => {
                var account;
                try {
                    account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'));
                } catch (e) {
                    return cb(e);
                }

                if (!account) {
                    return cb("Account not found");
                }

                if (account.second_signature && !body.secondSecret) {
                    return cb("Invalid second passphrase");
                }

                let second_keypair = null;
                if (account.secondSignature) {
                    const secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
                    second_keypair = ed.MakeKeypair(secondHash);
                }

                try {
                    var data = {
                        type: await this.getTransactionType(),
                        sender: account,
                        keypair,
                        second_keypair
                    }
                    var assetJsonName = await this.getAssetJsonName();
                    data[assetJsonName] = {
                        category: body.category,
                        name: body.name,
                        description: body.description,
                        tags: body.tags,
                        type: body.type,
                        link: body.link,
                        icon: body.icon,
                        delegates: body.delegates,
                        unlockDelegates: body.unlockDelegates
                    };

                    var transaction = await this.runtime.transaction.create(data);
                    var transactions = await this.runtime.transaction.receiveTransactions([transaction]);

                    cb(null, transactions);
                } catch (e) {
                    cb(e);
                }
            }, (err, transactions) => {
                if (err) {
                    return reject(err);
                }

                resolve({ success: true, transactionId: transactions[0].id });
            });
        });
    }

    async onBlockchainReady() {
        const installIds = await this.getInstalledDappIds();
        for (var i = 0; i < installIds.length; i++) {
            const dappId = installIds[i];
            const dappPath = path.join(this.config.dappsDir, dappId);
            const file = await this._getLaunchedMarkFile(dappPath);
            if (fs.existsSync(file)) {
                await this.runDapp(dappId); //wxm params
            }
        }
    }
}

module.exports = Dapp;