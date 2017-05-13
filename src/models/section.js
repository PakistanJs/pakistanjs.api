import mongoose from 'mongoose'
const Schema = mongoose.Schema

import { createFromDefaultSchema, createURIFrom } from './defaults'

const SectionSchema = createFromDefaultSchema({
  name: String,
  uri: { type: String, unique: true},
  desc: String,
  topics: [Schema.Types.ObjectId]
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
    return await Section.findOne({ uri: uri })
  } catch(e) {
    console.log(e)
  }
}

export default {
  saveSection,
  getSection
}
