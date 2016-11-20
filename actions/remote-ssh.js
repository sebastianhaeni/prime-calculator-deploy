const childProcess = require('child_process');

module.exports = function (command, ip, options, pipes) {
    return childProcess.execSync(`ssh root@${ip} '${command}' ${pipes}`, options || {});
};
