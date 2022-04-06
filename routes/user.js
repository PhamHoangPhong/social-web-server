const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const multer = require("multer");

//router get all user
router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find({}, ["-password", "-refreshToken"]);
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});
// router get one user
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params.id });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found or deleted" });
    const { password, refreshToken, ...other } = user._doc;
    return res
      .status(200)
      .json({ success: true, message: "Get user successfully!", other });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route get user followers
router.get("/followers/:id", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.id);
    const userFollowers = await Promise.all(
      currentUser.followers.map((item) => {
        return User.findById(item, ["-password", "-refreshToken"]);
      })
    );
    if (userFollowers.length === 0) {
      return res
        .status(200)
        .json({
          success: true,
          message: "Bạn chưa có ai theo dõi",
          userFollowers,
        });
    }
    return res.status(200).json({ success: true, userFollowers });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route get user followings
router.get("/followings/:id", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.id);
    const userFollowings = await Promise.all(
      currentUser.following.map((item) => {
        return User.findById(item, ["-password", "-refreshToken"]);
      })
    );
    return res.status(200).json({ success: true, userFollowings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route get user unfollowings
router.get("/unfollowings/users", verifyToken, async (req, res) => {
  try {
    const users = await User.find({}, ["-password", "-refreshToken"]);
    const currentUser = await User.findById(req.userId);
    const userUnfollowings = await Promise.all(
      users.filter((user) => !currentUser.following.includes(user._id))
    );
    return res.status(200).json({ success: true, userUnfollowings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//router update information user

router.put("/:id", verifyToken, async (req, res) => {
  try {
    if (req.userId === req.params.id) {
      const userUpdate = await User.findByIdAndUpdate(
        req.userId,
        { $set: req.body },
        {
          new: true,
        }
      ).select("-password");
      if (!userUpdate)
        return res
          .status(400)
          .json({ success: false, message: "User not found or deleted" });
      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công!", userUpdate });
    } else
      return res.status(400).json({ success: false, message: "id not match" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//update password
router.put("/forgot/:id", verifyToken, async (req, res) => {
  const { password } = req.body;
  if (!password)
    return res
      .status(400)
      .json({ success: false, message: "Missing password" });
  try {
    if (req.params.id === req.userId) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
      res
        .status(200)
        .json({ success: true, message: "Update password successfully!" });
    } else
      return res.status(400).json({ success: false, message: "Id not match" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//delete router
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.userId === req.params.id) {
      await User.findOneAndRemove({ _id: req.userId });
      return res
        .status(200)
        .json({ success: true, message: "Delete successfully" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//search router
router.get("/search/username", verifyToken, async (req, res) => {
  const searchText = req.query.name
  if (!searchText)
    return res.status(200).json({success: true, users: []})
  try {
    //let regex = new RegExp(req.query.name, "i");
    const users = await User.find({
      username: { $regex: searchText, $options: "$i" },
    }).select("-password -refreshToken");
    if (users.length === 0)
      return res.json({ success: false, message: "User not found" });
    return res
      .status(200)
      .json({ success: true, message: "successfully!", users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//route follow user
router.put("/:id/follow", verifyToken, async (req, res) => {
  if (req.params.id !== req.userId) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.userId);
      if (!user.followers.includes(req.userId)) {
        await user.updateOne({ $push: { followers: req.userId } });
        await currentUser.updateOne({ $push: { following: req.params.id } });
        res
          .status(200)
          .json({ success: true, message: "user has been followed" });
      } else return res.status(403).json("you already follow this user");
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server" });
    }
  } else
    return res
      .status(403)
      .json({ success: false, message: "You can't follow yourself" });
});

//router unfollow user
router.put("/:id/unfollow", verifyToken, async (req, res) => {
  if (req.params.id !== req.userId) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.userId);
      if (user.followers.includes(req.userId)) {
        await user.updateOne({ $pull: { followers: req.userId } });
        await currentUser.updateOne({ $pull: { following: req.params.id } });
        res
          .status(200)
          .json({ success: true, message: "user has been unfollowed" });
      } else return res.status(403).json("you don't follow this user");
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server" });
    }
  } else
    return res
      .status(403)
      .json({ success: false, message: "You can't unfollow yourself" });
});

//upload image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/profile");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });
router.post(
  "/upload/profile",
  verifyToken,
  upload.single("file"),
  (req, res) => {
    try {
      return res.status(200).json("file uploaded successfully!");
    } catch (error) {
      return res.status(400).json(error);
    }
  }
);

module.exports = router;
