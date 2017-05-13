const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = mongoose.model('User', {
  name: String,
  username: String,
  email: String,
  location: String,
  id: Number,
  avatar_url: String,
  company: String,
  access_token: String
})

async function saveUser(user) {
  return await new User(user).save()
}

async function getUser(email) {
  try {
    return await User.findOne({ email: email }, 'name username email location avatar_url company')
  } catch(e) {
    console.log(e)
  }
}

export default {
  saveUser,
  getUser
}
