const log = require('../util/log');
const getDroplets = require('../api/get-droplets');
const remoteSSH = require('../actions/remote-ssh');
const scaleUp = require('../actions/scale-up');
const scaleDown = require('../actions/scale-down');

const waitBetweenScans = 5000;
const waitBetweenUpScale = 30000;
const waitBetweenDownScale = 30000;

let lastScaleUp = 0;
let lastScaleDown = 0;

function checkStatus() {
    getDroplets('lamp').then(droplets => {
        let totalUsage = droplets.map(droplet => {
            let ip = droplet.networks.v4.find(network => network.type === 'private').ip_address;
            let cpuUsage = remoteSSH(`top -bn 2 -d 2`, ip, {}, ` | grep '^%Cpu' | tail -n 1 | gawk '{print $2+$4+$6}'`);
            cpuUsage = (cpuUsage + '').trim();
            log(`${ip} has a usage of ${cpuUsage}%`);
            return cpuUsage;
        }).reduce((a, b)=>a + b, 0);

        let average = totalUsage / droplets.length;

        if (average > 50 && +new Date() - lastScaleUp > waitBetweenUpScale) {
            scaleUp(droplets);
            lastScaleUp = +new Date();
        } else {
            if (droplets.length > 1 && average < 5 && +new Date() - lastScaleDown > waitBetweenDownScale) {
                scaleDown(droplets);
                lastScaleDown = +new Date();
            }
        }
    }).then(() => setTimeout(checkStatus, waitBetweenScans));
}

setTimeout(checkStatus, waitBetweenScans);
