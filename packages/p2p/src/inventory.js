import fs from 'fs'
import crypto from 'crypto'
/**
 * p2p peer
 * @param {*} host
 * @param {*} port: Local IP address to bind to, default is any.
 * @param {*} family: 4 = IPv4-only, 6 = IPv6-only, 0 = either (default).
 */
export class Peer {
  constructor ({ host, port, family }) {
    this.id = Peer.getId(`${host}:${port}`)
    this.host = host
    this.port = +port
    this.family = family
    this.status = Peer.STATUS.ready

    this.delay = 0
    this.failCount = 0
  }

  static getId (data) {
    return crypto.createHash('md5').update(Buffer.from(data)).digest().toString('hex')
  }

  setProxy (host, port) {
    this.proxy = {
      host, port
    }
  }

  setStatus () {
    this.status = Peer.STATUS.pending
    this.delay = 0
    this.failCount = 0
  }
}

Peer.STATUS = {
  disable: 0,
  pending: 1,
  ready: 2
}

// Peer.FAMILY = {
//   IPv4: 4,
//   IPv6: 6,
//   either: 0,
// }

/**
 * peer list
 * @param {*} options
 *   options.delayTime: Next retry time interval.
 *   options.tryTimes: Retry times before remove it.
 *   options.dbfile: Filepath to persist the peers data.
 */
export class Inventory {
  constructor (options) {
    options = options || {}
    this.peers = new Map()
    this.delayTime = options.delayTime || 3600
    this.tryTimes = options.tryTimes || 5
    this.dbfile = options.dbfile || './peer.db'
    this.logger = options.logger || console

    if (fs.existsSync(this.dbfile)) {
      const peers = JSON.parse(fs.readFileSync(this.dbfile))
      this.logger.debug('Peer is loaded from inventory, current dbfile is ', this.dbfile)
      for (const peer of peers) {
        this.peers.set(peer.id, peer)
      }
    }
  }

  has (id) {
    return this.peers.has(id)
  }

  get (id) {
    return this.peers.get(id)
  }

  add (peer) {
    if (!this.peers.has(peer.id)) this.peers.set(peer.id, new Peer(peer))

    this.logger.debug('Peer is added to inventory, this.dbfile is ', this.dbfile)
    fs.writeFileSync(this.dbfile, JSON.stringify([...this.peers.values()]))
  }

  update (peerId, data) {
    const peer = this.peers.get(peerId)
    for (const key of data) {
      peer[key] = data[key]
    }
  }

  remove (id) {
    this.peers.delete(id)
    fs.writeFileSync(this.dbfile, JSON.stringify([...this.peers.values()]))
  }

  flush () {
    fs.writeFileSync(this.dbfile, JSON.stringify([...this.peers.values()]))
  }

  disable (id) {
    const peer = this.peers.get(id)
    if (!peer) return

    peer.status = Peer.STATUS.disable
    peer.failCount = +peer.failCount + 1
    if (peer.failCount > this.tryTimes) {
      this.logger.debug('exceed max try times, remove the peer:', peer.host, peer.port)
      this.remove(id)
      return
    }

    peer.delay = Date.now() + this.delayTime * 1000
  }

  enable (id) {
    const peer = this.peers.get(id)
    if (!peer) return

    peer.status = Peer.STATUS.pending
    peer.failCount = 0
    peer.delay = 0
  }

  enableAll () {
    this.peers.forEach((peer, id) => {
      if (peer.status === Peer.STATUS.disable && Date.now() > peer.delay) {
        peer.status = Peer.STATUS.pending
        peer.failCount = 0
        peer.delay = 0
      }
    })
  }

  getAllPeers () {
    const result = []
    this.peers.forEach((peer) => {
      if (peer.status !== Peer.STATUS.disable) { result.push(peer) }
    })
    this.logger.debug('All peers have : ', this.peers.length)
    return result
  }

  getRandomPeer () {
    const peers = this.getAllPeers()
    const rnd = Math.floor(Math.random() * peers.length)
    this.logger.debug('Random peer pos: ', rnd, peers.length)
    return [...peers.values()][rnd]
  }

  addMap (id) {
    const hasPeer = this.peers.has(id)
    if (hasPeer) {
      this.peers.forEach((peer) => {
        if (peer.id === id) {
          peer.status = Peer.STATUS.ready
          peer.failCount = 0
          peer.delay = 0
        }
      })
    } else {
      const peers = JSON.parse(fs.readFileSync(this.dbfile))
      let peer = peers.find(item => item.id === id)
      // 可能不存在，不存在就随机在库里取一条加入连接池
      if (!peer) {
        const rnd = Math.floor(Math.random() * peers.length)
        peer = peers[rnd]
      }
      this.peers.set(peer.id, new Peer(peer))
      // this.logger.debug('Peer is added to inventory by map, this.dbfile is ', this.dbfile)
      // fs.writeFileSync(this.dbfile, JSON.stringify([...this.peers.values()]))
    }
  }

  getNextHop (fib, count) {
    const peers = []
    const results = new Set()
    this.peers.forEach((peer) => {
      if (peer.status !== Peer.STATUS.disable && !fib.includes(peer.id)) peers.push(peer)
    })

    count = peers.length > count ? count : peers.length
    for (let i = 0; i < count; i++) {
      const rnd = Math.floor(Math.random() * peers.length)
      results.add(peers[rnd])
    }
    return [...results]
  }
}
