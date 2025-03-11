"use client";
import { useEffect, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import { useRouter, useSearchParams } from "next/navigation";
import Dice from "@/app/components/Dice";
import Image from "next/image";

const defaultChallenges = [
  "ดื่ม 2 ช็อต 🍻",
  "หมุนอีกครั้ง!",
  "เลือกคนอื่นให้ดื่ม 🍷",
  "วิดพื้น 10 ครั้ง 💪",
  "เล่าเรื่องตลก 🎤",
  "ดื่มโดยไม่ใช้มือ! 🙌",
];

export default function HostPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");
  const [isEditChallenges, setIsEditChallenges] = useState(false); // Default number of spins
  const [challenges, setChallenges] = useState<string[]>(defaultChallenges);
  const [gameStarted, setGameStarted] = useState(false);
  const [rollingForce, setRollingForce] = useState(0);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const isSinglePlayer = searchParams.get("mode") === "single";
  const [currentPlayer, setCurrentPlayer] = useState<{
    id: string;
    nickname: string;
    connection: DataConnection;
  } | null>(null); // Store who started the spin
  const [players, setPlayers] = useState<
    { id: string; nickname: string; connection: DataConnection }[]
  >([]);

  const router = useRouter();

  useEffect(() => {
    if (isSinglePlayer) {
      setGameStarted(true);
    }
  }, [isSinglePlayer]);

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
    // Load saved challenges from localStorage
    const savedChallenges = localStorage.getItem("rollDiceChallenges");
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
          if (data.gesture === "swipe") {
            const player = {
              id: conn.peer,
              nickname: data.nickname,
              connection: conn,
            };
            setCurrentPlayer(player);
            startDiceRoll(data.force);
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
      });

      newPeer.on("error", () => {
        console.error("❌ Peer error! Redirecting...");
        closeConnection();
      });
    }
  }, [peer, router]);

  const handleEditChallenge = (index: number, newValue: string) => {
    const updatedChallenges = [...challenges];
    updatedChallenges[index] = newValue;
    setChallenges(updatedChallenges);

    // Save updated challenges to localStorage
    localStorage.setItem(
      "rollDiceChallenges",
      JSON.stringify(updatedChallenges)
    );
  };

  const startGame = () => {
    setGameStarted(true);
    players.forEach((player) => {
      if (player.connection.open) {
        player.connection.send({ event: "gameStarted" });
      }
    });
  };

  const handleStopGame = () => {
    setRollingForce(0);
    setGameStarted(false);
    players.forEach((player) => {
      if (player.connection.open) {
        player.connection.send({ event: "gameStopped" });
      }
    });
  };
  const startDiceRoll = (force: number) => {
    setRollingForce(force);
  };

  const handleDiceRollComplete = (result: number) => {
    setDiceResult(result);

    if (currentPlayer) {
      currentPlayer.connection.send({
        event: "diceResult",
        result: `${result} (${challenges[result - 1]})`,
      });
    }
  };

  const handleBackToHome = () => {
    // close connection
    peer?.disconnect();
    closeConnection();
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const handleRollDice = () => {
    let speed = Math.random() * 2;

    const randomVariation = (Math.random() - 0.5) * 1;
    speed = Math.max(1, Math.min(10, speed + randomVariation)); // Ensure it stays between 1 and 10

    console.log(`🎲 Roll Dice! Speed: ${speed}`);

    setRollingForce(speed);
  };
  const handleSingleMode = () => {
    setPlayers([]);
    peer?.disconnect();
    closeConnection();
    router.push("/games/roll-dice/host?mode=single");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white overflow-hidden">
      <h1 className="text-xl mb-4">🎲 Roll Dice Game 🎲</h1>
      {peerId ? (
        <>
          <div>
            {(!gameStarted || isSinglePlayer) && (
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
                    <div className="flex justify-center items-center absolute z-2 top-[60px]">
                      <div className="absolute h-fit w-[90vw] lg:max-w-md top-16 bg-gray-800 px-4 py-12 rounded-lg mx-auto">
                        <button
                          onClick={() => setIsEditChallenges(false)}
                          className="absolute top-2 text-sm w-[30px] h-[30px] rounded-full bg-red-500 right-4 text-white transition"
                        >
                          ปิด
                        </button>
                        {challenges.map((challenge, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <div className="text-white text-xs">
                              <Image
                                src={`/textures/dice${index + 1}.png`}
                                width={20}
                                height={20}
                                alt="dice"
                              />
                            </div>
                            <input
                              key={index}
                              type="text"
                              value={challenge}
                              onChange={(e) =>
                                handleEditChallenge(index, e.target.value)
                              }
                              className="w-full px-3 py-1 mb-2 text-white text-center rounded border border-gray-300 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-center flex-col items-center">
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
                          player.id === currentPlayer?.id
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
                  value={`https://p2p-game-hub.vercel.app/games/roll-dice/player?peerId=${peerId}`}
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
            {gameStarted && (
              <>
                <div className="mt-4 flex flex-col items-center min-w-[300px]">
                  <Dice
                    force={rollingForce}
                    onRollComplete={handleDiceRollComplete}
                  />
                  {players.length === 0 && isSinglePlayer && (
                    <button
                      onClick={() => handleRollDice()}
                      className="cursor-pointer px-6 py-2 mt-4 bg-blue-500 text-white rounded-lg"
                    >
                      Roll Dice
                    </button>
                  )}
                  <p className="text-xl flex gap-2 py-2">
                    <span>{diceResult || "Swipe on Phone to Roll!"}</span>
                    <span>
                      {diceResult && `(${challenges[diceResult - 1]})`}
                    </span>
                  </p>
                </div>
              </>
            )}
            {gameStarted && !isSinglePlayer && (
              <button
                onClick={() => handleStopGame()}
                className=" px-4 py-2 cursor-pointer w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg"
              >
                Stop Game
              </button>
            )}
            {!gameStarted && (
              <button
                onClick={() => handleSingleMode()}
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
