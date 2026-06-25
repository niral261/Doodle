import React from "react";

function RoundIndicator({ current, total }) {
  if (!current || !total) return null;

  const progress = (current / total) * 100;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "6px 16px",
        background: "rgba(0, 0, 0, 0.5)",
        borderRadius: "20px",
        backdropFilter: "blur(8px)",
        color: "#fff",
        fontFamily: "'Comic Sans MS', 'Segoe UI', sans-serif",
        fontWeight: "bold",
        fontSize: "14px",
        minWidth: "160px",
      }}
    >
      <span>🎯 Round {current} of {total}</span>
      <div
        style={{
          flex: 1,
          height: "6px",
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: "3px",
          overflow: "hidden",
          minWidth: "50px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #38ef7d, #11998e)",
            borderRadius: "3px",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export default RoundIndicator;
