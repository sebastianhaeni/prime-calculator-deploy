const path = require('path');
const childProcess = require('child_process');
const StringDecoder = require('string_decoder').StringDecoder;
const log = require('../util/log');
const getDroplets = require('../api/get-droplets');
const remoteSSH = require('../actions/remote-ssh');
const remoteCopy = require('../actions/remote-copy');

const decoder = new StringDecoder('utf8');


function deploy() {
    let options = {cwd: path.resolve(__dirname, '../stage/prime-calculator')};
    log('Received an update. Exciting times!');
    log('Executing git pull');
    display(childProcess.execSync('git pull', options));
    log('Executing npm install');
    display(childProcess.execSync('npm install', options));
    log('Executing npm run build');
    display(childProcess.execSync('npm run build', options));

    return getDroplets('lamp').then(droplets => droplets.forEach(droplet => {
        let ip = droplet.networks.v4.find(network => network.type === 'public').ip_address;

        log(`Stopping apache on ${ip}`);
        remoteSSH('service apache2 stop', ip, options);
        setTimeout(() => {
            log(`Copying artifacts to ${ip}`);
            remoteCopy('./www/*', '/var/www/html/.', ip, options);

            setTimeout(() => {
                remoteCopy('./api/', '/var/www/html/.', ip, options);
                log(`Starting apache on ${ip}`);
                setTimeout(()=> {
                    remoteSSH('service apache2 start', ip, options);

                }, 3000);
            }, 3000);
        }, 3000);
    })).then(() => log('Done deploying'));
}

function display(output) {
    if (typeof  output === 'string') {
        console.log(output);
    } else {
        console.log(decoder.write(output));
    }
}

module.exports = deploy;
