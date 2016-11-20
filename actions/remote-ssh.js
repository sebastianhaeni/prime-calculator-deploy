const childProcess = require('child_process');

module.exports = function (command, ip, options, pipes) {
    childProcess.execSync(`ssh root@${ip} '${command}' ${pipes}`, options || {});
};
