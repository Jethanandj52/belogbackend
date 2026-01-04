const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { connectToDB } = require("../src/config/database");

// Routes
const authRoute = require("../src/routes/authRoutes");
const blogRoute = require("../src/routes/blogRoutes");
const categoryRoute = require("../src/routes/categoryRoutes");
const guestPostRoute = require("../src/routes/guestPostRoutes");

dotenv.config();
const app = express();
const server = http.createServer(app);

// ==========================
// Socket.IO
// ==========================
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "https://task-hive-entrovex.vercel.app"],
    credentials: true
  }
});

const onlineUsers = new Map();

io.on("connection", socket => {
  console.log("Socket connected:", socket.id);

  socket.on("register", userId => onlineUsers.set(userId, socket.id));

  socket.on("call-user", ({ toUserId, offer, callType }) => {
    const targetSocket = onlineUsers.get(toUserId);
    if (targetSocket) io.to(targetSocket).emit("incoming-call", { from: socket.id, offer, callType });
  });

  socket.on("accept-call", ({ toSocketId, answer }) => {
    io.to(toSocketId).emit("call-accepted", { answer });
  });

  socket.on("end-call", ({ toSocketId }) => {
    io.to(toSocketId).emit("call-ended");
  });

  socket.on("disconnect", () => {
    for (const [key, value] of onlineUsers.entries()) {
      if (value === socket.id) onlineUsers.delete(key);
    }
  });
});

// ==========================
// Middlewares
// ==========================
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "https://belog-frontend.vercel.app"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ==========================
// DB Connection
// ==========================
connectToDB().catch(console.error);

// ==========================
// Routes
// ==========================
app.use("/auth", authRoute);
app.use("/blogs", blogRoute);
app.use("/categories", categoryRoute);
app.use("/guest-posts", guestPostRoute);

// ==========================
// Root
// ==========================
app.get("/", (req, res) => res.json({ message: "Server running with Socket.IO and Blogging API" }));

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

module.exports = app;
module.exports.config = { runtime: 'nodejs18' };
