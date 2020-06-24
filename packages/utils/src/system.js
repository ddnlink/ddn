import os from 'os'
import shell from 'shelljs'
import ip from 'ip'

class System {
  static getPublicIp () {
    let publicIp = null
    try {
      const ifaces = os.networkInterfaces()
      Object.keys(ifaces).forEach(ifname => {
        ifaces[ifname].forEach(({ family, internal, address }) => {
          if (family !== 'IPv4' || internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return
          }
          if (!ip.isPrivate(address)) {
            publicIp = address
          }
        })
      })
    } catch (e) {
      // TODO: update to logger.info(e)
      console.log(e)
    }
    return publicIp
  }

  static getErrorMsg (err) {
    return err.stack ? err.stack : (err.message ? err.message : err)
  }

  static exec (cmd) {
    return shell.exec(cmd).stdout
  }

  static getProcessInfo (name) {
    return this.exec(`ps aux | grep ${name} | egrep -v 'grep'`)
  }

  static getOsInfo () {
    const info = {}
    info.release = os.release()
    info.cpucore = os.cpus().length
    info.memfreemb = os.freemem() / 1024 / 1024
    info.memtotalmb = os.totalmem() / 1024 / 1024
    info.loadavg = os.loadavg()
    return info
  }

  static getInfo () {
    const info = this.getOsInfo()
    info.node = this.getProcessInfo('app.js')
    return info
  }
}

export default System
