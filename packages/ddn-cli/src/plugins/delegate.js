import fs from 'fs'
import path from 'path'
import JsSdk from '@ddn/js-sdk'
import Api from '../utils/api'
import { log } from 'console'

let globalOptions

// 调用其他方法之前需要初始化全局选项
function init(options) {
    globalOptions = options
}

function getApi() {
    return new Api({ host: globalOptions.host, port: globalOptions.port, mainnet: !!globalOptions.main })
}

function pretty(obj) {
    return JSON.stringify(obj, null, 2)
}

function getVotedDelegates(address, options) {
    const params = {
        address: address,
        limit: options.limit,
        offset: options.offset
    }
    getApi().get('/api/votes', params, function (err, result) {
        console.log(err || result)
    })
}

function getDelegates(options) {
    const params = {
        limit: options.limit,
        offset: options.offset,
        orderBy: options.sort || 'rate:asc'
    }
    getApi().get('/api/delegates/', params, function (err, result) {
        console.log(err || pretty(result.delegates))
    })
}

function getDelegatesCount() {
    getApi().get('/api/delegates/count', function (err, result) {
        console.log(err || result.count)
    })
}

function getVoters(publicKey) {
    const params = { publicKey: publicKey }
    getApi().get('/api/delegates/voters', params, function (err, result) {
        console.log(err || pretty(result.accounts))
    })
}

function getDelegateByPublicKey(publicKey) {
    const params = { publicKey: publicKey }
    getApi().get('/api/delegates/get', params, function (err, result) {
        console.log(err || pretty(result.delegate))
    })
}

function getDelegateByUsername(username) {
    const params = { username: username }
    getApi().get('/api/delegates/get', params, function (err, result) {
        console.log(err || pretty(result.delegate))
    })
}

async function registerDelegate(options) {
    // 初始化 JsSdk
    JsSdk.init()
    const trs = await JsSdk.delegate.createDelegate(options.username, options.secret, options.secondSecret)
    getApi().broadcastTransaction(trs, function (err, result) {
        console.log(err || result.transactionId)
    })
}

// 批量注册，需要提供一个文件 { Accounts: [ { username: 'DDN_111', secret: 'a', secondSecret: 'a' } ] }, 使用 teams.log 直接修改即可
async function registerDelegates(options) {
    const file = path.resolve(options.file)
    if (file && fs.existsSync(file)) {
        const fileObject = require(file)
        fileObject['Accounts'].forEach(async (item) => {
            // 初始化 JsSdk
            JsSdk.init()
            const trs = await JsSdk.delegate.createDelegate(item.username, item.secret, item.secondSecret)

            getApi().broadcastTransaction(trs, function (err, result) {
                console.log(`Registed ${item.username} success!`)
                console.log(err || result.transactionId)
            })
        })
    }
}

function listdiffvotes(options) {
    let params = { username: options.username }
    getApi().get('/api/delegates/get', params, function (err, result) {
        if (err) {
            console.log(err)
            return
        }

        const publicKey = result.delegate.publicKey
        params = {
            address: result.delegate.address,
            limit: options.limit || 101,
            offset: options.offset || 0
        }
        getApi().get('/api/votes', params, function (err, result) {
            if (err) {
                console.log(err)
                return
            }

            const names_a = []
            for (let i = 0; i < result.delegates.length; ++i) {
                names_a[i] = result.delegates[i].username
            }
            const a = new Set(names_a)
            params = { publicKey: publicKey }
            getApi().get('/api/delegates/voters', params, function (err, result) {
                if (err) {
                    console.log(err)
                    return
                }

                const names_b = []
                for (let i = 0; i < result.accounts.length; ++i) {
                    names_b[i] = result.accounts[i].username
                }
                const b = new Set(names_b)
                const diffab = [...a].filter(x => {
                    return x !== null && !b.has(x)
                })
                const diffba = [...b].filter(x => {
                    return x !== null && !a.has(x)
                })

                console.log("you voted but doesn't vote you: \n\t", JSON.stringify(diffab))
                console.log("\nvoted you but you don't voted: \n\t", JSON.stringify(diffba))
            })
        })
    })
}

async function vote(secret, publicKeys, op, secondSecret) {
    if (!secret) {
        console.log('secret required.')
        return
    }

    if (!publicKeys) {
        console.log('publicKeys required.')
        return
    }

    const votes = publicKeys.split(',').map(function (el) {
        return op + el
    })
    // 初始化 JsSdk
    JsSdk.init()
    const trs = await JsSdk.vote.createVote(votes, secret, secondSecret)
    getApi().broadcastTransaction(trs, function (err, result) {
        console.log(err || result.transactionId)
    })
}

function upvote(options) {
    vote(options.secret, options.publicKeys, '+', options.secondSecret)
}

// 批量投票，需要提供一个文件 { Accounts: [ { username: 'DDN_111', secret: 'a', secondSecret: 'a' } ] }, 使用 teams.log 直接修改即可
function upvotes(options) {
    const file = path.resolve(options.file)
    if (file && fs.existsSync(file)) {
        const delegates = require(file)
        const publicKeys = delegates['Accounts'].map((item) => {
            // 初始化 JsSdk
            JsSdk.init()
            return JsSdk.crypto.getKeys(item.secret).publicKey
        })
        console.log("publicKeys: ", publicKeys)

        // const secrets = delegates['Accounts'].map((item) => {
        //     return item.secret
        // })
        // console.log("secrets: ", secrets)

        // 找一个有投票资格的账号，然后把它的 secret 通过参数提供过来
        vote(options.secret, publicKeys.join(','), '+', options.secondSecret)
    }
}

function downvote(options) {
    vote(options.secret, options.publicKeys, '-', options.secondSecret)
}

export {
    getApi,
    init,
    getVotedDelegates,
    getDelegatesCount,
    getDelegates,
    getVoters,
    getDelegateByPublicKey,
    getDelegateByUsername,
    registerDelegate,
    registerDelegates,
    listdiffvotes,
    upvote,
    upvotes,
    downvote
}