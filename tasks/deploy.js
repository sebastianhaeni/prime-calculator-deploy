const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const childProcess = require('child_process');
const getDroplets = require('../api/get-droplets');
const remoteSSH = require('../actions/remote-ssh');
const remoteCopy = require('../actions/remote-copy');

const app = express();

app.use(bodyParser.json());

app.post('/git', function (req, res) {
    console.log(req.body);
    res.send('Thanks GitHub!');

    let options = {cwd: path.resolve(__dirname, '../stage/prime-calculator')};
    console.log(childProcess.execSync('git pull', options));
    console.log(childProcess.execSync('npm install', options));
    console.log(childProcess.execSync('npm run build', options));

    getDroplets('lamp').then(droplets => droplets.forEach(droplet => {
        let ip = droplet.networks.v4.find(network => network.type === 'public').ip_address;

        console.log(`Stopping apache on ${ip}`);
        remoteSSH('service apache2 stop', ip, options);

        console.log(`Copying artifacts to ${ip}`);
        remoteCopy('./www/*', '/var/www/html/.', ip, options);
        remoteCopy('./api/', '/var/www/html/.', ip, options);

        console.log(`Starting apache on ${ip}`);
        remoteSSH('service apache2 start', ip, options);
    }));

});

app.listen(8080, function () {
    console.log('Listening to git push events');
});
