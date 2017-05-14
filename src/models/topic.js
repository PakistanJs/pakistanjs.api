import mongoose from 'mongoose'
const Schema = mongoose.Schema
import { createFromDefaultSchema, createURIFrom } from './defaults'

const TopicSchema = createFromDefaultSchema({
  title: { type: String, required: true},
  uri: { type: String, unique: true},
  videoId: { type: String, required: true, unique: true},
  videoUrl: { type: String, required: true },
  desc: String,
  jsbin: String,
  references: [String],
  script: String
})


TopicSchema.pre('save', function (next) {
  this.uri = createURIFrom(this.title, 'topic_', 20, `_${this.videoId}`)
  next()
})

const Topic = mongoose.model('Topic', TopicSchema)

async function saveTopic(obj) {
  try {
    return await Topic(obj).save()
  } catch(e) {
    console.log(e)
  }
}

async function getTopic(uri) {
  try {
    return await Topic.findOne({ uri: uri })
  } catch(e) {
    console.log(e)
  }
}

async function getTopics() {
  try {
    return await Topic.find({})
  } catch(e) {
    console.log(e)
  }
}

async function insertTopics(topics) {
  try {
    topics.forEach(saveTopic)
  } catch(e) {
    console.log(e)
  }
}

export default {
  saveTopic,
  getTopic,
  getTopics,
  insertTopics
}
