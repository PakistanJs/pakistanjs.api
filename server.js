require('es6-promise').polyfill()
require('isomorphic-fetch')

const express = require('express')
const compression = require('compression')
const cors = require('cors')
const redis = require('redis')

const app = express()
const client = redis.createClient()

const cacheExpiry = 30 * 60
const cacheMiddleware = (req, res, next) => {
	client.get(req.path, (err, cache) => {
		if (cache) {
			res.send(JSON.parse(cache))
		} else {
			next()
		}
	})
}


app.use(cors())
app.use(compression())

const googleApiUrl = 'https://www.googleapis.com/youtube/v3/'
const apiKey = process.env.GOOGLE_API_KEY

if (!apiKey) {
	throw Error('GOOGLE_API_KEY is undefined');
}

const youtubeVideoParams = `key=${apiKey}&channelId=UCOHAJNSpYjS9_Hdho3LS7Fw&part=id,snippet&order=date&maxResults=20`

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

			client.setex(req.path, cacheExpiry, JSON.stringify(playlists))
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

			client.setex(req.path, cacheExpiry, JSON.stringify(videos))
			res.send(videos)
	})
})

app.listen(80, function () {
	console.log('app listening on port 80!')
})
