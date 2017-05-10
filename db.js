const mongoose = require('mongoose')
const Schema = mongoose.Schema
mongoose.connect('mongodb://128.199.105.140:27017/test')

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


export const saveUser = (user) => {
  return new Promise((resolve, reject) => {
    new User(user).save(err => {
      if (err) {
        reject(err)
      } else {
        resolve(user)
      }
    })
  })
}

export const updateUser = (user) => {
  return new Promise((resolve, reject) => {
    User.update({ email: user.email }, { $set: user }, (err, user) => {
      if (err) {
        reject(err)
      } else {
        resolve(user)
      }
    })
  })
}

export const getUser = (email) => {
  return new Promise((resolve, reject) => {
    User.findOne({ email: email }, (err, user) => {
      if (err) {
        reject(err)
      } else {
        resolve(user)
      }
    })
  })
}
