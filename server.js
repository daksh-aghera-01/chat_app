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


    // Join Room
    socket.on("join_room", ({ myId, otherUserId }) => {
        const roomName = [myId, otherUserId].sort().join("-");

        socket.join(roomName);

        console.log(`User ${myId} joined room: ${roomName}`);

        socket.emit("room_joined", { roomId: roomName });
    });

    // Leave Room
    socket.on("leave_room", ({roomName}) => {
        socket.leave(roomName);
        console.log(`User ${socket.id} left Room: ${roomName}`);
    })

    // Send Message
    socket.on("send_message", (data) => {
        const { roomId, message, senderId, senderName } = data;

        console.log(`Message in ${roomId}: ${message}`);
        
        io.to(roomId).emit("receive_message", {
            senderId: senderId,
            senderName: senderName,
            message: message,
            timestamp: new Date().toISOString(),
        });
    });

    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});