
var express = require('express');
var router = express.Router();
var storyFetcher = require('../lib/storyFetcher');

router.get('/', function(req, res, next) {
    storyFetcher.getStorySummary(res);
});

module.exports = router;
