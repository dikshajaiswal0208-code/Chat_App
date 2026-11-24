// npm init -y, npm i express socket.io
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const httpserver = http.createServer(app);

const io = new Server(httpserver);

// To manage Active user count
let count = 0;

io.on("connection", (socket) => {
  count++;
  console.log("Active User: ", count); // terminal/backend
  io.emit("active", count); // frontend/client

  console.log("Connected Established");

  socket.emit("chat", "Hello from server side");

  // To broadcast a message
  socket.broadcast.emit("join", "New User Joined");

  socket.on("msg", (message) => {
    const text = typeof message === "string" ? message : message && message.text;
    if (typeof text !== "string" || !text.trim()) {
      return;
    }

    const chatMessage = {
      id: message && message.id ? String(message.id) : `${socket.id}-${Date.now()}`,
      text: text.trim().slice(0, 2000),
      username: message && typeof message.username === "string"
        ? message.username.trim().slice(0, 24) || "Guest"
        : "Guest",
      senderId: socket.id,
      timestamp: new Date().toISOString(),
    };

    console.log(chatMessage);
    io.emit("msg", chatMessage);
  });

  // handling disconnect event
  socket.on("disconnect", () => {
    count--;
    console.log("Active User: ", count); // terminal/backend
    io.emit("active", count);
  });

  // For making announcement
  io.emit("announce", "Only 5hr class left");
});

app.use(express.static(path.join(__dirname, "dist")));
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

httpserver.listen(8080, () => {
  console.log("Server started");
});
