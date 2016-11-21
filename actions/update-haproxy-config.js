const fs = require('fs');
const path = require('path');
const config = require('../config');

function updateHAProxyConfig(lamps) {
    console.log(lamps);
    let proxyConfig = fs.readFileSync(path.join(__dirname, '../resources/haproxy.template.cfg'), 'utf8');
    console.log(proxyConfig);
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
    console.log(proxyConfig);

    fs.writeFileSync(path.join(__dirname, '../stage/haproxy.cfg'), proxyConfig, {flag: 'w'});
}

module.exports = updateHAProxyConfig;
