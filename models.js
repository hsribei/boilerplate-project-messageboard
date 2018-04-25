require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);

const Schema = mongoose.Schema;

const replySchema = new Schema(
  {
    thread_id: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: "created_on" }
  }
);

const Reply = mongoose.model("Reply", replySchema);

const threadSchema = new Schema(
  {
    board: { type: String, required: true },
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false },
    replies: [replySchema]
  },
  {
    timestamps: { createdAt: "created_on", updatedAt: "bumped_on" }
  }
);

const Thread = mongoose.model("Thread", threadSchema);

module.exports = { Thread, Reply };
