const childProcess = require('child_process');

module.exports = function (command, ip, options) {
    return childProcess.execSync(`ssh root@${ip} '${command}'`, options);
};
