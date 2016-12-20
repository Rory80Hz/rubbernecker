var request = require('request');
var async = require('async');
var personFetcher = require('./personFetcher');

module.exports = storyFetcher;

function storyFetcher(){};

var internals = {};

internals.getStoryViewModel = function(storyDetail, membershipInfo) {
    var viewModels = storyDetail.map(function(story) {
        var workers = story.owner_ids.map(function(worker_id) {
            return personFetcher.mapPersonFromId(worker_id, membershipInfo);
        });
        var signOffBy = personFetcher.mapPersonFromId(story.requested_by_id, membershipInfo);
        var blocked = story.labels.filter(function(l) { return l.name == 'blocked' });
        return { id: story.id, name: story.name, signOffBy: signOffBy, workers: workers, blocked: blocked.length > 0}
    });

    return viewModels;
}

internals.getStoriesByStatus = function(res, callback, status) {
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

storyFetcher.getStorySummary = function(res) {
    async.parallel([
            function(callback) {
                internals.getStoriesByStatus(res, callback, "started");
            },
            function(callback) {
                personFetcher.getMembers(res, callback);
            },
            function(callback) {
                internals.getStoriesByStatus(res, callback, "finished");
            },
            function(callback) {
                internals.getStoriesByStatus(res, callback, "delivered");
            },
            function(callback) {
                internals.getStoriesByStatus(res, callback, "rejected");
            }
        ],
        // Combine the results of the things above
        function(err, results) {
            if (err) {
                res.render('damn', { message: '┬──┬◡ﾉ(° -°ﾉ)', status: err, reason: "(╯°□°）╯︵ ┻━┻" });
            } else {
                var startedStories = internals.getStoryViewModel(results[0], results[1]);
                var finishedStories = internals.getStoryViewModel(results[2], results[1]);
                var deliveredStories = internals.getStoryViewModel(results[3], results[1]);
                var rejectedStories =  internals.getStoryViewModel(results[4], results[1]);
                var reviewSlotsFull = res.app.get('reviewSlotsLimit') <= finishedStories.length;
                var approveSlotsFull = res.app.get('signOffSlotsLimit') <= deliveredStories.length;

                res.render('index', { projectId: res.app.get('pivotalProjectId'), story: startedStories, finishedStory: finishedStories, deliveredStory: deliveredStories, rejectedStory: rejectedStories, reviewSlotsFull: reviewSlotsFull, approveSlotsFull:approveSlotsFull });
            }
        });
}
