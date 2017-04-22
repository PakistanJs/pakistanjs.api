require('es6-promise').polyfill()
require('isomorphic-fetch')

const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())

const googleApiUrl = 'https://www.googleapis.com/youtube/v3/'
const apiKey = process.env.GOOGLE_API_KEY

if (!apiKey) {
	throw Error('GOOGLE_API_KEY is undefined');
}

const youtubeVideoParams = `key=${apiKey}&channelId=UCOHAJNSpYjS9_Hdho3LS7Fw&part=id,snippet&order=date&maxResults=20`

app.get('/playlists', function (req, res) {
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

			res.send(playlists)
	})
})

app.get('/:playlistId/list', function (req, res) {
	const { playlistId } = req.params

	console.log(playlistId);

	fetch(`${googleApiUrl}playlistItems?${youtubeVideoParams}&playlistId=${playlistId}`)
		.then(response => {
			return response.json()
		})
		.then(response => {
			console.log(response);
			// res.send(response)
			const videos = response.items
				.filter(({ snippet }) => snippet.resourceId.kind === "youtube#video")
				.map(({ id, snippet }) => ({
					videoUrl: `https://www.youtube.com/embed/${snippet.resourceId.videoId}`,
					title: snippet.title,
					desc: snippet.description
				}))

			res.send(videos)
	})
})

app.listen(80, function () {
	console.log('app listening on port 80!')
})
