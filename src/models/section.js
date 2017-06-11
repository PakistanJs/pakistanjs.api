import mongoose from 'mongoose'
const Schema = mongoose.Schema

import { createFromDefaultSchema, createURIFrom } from './defaults'

const SectionSchema = createFromDefaultSchema({
  name: String,
  uri: { type: String, unique: true },
  desc: String,
  topics: [{
    type: Schema.Types.ObjectId,
    ref: 'Topic'
  }]
})

SectionSchema.pre('save', function (next) {
  this.uri = createURIFrom(this.name, 'section_')
  next()
})

const Section = mongoose.model('Section', SectionSchema)

async function saveSection(obj) {
  return await Section(obj).save()
}

async function getSection(uri) {
  try {
    return await Section.findOne({ uri: uri }).populate('sections').populate('topics')
  } catch(e) {
    console.log(e)
  }
}

async function updateSection(uri, section) {
  try {
    return await Section
      .findOneAndUpdate({ uri: uri }, section, { new: true })
      .populate('topics')
  } catch (e) {
    console.log (e)
  }
}


export default {
  saveSection,
  getSection,
  updateSection
}
