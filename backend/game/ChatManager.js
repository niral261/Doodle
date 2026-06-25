class ChatManager {
  constructor() {
    this.chatHistory = [];
  }

  processMessage(message, player, currentWord) {
    let rightGuess = false;

    if (
      currentWord &&
      message &&
      message.toLowerCase() === currentWord.toLowerCase()
    ) {
      rightGuess = true;
      this.chatHistory.push(`${player.id} guessed the right word`);
    } else {
      this.chatHistory.push(message);
    }

    const returnObject = {
      msg: message,
      player: player,
      rightGuess: rightGuess,
    };

    return { rightGuess, returnObject };
  }

  clearHistory() {
    this.chatHistory = [];
  }

  getHistory() {
    return this.chatHistory;
  }
}

module.exports = ChatManager;
