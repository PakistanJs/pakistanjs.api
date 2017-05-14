require('es6-promise').polyfill()
require('isomorphic-fetch')

const mongoose = require('mongoose')
mongoose.Promise = global.Promise
mongoose.connect('mongodb://128.199.105.140:27017/pkjsdev')

import models from './models'

const express = require('express')
const compression = require('compression')
const cors = require('cors')
const redis = require('redis')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const passport = require('passport')
const colors = require('colors/safe')
const morgan = require('morgan')

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

const authGate = (req, res, next) => (req.user ? next() : res.status(401).send({ error: 'your are not logged in' }))

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

app.use(bodyParser.json())
app.use(cors())
app.use(compression())
app.use(cookieParser('elloworld'))

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

app.use(morgan(':method :url :response-time'))

const googleApiUrl = 'https://www.googleapis.com/youtube/v3/'
const apiKey = envVars[0]
const youtubeVideoParams = `key=${apiKey}&channelId=UCOHAJNSpYjS9_Hdho3LS7Fw&part=id,snippet&order=date&maxResults=50`

passport.use(new GithubStrategy({
    clientID: envVars[1],
    clientSecret: envVars[2],
    callbackURL: 'http://localhost:8888/auth/success'
  },
  async function(accessToken, refreshToken, profile, done) {
  	const user = profile._json
    const userObject = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.login,
      location: user.location,
      company: user.company,
      avatarUrl: user.avatar_url,
      accessToken: accessToken,
    }

    const { access_token, id, ...sessionObject } = userObject
    const existingUser = await models.user.getUser(userObject.email)
    if (existingUser) {
    	done(null, existingUser)
    } else {
    	const newUser = await models.user.saveUser(userObject)
    	done(null, newUser)
    }
  })
)

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

app.get('/:playlistId/list', authGate, async function(req, res) {
	const topics = await models.topic.getTopics()
	res.send(topics)
})

app.get('/user', authGate, (req, res) => {
	res.send(req.user)
})

app.get('/login',
  passport.authenticate('github', { scope: [ 'user:email' ] }))

app.get('/auth/success',
  passport.authenticate('github', { failureRedirect: '/zzz' }),
  (req, res) => {
    res.redirect('/user')
  })

app.get('/logout', (req, res) => {
	req.session.destroy()
	req.logout()
	res.redirect('/')
})

app.get('/sync', (req, res) => {
	fetch(`${googleApiUrl}search?${youtubeVideoParams}`)
		.then(response => {
			return response.json()
		})
		.then(response => {
			const topics = response.items
				.filter(({ id }) => id.kind === "youtube#video")
				.map(({ id, snippet }) => ({
					videoId: id.videoId,
					videoUrl: `https://www.youtube.com/embed/${id.videoId}?theme=light&color=white&showinfo=0`,
					title: snippet.title,
					desc: snippet.description
				}))

			models.topic.insertTopics(topics)

			res.send('syncing complete')
	})
})


app.post('/course/add', async function(req, res) {
	try {
		const course = req.body
		console.log(course)
		const savedCourse = await models.course.saveCourse(course)
		res.send(savedCourse)
	} catch (e) {
		res.status(400).send({ error: e.code && e.code === 11000 ? 'course with this name already exist' : 'could not add this course' })
	}
})

app.get('/courses', async function(req, res) {
	try {
		const courses = await models.course.getCourses()
		res.send(courses)
	} catch (e) {
		console.log(e)
	}
})

app.post('/course/section/add', async function(req, res) {
	try {
		const section = req.body
		const savedSection = await models.section.saveSection(section)
		res.send(savedSection)
	} catch (e) {
		res.status(400).send({ error: e.code && e.code === 11000 ? 'section with this name already exist' : 'could not add this section' })
	}
})

app.get('/course/sections', async function(req, res) {
	try {
		const courses = await models.course.getCourses()
		res.send(courses)
	} catch (e) {
		console.log(e)
	}
})

app.listen(3000, function () {
	console.log('app listening on port 3000!')
})

