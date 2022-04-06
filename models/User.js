const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
    followers: {
      type: Array,
      default: [],
    },
    following: {
      type: Array,
      default: [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    desc: {
      type: String,
      max: 50
    },
    homeTown: {
      type: String,
      max: 50
    },
    relationship: {
      type: Number,
      enum: [1,2,3]
    },
    refreshToken: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("users", UserSchema);
