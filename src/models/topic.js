import mongoose from 'mongoose'
const Schema = mongoose.Schema
import { createFromDefaultSchema, createURIFrom } from './defaults'

const TopicSchema = createFromDefaultSchema({
  name: String,
  uri: { type: String, unique: true},
  desc: String,
  jsbin: String,
  references: [String],
  script: String
})


TopicSchema.pre('save', function (next) {
  this.uri = createURIFrom(this.name, 'topic_')
  next()
})

const Topic = mongoose.model('Topic', TopicSchema)

async function saveTopic(obj) {
  return await Topic(obj).save()
}

async function getTopic(uri) {
  try {
    return await Topic.findOne({ uri: uri })
  } catch(e) {
    console.log(e)
  }
}

export default {
  saveTopic,
  getTopic
}
