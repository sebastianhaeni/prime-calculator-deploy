const childProcess = require('child_process');

module.exports = function (source, destination, ip, options) {
    return childProcess.execSync(`scp -r ${source} root@${ip}:${destination}`, options);
};
