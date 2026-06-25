const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const dotenv = require("dotenv");
const registerSocketHandlers = require("./socketHandler");

// ──────────── Config ────────────

dotenv.config({ path: "../.env" });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {},
});

// ──────────── Middleware ────────────

app.use(cors());
app.use(express.json());

// ──────────── Deployment ────────────

const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "./frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Doodle API is running successfully");
  });
}

// ──────────── Socket.IO ────────────

registerSocketHandlers(io);

// ──────────── Start Server ────────────

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Doodle server listening on port ${port}`);
});
