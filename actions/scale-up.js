const path = require('path');
const childProcess = require('child_process');
const log = require('../util/log');
const config = require('../config');
const remoteSSH = require('./remote-ssh');
const remoteCopy = require('./remote-copy');
const updateHAProxyConfig = require('./update-haproxy-config');
const createDroplet = require('../api/create-droplet');

module.exports = function (droplets) {
    log('Scaling up');

    let i = parseInt(Math.max.apply(null, droplets.map(droplet => droplet.name.replace('lamp', '')))) + 1;

    // create new lamp with API
    return createDroplet(i).then(droplet => {
        let options = {cwd: path.resolve(__dirname, '../stage/prime-calculator')};
        // add it's IP address to known_hosts file
        let ip = droplet.networks.v4.find(network => network.type === 'public').ip_address;
        log(`Adding IP address ${ip} to known hosts`);
        childProcess.execSync(`ssh-keyscan -H ${ip} >> ~/.ssh/known_hosts`);
        log(`Copying new sources to ${droplet.name}`);
        remoteCopy('./www/*', '/var/www/html/.', ip, options);
        remoteCopy('./api/', '/var/www/html/.', ip, options);

        let lamps = droplets.map(droplet => {
            return {
                name: droplet.name,
                ip: droplet.networks.v4.find(network => network.type === 'public').ip_address
            }
        });

        log('Updating haproxy');
        updateHAProxyConfig(lamps);

        options = {cwd: path.resolve(__dirname, '../stage/')};
        remoteCopy('./haproxy.cfg', '/etc/haproxy/haproxy.cfg', config.PROXY.IP, options);
        remoteSSH('service haproxy restart', config.PROXY.IP, options);
    });
};
