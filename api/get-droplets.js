const fetch = require('node-fetch');
const config = require('../config');

function getDroplets(tagname) {

    let filter = tagname ? '?tag_name=' + tagname : '';

    return fetch('https://api.digitalocean.com/v2/droplets' + filter, {
        headers: {
            'Authorization': `Bearer ${config.API_TOKEN}`
        }
    }).then(response => response.json())
        .then(json => json.droplets);
}

module.exports = getDroplets;
