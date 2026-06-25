import React from "react";
import "./HowToPlay.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faXmark } from "@fortawesome/free-solid-svg-icons";

const HowToPlay = ({ onClose }) => {
  return (
    <div className="main-container-how">
      <header className="home-header">
        <FontAwesomeIcon icon={faQuestionCircle} className="icon" />
        <h1 className="how-h1">How to Play</h1>
        <FontAwesomeIcon
          icon={faXmark}
          className="icon"
          id="icon-cross"
          onClick={onClose}
        />
      </header>
      <div className="rules-content">
        <div className="rule-section">
          <h3 className="rule-title">🎮 Getting Started</h3>
          <ul className="rule-list">
            <li>Enter your name and pick an avatar on the home screen.</li>
            <li>At least <strong>2 players</strong> are needed to start a game.</li>
            <li>The game starts automatically when enough players join.</li>
          </ul>
        </div>

        <div className="rule-section">
          <h3 className="rule-title">🎨 Drawing</h3>
          <ul className="rule-list">
            <li>Each round, one player becomes the <strong>drawer</strong>.</li>
            <li>The drawer picks one word from three choices.</li>
            <li>Use the color palette, brush, eraser, and fill tools to draw.</li>
            <li>You have <strong>60 seconds</strong> to draw your word.</li>
          </ul>
        </div>

        <div className="rule-section">
          <h3 className="rule-title">🤔 Guessing</h3>
          <ul className="rule-list">
            <li>Other players type guesses in the chat box.</li>
            <li>Dashes at the top show how many letters the word has.</li>
            <li>You get <strong>unlimited guesses</strong> — keep trying!</li>
            <li>Correct guesses turn <span style={{color: '#38ef7d', fontWeight: 'bold'}}>green</span> in the chat.</li>
          </ul>
        </div>

        <div className="rule-section">
          <h3 className="rule-title">⭐ Scoring</h3>
          <ul className="rule-list">
            <li>Guessers earn <strong>100 points</strong> for each correct guess.</li>
            <li>The drawer earns <strong>50 points</strong> per player who guesses correctly.</li>
            <li>If everyone guesses right, the turn ends early.</li>
          </ul>
        </div>

        <div className="rule-section">
          <h3 className="rule-title">🏆 Winning</h3>
          <ul className="rule-list">
            <li>The game lasts <strong>3 rounds</strong>. Every player draws once per round.</li>
            <li>The player with the most points at the end wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;
