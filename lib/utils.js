var basicAuth = require('basic-auth')

exports.basicAuth = function(username, password) {
  return function(req, res, next) {
    if (!username || !password) {
      return res.send('<h1>༼ つ ◕_◕ ༽つ AWWWW SNAP!</h1><p>Username or password not set. Probably go do that, given you turned on basic auth, you set it in environment variables.');
    }

    var user = basicAuth(req)
    if (!user || user.name !== username || user.pass !== password) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.sendStatus(401)
    }

    next()
  }
}