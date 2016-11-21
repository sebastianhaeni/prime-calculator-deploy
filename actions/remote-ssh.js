const childProcess = require('child_process');

module.exports = function (command, ip, options, pipes) {
    return childProcess.execSync(`ssh -o StrictHostKeyChecking=no root@${ip} '${command}' ${pipes}`, options || {});
};
