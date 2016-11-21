const childProcess = require('child_process');

module.exports = function (source, destination, ip, options) {
    return childProcess.execSync(`scp -o StrictHostKeyChecking=no -r ${source} root@${ip}:${destination}`, options);
};
