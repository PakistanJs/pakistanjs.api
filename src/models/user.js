const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = mongoose.model('User', {
  name: String,
  username: String,
  email: String,
  location: String,
  id: Number,
  avatarUrl: String,
  company: String,
  accessToken: String,
  isAdmin: { type: Boolean, default: false }
})

async function saveUser(user) {
  const savedUser = await new User(user).save()

  return {
    name: savedUser.name,
    username: savedUser.username,
    email: savedUser.email,
    location: savedUser.location,
    avatarUrl: savedUser.avatarUrl,
    company: savedUser.company,
    isAdmin: savedUser.isAdmin
  }
}

async function getUser(email) {
  try {
    return await User.findOne({ email: email }, 'name username email location avatarUrl company isAdmin')
  } catch(e) {
    console.log(e)
  }
}

export default {
  saveUser,
  getUser
}
