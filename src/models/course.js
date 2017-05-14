import mongoose from 'mongoose'
const Schema = mongoose.Schema

import { createFromDefaultSchema, createURIFrom } from './defaults'

const CourseSchema = createFromDefaultSchema({
  name: { type: String, required: true, unique: true},
  uri: { type: String, unique: true},
  desc: String,
  thumb: String,
  sections: [Schema.Types.ObjectId]
})

CourseSchema.pre('save', function (next) {
  this.uri = createURIFrom(this.name, 'course_', 20, '')
  next()
})

const Course = mongoose.model('Course', CourseSchema)

async function saveCourse(obj) {
  return await Course(obj).save()
}

async function getCourse(uri) {
  try {
    return await Course.findOne({ uri: uri }, '-_id name uri desc thumb sections')
  } catch(e) {
    console.log(e)
  }
}

async function getCourses() {
  try {
    return await Course.find({}, '-_id name uri desc thumb sections')
  } catch(e) {
    console.log(e)
  }
}

export default {
  saveCourse,
  getCourse,
  getCourses
}
