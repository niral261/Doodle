const {
  TURN_DURATION,
  POINTS_FOR_GUESS,
  POINTS_FOR_DRAWER,
  MAX_ROUNDS,
  MIN_PLAYERS,
} = require("./constants");


class GameManager {
  constructor(io) {
    this.io = io;
    this.players = [];
    this.word = null;
    this.drawerIndex = 0;
    this.round = 0;
    this.timeout = null;
    this.playerGuessedRightWord = [];
    this.gameActive = false;
  }

  // ──────────── Player Management ────────────

  addPlayer(socketId, username, avatar) {
    const newPlayer = {
      id: socketId,
      name: username,
      points: 0,
      avatar: avatar,
    };
    this.players.push(newPlayer);
    console.log("Players:", this.players.map((p) => p.name));
    this.io.emit("updated-players", this.players);
    this.io.emit("player-count", this.players.length);


    if (this.players.length === MIN_PLAYERS && !this.gameActive) {
      this.startGame();
    }

    if (this.players.length > MIN_PLAYERS && this.gameActive) {
      this.io.emit("game-already-started", {});
    }

    return newPlayer;
  }

  removePlayer(socketId) {
    const index = this.players.findIndex((p) => p.id === socketId);
    if (index > -1) {
      const removed = this.players.splice(index, 1)[0];
      console.log(`Player "${removed.name}" disconnected`);
    }
    this.io.emit("updated-players", this.players);
    this.io.emit("player-count", this.players.length);

    if (this.players.length < MIN_PLAYERS) {
      this.stopGame();
    }
  }

  getPlayers() {
    return this.players;
  }

  getDrawer() {
    return this.players[this.drawerIndex] || null;
  }

  // ──────────── Game Lifecycle ────────────

  startGame() {
    console.log("Game started");
    this.gameActive = true;
    this.round = 1;
    this.drawerIndex = 0;

    this.players.forEach((p) => (p.points = 0));
    this.io.emit("updated-players", this.players);

    this.io.emit("game-start", {});
    this.io.emit("round-update", { current: this.round, total: MAX_ROUNDS });
    this.startTurn();
  }

  stopGame() {
    console.log("Game stopped");
    this.gameActive = false;
    this.round = 0;
    this.drawerIndex = 0;
    this.playerGuessedRightWord = [];

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.io.emit("game-stop", {});
  }


  endGame() {
    console.log("Game over — all rounds complete");
    this.gameActive = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const sortedPlayers = [...this.players].sort(
      (a, b) => b.points - a.points
    );
    this.io.emit("game-over", { standings: sortedPlayers });
  }

  // ──────────── Turn Lifecycle ────────────

  startTurn() {
    if (!this.gameActive) return;

    if (this.drawerIndex >= this.players.length) {
      this.drawerIndex = 0;
      this.round++;
      this.io.emit("round-update", {
        current: this.round,
        total: MAX_ROUNDS,
      });

      if (this.round > MAX_ROUNDS) {
        this.endGame();
        return;
      }
    }

    const drawer = this.getDrawer();
    if (!drawer) return;

    this.io.emit("start-turn", drawer);
  }

  startDraw(selectedWord) {
    this.word = selectedWord;
    const drawer = this.getDrawer();
    if (!drawer) return;

    this.io.emit("word-len", selectedWord.length);
    this.io.emit("start-draw", drawer);

    this.timeout = setTimeout(() => {
      this.endTurn();
    }, TURN_DURATION);
  }

  endTurn() {
    if (!this.gameActive) return;

    const drawer = this.getDrawer();

    if (drawer && this.playerGuessedRightWord.length > 0) {
      const drawerPlayer = this.players.find((p) => p.id === drawer.id);
      if (drawerPlayer) {
        drawerPlayer.points +=
          POINTS_FOR_DRAWER * this.playerGuessedRightWord.length;
      }
    }

    this.io.emit("end-turn", drawer);
    this.io.emit("updated-players", this.players);

    this.playerGuessedRightWord = [];
    this.word = null;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.drawerIndex = (this.drawerIndex + 1) % this.players.length;

    setTimeout(() => {
      this.startTurn();
    }, 1500);
  }

  // ──────────── Guess Handling ────────────


  recordCorrectGuess(socketId) {
    const alreadyGuessed = this.playerGuessedRightWord.includes(socketId);
    if (alreadyGuessed) return false;

    const player = this.players.find((p) => p.id === socketId);
    if (player) {
      player.points += POINTS_FOR_GUESS;
    }

    this.playerGuessedRightWord.push(socketId);

    const allGuessed = this.playerGuessedRightWord.length === this.players.length - 1;

    if (allGuessed) {
      this.io.emit("all-guessed-correct", {});
      this.endTurn();
    }

    return allGuessed;
  }

  getCurrentWord() {
    return this.word;
  }

  isGameActive() {
    return this.gameActive;
  }
}

module.exports = GameManager;
