import fs from 'fs'
import { Peer, Inventory } from '../src/inventory'

const inv = new Inventory()
const host = '127.0.0.1'
const family = 'IPv4'
describe('Message tool test', () => {
  beforeAll(() => {
    if (fs.existsSync(inv.dbfile)) {
      fs.unlinkSync(inv.dbfile)
    }
  })

  afterAll(() => {
    if (fs.existsSync(inv.dbfile)) {
      fs.unlinkSync(inv.dbfile)
    }
  })

  it('Inventory property test ', async () => {
    expect(inv.peers.size).toBe(0)
    expect(inv.delayTime).toBe(3600)
    expect(inv.tryTimes).toBe(5)
  })

  it('add method test ', async () => {
    const peer = new Peer({ host, port: 8001, family })
    inv.add(peer)
    expect(peer.id).toBe(Peer.getId('127.0.0.1:8001'))
    expect(peer.host).toBe('127.0.0.1')
    expect(peer.port).toBe(8001)
    expect(peer.family).toBe(family)
    expect(peer.status).toBe(Peer.STATUS.ready)
    expect(inv.peers.size > 0).toBe(true)
    expect(inv.peers.has(peer.id)).toBe(true)
    const peer1 = new Peer({ host, port: 8002, family })
    inv.add(peer1)
    expect(inv.peers.has(peer1.id)).toBe(true)
    expect(inv.peers.size > 1).toBe(true)
  })

  it('get method test', async () => {
    const id = Peer.getId('127.0.0.1:8001')
    const peer = inv.get(id)
    expect(peer.id).toBe(id)
    expect(peer.host).toBe('127.0.0.1')
    expect(peer.port).toBe(8001)
    expect(peer.family).toBe(family)
    expect(peer.status).toBe(Peer.STATUS.ready)
  })

  it('remove method test', async () => {
    const id = Peer.getId('127.0.0.1:8001')
    inv.remove(id)
    expect(inv.peers.has(id)).toBe(false)
  })

  it('disable method test', async () => {
    const peer = new Peer({ host, port: 8003, family })
    inv.add(peer)
    expect(peer.status).toBe(Peer.STATUS.ready)
    expect(peer.delay).toBe(0)
    expect(peer.failCount).toBe(0)
    inv.disable(peer.id)
    // const peer1 = inv.get(peer.id)
    // expect(peer1.failCount).toBe(1)
    // expect(peer.failCount).toBe(1)
    // expect(peer.delay > Date.now()).toBe(true)
    expect(inv.peers.has(peer.id)).toBe(true)
    for (let i = 1; i < inv.tryTimes + 1; i++) {
      inv.disable(peer.id)
    }
    expect(inv.peers.has(peer.id)).toBe(false)
  })

  it('enable method test', async () => {
    if (inv.peers.size) {
      const peer = inv.getRandomPeer()
      inv.enable(peer.id)
      expect(peer.status).toBe(Peer.STATUS.pending)
      expect(peer.failCount).toBe(0)
      expect(peer.delay).toBe(0)
    } else {
      expect(inv.peers.size).toBe(0)
    }
  })

  it('getAllPeers method test', async () => {
    const peers = inv.getAllPeers()
    expect(inv.peers.size >= peers.length).toBe(true)
  })

  it('getRandomPeer method test', async () => {
    const peer = inv.getRandomPeer()
    if (inv.peers.size) { expect(inv.peers.has(peer.id)).toBe(true) } else { expect(peer).toBe(undefined) }
  })

  it('Peer getId method test', async () => {
    const id = Peer.getId('127.0.0.1:8080')
    expect(id).toBe('5958c386bf5e9109ac10d2a628645aea')
  })
})
