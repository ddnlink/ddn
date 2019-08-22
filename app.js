/**
 * 系统启动入口
 * wangxm   2018-12-25
 */
const package = require('./package.json');
const command = require('commander');
const path = require('path');
const fs = require('fs');
const { Utils } = require('@ddn/ddn-utils');
const Program = require('./src/kernal/program');

/**
 * 整理系统配置文件生成输入参数
 */
function genOptions() {
    command
        .version(package.version)
        .option('-c, --config <path>', 'Config file path')
        .option('-p, --port <port>', 'Listening port number')
        .option('-a, --address <ip>', 'Listening host name or ip')
        .option('-b, --blockchain <path>', 'Blockchain db path')
        .option('-g, --genesisblock <path>', 'Genesisblock path')
        .option('-x, --peers [peers...]', 'Peers list')
        .option('-l, --log <level>', 'Log level')
        .option('-d, --daemon', 'Run ddn node as daemon')
        .option('-e, --execute <path>', 'exe')
        .option('--dapps <dir>', 'DApps directory')
        .option('--base <dir>', 'Base directory')
        .parse(process.argv);

    const baseDir = command.base || path.resolve(__dirname, './');

    let configFile = path.join(baseDir, 'config.json');
    if (command.config) {
        configFile = path.resolve(process.cwd(), command.config);
    }
    if (!fs.existsSync(configFile)) {
        console.error("Failed: DDN config file does not exists.")
        process.exit(1);
        return;
    }

    let genesisblockFile = path.join(baseDir, 'genesisBlock.json');
    if (command.genesisblock) {
        genesisblockFile = path.resolve(process.cwd(), command.genesisblock);
    }
    if (!fs.existsSync(genesisblockFile)) {
        console.error("Failed: DDN genesisblock file does not exists.")
        process.exit(1);
        return;
    }

    const protoFile = path.join(baseDir, 'protos', 'ddn.proto');
    if (!fs.existsSync(protoFile)) {
        console.error('Failed: DDN proto file does not exists.');
        process.exit(1);
        return;
    }

    const assetConfigFile = path.resolve(path.join(baseDir, 'config.asset.js'));
    if (!fs.existsSync(assetConfigFile)) {
        console.error('Failed: DDN asset config file does not exists.');
        process.exit(1);
        return;
    }

    const configObject = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    const genesisblockObject = JSON.parse(fs.readFileSync(genesisblockFile, 'utf8'));

    //wxm 修改config.json文件，自动生成dapp的masterpassword，这个不应该在代码中，应该在外围生成
    if (!configObject.dapp.masterpassword) {
        const randomstring = require("randomstring");
        configObject.dapp.masterpassword = randomstring.generate({
            length: 12,
            readable: true,
            charset: 'alphanumeric'
        });
        fs.writeFileSync(configFile, JSON.stringify(configObject, null, 2), "utf8");
    }

    configObject.version = package.version;
    configObject.basedir = baseDir;
    configObject.buildVersion = 'development';
    configObject.netVersion = process.env.NET_VERSION || 'testnet';
    configObject.publicDir = path.join(baseDir, 'public', 'dist');
    configObject.dappsDir = command.dapps || path.join(baseDir, 'dapps')
    if (command.port) {
        configObject.port = command.port;
    }
    
    if (command.address) {
        configObject.address = command.address;
    }

    if (command.peers) {
        if (typeof command.peers === 'string') {
            configObject.peers.list = command.peers.split(',').map(peer => {
                peer = peer.split(":");
                return {
                    ip: peer.shift(),
                    port: peer.shift() || configObject.port
                };
            });
        } else {
            configObject.peers.list = [];
        }
    }
    
    if (command.log) {
        configObject.logLevel = command.log;
    }

    if (command.reindex) {
        configObject.loading.verifyOnLoading = true;
    }
    
    return {
        baseDir,
        configObject,
        genesisblockObject,
        assetConfigFile,
        protoFile,
        isDaemonMode: !!command.daemon
    }
}

async function main() {
    global._require_runtime_ = function(m) {
        if (typeof(_require_native_) == "function") {
            return _require_native_(m);
        } else {
            return require(m);
        }
    };

    var program;

    try
    {
        var options = genOptions();
        program = new Program();
        await program.run(options);
    }
    catch (err)
    {
        console.error(Utils.getErrorMsg(err));
        
        if (program) {
            program.destory();
        }

        process.exit(1);
        return;
    }
}

main();