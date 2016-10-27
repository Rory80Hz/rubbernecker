var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');

function storyBones(storyDetail, membershipInfo) {
    var bones = storyDetail.map(function(story) {
        var workers = story.owner_ids.map(function(worker_id) {
            // call in here to get the persons name
            return getPersonById(worker_id, membershipInfo);
        });
        var signOffBy = getPersonById(story.requested_by_id, membershipInfo);
        return { id: story.id, name: story.name, signOffBy: signOffBy, workers: workers }
    });

    return bones;
}

function getPersonById(id, membershipInfo) {
    var picked = membershipInfo.find(membership => membership.person.id === id);
    return picked.person.name;
}

function getStorySummary(res) {
    async.parallel([
            function(callback) {
                //Get the list of stories
                var options = {
                    url: 'https://www.pivotaltracker.com/services/v5/projects/' + res.app.get('pivotalProjectId') +'/stories?date_format=millis&with_state=started',
                    headers: {
                        'X-TrackerToken': res.app.get('pivotalApiKey')
                    }
                };

                request(options, function getStories(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        callback(null, JSON.parse(body));
                    } else {
                        callback("Couldn't get stories thanks to this crap: " + response, null);
                    }
                });
            },
            function(callback) {
                //Get the list of stories
                var options = {
                    url: 'https://www.pivotaltracker.com/services/v5/projects/' + res.app.get('pivotalProjectId') +'/memberships',
                    headers: {
                        'X-TrackerToken': res.app.get('pivotalApiKey')
                    }
                };

                request(options, function getStories(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        callback(null, JSON.parse(body));
                    } else {
                        callback("Couldn't get people thanks to this crap" + response, null);
                    }
                });
            }
        ],
        // Combine the results of the things above
        function(err, results) {
            if (err) {
                res.render('damn', { message: '┬──┬◡ﾉ(° -°ﾉ)', status: err, reason: "(╯°□°）╯︵ ┻━┻" });
            } else {

                res.render('index', { title: 'Dem Stories', story: storyBones(results[0], results[1]) });
            }
            // the results array will equal ['one','two'] even though
            // the second function had a shorter timeout.
        });
}

/* GET home page. */
router.get('/', function(req, res, next) {
    getStorySummary(res);
});

module.exports = router;
