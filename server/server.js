import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import { Server } from "socket.io";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

//Creating express app and HTTP server
const app = express();
const server = http.createServer(app);

//Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

//Store online users
export const usersSocketMap = {}; //{userId:socketId}

//Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);

  if (userId) usersSocketMap[userId] = socket.id;

  //Emit online users to all connected client
  io.emit("getOnlineUsers", Object.keys(usersSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
    delete usersSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(usersSocketMap));
  });
});

//Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

//Routes setup
app.use("/api/status", (req, res) => {
  res.send("Server is live...");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//Connect to mongodb database;
await connectDB();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log("Server is running on PORT: " + PORT);
  });
}

//Export server for vercel
export default server;
