const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    desc: {
      type: String,
    },
    photoUrl: {
      type: Array,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    likes: {
      type: Array,
      default: [],
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment",
      },
    ],
    shares: {
      type: Array,
      default: [],
    },
    postShare: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("posts", PostSchema);
