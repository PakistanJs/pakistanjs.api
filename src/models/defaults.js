import mongoose from 'mongoose'
const Schema = mongoose.Schema

export function createFromDefaultSchema(schema) {
	return new Schema({
		...schema,
		dateCreated: Date,
		dateModified: Date,
		createdBy: Schema.Types.ObjectId,
		lastModifiedBy: Schema.Types.ObjectId
	})
}

export function createURIFrom(prop, prefix) {
	const uriFromProp = prop.replace(/\s/gi, '_').toLowerCase()
	return `${prefix}${uriFromProp}`
}
