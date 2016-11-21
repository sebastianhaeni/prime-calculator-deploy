const fs = require('fs');
const path = require('path');
const config = require('../config');

function updateHAProxyConfig(lamps) {
    console.log(lamps);
    return fs.readFile(path.join(__dirname, '../resources/haproxy.template.cfg'), 'utf8', function (err, proxyConfig) {
        proxyConfig = proxyConfig.replace('${statsPassword}', config.STATS_PASSWORD);

        let re = new RegExp('{repeat}([a-zA-Z0-9\\${}:\\W]*){endRepeat}');
        let serverStringTemplate = re.exec(proxyConfig)[1];

        let servers = [];

        lamps.forEach(lamp => {
            let serverString = serverStringTemplate.replace('${serverName}', lamp.name);
            serverString = serverString.replace('${serverIp}', lamp.ip);
            servers.push(serverString);
        });

        proxyConfig = proxyConfig.replace(re, servers.join(''));

        fs.writeFileSync(path.join(__dirname, '../stage/haproxy.cfg'), proxyConfig);
    });
}

module.exports = updateHAProxyConfig;
