
var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');

function getStoryViewModel(storyDetail, membershipInfo) {
    var views = storyDetail.map(function(story) {
        return getSingleStoryViewModel(story, membershipInfo);
    });

    return views;
}

function getSingleStoryViewModel(story, membershipInfo) {
    console.log(story);
    var workers = story.owner_ids.map(function(worker_id) {
        return mapPersonFromId(worker_id, membershipInfo);
    });
    var signOffBy = mapPersonFromId(story.requested_by_id, membershipInfo);

    return { id: story.id, name: story.name, signOffBy: signOffBy, workers: workers }
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

function getStoryById(res, callback, id) {
    //Get the list of stories
    var options = {
        url: 'https://www.pivotaltracker.com/services/v5/projects/' + res.app.get('pivotalProjectId') + '/stories/' + id,
        headers: {
            'X-TrackerToken': res.app.get('pivotalApiKey')
        }
    };

    request(options, function getStories(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, JSON.parse(body));
        } else {
            callback("Couldn't get story thanks to this crap: " + response.statusCode, null);
        }
    });
}

function getStorySummary(res) {
    async.parallel([
            /**
             * Get user list from Pivotal.
             *
             * @param callback
             */
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
            /**
             * Get stories in play.
             *
             * @param callback
             */
            function(callback) {
                getStoriesByStatus(res, callback, "started");
            },

            /**
             * Get stories in review.
             *
             * @param callback
             */
            function(callback) {
                getStoriesByStatus(res, callback, "finished");
            },

            /**
             * Get stories in approval.
             *
             * @param callback
             */
                function(callback) {
                getStoriesByStatus(res, callback, "delivered");
            },

            /**
             * Get support info.
             *
             * @param callback
             */
            function(callback) {
                console.log(res.app.get('supportStoryId'));

                if (res.app.get('supportStoryId')) {
                    getStoryById(res, callback, res.app.get('supportStoryId'));
                } else {
                    callback(null, JSON.parse(null));
                }
            }
        ],
        // Combine the results of the things above
        function(err, results) {
            if (err) {
                res.render('damn', { message: '┬──┬◡ﾉ(° -°ﾉ)', status: err, reason: "(╯°□°）╯︵ ┻━┻" });
            } else {
                var startedStories = getStoryViewModel(results[1], results[0]);
                var finishedStories = getStoryViewModel(results[2], results[0]);
                var deliveredStories = getStoryViewModel(results[3], results[0]);
                var support = results[4] ? getSingleStoryViewModel(results[4], results[0]) : null;
                var reviewSlotsFull = res.app.get('reviewSlotsLimit') <= finishedStories.length;
                var approveSlotsFull = res.app.get('signOffSlotsLimit') <= deliveredStories.length;

                res.render('index', { projectId: res.app.get('pivotalProjectId'), story: startedStories, finishedStory: finishedStories, deliveredStory: deliveredStories, reviewSlotsFull: reviewSlotsFull, approveSlotsFull:approveSlotsFull, support: support });
            }
        });
}

router.get('/', function(req, res, next) {
    getStorySummary(res);
});

module.exports = router;
