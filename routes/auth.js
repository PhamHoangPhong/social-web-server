const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken");
//register rout

router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  console.log(username, password, email);
  if (!username || !password || !email)
    return res.status(400).json({
      success: false,
      message: "Missing username, email or password!",
    });
  try {
    const emailCondition = await User.findOne({ email });
    if (emailCondition)
      return res.status(400).json({
        success: false,
        message: "Username or email have already taken!",
      });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
    });
    await newUser.save();

    //create access token
    const tokens = genarateToken(newUser._id);
    return res.json({
      success: true,
      message: "Register successfully!",
      tokens,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      success: false,
      message: "Missing email or password!",
    });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Email incorrectly!",
      });
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (passwordCompare === false)
      return res.status(400).json({
        success: false,
        message: "Password incorrectly!",
      });

    //create access token
    const tokens = genarateToken(user._id);
    updateRefreshToken(user._id, tokens.refreshToken);
    res.json({ success: true, message: "Login successfully", tokens });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//logout route
router.post("/logout", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { refreshToken: "" });
    res.status(200).json({ success: true, message: "logout successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//load user route
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user)
      return (
        res.status(400), json({ success: false, message: "user not found" })
      );
    res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server" });
  }
});

//handle refresh token
router.post("/token", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(403);
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const tokens = genarateToken(decoded.userId);
    updateRefreshToken(decoded.userId, tokens.refreshToken);
    return res.status(200).json({ success: true, tokens });
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "refreshToken not verify" });
  }
});

const genarateToken = (userId) => {
  const accessToken = jwt.sign(
    { userId: userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
  const refreshToken = jwt.sign(
    { userId: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "2h" }
  );
  return { accessToken, refreshToken };
};

const updateRefreshToken = async (userId, refreshToken) => {
  try {
    await User.findByIdAndUpdate(userId, { refreshToken });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal servers" });
  }
};
module.exports = router;
