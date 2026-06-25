const GameManager = require("./game/GameManager");
const ChatManager = require("./game/ChatManager");

function registerSocketHandlers(io) {
  const gameManager = new GameManager(io);
  const chatManager = new ChatManager();

  io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    console.log("User connected:", socket.id);

    io.to(socket.id).emit("send-user-data", {});

    // ──────────── Player Registration ────────────

    socket.on("recieve-user-data", ({ username, avatar }) => {
      console.log(`Player "${username}" joined with id ${socket.id}`);
      gameManager.addPlayer(socket.id, username, avatar);
    });

    // ──────────── Drawing ────────────

    socket.on("sending", (data) => {
      // Broadcast canvas data to all other clients
      socket.broadcast.emit("receiving", data);
    });

    // ──────────── Chat & Guessing ────────────

    socket.on("sending-chat", (inputMessage) => {
      const userId = socket.client.sockets.keys().next().value;
      console.log("Chat received from", userId, ":", inputMessage);

      const players = gameManager.getPlayers();
      const player = players.find((p) => p.id === userId);
      if (!player) return;

      const currentWord = gameManager.getCurrentWord();
      const { rightGuess, returnObject } = chatManager.processMessage(
        inputMessage,
        player,
        currentWord
      );

      // Attach updated players list to the response
      returnObject.players = gameManager.getPlayers();

      io.emit("recieve-chat", returnObject);

      if (rightGuess) {
        gameManager.recordCorrectGuess(userId);
      }
    });

    // ──────────── Word Selection ────────────

    socket.on("word-select", (word) => {
      gameManager.startDraw(word);
    });

    // ──────────── Disconnect ────────────

    socket.on("disconnect", (reason) => {
      console.log("Disconnect reason:", reason);
      console.log("User disconnected:", socket.id);

      gameManager.removePlayer(socket.id);
      io.to(socket.id).emit("user-disconnected", {});
    });
  });
}

module.exports = registerSocketHandlers;
