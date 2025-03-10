"use client";
import { useEffect, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import { useRouter, useSearchParams } from "next/navigation";
import Dice from "@/app/components/Dice";

export default function HostPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");

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
        window.location.href = "/";
      });

      newPeer.on("error", () => {
        console.error("❌ Peer error! Redirecting...");
        closeConnection();
        window.location.href = "/"; // Redirect on peer error
      });
    }
  }, [peer, router]);

  const startGame = () => {
    setGameStarted(true);
    players.forEach((player) => {
      if (player.connection.open) {
        player.connection.send({ event: "gameStarted" });
      }
    });
  };
  const startDiceRoll = (force: number) => {
    setRollingForce(force);
  };

  const handleDiceRollComplete = (result: number) => {
    setDiceResult(result);

    if (currentPlayer) {
      currentPlayer.connection.send({ event: "diceResult", result });
    }
  };

  const handleBackToHome = () => {
    // close connection
    closeConnection();
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white overflow-hidden">
      <h1 className="text-xl mb-4">🎲 Roll Dice Game 🎲</h1>
      {peerId ? (
        <>
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
                  <button
                    onClick={() => setRollingForce(Math.random())}
                    className="cursor-pointer px-6 py-2 mt-4 bg-blue-500 text-white rounded-lg"
                  >
                    Roll Dice
                  </button>
                  <p className="text-xl py-2">
                    {diceResult || "Swipe on Phone to Roll!"}
                  </p>
                </div>
              </>
            )}
            {gameStarted && !isSinglePlayer && (
              <button
                onClick={() => setGameStarted(false)}
                className=" px-4 py-2 cursor-pointer w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg"
              >
                Back to QR
              </button>
            )}
            {!gameStarted && (
              <button
                onClick={() => router.push("/games/roll-dice/host?mode=single")}
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
