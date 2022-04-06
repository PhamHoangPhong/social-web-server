const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const Conversation = require("../models/Conversation");

router.post("/", verifyToken, async (req, res) => {
  const { receiverId } = req.body;
  try {
    const checkNewConversation = await Conversation.findOne({
      members: { $all: [req.userId, receiverId] },
    }).populate("members", [
      "username",
      "profilePicture",
      "email",
      "coverPicture",
      "followers",
      "relationship",
    ]);
    if (checkNewConversation) {
      return res.status(200).json({ success: true, checkNewConversation });
    } else {
      const saveConversation = new Conversation({
        members: [req.userId, receiverId],
      });
      await saveConversation.save();
      const newConversation = await Conversation.findById(
        saveConversation._id
      ).populate("members", [
        "username",
        "profilePicture",
        "email",
        "coverPicture",
        "followers",
        "relationship",
      ]);
      return res.status(200).json({ success: true, newConversation });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.userId] },
    })
      .sort("-createdAt")
      .populate("members", [
        "username",
        "profilePicture",
        "email",
        "coverPicture",
        "followers",
        "relationship",
      ]);
    return res.status(200).json({ success: true, conversations });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

module.exports = router;
