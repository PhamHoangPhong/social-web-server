const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const Message = require("../models/Message");

//send message
router.post("/", verifyToken, async (req, res) => {
  const { conversationId, text } = req.body;
  try {
    const newMessage = new Message({
      conversationId,
      text,
      sender: req.userId,
    });
    await newMessage.save();
    const message = await Message.findById(newMessage._id).populate("sender", [
      "profilePicture",
    ]);
    return res.status(200).json({ success: true, message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//get message in conversation
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.id,
    })
      .sort("createdAt")
      .populate("sender", ["profilePicture"]);
    return res.status(200).json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

module.exports = router;
