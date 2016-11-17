const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const childProcess = require('child_process');
const StringDecoder = require('string_decoder').StringDecoder;
const log = require('../util/log');
const getDroplets = require('../api/get-droplets');
const remoteSSH = require('../actions/remote-ssh');
const remoteCopy = require('../actions/remote-copy');

const app = express();
const decoder = new StringDecoder('utf8');

let statusCheck = null;

app.use(bodyParser.json());

app.post('/git', function (req, res) {
    res.send('Thanks GitHub!');

    if (req.body.ref !== 'refs/heads/master') {
        return;
    }

    statusCheck.disable();

    let options = {cwd: path.resolve(__dirname, '../stage/prime-calculator')};
    log('Received an update. Exciting times!');
    log('Executing git pull');
    let output = childProcess.execSync('git pull', options);
    display(output);
    log('Executing npm install');
    childProcess.execSync('npm install', options);
    log('Executing npm run build');
    childProcess.execSync('npm run build', options);

    getDroplets('lamp').then(droplets => droplets.forEach(droplet => {
        let ip = droplet.networks.v4.find(network => network.type === 'public').ip_address;

        log(`Stopping apache on ${ip}`);
        remoteSSH('service apache2 stop', ip, options);

        log(`Copying artifacts to ${ip}`);
        remoteCopy('./www/*', '/var/www/html/.', ip, options);
        remoteCopy('./api/', '/var/www/html/.', ip, options);

        log(`Starting apache on ${ip}`);
        remoteSSH('service apache2 start', ip, options);
    }))
        .then(() => log('Done deploying'))
        .then(() => statusCheck.enable());
});

app.listen(8080, function () {
    console.log('Listening to git push events');
});

function display(output) {
    if (typeof  output === 'string') {
        console.log(output);
    } else {
        console.log(decoder.write(output));
    }
}

module.exports = function (check) {
    statusCheck = check
};
