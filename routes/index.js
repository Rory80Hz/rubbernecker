
var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');

function getStoryViewModel(storyDetail, membershipInfo) {
    var views = storyDetail.map(function(story) {
        var workers = story.owner_ids.map(function(worker_id) {
            return mapPersonFromId(worker_id, membershipInfo);
        });
        var signOffBy = mapPersonFromId(story.requested_by_id, membershipInfo);
        return { id: story.id, name: story.name, signOffBy: signOffBy, workers: workers }
    });

    return views;
}

function mapPersonFromId(id, membershipInfo) {
    var picked = membershipInfo.find(membership => membership.person.id === id);
    return picked.person.name;
}

function getStoriesByStatus(res, callback, status) {
    //Get the list of stories
    var options = {
        url: 'https://www.pivotaltracker.com/services/v5/projects/' + res.app.get('pivotalProjectId') + '/stories?date_format=millis&with_state=' + status,
        headers: {
            'X-TrackerToken': res.app.get('pivotalApiKey')
        }
    };

    request(options, function getStories(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, JSON.parse(body));
        } else {
            callback("Couldn't get stories thanks to this crap: " + response.statusCode, null);
        }
    });
}

function getStorySummary(res) {
    async.parallel([
            function(callback) {
                getStoriesByStatus(res, callback, "started");
            },
            function(callback) {
                //Get the list of people
                var options = {
                    url: 'https://www.pivotaltracker.com/services/v5/projects/' + res.app.get('pivotalProjectId') + '/memberships',
                    headers: {
                        'X-TrackerToken': res.app.get('pivotalApiKey')
                    }
                };

                request(options, function getStories(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        callback(null, JSON.parse(body));
                    } else {
                        callback("Couldn't get people thanks to this crap" + response.statusCode, null);
                    }
                });
            },
            function(callback) {
                getStoriesByStatus(res, callback, "finished");
            },
            function(callback) {
                getStoriesByStatus(res, callback, "delivered");
            }
        ],
        // Combine the results of the things above
        function(err, results) {
            if (err) {
                res.render('damn', { message: '┬──┬◡ﾉ(° -°ﾉ)', status: err, reason: "(╯°□°）╯︵ ┻━┻" });
            } else {
                var startedStories = getStoryViewModel(results[0], results[1]);
                var finishedStories = getStoryViewModel(results[2], results[1]);
                var deliveredStories = getStoryViewModel(results[3], results[1]);
                var reviewSlotsFull = res.app.get('reviewSlotsLimit') <= finishedStories.length;
                var approveSlotsFull = res.app.get('signOffSlotsLimit') <= deliveredStories.length;

                res.render('index', { projectId: res.app.get('pivotalProjectId'), story: startedStories, finishedStory: finishedStories, deliveredStory: deliveredStories, reviewSlotsFull: reviewSlotsFull, approveSlotsFull:approveSlotsFull });
            }
        });
}

router.get('/', function(req, res, next) {
    getStorySummary(res);
});

module.exports = router;
