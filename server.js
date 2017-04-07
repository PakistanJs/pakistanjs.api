require('es6-promise').polyfill()
require('isomorphic-fetch')

var express = require('express')
var app = express()

app.get('/video/list', function (req, res) {
  fetch('https://www.googleapis.com/youtube/v3/search?key=AIzaSyBqWHIRiPvMUp_74kvl29fT28BdOkByKl4&channelId=UCOHAJNSpYjS9_Hdho3LS7Fw&part=id,snippet&order=date&maxResults=20')
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
