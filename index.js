const express = require('express');
const bodyParser = require('body-parser');
const log = require('./util/log');
const statusCheck = require('./tasks/status-check');
const deploy = require('./tasks/deploy');
const scaleUp = require('./actions/scale-up');
const scaleDown = require('./actions/scale-down');

const app = express();
const cycleGap = 5000;
const scaleGap = 30000;

let deployScheduled = false;
let lastScaleChange = 0;


function doCycle() {
    if (deployScheduled) {
        deployScheduled = false;
        deploy()
            .then(() => setTimeout(doCycle, cycleGap));
    } else {
        statusCheck()
            .then((result) => {
                if (result.action !== 'IDLE') {
                    let timePassed = (+new Date()) - lastScaleChange;
                    if (timePassed > scaleGap) {
                        lastScaleChange = +new Date();
                        if (result.action === 'SCALE_UP') {
                            scaleUp(result.droplets);
                        } else if (result.action === 'SCALE_DOWN') {
                            scaleDown(result.droplets);
                        }
                    }
                }
            }).then((result) => setTimeout(doCycle, cycleGap));
    }
}


setTimeout(doCycle, cycleGap);


app.use(bodyParser.json());
app.post('/git', function (req, res) {
    if (req.body.ref !== 'refs/heads/master') {
        res.send('Thanks GitHub! But I don\' think that\'s of my interest');
        return;
    }
    res.send('Thanks GitHub! I will deploy');

    deployScheduled = true;
    log('Deploy scheduled');
});
app.listen(8080, function () {
    log('Listening to git push events');
});
