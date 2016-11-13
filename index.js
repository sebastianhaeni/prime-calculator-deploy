var express = require('express');
var bodyParser = require('body-parser');
var app = express();


app.use(bodyParser.json());

app.post('/git', function (req, res) {
    console.log(req.body);
    res.send('Thanks!');
});

app.listen(8080, function () {
    console.log('Started server');
});
