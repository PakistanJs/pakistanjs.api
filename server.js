require('es6-promise').polyfill()
require('isomorphic-fetch')

const db = require('./db')

const express = require('express')
const compression = require('compression')
const cors = require('cors')
const redis = require('redis')
const session = require('express-session')
const passport = require('passport')
const colors = require('colors/safe')

const GithubStrategy = require('passport-github2').Strategy
const RedisStore = require('connect-redis')(session)

const app = express()
const client = redis.createClient()

const cacheExpiry = 30 * 60
const setAPIResponseCache = (path, response) => client.setex(`api:${path}`, cacheExpiry, JSON.stringify(response))
const getAPIResponseCache = (path, cb) => client.get(`api:${path}`, (err, cache) => cb(JSON.parse(cache)))
const cacheMiddleware = (req, res, next) => {
	getAPIResponseCache(req.path, 
		(err, cache) => cache ? res.send(cache) : next())
}

const envVars = [
	process.env.GOOGLE_API_KEY,
	process.env.GITHUB_CLIENT_ID,
	process.env.GITHUB_CLIENT_SECRET
]
const hasRequiredEnvs = envVars.some((envVar) => envVar == undefined)

if (hasRequiredEnvs) {
	console.error(colors.red.underline('Please set following env vars: GOOGLE_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET'))
	process.exit(1)
}


app.use(cors())
app.use(compression())

const googleApiUrl = 'https://www.googleapis.com/youtube/v3/'
const apiKey = envVars[0]
const youtubeVideoParams = `key=${apiKey}&channelId=UCOHAJNSpYjS9_Hdho3LS7Fw&part=id,snippet&order=date&maxResults=20`


passport.use(new GithubStrategy({
    clientID: envVars[1],
    clientSecret: envVars[2],
    callbackURL: '/auth/success'
  },
  function(accessToken, refreshToken, profile, done) {
  	const user = profile._json;
    const sessionObject = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.login,
      avatar_url: user.avatar_url,
      access_token: accessToken,
    };

    user.access_token = accessToken;
    db.getUser(user.email)
      .then(savedUser => done(null, sessionObject))
      .catch(err => {
        db.saveUser(user)
          .then(savedUser => done(null, sessionObject))
          .catch(err => done(err, null));
      })

  })
)

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

app.use(session({  
  store: new RedisStore({
    client: client
  }),
  secret: 'elloworld',
  resave: false,
  saveUninitialized: false
}))
// use passport session
app.use(passport.initialize())
app.use(passport.session())

app.get('/playlists', cacheMiddleware, (req, res) => {
	fetch(`${googleApiUrl}playlists?${youtubeVideoParams}`)
		.then(response => {
			return response.json()
		})
		.then(response => {
			const playlists = response.items
				.map(({ id, snippet }) => ({
					id: id,
					title: snippet.title,
					desc: snippet.description
				}))
				.reverse()

			setAPIResponseCache(req.path, playlists)
			res.send(playlists)
	})
})

app.get('/:playlistId/list', cacheMiddleware, (req, res) => {
	const { playlistId } = req.params

	fetch(`${googleApiUrl}playlistItems?${youtubeVideoParams}&playlistId=${playlistId}`)
		.then(response => {
			return response.json()
		})
		.then(response => {
			const videos = response.items
				.filter(({ snippet }) => snippet.resourceId.kind === "youtube#video")
				.map(({ id, snippet }) => ({
					videoUrl: `https://www.youtube.com/embed/${snippet.resourceId.videoId}?theme=light&color=white&showinfo=0`,
					title: snippet.title,
					desc: snippet.description
				}))

			setAPIResponseCache(req.path, videos)
			res.send(videos)
	})
})

app.get('/user', (req, res) => {
	console.log(req.session)
	res.send(req.user)
})

app.get('/login',
  passport.authenticate('github', { scope: [ 'user:email' ] }))

app.get('/auth/success',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/user')
  })

app.get('/logout', (req, res) => {
	req.session.destroy()
	req.logout()
	res.redirect('/')
})

app.listen(3000, function () {
	console.log('app listening on port 3000!')
})
