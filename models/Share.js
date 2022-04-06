const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ShareSchema = new Schema({
    desc: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'posts'
    }
})

module.exports = mongoose.model("shares", ShareSchema)