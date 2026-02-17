const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`${socket.id} user just connected`);

    //Join Room
    socket.on("join_room", ({myId, otherUserId}) => {
        const roomName = [myId, otherUserId].sort().join("-");

    socket.join(roomName);

    console.log(`User ${myId} joined room: ${roomName}`);

    socket.emit("room_joined", { roomId: roomName });
  });

  //Send Message
  socket.on("send_message", (data) => {
      const {roomId, message, senderId, senderName } = data;

    socket.on("disconnect", () => {
        console.log(`User Dissconnected: ${socket.id}`);
    })
})
})
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
    
})
