const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");

//route get timeline post
router.get("/", verifyToken, async (req, res) => {
  const { page, size } = req.query;
  const limit = parseInt(size);
  const skip = (page - 1) * size;
  try {
    const currentUser = await User.findById(req.userId);
    const postYourself = await Post.find({ user: req.userId })
      .sort("-createdAt")
      .limit(limit)
      .skip(skip)
      .populate("user", ["username", "profilePicture"])
      .populate("postShare", [
        "username",
        "profilePicture",
        "desc",
        "photoUrl",
        "createdAt",
        "user",
      ])
      .populate({
        path: "postShare",
        populate: { path: "user", select: "username profilePicture" },
      });
    /*const posts = await Post.find({}).populate("user", ["username"]);
    const postsFollowing = posts.filter((post) =>
      currentUser.following.includes(post.user._id)
    ); */
    const postFriend = await Promise.all(
      currentUser.following.map((friendId) => {
        return Post.find({ user: friendId })
          .sort("-createdAt")
          .limit(limit)
          .skip(skip)
          .populate("user", ["username", "profilePicture"])
          .populate("postShare", [
            "username",
            "profilePicture",
            "desc",
            "photoUrl",
            "createdAt",
            "user",
          ])
          .populate({
            path: "postShare",
            populate: { path: "user", select: "username profilePicture" },
          });
      })
    );
    return res.status(200).json({
      success: true,
      message: "Get posts successfully!",
      posts: postYourself.concat(...postFriend),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route get one post
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", ["username", "profilePicture"])
      .populate("postShare", [
        "username",
        "profilePicture",
        "desc",
        "photoUrl",
        "createdAt",
        "user",
      ])
      .populate({
        path: "postShare",
        populate: { path: "user", select: "username profilePicture" },
      });
    return res
      .status(200)
      .json({ success: true, message: "Get posts successfully!", post });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//get post by user
router.get("/user/:id", verifyToken, async (req, res) => {
  const { page, size } = req.query;
  const limit = parseInt(size);
  const skip = (page - 1) * size;
  try {
    const posts = await Post.find({ user: req.params.id })
      .sort("-createdAt")
      .populate("user", ["username", "profilePicture"])
      .populate("postShare", [
        "username",
        "profilePicture",
        "desc",
        "photoUrl",
        "createdAt",
        "user",
      ])
      .limit(limit)
      .skip(skip)
      .populate({
        path: "postShare",
        populate: { path: "user", select: "username profilePicture" },
      });
    return res.status(200).json({
      success: true,
      message: "Get posts successfully!",
      posts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route create post
router.post("/", verifyToken, async (req, res) => {
  const { desc, photoUrl } = req.body;
  try {
    const newPost = new Post({ desc, photoUrl, user: req.userId });
    await newPost.save();
    res
      .status(200)
      .json({ success: true, message: "Create post successfully!", newPost });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//router share post
router.post("/:id/share", verifyToken, async (req, res) => {
  const { desc } = req.body;
  try {
    const postShared = await Post.findById(req.params.id);
    const newShare = new Post({
      desc,
      postShare: req.params.id,
      user: req.userId,
    });
    await newShare.save();
    const sharePost = await Post.findById(newShare._id)
      .populate("user", ["username", "profilePicture"])
      .populate("postShare", [
        "username",
        "profilePicture",
        "desc",
        "photoUrl",
        "createdAt",
        "user",
      ])
      .populate({
        path: "postShare",
        populate: { path: "user", select: "username profilePicture" },
      });
    await postShared.updateOne({ $push: { shares: req.userId } });
    res
      .status(200)
      .json({ success: true, message: "Create post successfully!", sharePost });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route update post
router.put("/:id", verifyToken, async (req, res) => {
  const { desc } = req.body;
  try {
    const updatedPostCondition = { _id: req.params.id, user: req.userId };
    const updatedPost = await Post.findOneAndUpdate(
      updatedPostCondition,
      { desc },
      { new: true }
    )
      .populate("user", ["username", "profilePicture"])
      .populate("postShare", [
        "username",
        "profilePicture",
        "desc",
        "photoUrl",
        "createdAt",
        "user",
      ])
      .populate({
        path: "postShare",
        populate: { path: "user", select: "username profilePicture" },
      });
    if (!updatedPost)
      return res.status(400).json({
        success: false,
        message:
          "You can't update this post because it has been deleted or it's not your",
      });
    res
      .status(200)
      .json({ success: true, message: "Post has been updated!", updatedPost });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route delete post
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deletePostCondition = { _id: req.params.id, user: req.userId };
    const deletedPost = await Post.findOneAndRemove(deletePostCondition);
    if (!deletedPost)
      return res.status(400).json({
        success: false,
        message:
          "You can't delete this post because it has been deleted or it's not your",
      });
    res.status(200).json({ success: true, message: "Post has been deleted!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route like post
router.put("/:id/like", verifyToken, async (req, res) => {
  try {
    const currentPost = await Post.findById(req.params.id);
    if (!currentPost.likes.includes(req.userId)) {
      await currentPost.updateOne({ $push: { likes: req.userId } });
      return res.status(200).json({ success: true, message: "Liked!" });
    } else {
      await currentPost.updateOne({ $pull: { likes: req.userId } });
      return res.status(200).json({ success: false, message: "Disliked!" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route comment post
router.put("/:id/comment", verifyToken, async (req, res) => {
  const { comment } = req.body;
  try {
    const newComment = new Comment({
      text: comment,
      user: req.userId,
      post: req.params.id,
    });
    await newComment.save();
    const post = await Post.findById(req.params.id);
    post.comments.push(newComment._id);
    await post.save();
    const newCommentReturn = await Comment.findById(newComment._id).populate(
      "user",
      ["username", "profilePicture"]
    );
    return res
      .status(200)
      .json({ success: true, message: "done!", newCommentReturn });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});
//router get post's comments
router.get("/:id/comments", verifyToken, async (req, res) => {
  const { page, size } = req.query;
  const limit = parseInt(size);
  const skip = (page - 1) * size;
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort("-createdAt")
      .limit(limit)
      .skip(skip)
      .populate("user", ["username", "profilePicture"]);
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//router upload image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/feed");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });
router.post(
  "/upload/feed",
  verifyToken,
  upload.array("file", 6),
  (req, res) => {
    try {
      return res.status(200).json("file uploaded successfully!");
    } catch (error) {
      return res.status(400).json(error);
    }
  }
);

module.exports = router;
