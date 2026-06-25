// Game configuration constants
const TURN_DURATION = 60000; // 60 seconds per turn
const POINTS_FOR_GUESS = 100; // Points awarded to a correct guesser
const POINTS_FOR_DRAWER = 50; // Points awarded to the drawer per correct guesser
const MAX_ROUNDS = 3; // Number of rounds before the game ends
const MIN_PLAYERS = 2; // Minimum players needed to start a game

module.exports = {
  TURN_DURATION,
  POINTS_FOR_GUESS,
  POINTS_FOR_DRAWER,
  MAX_ROUNDS,
  MIN_PLAYERS,
};
