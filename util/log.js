module.exports = function (message) {
    let date = new Date();
    let timeString = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + ' ' + date.getHours() + ':' +
        date.getMinutes() + ':' + date.getSeconds();
    console.log(timeString + ' ' + message);
};
