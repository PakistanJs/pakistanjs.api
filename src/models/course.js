import mongoose from 'mongoose'
const Schema = mongoose.Schema

import { createFromDefaultSchema, createURIFrom } from './defaults'

const CourseSchema = createFromDefaultSchema({
  name: String,
  uri: { type: String, unique: true},
  desc: String,
  thumb: String,
  sections: [Schema.Types.ObjectId]
})

CourseSchema.pre('save', function (next) {
  this.uri = createURIFrom(this.name, 'course_')
  next()
})

const Course = mongoose.model('Course', CourseSchema)

async function saveCourse(obj) {
  return await Course(obj).save()
}

async function getCourse(uri) {
  try {
    return await Course.findOne({ uri: uri })
  } catch(e) {
    console.log(e)
  }
}

export default {
  saveCourse,
  getCourse
}
