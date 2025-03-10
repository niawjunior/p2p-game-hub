"use client";
import { useEffect, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import SpinWheel from "../../../components/SpinWheel";
import { useRouter, useSearchParams } from "next/navigation";

// Default challenge labels
const defaultChallenges = [
  "ดื่ม 2 ช็อต 🍻",
  "หมุนอีกครั้ง!",
  "เลือกคนอื่นให้ดื่ม 🍷",
  "วิดพื้น 10 ครั้ง 💪",
  "เล่าเรื่องตลก 🎤",
  "ดื่มโดยไม่ใช้มือ! 🙌",
  "ทำหน้าตลก 30 วินาที 😜",
  "ทุกคนต้องดื่ม 🌊",
  "สลับเสื้อกับใครสักคน 👕",
  "หมุนอีกครั้งและดื่ม 2 เท่า! 🔄",
];

// Segment colors remain the same
const segmentColors = [
  "#ff4757",
  "#1e90ff",
  "#2ed573",
  "#ffa502",
  "#ff6b81",
  "#3742fa",
  "#70a1ff",
  "#7bed9f",
  "#5352ed",
  "#eccc68",
];

export default function HostPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(
    null
  );
  const [startSpin, setStartSpin] = useState(false);
  const [spinTime, setSpinTime] = useState(5000); // Default spin time
  const [spinCount, setSpinCount] = useState(10); // Default number of spins
  const [isEditChallenges, setIsEditChallenges] = useState(false); // Default number of spins
  const [challenges, setChallenges] = useState<string[]>(defaultChallenges);
  const [gameStarted, setGameStarted] = useState(false);
  const searchParams = useSearchParams();
  const isSinglePlayer = searchParams.get("mode") === "single";
  const [currentSpinner, setCurrentSpinner] = useState<{
    id: string;
    nickname: string;
    connection: DataConnection;
  } | null>(null); // Store who started the spin
  const [players, setPlayers] = useState<
    { id: string; nickname: string; connection: DataConnection }[]
  >([]);

  const router = useRouter();

  const closeConnection = () => {
    if (players.length > 0) {
      players.forEach((player) => {
        if (player.connection.open) {
          console.log(`❌ Closing connection with: ${player.id}`);
          player.connection.close();
        }
      });
    }
  };

  useEffect(() => {
    if (isSinglePlayer) {
      setGameStarted(true);
    }
  }, [isSinglePlayer]);
  useEffect(() => {
    // Load saved challenges from localStorage
    const savedChallenges = localStorage.getItem("customChallenges");
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    }

    if (!peer) {
      const newPeer = new Peer();
      setPeer(newPeer);

      newPeer.on("open", (id) => {
        setPeerId(id);
        console.log("✅ Host Peer ID:", id);
      });

      newPeer.on("connection", (conn) => {
        console.log(`📲 Phone connected: ${conn.peer}`);

        conn.on("data", (data: any) => {
          if (data.gesture === "swipe" && !startSpin) {
            const spinner = {
              id: conn.peer,
              nickname: data.nickname,
              connection: conn,
            };
            setCurrentSpinner(spinner);
            initiateSpin(data.force);
          }

          if (data.event === "join") {
            // Add player (if not already in list)
            setPlayers((prev) => {
              if (!prev.some((p) => p.id === data.peerId)) {
                return [
                  ...prev,
                  {
                    id: data.peerId,
                    nickname: data.nickname,
                    connection: conn,
                  },
                ];
              }
              return prev;
            });
          }
        });

        conn.on("close", () => {
          closeConnection();
          console.warn(`⚠️ Connection closed: ${conn.peer}`);
          setPlayers((prev) => prev.filter((p) => p.id !== conn.peer));
        });

        conn.on("error", () => {
          closeConnection();
          console.error(`❌ Connection error with: ${conn.peer}`);
          setPlayers((prev) => prev.filter((p) => p.id !== conn.peer));
        });
      });

      newPeer.on("disconnected", () => {
        closeConnection();
        console.warn("⚠️ Peer disconnected! Redirecting...");
        window.location.href = "/";
      });

      newPeer.on("error", () => {
        console.error("❌ Peer error! Redirecting...");
        closeConnection();
        window.location.href = "/"; // Redirect on peer error
      });
    }
  }, [peer, router, startSpin]);

  const initiateSpin = (force: number) => {
    console.log("Force:", force);
    setSpinTime(3000 + force * 500); // Adjust spin time based on force
    setSpinCount(5 + Math.floor(force * 3)); // More force = more spins
    setStartSpin(true);

    players.forEach((player) => {
      if (player.connection.open) {
        player.connection.send({ event: "spinStarted" });
      }
    });
  };

  const handleSpinCompleted = (option: string, payerId: string | null) => {
    setSelectedChallenge(option);
    setStartSpin(false);
    console.log(payerId);
    console.log("currentSpinner", currentSpinner);

    if (payerId) {
      // If a specific payer swiped, send result only to that payer
      const targetPlayer = players.find(
        (player) => player.id === currentSpinner?.id
      );
      if (targetPlayer && targetPlayer.connection.open) {
        targetPlayer.connection.send({ event: "spinResult", result: option });
      }
    }

    setCurrentSpinner(null); // Reset spinner ID after spin is done
  };

  const handleSpinStart = (
    spinner: { id: string; nickname: string; connection: DataConnection } | null
  ) => {
    console.log("Spin start for:", spinner);
    setCurrentSpinner(spinner);
  };

  const handleEditChallenge = (index: number, newValue: string) => {
    const updatedChallenges = [...challenges];
    updatedChallenges[index] = newValue;
    setChallenges(updatedChallenges);

    // Save updated challenges to localStorage
    localStorage.setItem("customChallenges", JSON.stringify(updatedChallenges));
  };

  const startGame = () => {
    setGameStarted(true);
    players.forEach((player) => {
      if (player.connection.open) {
        player.connection.send({ event: "gameStarted" });
      }
    });
  };

  const handleBackToHome = () => {
    // close connection
    closeConnection();
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white overflow-hidden">
      <h1 className="text-xl ">🍻 Drunk Challenge Game 🎉</h1>
      {peerId ? (
        <>
          <div>
            {!gameStarted && (
              <>
                {/* Editable Challenge List */}
                <div className="mb-4 mt-4 px-4">
                  <button
                    className="px-4 absolute  top-4 right-4 py-2 bg-green-500 z-2 hover:bg-green-600 transition text-white font-semibold rounded-lg"
                    onClick={() => setIsEditChallenges(!isEditChallenges)}
                  >
                    Edit Challenges
                  </button>
                  {isEditChallenges && (
                    <div className="flex justify-center items-center absolute top-[60px]">
                      <div className="absolute h-[70vh] w-[90vw] lg:max-w-md top-16 bg-gray-800 px-4 py-8 rounded-lg mx-auto">
                        <button
                          onClick={() => setIsEditChallenges(false)}
                          className="absolute top-0 text-2xl right-4 text-gray-300 hover:text-white transition"
                        >
                          x
                        </button>
                        {challenges.map((challenge, index) => (
                          <input
                            key={index}
                            type="text"
                            value={challenge}
                            onChange={(e) =>
                              handleEditChallenge(index, e.target.value)
                            }
                            className="w-full px-3 py-1 mb-2 text-white text-center rounded border border-gray-300 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center flex-col items-center ">
            {!gameStarted && players.length > 0 && (
              <button
                className="px-6 py-2 bg-blue-500 cursor-pointer hover:bg-blue-600 text-white font-bold rounded-lg"
                onClick={() => startGame()}
              >
                Start Game
              </button>
            )}
            {!isSinglePlayer && (
              <div className="flex flex-col items-center">
                <h2 className="text-sm font-semibold mb-2 mt-2">
                  Players Online: {players.length}
                </h2>
                {players.length > 0 ? (
                  <ul>
                    {players.map((player, index) => (
                      <li
                        key={index}
                        className={`px-1 py-1 text-green-400 text-xs ${
                          player.id === currentSpinner?.id
                            ? "border-1 border-white rounded-[4px]"
                            : ""
                        }`}
                      >
                        {player.nickname} ({player.id})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">Waiting for players...</p>
                )}
              </div>
            )}
            {!gameStarted && (
              <>
                <QRCodeSVG
                  value={`https://p2p-game-hub.vercel.app/games/drunk-wheel-challenge/player?peerId=${peerId}`}
                  size={200}
                  className="mt-4"
                />
                <h1 className="mt-2 text-xl">Scan QR Code to Join</h1>
                <p className="mt-2">Or enter this ID manually:</p>
                <p className="text-base font-bold">{peerId}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(peerId)}
                  className="mt-2 px-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg"
                >
                  Copy to Clipboard
                </button>
              </>
            )}
            {/* Spin Wheel */}
            {gameStarted && (
              <div className="mt-4 ">
                <SpinWheel
                  segments={challenges}
                  colors={segmentColors}
                  spinTime={spinTime}
                  spinCount={spinCount}
                  onFinished={handleSpinCompleted}
                  startSpin={startSpin}
                  onSpinStart={handleSpinStart}
                  currentSpinner={currentSpinner}
                />

                <h2 className="mt-[70px] text-xl text-center">
                  {selectedChallenge || "Swipe on Phone to Spin!"}
                </h2>
              </div>
            )}
            {gameStarted && !isSinglePlayer && (
              <button
                onClick={() => setGameStarted(false)}
                className="mt-4 px-4 py-2 cursor-pointer w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg"
              >
                Back to QR
              </button>
            )}
            {!gameStarted && (
              <button
                onClick={() =>
                  router.push("/games/drunk-wheel-challenge/host?mode=single")
                }
                className="mt-4 px-4 py-2 cursor-pointer w-full bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg"
              >
                Play without Players
              </button>
            )}
            <button
              onClick={() => handleBackToHome()}
              className="mt-4 px-4 py-2 cursor-pointer w-full  bg-indigo-400 hover:bg-indigo-600 text-white font-bold rounded-lg"
            >
              Back to Home
            </button>
          </div>
        </>
      ) : (
        <p>Generating ID...</p>
      )}
    </div>
  );
}
