var fs = require("fs");
var async = require("async");
var request = require("request");
var accountHelper = require("../helpers/account.js");
var blockHelper = require("../helpers/block.js");
var cryptoLib = require("../lib/crypto.js");
var dappHelper = require("../helpers/dapp.js");
var Api = require('../helpers/api.js');
var EbookchainUtils = require('ebookchain-js').utils;

var globalOptions;

function getApi() {
  return new Api({host: globalOptions.host, port: globalOptions.port, mainnet: !!globalOptions.main});
}

function writeFileSync(file, obj) {
	var content = (typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
	fs.writeFileSync(file, content, "utf8");
}

function appendFileSync(file, obj) {
	var content = (typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
	fs.appendFileSync(file, content, "utf8");
}

function genGenesisBlock(options) {
	var genesisAccount = accountHelper.account(cryptoLib.generateSecret());
	var newBlockInfo = blockHelper.new(genesisAccount, null, options.file);
	var delegateSecrets = newBlockInfo.delegates.map(function(i) {
		return i.secret;
	});
	writeFileSync("./genesisBlock.json", newBlockInfo.block);
	
	var logFile = "./genGenesisBlock.log";
	writeFileSync(logFile, "genesis account:\n");
	appendFileSync(logFile, genesisAccount);
	appendFileSync(logFile, "\ndelegates secrets:\n");
	appendFileSync(logFile, delegateSecrets);
	console.log('New genesis block and related account has been created, please see the two file: genesisBlock.json and genGenesisBlock.log');
}

function genMine(options) {
	var genesisAccount = accountHelper.account(cryptoLib.generateSecret());
	var newBlockInfo = blockHelper.new(genesisAccount, null, options.file);
	var delegateSecrets = newBlockInfo.delegates.map(function (i) {
		return i.secret;
	});
	writeFileSync("./genesisBlock.json", newBlockInfo.block);

	var logFile = "./genGenesisBlock.log";
	writeFileSync(logFile, "genesis account:\n");
	appendFileSync(logFile, genesisAccount);
	appendFileSync(logFile, "\ndelegates secrets:\n");
	appendFileSync(logFile, delegateSecrets);
	console.log('New genesis block and related account has been created, please see the two file: genesisBlock.json and genGenesisBlock.log');
}

function peerstat() {
	var api = getApi();
	api.get('/api/peers/', {}, function (err, result) {
    if (err) {
			console.log('Failed to get peers', err);
			return;
		}
		async.map(result.peers, function (peer, next) {
			new Api({host: peer.ip, port: peer.port}).get('/api/blocks/getHeight', function (err, result) {
				if (err) {
					console.log('%s:%d %s %d', peer.ip, peer.port, peer.version, err);
					next(null, {peer: peer, error: err});
				} else {
					console.log('%s:%d %s %d', peer.ip, peer.port, peer.version, result.height);
					next(null, {peer: peer, height: result.height});
				}
			});
		}, function (err, results) {
			var heightMap = {};
			var errorMap = {};
			for (var i = 0; i < results.length; ++i) {
				var item = results[i];
				if (item.error) {
					if (!errorMap[item.error]) {
						errorMap[item.error] = [];
					}
					errorMap[item.error].push(item.peer);
				} else {
					if (!heightMap[item.height]) {
						heightMap[item.height] = [];
					}
					heightMap[item.height].push(item.peer);
				}
			}
			var normalList = [];
			var errList = [];
			for (var k in heightMap) {
				normalList.push({peers: heightMap[k], height: k});
			}
			for (var k in errorMap) {
				errList.push({peers: errorMap[k], error: k});
			}
			normalList.sort(function (l, r) {
				return r.height - l.height;
			});
			
			function joinPeerAddrs(peers) {
				var peerAddrs = [];
				peers.forEach(function (p) {
					peerAddrs.push(p.ip + ':' + p.port);
				});
				return peerAddrs.join(',');
			}
			console.log('======================================');
			for (var i = 0; i < normalList.length; ++i) {
				var item = normalList[i];
				if (i == 0) {
					console.log(item.peers.length + ' height: ' + item.height);
				} else {
					console.log(item.peers.length + ' height: ' + item.height, joinPeerAddrs(item.peers));
				}
			}
			for (var i = 0; i < errList.length; ++i) {
				var item = errList[i];
				console.log(item.peers.length + ' error: ' + item.error, joinPeerAddrs(item.peers));
			}
		});
  });
}

function delegatestat() {
	var api = getApi();
	api.get('/api/delegates', {}, function (err, result) {
    if (err) {
			console.log('Failed to get delegates', err);
			return;
		}
		async.map(result.delegates, function (delegate, next) {
			var params = {
				generatorPublicKey: delegate.publicKey,
				limit: 1,
				offset: 0,
				orderBy: 'height:desc'
			};
			api.get('/api/blocks', params, function (err, result) {
				if (err) {
					next(err);
				} else {
					next(null, {delegate: delegate, block: result.blocks[0]});
				}
			});
		}, function (err, delegates) {
			if (err) {
				console.log('Failed to get forged block', err);
				return;
			}
			delegates = delegates.sort(function (l, r) {
				if (!l.block) {
					return -1;
				}
				if (!r.block) {
					return 1;
				}
				return l.block.timestamp - r.block.timestamp;
			});
			console.log("name\taddress\trate\tapproval\tproductivity\tproduced\tbalance\theight\tid\ttime");
			for (var i in delegates) {
				var d = delegates[i].delegate;
				var b = delegates[i].block;
				console.log('%s\t%s\t%d\t%s%%\t%s%%\t%d\t%d\t%s\t%s\t%s(%s)',
						d.username,
						d.address,
						d.rate,
						d.approval,
						d.productivity,
						d.producedblocks,
						d.balance / 100000000,
						b ? b.height : '',
						b ? b.id : '',
						EbookchainUtils.format.fullTimestamp(b ? b.timestamp : ''),
						EbookchainUtils.format.timeAgo(b ? b.timestamp : ''));
			}
		});
	});
}

function ipstat() {
	var api = getApi();
	api.get('/api/peers/', {}, function (err, result) {
    if (err) {
			console.log('Failed to get peers', err);
			return;
		}
		async.mapLimit(result.peers, 5, function (peer, next) {
			var url = 'http://ip.taobao.com/service/getIpInfo.php?ip=' + peer.ip;
			request(url, function (err, resp, body) {
				if (err || resp.statusCode != 200) {
					console.error('Failed to get ip info:', err);
					next(null, {});
				} else {
					next(null, JSON.parse(body).data);
				}
			});
		}, function (err, ips) {
			for (var i = 0; i < ips.length; ++i) {
				var ip = ips[i];
				if (ip.country_id) {
					console.log('%s\t%s', ip.country, ip.country_id);
				}
			}
		});
	});
}

module.exports = function(program) {
	globalOptions = program;

  program
	  .command("creategenesis")
		.description("create genesis block")
		.option("-f, --file <file>", "genesis accounts balance file")
		.action(genGenesisBlock);
		
  program
	  .command("peerstat")
		.description("analyze block height of all peers")
		.action(peerstat);
		
  program
	  .command("delegatestat")
		.description("analyze delegates status")
		.action(delegatestat);
	
  program
	  .command("ipstat")
		.description("analyze peer ip info")
		.action(ipstat);
}