const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationsSchema = new Schema(
  {
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("conversations", ConversationsSchema);
