import net from 'net'
import EventEmitter from 'events'
import Socks5Client from 'socks5-client'
import { Buffers } from './buffers'
import { Message } from './message'

/**
 * Simulate a p2p pipe using TCP connection.
 *
 * @param socket
 * @param options
 *   options.port: port.
 *   options.timeout: waiting until timeout second when request or connect.
 *   options.cycle: loop cycle ping task.
 *   options.several: try times if not get pong reply.
 *   options.version: _protocol version default v1.
 *   options.nethash: ddn nethash default 0ab796cd.
 * @constructor
 */
export class Pipe extends EventEmitter {
  constructor (options) {
    super()
    options = options || {}
    this.id = options.id
    this.proxy = options.proxy
    this.timeout = options.timeout || 3000
    this.version = options.version || 'v1'
    this.nethash = options.nethash || '0ab796cd'
    this.cycle = options.cycle || 10000
    this.several = options.several || 4
    this.logger = options.logger || console
    this.callback = null

    this._serial = 0
    this._queue = new Map()
    this._buffers = new Buffers()
    this._protocol = new Message({ version: this.version, nethash: this.nethash, logger: this.logger })
    this._isOpen = options.isOpen
    this._hasTryTimes = 0

    // const cmds = Message.commands
    // this.msgEmitCmd = [cmds.GET, cmds.PUT, cmds.POST, cmds.DELETE, cmds.PUSH]

    const self = this
    // handle callback - call a callback function only once, for the first event it will triger
    const handleCallback = (error) => {
      if (self.callback) {
        self.callback(error)
        self.callback = null
      }
    }

    let socket
    if (options.socket) socket = options.socket
    else {
      if (options.proxy) socket = new Socks5Client(options.proxy.host, options.proxy.port)
      else socket = new net.Socket()
    }
    this.socket = socket

    if (this.timeout) socket.setTimeout(this.timeout)

    socket.on('data', (data) => {
      self._buffers.push(data)

      if (self._buffers.length > Message.MAX_PACKET_SIZE) {
        // TODO: handle this case better
        return self.close()
      }
      self._processData()
    })

    socket.on('connect', () => {
      handleCallback()
      self._heartTickHandle = setInterval(this._heartTick.bind(this), this.cycle)
      self.emit('connection')
    })

    socket.on('close', (had_error) => {
      handleCallback(had_error)
      self.close()
      self.emit('close', had_error)
    })

    socket.on('error', (error) => {
      handleCallback(error)
      self.close()
      self.emit('error', error)
    })

    socket.on('timeout', () => {
      // this._isOpen is left in its current state as it reflects two types of timeouts,
      // i.e. 'false' for "TCP connection timeout" and 'true' for "this response timeout"
      // (this allows to continue request re-tries without reconnecting TCP).
      const err = new Error('TCP Connection Timed Out')
      handleCallback(err)
      self.emit('timeout', err)
    })
    /**
     * Check if port is open.
     *
     * @returns {boolean}
     */
    Object.defineProperty(this, 'isOpen', {
      enumerable: true,
      get: function () {
        return this._isOpen
      }
    })
  }

  /**
   * successful port open.
   * @todo start cyclely run ping/pong task
   * @param callback
   */
  open (port, host, callback) {
    if (this._isOpen) return
    this._isOpen = true
    this.callback = callback
    this.socket.connect({ port, host })
  }

  /**
   * successful close port.
   *
   * @param callback
   */
  close (callback) {
    if (!this.socket.destroyed) {
      this.socket.end()
      this.socket.destroy()
    }

    if (!this._isOpen) return
    this._isOpen = false
    this.callback = callback
    clearInterval(this._heartTickHandle)
  }

  /**
   * Send data to remote.
   * @param cmd
   * @param data
   */
  send (cmd, data, meta, serial) {
    let currentSerial = serial
    if(isNaN(serial)) {
      currentSerial = this._serial
      this._serial = (this._serial + 1) & 0xffff
    }
    const buf = this._protocol.packet(cmd, data, meta, currentSerial)
    this.socket.write(buf)
    // this.logger.debug(`send msg, pipe: ${this.id}, cmd: ${cmd}, serial: ${serial}, currentSerial: ${currentSerial}`)
    // this.logger.debug(`packet msg to buffer: `, data)
    return currentSerial
  }

  /**
   * Request data from remote.
   * @param cmd
   * @param data
   */
  async request (cmd, data, meta) {
    return new Promise((resolve, reject) => {
      const serial = this.send(cmd, data, meta)
      const handle = setTimeout(() => {
        // this.logger.warn(`---timeout for answer, serial: ${serial}, cmd: ${cmd} ${meta && meta.api} ${this.port}`)
        reject(new Error('request is timeout'))
      }, this.timeout)

      function response (err, res) {
        if (err) reject(err)
        clearTimeout(handle)
        // this.logger.warn(`---success for answer, serial: ${serial}, cmd: ${cmd} ${meta && meta.api} ${this.port}`)
        resolve(res)
      }

      // this.logger.warn(`---waiting for answer, serial: ${serial}, cmd: ${cmd} ${meta && meta.api} ${this.port}`)
      this._queue.set(serial, response.bind(this))
    })
  }

  /**
   * unpack received data
   * @returns
   */
  _processData () {
    if(!this._buffers.length) return;
    const packet = this._protocol.unpack(this._buffers)
    // this.logger.debug('received packet: ', this.port, packet)
    if (!packet) return
    const { serial, cmd } = packet
    // this.logger.debug(`received packet, serial:${serial}, cmd: ${cmd}`)
    if (cmd === Message.commands.PING) {
      this.send(Message.commands.PONG, undefined, undefined, serial)
      return
    }
    if (cmd === Message.commands.RESPONSE || cmd === Message.commands.PONG) {
      const response = this._queue.get(serial)
      if (response) response(null, packet)
      this._queue.delete(serial)
      return
    }
    // if(this.msgEmitCmd.includes(msg.cmd))
    // this.logger.debug('emit message event: ', msg)
    this.emit('message', packet)

    this._processData()
  }

  async _heartTick () {
    try {
      await this.request(Message.commands.PING)
    } catch (err) {
      if (this._hasTryTimes > this.several) {
        this._hasTryTimes = 0
        this.close()
      }
    }
  }

  async ping () {
    const just = Date.now()
    await this.request(Message.commands.PING)
    return Date.now() - just
  }

  pong (serial) {
    this.send(Message.commands.PONG, undefined, undefined, serial)
  }
}
