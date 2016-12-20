var request = require('request');

module.exports = personFetcher;

function personFetcher(){};
var internals = {};

personFetcher.getMembers = function(res, callback){
    var options = {
        url: 'https://www.pivotaltracker.com/services/v5/projects/' + res.app.get('pivotalProjectId') + '/memberships',
        headers: {
            'X-TrackerToken': res.app.get('pivotalApiKey')
        }
    };

    request(options, function getMemberships(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, JSON.parse(body));
        } else {
            callback("Couldn't get people thanks to this crap" + response.statusCode, null);
        }
    });    
}

personFetcher.mapPersonFromId = function(id, membershipInfo) {
    var picked = membershipInfo.find(membership => membership.person.id === id);
    var name = "Unknown/Inactive User";
    if(picked) {
        name = picked.person.name;
    }
    return name;
}