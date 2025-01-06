import fs from 'fs'
import path from 'path'
import { P2P } from '../src'

const fixturesDir = path.resolve(__dirname, 'fixtures')
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true })
}

const routes = {
  'POST /tx': async ({ peer, body, params }) => { return 'received new tx: ' + body.toString() },
  'POST /block': async ({ peer, body }) => { return 'received new block: ' + body.toString() },
  'POST /vote': async ({ peer, body }) => { return 'received new vote: ' + body.toString() },
  'POST /propose': async ({ peer, body }) => { return 'received new propose: ' + body.toString() },
  'POST /signature': async ({ peer, body }) => { return 'received new signature: ' + body.toString() },

  'GET /tx': async ({ body, params, peer }) => {
    return `this is reply: ${body.toString()} ok!`
  },
  'GET /block': async ({ body, peer }) => {
    return `this is reply: ${body.toString()} ok!`
  },
  'GET /vote': async ({ body, peer }) => {
    return `this is reply: ${body.toString()} ok!`
  },
  'GET /propose': async ({ body, peer }) => {
    return `this is reply: ${body.toString()} ok!`
  },
  'GET /signature': async ({ body, peer }) => {
    return `this is reply: ${body.toString()} ok!`
  },
  'GET /block/Height': async ({ body, peer }) => {
    return `this is reply: ${body.toString()} ok!`
  }
}

const dbfile1 = path.resolve(__dirname, 'fixtures', 'peer1.txt')
const dbfile2 = path.resolve(__dirname, 'fixtures', 'peer2.txt')

// 修改初始化数据结构 - 使用简单对象
const peers = new Map()
const emptyPeers = JSON.stringify(peers)

// 确保文件存在并写入初始数据
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true })
}

fs.writeFileSync(dbfile1, emptyPeers)
fs.writeFileSync(dbfile2, emptyPeers)

const peer1 = new P2P({ port: 8001, host: '127.0.0.1', routes, timeout: 10000, dbfile: dbfile1 })
const peer2 = new P2P({ port: 8002, host: '127.0.0.1', routes, timeout: 10000, dbfile: dbfile2 })

// 然后再调用 prepare()
peer1.prepare()
peer2.prepare()

const sleep = (seconds) => { return new Promise((resolve) => setTimeout(() => resolve(), seconds)) }

describe('p2p main test', () => {
  beforeAll(async () => {
    await sleep(3000)
    await peer1.connect(8002, '127.0.0.1')
  })

  afterAll(async () => {
    await sleep(2000)
    peer1.close()
    peer2.close()
    await sleep(3000)
    if (fs.existsSync(dbfile1)) {
      fs.unlinkSync(dbfile1)
    }
    if (fs.existsSync(dbfile2)) {
      fs.unlinkSync(dbfile2)
    }
  })

  it('GET method test: peer1 to peer2 ', async () => {
    let res
    res = await peer1.get('/tx', 'get from peer2 tx')
    expect(res.body).toBe('this is reply: get from peer2 tx ok!')
    res = await peer1.get('/block', 'get from peer2 block')
    expect(res.body).toBe('this is reply: get from peer2 block ok!')
    res = await peer1.get('/vote', 'get from peer2 vote')
    expect(res.body).toBe('this is reply: get from peer2 vote ok!')
    res = await peer1.get('/propose', 'get from peer2 propose')
    expect(res.body).toBe('this is reply: get from peer2 propose ok!')
    res = await peer1.get('/signature', 'get from peer2 signature')
    expect(res.body).toBe('this is reply: get from peer2 signature ok!')
    res = await peer1.get('/block/height', 'get from peer2 block height')
    expect(res.body).toBe('this is reply: get from peer2 block height ok!')
  })

  it('GET method test: peer2 to peer1 ', async () => {
    let res
    res = await peer2.get('/tx', 'get from peer1 tx')
    expect(res.body).toBe('this is reply: get from peer1 tx ok!')
    res = await peer2.get('/block', 'get from peer1 block')
    expect(res.body).toBe('this is reply: get from peer1 block ok!')
    res = await peer2.get('/vote', 'get from peer1 vote')
    expect(res.body).toBe('this is reply: get from peer1 vote ok!')
    res = await peer2.get('/propose', 'get from peer1 propose')
    expect(res.body).toBe('this is reply: get from peer1 propose ok!')
    res = await peer2.get('/signature', 'get from peer1 signature')
    expect(res.body).toBe('this is reply: get from peer1 signature ok!')
    res = await peer2.get('/block/height', 'get from peer1 block height')
    expect(res.body).toBe('this is reply: get from peer1 block height ok!')
  })

  it('POST method test: peer1 to peer2', async () => {
    let res
    res = await peer1.post('/tx', 'post to peer2 tx')
    expect(res.body).toBe('received new tx: post to peer2 tx')
    res = await peer1.post('/block', 'post to peer2 block')
    expect(res.body).toBe('received new block: post to peer2 block')
    res = await peer1.post('/vote', 'post to peer2 vote')
    expect(res.body).toBe('received new vote: post to peer2 vote')
    res = await peer1.post('/propose', 'post to peer2 propose')
    expect(res.body).toBe('received new propose: post to peer2 propose')
    res = await peer1.post('/signature', 'post to peer2 signature')
    expect(res.body).toBe('received new signature: post to peer2 signature')
  })

  it('POST method test: peer2 to peer1', async () => {
    let res
    res = await peer2.post('/tx', 'post to peer1 tx')
    expect(res.body).toBe('received new tx: post to peer1 tx')
    res = await peer2.post('/block', 'post to peer1 block')
    expect(res.body).toBe('received new block: post to peer1 block')
    res = await peer2.post('/vote', 'post to peer1 vote')
    expect(res.body).toBe('received new vote: post to peer1 vote')
    res = await peer2.post('/propose', 'post to peer1 propose')
    expect(res.body).toBe('received new propose: post to peer1 propose')
    res = await peer2.post('/signature', 'post to peer1 signature')
    expect(res.body).toBe('received new signature: post to peer1 signature')
  })
})
