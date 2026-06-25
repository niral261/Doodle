import React from "react";
import "./GameOverOverlay.css";

function GameOverOverlay({ standings, currentSocketId, onBackToLobby }) {
  if (!standings || standings.length === 0) return null;

  const getRankClass = (index) => {
    if (index === 0) return "rank-1";
    if (index === 1) return "rank-2";
    if (index === 2) return "rank-3";
    return "rank-other";
  };

  const getBadgeClass = (index) => {
    if (index === 0) return "badge-1";
    if (index === 1) return "badge-2";
    if (index === 2) return "badge-3";
    return "badge-other";
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <h1 className="game-over-title">
          🏆 Game Over!
        </h1>
        <p className="game-over-subtitle">Final Standings</p>

        <ul className="standings-list">
          {standings.map((player, index) => (
            <li
              key={player.id}
              className={`standing-item ${getRankClass(index)}`}
            >
              <div className={`rank-badge ${getBadgeClass(index)}`}>
                {index + 1}
              </div>
              <img
                src={player.avatar}
                alt={player.name}
                className="standing-avatar"
              />
              <div className="standing-info">
                <div className="standing-name">
                  {player.name}
                  {player.id === currentSocketId && (
                    <span className="you-tag">(you)</span>
                  )}
                  {index === 0 && <span className="winner-crown">👑</span>}
                </div>
              </div>
              <div className="standing-points">{player.points} pts</div>
            </li>
          ))}
        </ul>

        <button className="game-over-btn" onClick={onBackToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}

export default GameOverOverlay;
