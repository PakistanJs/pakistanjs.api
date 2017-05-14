import mongoose from 'mongoose'
const Schema = mongoose.Schema

import { createFromDefaultSchema, createURIFrom } from './defaults'

const CourseSchema = createFromDefaultSchema({
  name: { type: String, required: true, unique: true},
  uri: { type: String, unique: true},
  desc: String,
  thumb: String,
  sections: [{
    type: Schema.Types.ObjectId,
    ref: 'Section'
  }]
})

CourseSchema.pre('save', function (next) {
  this.uri = createURIFrom(this.name, 'course_', 20, '')
  next()
})

const Course = mongoose.model('Course', CourseSchema)

async function saveCourse(obj) {
  try {
    return await new Course(obj).save()
  } catch (e) {
    console.log (e)
  }
}

async function updateCourse(uri, course) {
  try {
    return await Course
      .findOneAndUpdate({ uri: uri }, course, { new: true })
      .populate('sections')
  } catch (e) {
    console.log (e)
  }
}

async function getCourse(uri) {
  try {
    return await Course
      .findOne({ uri: uri }, '-_id name uri desc thumb sections')
      .populate('sections')
  } catch(e) {
    console.log(e)
  }
}

async function getCourses() {
  try {
    return await Course
      .find({}, '-_id name uri desc thumb sections')
      .populate('sections')
  } catch(e) {
    console.log(e)
  }
}

export default {
  saveCourse,
  updateCourse,
  getCourse,
  getCourses
}
