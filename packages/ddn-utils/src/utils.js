const os = require('os');
const shell = require("shelljs")

class Utils{
    static getPublicIp() {
        let publicIp = null;
        try {
            const ifaces = os.networkInterfaces();
            Object.keys(ifaces).forEach(ifname => {
                ifaces[ifname].forEach(iface => {
                    if ('IPv4' !== iface.family || iface.internal !== false) {
                        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                        return;
                    }
                    if (!ip.isPrivate(iface.address)) {
                        publicIp = iface.address;
                    }
                });
            });
        } catch (e) {
        }
        return publicIp;
    }

    static getErrorMsg(err) {
        return err.stack ? err.stack : (err.message ? err.message : err);
    }
    
    static exec(cmd){
        return shell.exec(cmd).stdout;
    }
      
    static getProcessInfo(name) {
        return this.exec(`ps aux | grep ${name} | egrep -v 'grep'`);
    }  
      
    static getOsInfo() {
        let info = {};
        info.release = os.release();
        info.cpucore = os.cpus().length;
        info.memfreemb = os.freemem()/1024/1024;
        info.memtotalmb = os.totalmem()/1024/1024;
        info.loadavg = os.loadavg();
        return info;
    }
      
    static getInfo() {
        let info = this.getOsInfo();
        info.node = this.getProcessInfo('app.js');
        return info;
    }
      
}

module.exports = Utils;