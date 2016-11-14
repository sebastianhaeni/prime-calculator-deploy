const getDroplets = require('../api/get-droplets');
const remoteSSH = require('../actions/remote-ssh');
const scaleUp = require('../actions/scale-up');
const scaleDown = require('../actions/scale-down');

function checkStatus() {
    console.log('\n\nChecking status on nodes');

    getDroplets('lamp').then(droplets => {
        let totalUsage = droplets.map(droplet => {
            let ip = droplet.networks.v4.find(network => network.type === 'public').ip_address;
            let cpuUsage = remoteSSH(`top -bn 2 -d 2 | grep '^%Cpu' | tail -n 1 | gawk '{print $2+$4+$6}'`, ip);
            console.log(`${ip} has a usage of ${cpuUsage}%`);
            return cpuUsage;
        }).reduce((a, b)=>a + b, 0);

        let average = totalUsage / droplets.length;

        if (average > 50) {
            scaleUp(droplets);
        } else if (average < 5) {
            scaleDown(droplets);
        }
    }).then(() => setTimeout(checkStatus, 5000));
}

setTimeout(checkStatus, 5000);
