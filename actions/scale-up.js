const path = require('path');
const config = require('../config');
const remoteSSH = require('./remote-ssh');
const remoteCopy = require('./remote-copy');
const updateHAProxyConfig = require('./update-haproxy-config');

module.exports = function (droplets) {
    console.log('Scaling up');

    let lamps = droplets.map(droplet => {
        return {
            name: droplet.name,
            ip: droplet.networks.v4.find(network => network.type === 'public').ip_address
        }
    });
    updateHAProxyConfig(lamps);

    let options = {cwd: path.resolve(__dirname, '../stage/')};
    remoteCopy('./haproxy.cfg', '/etc/haproxy/haproxy.cfg', config.PROXY.IP, options);
    remoteSSH('service haproxy restart', config.PROXY.IP, options);
};
