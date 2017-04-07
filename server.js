require('es6-promise').polyfill()
require('isomorphic-fetch')

const express = require('express')
const app = express()

const googleApiUrl = 'https://www.googleapis.com/youtube/v3/search'
const apiKey = process.env.GOOGLE_API_KEY
const youtubeVideoParams = `key=${apiKey}&channelId=UCOHAJNSpYjS9_Hdho3LS7Fw&part=id,snippet&order=date&maxResults=20`

app.get('/video/list', function (req, res) {
  fetch(`${googleApiUrl}?${youtubeVideoParams}`)
  	.then(response => {
  		return response.json()
  	})
  	.then(response => {
  		const videos = response.items
  			.filter(({ id }) => id.kind === "youtube#video")
  			.map(({ id, snippet }) => ({
  				id: id.videoId,
  				title: snippet.title,
  				description: snippet.description
  			}))

  		res.send(videos)
  	})
})

app.listen(80, function () {
  console.log('app listening on port 80!')
})
