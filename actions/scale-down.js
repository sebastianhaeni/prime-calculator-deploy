const path = require('path');
const fetch = require('node-fetch');
const log = require('../util/log');
const config = require('../config');
const remoteSSH = require('./remote-ssh');
const remoteCopy = require('./remote-copy');
const updateHAProxyConfig = require('./update-haproxy-config');

module.exports = function (droplets) {
    log('Scaling down');

    let i = parseInt(Math.max.apply(null, droplets.map(droplet => droplet.name.replace('lamp', ''))));
    let sacrifice = droplets.find(droplet => droplet.name === `lamp${i}`);

    let lamps = droplets
        .filter(droplet => droplet.id !== sacrifice.id)
        .map(droplet => {
            return {
                name: droplet.name,
                ip: droplet.networks.v4.find(network => network.type === 'public').ip_address
            }
        });

    log('Updating haproxy');
    updateHAProxyConfig(lamps);
    let options = {cwd: path.resolve(__dirname, '../stage/')};
    remoteCopy('./haproxy.cfg', '/etc/haproxy/haproxy.cfg', config.PROXY.IP, options);
    remoteSSH('service haproxy restart', config.PROXY.IP, options);
    log('Done updating haproxy');

    log(`Destroying ${sacrifice.name}. Sorry but you have to go`);
    return fetch('https://api.digitalocean.com/v2/droplets/' + sacrifice.id, {
        method: 'delete',
        headers: {
            'Authorization': `Bearer ${config.API_TOKEN}`
        }
    })
        .then(() => log('Done destroying'));

};
