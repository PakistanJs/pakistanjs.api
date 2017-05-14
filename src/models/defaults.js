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

export function createURIFrom(prop, prefix, limit, suffix) {
	const uriFromProp = prop.replace(/[^\w]+/gi, '_').toLowerCase()
	return `${prefix}${uriFromProp.substr(0, limit)}${suffix}`
}
