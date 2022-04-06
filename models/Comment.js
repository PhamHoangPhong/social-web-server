const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CommentSchema = new Schema({
    text: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts"
    }
}, { timestamps: true })

module.exports = mongoose.model("comment", CommentSchema)