const path = require('path');
const childProcess = require('child_process');
const fetch = require('node-fetch');
const StringDecoder = require('string_decoder').StringDecoder;
const Promise = require('promise');
const log = require('../util/log');
const config = require('../config');
const remoteSSH = require('./remote-ssh');
const remoteCopy = require('./remote-copy');
const updateHAProxyConfig = require('./update-haproxy-config');
const createDroplet = require('../api/create-droplet');

const decoder = new StringDecoder('utf8');

module.exports = function (droplets) {
    log('Scaling up');

    let i = parseInt(Math.max.apply(null, droplets.map(droplet => droplet.name.replace('lamp', '')))) + 1;

    // create new lamp with API
    return createDroplet(i).then(id => {
        return fetch('https://api.digitalocean.com/v2/droplets/' + id, {
            headers: {
                'Authorization': `Bearer ${config.API_TOKEN}`
            }
        })
            .then(response => response.json())
            .then(json => json.droplet)
            .then(droplet => {
                var ip = droplet.networks.v4.find(network => network.type === 'public').ip_address;
                // add it's IP address to known_hosts file
                log(`Adding IP address ${ip} to known hosts`);
                display(childProcess.execSync(`ssh-keyscan -H ${ip} >> ~/.ssh/known_hosts`));
                log(`Waiting for ${droplet.name} to settle down`);

                return new Promise((resolve) => {
                    setTimeout(() => {
                        log(`Copying new sources to ${droplet.name}`);
                        let options = {cwd: path.resolve(__dirname, '../stage/prime-calculator')};
                        remoteCopy('./www/*', '/var/www/html/.', ip, options);
                        remoteCopy('./api/', '/var/www/html/.', ip, options);
                        let lamps = droplets.map(droplet => {
                            return {
                                name: droplet.name,
                                ip: droplet.networks.v4.find(network => network.type === 'public').ip_address
                            }
                        });

                        // add new born
                        lamps.push({
                            name: droplet.name,
                            ip: ip
                        });

                        log('Updating haproxy');
                        return updateHAProxyConfig(lamps).then(() => {
                            options = {cwd: path.resolve(__dirname, '../stage/')};
                            remoteCopy('./haproxy.cfg', '/etc/haproxy/haproxy.cfg', config.PROXY.IP, options);
                            remoteSSH('service haproxy restart', config.PROXY.IP, options);
                            resolve();
                        });
                    }, 20000);
                });
            });
    });
};

function display(output) {
    if (typeof  output === 'string') {
        console.log(output);
    } else {
        console.log(decoder.write(output));
    }
}
