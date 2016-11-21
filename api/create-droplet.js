const fetch = require('node-fetch');
const Promise = require('promise');
const config = require('../config');
const log = require('../util/log');

function createDroplet(i) {
    log(`Creating droplet lamp${i}`);

    return fetch('https://api.digitalocean.com/v2/droplets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: `lamp${i}`,
            region: 'fra1',
            size: '512mb',
            image: 20947873,
            ssh_keys: [4743654],
            backups: false,
            ipv6: false,
            private_networking: true,
            user_data: null,
            volume: [],
            tags: ['lamp']
        })
    })
        .then(response => response.json())
        .then(json => json.droplet)
        .then(droplet => waitTillItsAlive(droplet))
        .catch((err) => console.log(err));
}

function waitTillItsAlive(droplet) {
    log(`Waiting for ${droplet.name} to boot up...`);
    return fetch('https://api.digitalocean.com/v2/droplets/' + droplet.id, {
        headers: {
            'Authorization': `Bearer ${config.API_TOKEN}`
        }
    })
        .then(response => response.json())
        .then(json => json.droplet)
        .then(droplet => {
            if (droplet.status !== 'active' || droplet.networks.v4.length === 0) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        waitTillItsAlive(droplet).then(() => resolve(droplet.id));
                    }, 5000);
                });
            }
            let ip = droplet.networks.v4.find(network => network.type === 'public').ip_address;
            log(`${droplet.name} with IP address ${ip} is booted up`);
        });
}

module.exports = createDroplet;
