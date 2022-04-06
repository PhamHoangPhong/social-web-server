const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const helmet = require("helmet");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const conversation = require("./routes/conversation")
const message = require("./routes/message")
const cors = require('cors');
const path = require("path");
const app = express();
const server = require('http').createServer(app)
const io = require("socket.io")(server, {cors: {origin: "*"}})
require('dotenv').config()


mongoose.connect(
  `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@social.vptl3.mongodb.net/social?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => console.log("mongo connected")
);

app.use("/images", express.static(path.join(__dirname, "public/images")))

//middleware
app.use(cors())
app.use(express.json());
app.use(helmet());
app.use(morgan("tiny"));


app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/conversation", conversation);
app.use("/api/message", message);

const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log("server running in port 8080");
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
    users = users.filter(user => user.socketId !== socketId)
}

const getUser = (receiverId) => {
    return users.find(user => user.userId === receiverId)
}

io.on("connection", (socket) => {
  //when connect
  //take userId and socketId from client
  socket.on("addUser", (userId) => {
      addUser(userId, socket.id)
      io.emit("getUsers", users)
  });
  //send and get message
  socket.on("sendMessage", ({message, receiverId}) => {
    const user = getUser(receiverId)
    user && io.to(user.socketId).emit("getMessage", message)
  })

  //send notification
  socket.on("sendNotification", ({notification, receiverId}) => {
    const user = getUser(receiverId)
    user && io.to(user.socketId).emit("getNotification", {notification, receiverId})
  })

  //when disconnect
  socket.on("disconnect", () => {
      removeUser(socket.id)
      io.emit("getUsers", users)
  })
});