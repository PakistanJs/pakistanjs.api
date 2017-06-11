require('es6-promise').polyfill()
require('isomorphic-fetch')

// import models from './models'
const BakeEnd = require('../../bake-end/dist/main')

import mongoose from 'mongoose'
const Schema = mongoose.Schema

const express = require('express')
const multer  = require('multer')
const compression = require('compression')
const cors = require('cors')
const redis = require('redis')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const passport = require('passport')
const colors = require('colors/safe')
const morgan = require('morgan')
const cloudinary = require('cloudinary')

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

const createURIFrom = (prop, prefix, limit, suffix) => {
	const uriFromProp = prop.replace(/[^\w]+/gi, '_').toLowerCase()
	return `${prefix}${uriFromProp.substr(0, limit)}${suffix || ''}`
}

const envVars = [
	process.env.GOOGLE_API_KEY,
	process.env.GITHUB_CLIENT_ID,
	process.env.GITHUB_CLIENT_SECRET,
	process.env.CLOUDINARY_URL
]
const hasRequiredEnvs = envVars.some((envVar) => envVar == undefined)

if (hasRequiredEnvs) {
	console.error(colors.red.underline('Please set following env vars: GOOGLE_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, CLOUDINARY_URL'))
	process.exit(1)
}

app.use(bodyParser.json())
app.use(cors())
app.use(compression())
app.use(cookieParser('elloworld'))

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

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

const bakeEnd = BakeEnd(
  {
    mongoURL: 'mongodb://128.199.105.140:27017/test_yo',

    dataRequirements: {
      User: {
				fields: {
					name: { type: String },
	        username: { type: String,  unique: true },
	        email: { type: String, unique: true },
	        location: { type: String },
	        id: { type: Number },
	        avatarUrl: { type: String },
	        company: { type: String },
	        accessToken: { type: String },
	        isAdmin: { type: Boolean, default: false }
				}
      },
			Topic: {
				fields: {
					title: { type: String, required: true },
					uri: { type: String, unique: true },
					markdown: { type: String }
				},
				beforeCreate: (obj) => {
					obj.uri = createURIFrom(obj.title, 'topic_', 20, '')
					return obj
				}
			},
			Section: {
				fields: {
					name: { type: String, unique: true },
				  uri: { type: String, unique: true },
				  desc: { type: String },
					topics: [{
						type: Schema.Types.ObjectId,
						ref: 'Topic'
					}]
				},
				beforeCreate: (obj) => {
					obj.uri = createURIFrom(obj.name, 'section_', 20, '')
					return obj
				}
			},
			Course: {
				fields: {
					name: { type: String, required: true, unique: true },
					uri: { type: String, unique: true },
					desc: { type: String },
					thumb: { type: 'Image' },
					sections: [{
						type: Schema.Types.ObjectId,
						ref: 'Section'
					}]
				},
				beforeCreate: (obj) => {
					obj.uri = createURIFrom(obj.name, 'course_', 20, '')
					return obj
				}
			}
    },
    app: app
  }
)

const googleApiUrl = 'https://www.googleapis.com/youtube/v3/'
const apiKey = envVars[0]
const youtubeVideoParams = `key=${apiKey}&channelId=UCOHAJNSpYjS9_Hdho3LS7Fw&part=id,snippet&order=date&maxResults=50`

passport.use(new GithubStrategy({
    clientID: envVars[1],
    clientSecret: envVars[2],
    callbackURL: 'http://localhost:8888/auth/success'
  },
  async function(accessToken, refreshToken, profile, done) {
    const userModel = bakeEnd.models['User'].model
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
    const existingUser = await userModel.findOne({ email: userObject.email }, 'name username email location avatarUrl company isAdmin')
    if (existingUser) {
    	done(null, existingUser)
    } else {
    	const newUser = await userModel(userObject).save()
    	done(null, newUser)
    }
  })
)

app.get('/user', authGate, (req, res) => {
	res.send(req.user)
})

app.post('/upload', upload.any(), (req, res) => {
	cloudinary.uploader
		.upload_stream(({ url, public_id}) => res.send({ url, public_id }))
		.end(req.files[0].buffer)
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


bakeEnd.run(3000)
