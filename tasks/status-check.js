const log = require('../util/log');
const getDroplets = require('../api/get-droplets');
const remoteSSH = require('../actions/remote-ssh');

const ACTIONS = {
    'IDLE': 'IDLE',
    'SCALE_UP': 'SCALE_UP',
    'SCALE_DOWN': 'SCALE_DOWN'
};

function checkStatus() {
    return getDroplets('lamp').then(droplets => {
        let totalUsage = droplets.map(droplet => {
            let ip = droplet.networks.v4.find(network => network.type === 'public').ip_address;
            log(`Checking status of ${ip}...`);
            let cpuUsage = remoteSSH(`top -bn 2 -d 2`, ip, {}, ` | grep '^%Cpu' | tail -n 1 | gawk '{print $2+$4+$6}'`);
            if (!cpuUsage || cpuUsage.length === 0) {
                return;
            }
            cpuUsage = (cpuUsage + '').trim();
            log(`${ip} has a CPU usage of ${cpuUsage}%`);
            return cpuUsage;
        }).reduce((a, b) => a + b, 0);

        let average = totalUsage / droplets.length;

        if (average > 50) {
            return {
                action: ACTIONS.SCALE_UP,
                droplets: droplets
            };
        } else if (droplets.length > 1) {
            return {
                action: ACTIONS.SCALE_DOWN,
                droplets: droplets
            };
        } else {
            return {
                action: ACTIONS.IDLE
            };
        }

    });
}

module.exports = checkStatus;
