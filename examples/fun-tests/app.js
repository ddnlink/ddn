/**
 * 系统启动入口
 * wangxm   2018-12-25
 */
const packageFile =require('./package.json');
const command =require('commander');
const path =require('path');
const fs =require('fs');
const { Utils } =require('@ddn/ddn-utils');
const { getUserConfig } =require('@ddn/ddn-core');
const Peer = require('@ddn/ddn-peer');

/**
 * 整理系统配置文件生成输入参数
 */
function genOptions() {
    command
        .version(packageFile.version)
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

    let genesisblockFile = path.join(baseDir, 'config', 'genesisBlock.json');
    if (command.genesisblock) {
        genesisblockFile = path.resolve(process.cwd(), command.genesisblock);
    }
    if (!fs.existsSync(genesisblockFile)) {
        console.error("Failed: DDN genesisblock file does not exists.")
        process.exit(1);
        return;
    }

    const genesisblockObject = JSON.parse(fs.readFileSync(genesisblockFile, 'utf8'));

    const protoFile = path.join(baseDir, 'protos', 'ddn.proto');
    if (!fs.existsSync(protoFile)) {
        console.error('Failed: DDN proto file does not exists.');
        process.exit(1);
        return;
    }

    const configObject = getUserConfig({ cwd: baseDir });

    configObject.version = packageFile.version;
    configObject.basedir = baseDir;
    configObject.buildVersion = 'development';
    configObject.netVersion = process.env.NET_VERSION || 'testnet';
    configObject.publicDir = path.join(baseDir, 'public');
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
        protoFile,
        isDaemonMode: !!command.daemon
    }
}

async function main() {
    global._require_runtime_ = function(m) {
        if (typeof(global._require_native_) == "function") {
            return global._require_native_(m);
        } else {
            return require(m).default || require(m); // 兼容 ESM
        }
    };

    let peer;

    try
    {
        let options = genOptions();
        peer = new Peer();
        await peer.run(options);
    }
    catch (err)
    {
        console.error(Utils.getErrorMsg(err));

        if (peer) {
            peer.destory();
        }

        process.exit(1);
        return;
    }
}

main();
