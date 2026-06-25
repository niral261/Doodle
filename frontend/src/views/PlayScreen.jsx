import React, { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Buffer } from "buffer";
import PlayerCard from "../components/PlayerCard";
import WordBar from "../components/WordBar";
import RoundIndicator from "../components/RoundIndicator";
import Toast from "../components/Toast";
import GameOverOverlay from "../components/GameOverOverlay";
import { wordsArray, getWordsArrayLength } from "../components/Words";
import { useNavigate, useLocation } from "react-router-dom";

function PlayScreen() {
  const canvasRef = useRef(null);
  const [isPainting, setIsPainting] = useState(false);
  const [mousePosition, setMousePosition] = useState(undefined);
  const [color, setColor] = useState("#000000");
  const [startPoint, setStartPoint] = useState(null);
  const [lines, setLines] = useState([]);
  const [straightLineMode, setStraightLineMode] = useState(false);
  const [radius, setRadius] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [context, setContext] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [allChats, setAllChats] = useState([]);
  const [allPlayers, setAllPlayer] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentUserDrawing, setCurrentUserDrawing] = useState(false);
  const [gameStarted, setgameStarted] = useState(false);
  const [playerDrawing, setPlayerDrawing] = useState(null);
  const [showWords, setShowWords] = useState(false);
  const [words, setWords] = useState(["car", "bike", "cycle"]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showClock, setShowClock] = useState(false);
  const [wordLen, setWordLen] = useState(0);
  const [guessedWord, setGuessedWord] = useState(false);

  // ──────────── New state for added features ────────────
  const [roundInfo, setRoundInfo] = useState({ current: 0, total: 0 });
  const [gameOverData, setGameOverData] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [canvasHistory, setCanvasHistory] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const userDataRecieved = location.state || {};
  const ENDPOINT = "https://doodle.onrender.com/";
  const ENDPOINT_LOCAL = "http://localhost:3001/";

  // ──────────── Toast helpers ────────────
  const addToast = useCallback((message, type = "info") => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ──────────── Canvas history for undo ────────────
  const saveCanvasState = useCallback(() => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL("image/png");
      setCanvasHistory((prev) => {
        const newHistory = [...prev, dataURL];
        // Keep last 20 states to avoid memory bloat
        if (newHistory.length > 20) newHistory.shift();
        return newHistory;
      });
    }
  }, []);

  const undoCanvas = useCallback(async () => {
    if (!currentUserDrawing || canvasHistory.length === 0) return;

    const newHistory = [...canvasHistory];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    setCanvasHistory(newHistory);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (previousState) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        socket.emit("sending", dataURL);
      };
      img.src = previousState;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL("image/png");
      socket.emit("sending", dataURL);
    }
  }, [currentUserDrawing, canvasHistory, socket]);

  // ──────────── Socket connection ────────────
  useEffect(() => {
    let us = localStorage.getItem("username");
    if (!us || !userDataRecieved.username || !userDataRecieved.avatar) {
      navigate("/");
      return;
    }
    const newSocket = io.connect(
      process.env.REACT_APP_NODE_ENV === "production"
        ? ENDPOINT
        : ENDPOINT_LOCAL
    );
    setSocket(newSocket);

    window.onbeforeunload = () => {
      localStorage.removeItem("username");
    };
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      localStorage.removeItem("username");
    };
  }, []);

  // ──────────── Player updates ────────────
  useEffect(() => {
    if (socket) {
      socket.on("updated-players", (updatedplayers) => {
        console.log("updated Players", updatedplayers);
        setAllPlayer(updatedplayers);
      });
    }
  }, [socket]);

  // ──────────── Send user data on connect ────────────
  useEffect(() => {
    if (socket) {
      socket.on("send-user-data", () => {
        console.log("sending user data");
        let userdata = {
          username: userDataRecieved.username,
          avatar: userDataRecieved.avatar,
        };
        socket.emit("recieve-user-data", userdata);
      });
    }
  }, [socket]);

  // ──────────── Receive canvas data ────────────
  useEffect(() => {
    if (socket) {
      socket.on("receiving", async (data) => {
        const base64String = data.split(",")[1];
        const buffer = Buffer.from(base64String, "base64");
        const byteArray = new Uint8Array(buffer);
        const blob = new Blob([byteArray], { type: "image/png" });
        const imageUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          context.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          context.drawImage(img, 0, 0);
        };
        img.src = imageUrl;
      });
    }
  }, [socket, context]);

  // ──────────── Canvas setup ────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    setContext(ctx);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = radius;
    ctx.strokeStyle = color;
    setContext(ctx);
  }, [color, radius]);

  // ──────────── Game lifecycle events ────────────
  useEffect(() => {
    if (socket) {
      socket.on("game-start", () => {
        console.log("game started");
        setgameStarted(true);
        setGameOverData(null);
        addToast("Game started! Get ready!", "success");
      });
    }
  }, [socket, addToast]);

  useEffect(() => {
    if (socket) {
      socket.on("game-already-started", () => {
        setgameStarted(true);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("game-stop", () => {
        console.log("game stopped");
        setgameStarted(false);
        setShowClock(false);
        setCurrentUserDrawing(false);
        setPlayerDrawing(null);
        addToast("Game stopped — not enough players", "warning");
      });
    }
  }, [socket, addToast]);

  // ──────────── NEW: Round updates ────────────
  useEffect(() => {
    if (socket) {
      socket.on("round-update", ({ current, total }) => {
        console.log(`Round ${current} of ${total}`);
        setRoundInfo({ current, total });
        if (current > 1) {
          addToast(`Round ${current} of ${total}`, "info");
        }
      });
    }
  }, [socket, addToast]);

  // ──────────── NEW: Game Over ────────────
  useEffect(() => {
    if (socket) {
      socket.on("game-over", ({ standings }) => {
        console.log("Game over!", standings);
        setGameOverData(standings);
        setgameStarted(false);
        setShowClock(false);
        setCurrentUserDrawing(false);
        setPlayerDrawing(null);
      });
    }
  }, [socket]);

  // ──────────── NEW: Player count ────────────
  useEffect(() => {
    if (socket) {
      socket.on("player-count", (count) => {
        const prevCount = playerCount;
        setPlayerCount(count);
        if (count > prevCount && prevCount > 0) {
          addToast("A new player joined!", "info");
        } else if (count < prevCount && prevCount > 0) {
          addToast("A player left", "warning");
        }
      });
    }
  }, [socket, playerCount, addToast]);

  // ──────────── Turn events ────────────
  useEffect(() => {
    if (socket) {
      socket.on("start-turn", (player) => {
        console.log("turn started of", player);
        setGuessedWord(false);
        clearCanvasAfterTurn();
        setPlayerDrawing(player);
        let newRandomWords = getRandomWords();
        setWords(newRandomWords);
        setShowWords(true);
        setCanvasHistory([]);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("word-len", (wl) => {
        console.log("selected word length", wl);
        setWordLen(wl);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("start-draw", (player) => {
        console.log("drawing started of", player);
        setShowWords(false);
        setShowClock(true);
        clearCanvasAfterTurn();
        if (player.id === socket.id) {
          console.log("your turn started");
          setCurrentUserDrawing(true);
          saveCanvasState();
        }
      });
    }
  }, [socket, saveCanvasState]);

  useEffect(() => {
    if (socket) {
      socket.on("all-guessed-correct", () => {
        console.log("all players guessed the word correct, end the timer");
        addToast("Everyone guessed correctly!", "success");
      });
    }
  }, [socket, addToast]);

  useEffect(() => {
    if (socket) {
      socket.on("end-turn", (player) => {
        console.log("turn ended of", player);
        setGuessedWord(false);
        setPlayerDrawing(null);
        setShowClock(false);
        setSelectedWord(null);
        if (socket.id === player.id) {
          console.log("your turn ended!");
          setCurrentUserDrawing(false);
        }
      });
    }
  }, [socket]);

  // ──────────── Chat ────────────
  useEffect(() => {
    if (socket) {
      socket.on("recieve-chat", ({ msg, player, rightGuess, players }) => {
        console.log(msg, player, rightGuess, players);
        setAllPlayer(players);
        if (rightGuess) {
          if (player.id === socket.id) {
            setGuessedWord(true);
            setAllChats((prevchats) => [
              {
                sender: "you",
                message: `you guessed the right word! (${msg})`,
                rightGuess,
              },
              ...prevchats,
            ]);
          } else {
            setAllChats((prevchats) => [
              {
                sender: player.name,
                message: `${player.name} guessed the word right!`,
                rightGuess,
              },
              ...prevchats,
            ]);
          }
        } else {
          if (player.id === socket.id) {
            setAllChats((prevchats) => [
              { sender: "you", message: msg, rightGuess },
              ...prevchats,
            ]);
          } else {
            setAllChats((prevchats) => [
              { sender: player.name, message: msg, rightGuess },
              ...prevchats,
            ]);
          }
        }
      });
    }
  }, [socket]);

  // ──────────── Drawing functions ────────────
  const startPaint = (event) => {
    if (!currentUserDrawing) return;

    const coordinates = getCoordinates(event);
    if (coordinates) {
      saveCanvasState();
      setIsPainting(true);
      setMousePosition(coordinates);
      if (straightLineMode) {
        setStartPoint(coordinates);
      }
    }
  };

  const paint = (event) => {
    if (!isPainting || straightLineMode) {
      return;
    }
    const newMousePosition = getCoordinates(event);
    if (mousePosition && newMousePosition) {
      if (isEraser) {
        eraseLine(newMousePosition);
      } else {
        drawLine(newMousePosition);
      }
      setMousePosition(newMousePosition);
    }
  };

  const exitPaint = () => {
    setIsPainting(false);
    setMousePosition(undefined);
    setStartPoint(null);
  };

  const getCoordinates = (event) => {
    return {
      x: event.pageX - canvasRef.current.offsetLeft,
      y: event.pageY - canvasRef.current.offsetTop,
    };
  };

  const drawLine = async (position) => {
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(mousePosition.x, mousePosition.y);
    context.lineTo(position.x, position.y);
    context.lineWidth = radius;
    context.stroke();
    const dataURL = await canvasRef.current.toDataURL("image/png");
    socket.emit("sending", dataURL);
    const newLines = [
      ...lines,
      { start: mousePosition, end: position, color, radius },
    ];
    setLines(newLines);
    setMousePosition(position);
  };

  const handleMouseUp = (event) => {
    if (straightLineMode && startPoint) {
      drawStraightLine(event);
    }
    exitPaint();
  };

  const drawStraightLine = async (event) => {
    if (straightLineMode && startPoint) {
      const endPoint = getCoordinates(event);
      context.strokeStyle = color;
      context.lineWidth = radius;
      context.beginPath();
      context.moveTo(startPoint.x, startPoint.y);
      context.lineTo(endPoint.x, endPoint.y);
      context.stroke();
      const dataURL = await canvasRef.current.toDataURL("image/png");
      socket.emit("sending", dataURL);
      setStartPoint(null);
    }
  };

  const eraseLine = async (position) => {
    const imageData = context.getImageData(
      position.x - radius,
      position.y - radius,
      2 * radius,
      2 * radius
    );
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i + 3] = 0;
    }
    context.putImageData(imageData, position.x - radius, position.y - radius);
    const dataURL = await canvasRef.current.toDataURL("image/png");
    socket.emit("sending", dataURL);
    const newLines = lines.filter((line) => {
      const startX = Math.min(line.start.x, line.end.x) - radius;
      const endX = Math.max(line.start.x, line.end.x) + radius;
      const startY = Math.min(line.start.y, line.end.y) - radius;
      const endY = Math.max(line.start.y, line.end.y) + radius;
      return (
        position.x < startX ||
        position.x > endX ||
        position.y < startY ||
        position.y > endY
      );
    });
    setLines(newLines);
  };

  const fillCanvas = async () => {
    if (!currentUserDrawing) return;
    saveCanvasState();
    context.fillStyle = color;
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const dataURL = await canvasRef.current.toDataURL("image/png");
    socket.emit("sending", dataURL);
  };

  const clearCanvas = async () => {
    if (!currentUserDrawing) return;
    saveCanvasState();
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setLines([]);
    const dataURL = await canvasRef.current.toDataURL("image/png");
    socket.emit("sending", dataURL);
  };

  const clearCanvasAfterTurn = () => {
    if (context) {
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  };

  // ──────────── Chat handlers ────────────
  const handleChangeText = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!inputMessage) return;
    socket.emit("sending-chat", inputMessage.toLocaleLowerCase());
    setInputMessage("");
  };

  const handleWorSelect = (w) => {
    setShowWords(false);
    setSelectedWord(w);
    socket.emit("word-select", w);
    setWords([]);
  };

  const getRandomWords = () => {
    let lengthWordArray = getWordsArrayLength();
    let newWordsArray = [];
    let newIndex;
    let prevIndex = -1;
    for (let i = 0; i < 3; i++) {
      newIndex = Math.floor(Math.random() * lengthWordArray);
      while (newIndex === prevIndex) {
        newIndex = Math.floor(Math.random() * lengthWordArray);
      }
      newWordsArray.push(wordsArray[newIndex]);
      prevIndex = newIndex;
    }
    return newWordsArray;
  };

  const basicColors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#C0C0C0",
    "#808080",
    "#FFFFFF",
  ];

  // ──────────── Render ────────────
  return (
    <div className="relative w-screen h-screen">
      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Game Over overlay */}
      {gameOverData && (
        <GameOverOverlay
          standings={gameOverData}
          currentSocketId={socket?.id}
          onBackToLobby={() => navigate("/")}
        />
      )}

      <div className="w-full h-full flex flex-col justify-center items-center gap-4">
        {/* Top bar: Round indicator + WordBar */}
        <div className="flex items-center gap-4">
          <RoundIndicator
            current={roundInfo.current}
            total={roundInfo.total}
          />
          <WordBar
            showClock={showClock}
            wordLen={wordLen}
            gameStarted={gameStarted}
            showWords={showWords}
            currentUserDrawing={currentUserDrawing}
            selectedWord={selectedWord}
          />
          {/* Player count badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              background: "rgba(0, 0, 0, 0.5)",
              borderRadius: "20px",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontFamily: "'Comic Sans MS', 'Segoe UI', sans-serif",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            👥 {playerCount}
          </div>
        </div>

        <div className="w-full flex justify-center items-center gap-10">
          {/* Player list */}
          <div className="w-[300px] h-[540px] border border-black bg-white text-black">
            {allPlayers &&
              allPlayers.map((pl, idx) => (
                <PlayerCard
                  key={idx}
                  pl={pl}
                  curruser={pl.id === socket.id}
                  playerDrawing={playerDrawing}
                />
              ))}
          </div>

          {/* Canvas */}
          <div className="w-[680px] h-[540px] ">
            <canvas
              ref={canvasRef}
              width={680}
              height={540}
              onMouseDown={startPaint}
              onMouseMove={paint}
              onMouseUp={handleMouseUp}
              onMouseLeave={exitPaint}
              className={`${!currentUserDrawing ? "cursor-not-allowed" : ""}`}
              style={{ border: "1px solid #000", backgroundColor: "white" }}
            />
            <div>
              {showWords && playerDrawing && playerDrawing.id === socket.id && (
                <div className="absolute top-0 left-0 h-full w-full flex justify-center gap-10 items-center z-10 bg-white bg-opacity-80">
                  {words.map((w, idx) => (
                    <div
                      onClick={() => handleWorSelect(w)}
                      key={idx}
                      className="text-black text-center w-36 h-7 border-2 rounded-md border-black cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      {w}
                    </div>
                  ))}
                </div>
              )}
              {showWords && playerDrawing && playerDrawing.id !== socket.id && (
                <div className="text-black absolute h-full w-full top-0 left-0 flex justify-center items-center z-10 bg-white bg-opacity-80">
                  {`${playerDrawing.name} is choosing a word`}
                </div>
              )}
            </div>
          </div>

          {/* Chat panel */}
          <div className="w-[300px] h-[540px] border border-black flex flex-col-reverse rounded-b-lg p-1">
            <form
              onSubmit={(e) => {
                handleSubmitForm(e);
              }}
            >
              <input
                value={inputMessage}
                placeholder="Type your guess here"
                className={`min-w-full active max-w-full text-black flex flex-wrap px-6 py-2 rounded-lg font-medium bg-sky-50 bg-opacity-40 border border-blue-300 placeholder-gray-400 text-md focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-0 focus:shadow-[0_0px_10px_2px_#bfdbfe] ${
                  currentUserDrawing || showWords || !gameStarted
                    ? "cursor-not-allowed"
                    : ""
                }`}
                onChange={(e) => handleChangeText(e)}
                disabled={
                  currentUserDrawing ||
                  showWords ||
                  !gameStarted ||
                  guessedWord
                }
              ></input>
            </form>
            {allChats &&
              allChats.length > 0 &&
              allChats.map((chat, idx) => (
                <p
                  className={`${
                    chat.rightGuess ? "bg-green-200 text-green-600" : ""
                  }`}
                  key={idx}
                >
                  {chat.rightGuess
                    ? chat.message
                    : `${chat.sender}: ${chat.message}`}
                </p>
              ))}
          </div>
        </div>

        {/* Drawing tools */}
        {currentUserDrawing && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "10px",
              }}
            >
              {basicColors.map((c, index) => (
                <button
                  key={index}
                  style={{
                    backgroundColor: c,
                    width: "40px",
                    height: "40px",
                    margin: "0 5px",
                    border: "2px solid #333",
                    borderRadius: "10px",
                    cursor: "pointer",
                    outline: "none",
                    boxShadow: "3px 3px 5px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.3s",
                  }}
                  onClick={() => setColor(c)}
                  onMouseEnter={(e) => (e.target.style.borderColor = "#FFA500")}
                  onMouseLeave={(e) => (e.target.style.borderColor = "#333")}
                  className="zoom-btn"
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "10px",
              }}
            >
              <button
                className="zoom-btn"
                style={{
                  backgroundColor: "black",
                  padding: "8px 20px",
                  margin: "0 10px",
                  border: "2px solid black",
                  borderRadius: "10px",
                  fontFamily: "Comic Sans MS",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => setIsEraser(!isEraser)}
              >
                {isEraser ? "Draw" : "Eraser"}
              </button>
              <button
                className="zoom-btn"
                style={{
                  backgroundColor: "black",
                  padding: "8px 20px",
                  margin: "0 10px",
                  border: "2px solid black",
                  borderRadius: "10px",
                  fontFamily: "Comic Sans MS",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => setStraightLineMode(!straightLineMode)}
              >
                {straightLineMode
                  ? "Disable Straight Line"
                  : "Enable Straight Line"}
              </button>
              <button
                className="zoom-btn"
                style={{
                  backgroundColor: "black",
                  padding: "8px 20px",
                  margin: "0 10px",
                  border: "2px solid black",
                  borderRadius: "10px",
                  fontFamily: "Comic Sans MS",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={fillCanvas}
              >
                Fill Canvas
              </button>
              {/* Undo button */}
              <button
                className="zoom-btn"
                style={{
                  backgroundColor: "#4a5568",
                  padding: "8px 20px",
                  margin: "0 10px",
                  border: "2px solid #4a5568",
                  borderRadius: "10px",
                  fontFamily: "Comic Sans MS",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  cursor: canvasHistory.length > 0 ? "pointer" : "not-allowed",
                  opacity: canvasHistory.length > 0 ? 1 : 0.5,
                }}
                onClick={undoCanvas}
                disabled={canvasHistory.length === 0}
              >
                ↩ Undo
              </button>
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  if (e.target.value !== color) {
                    setColor(e.target.value);
                  }
                }}
                style={{ marginLeft: "10px", marginRight: "10px" }}
              />
              <label>Radius:</label>
              <input
                type="range"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                style={{ marginLeft: "5px", marginRight: "10px" }}
              />

              <button
                className="zoom-btn"
                style={{
                  padding: "8px 20px",
                  margin: "0 10px",
                  border: "2px solid black",
                  borderRadius: "10px",
                  fontFamily: "Comic Sans MS",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={clearCanvas}
              >
                Clear
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PlayScreen;
