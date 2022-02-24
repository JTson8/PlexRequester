const http = require('http');
const config = require('../data/config.json');
const logger = require('winston');

function searchTMDBShow(term, callback) {
    searchTMDB(`http://api.themoviedb.org/3/search/tv?api_key=${config.apiKey}&query=${term}`, callback)
}

function searchTMDBMovie(term, callback) {
    searchTMDB(`http://api.themoviedb.org/3/search/movie?api_key=${config.apiKey}&query=${term}`, callback)
}

function searchTMDB(command, callback) {
    http.get(encodeURI(command), (resp) => {
        let data = "";

        resp.on('data', (chunk) => {
            data += chunk;
        });

        resp.on('end', () => {
            return callback(JSON.parse(data).results);
        });
    }).on("error", (err) => {
        logger.error(err.message);
    });
}

module.exports = {searchTMDBMovie, searchTMDBShow}
