const paddler = new Padder(2);

module.exports = function (message) {
    let date = new Date();

    var month = paddler.pad(date.getMonth());
    var day = paddler.pad(date.getDate());
    var hours = paddler.pad(date.getHours());
    var minutes = paddler.pad(date.getMinutes());
    var seconds = paddler.pad(date.getSeconds());

    let timeString = date.getFullYear() + '-'
        + month + '-'
        + day + ' '
        + hours + ':'
        + minutes + ':'
        + seconds;
    console.log(timeString + ' ' + message);
};

function Padder(len, pad) {
    if (len === undefined) {
        len = 1;
    } else if (pad === undefined) {
        pad = '0';
    }

    var pads = '';
    while (pads.length < len) {
        pads += pad;
    }

    this.pad = function (what) {
        var s = what.toString();
        return pads.substring(0, pads.length - s.length) + s;
    };
}
