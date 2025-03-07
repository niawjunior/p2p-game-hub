"use client";
import { useEffect, useRef, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import SpinWheel from "../SpinWheel";
import { useRouter } from "next/navigation";

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

export default function DesktopPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhones, setConnectedPhones] = useState<DataConnection[]>([]); // Store multiple connections

  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(
    null
  );
  const [startSpin, setStartSpin] = useState(false);
  const [spinTime, setSpinTime] = useState(5000); // Default spin time
  const [spinCount, setSpinCount] = useState(10); // Default number of spins
  const [isEditChallenges, setIsEditChallenges] = useState(false); // Default number of spins
  const [challenges, setChallenges] = useState<string[]>(defaultChallenges);
  const [phoneIds, setPhoneIds] = useState<string[]>([]); // Store Peer IDs of phones
  const [gameStarted, setGameStarted] = useState(false);
  const phoneHeartbeats = useRef<{ [key: string]: number }>({});
  const [currentSpinner, setCurrentSpinner] = useState<string | null>("host"); // Store who started the spin

  const router = useRouter();

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
        console.log("✅ Desktop Peer ID:", id);
      });

      newPeer.on("connection", (conn) => {
        console.log(`📲 Phone connected: ${conn.peer}`);

        // Store multiple phone connections
        setConnectedPhones((prevPhones) => {
          // Prevent duplicate entries
          if (!prevPhones.some((p) => p.peer === conn.peer)) {
            return [...prevPhones, conn];
          }
          return prevPhones;
        });

        setPhoneIds((prevIds) => {
          if (!prevIds.includes(conn.peer)) {
            return [...prevIds, conn.peer];
          }
          return prevIds;
        });

        setIsConnected(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conn.on("data", (data: any) => {
          if (data.gesture === "swipe" && !startSpin) {
            initiateSpin(data.force, conn.peer);
          }
          if (data.event === "heartbeat") {
            phoneHeartbeats.current[conn.peer] = Date.now();
          }
        });

        conn.on("close", () => {
          console.warn(`⚠️ Connection closed: ${conn.peer}`);

          // Remove disconnected phone from state
          setConnectedPhones((prevPhones) =>
            prevPhones.filter((p) => p.peer !== conn.peer)
          );
          setPhoneIds((prevIds) => prevIds.filter((id) => id !== conn.peer));
        });

        conn.on("error", () => {
          console.error(`❌ Connection error with: ${conn.peer}`);
          setConnectedPhones((prevPhones) =>
            prevPhones.filter((p) => p.peer !== conn.peer)
          );
          setPhoneIds((prevIds) => prevIds.filter((id) => id !== conn.peer));
        });
      });

      newPeer.on("disconnected", () => {
        console.warn("⚠️ Peer disconnected! Redirecting...");
        window.location.href = "/";
      });

      newPeer.on("error", () => {
        console.error("❌ Peer error! Redirecting...");
        window.location.href = "/"; // Redirect on peer error
      });
    }
  }, [peer, router, startSpin]);

  const initiateSpin = (force: number, peerId?: string) => {
    console.log("peerId", peerId);
    if (peerId) {
      setCurrentSpinner(peerId); // Store the peer ID of the phone that triggered the spin
    }

    console.log("Force:", force);
    setSpinTime(3000 + force * 500); // Adjust spin time based on force
    setSpinCount(5 + Math.floor(force * 3)); // More force = more spins
    setStartSpin(true);

    connectedPhones.forEach((conn) => {
      if (conn.open) {
        conn.send({ event: "spinStarted" });
      }
    });
  };

  const handleSpinCompleted = (option: string, isHost: boolean) => {
    setSelectedChallenge(option);
    setStartSpin(false);
    console.log("currentSpinner", currentSpinner);
    if (isHost) {
      // If the desktop triggered the spin, send the result to all phones
      connectedPhones.forEach((conn) => {
        if (conn.open) {
          conn.send({ event: "spinResult", result: option });
        }
      });
    } else {
      // If a specific phone swiped, send result only to that phone
      const targetPhone = connectedPhones.find(
        (conn) => conn.peer === currentSpinner
      );
      if (targetPhone && targetPhone.open) {
        targetPhone.send({ event: "spinResult", result: option });
      }
    }

    setCurrentSpinner(null); // Reset spinner ID after spin is done
  };

  const handleEditChallenge = (index: number, newValue: string) => {
    const updatedChallenges = [...challenges];
    updatedChallenges[index] = newValue;
    setChallenges(updatedChallenges);

    // Save updated challenges to localStorage
    localStorage.setItem("customChallenges", JSON.stringify(updatedChallenges));
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white overflow-hidden">
      {peerId ? (
        <>
          <div>
            <h1 className="text-xl mb-6">🍻 Drunk Challenge Game 🎉</h1>

            {!isConnected && !gameStarted && (
              <>
                {/* Editable Challenge List */}
                <div className="mb-4 mt-4 px-4">
                  <button
                    className="px-4 absolute top-4 right-4 py-2 bg-green-500 z-2 hover:bg-green-600 transition text-white font-semibold rounded-lg"
                    onClick={() => setIsEditChallenges(!isEditChallenges)}
                  >
                    Edit Challenges
                  </button>
                  {isEditChallenges && (
                    <div className="absolute h-[70vh]  top-16 right-4 bg-gray-800 px-4 py-8 rounded-lg">
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
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center flex-col items-center">
            {!gameStarted && phoneIds.length > 0 && (
              <button
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg"
                onClick={() => {
                  setGameStarted(true);
                  connectedPhones.forEach((conn) =>
                    conn.send({ event: "gameStarted" })
                  );
                }}
              >
                Start Game
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold mb-2 mt-2">
                Players Online:
              </h2>
              {phoneIds.length > 0 ? (
                <ul>
                  {phoneIds.map((id, index) => (
                    <li key={index} className="text-green-400">
                      {id}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">Waiting for players...</p>
              )}
            </div>
            {!gameStarted && (
              <>
                <h1 className="text-2xl">Scan QR Code to Join</h1>

                <QRCodeSVG
                  value={`https://drunk-wheel-challenge.vercel.app/phone?peerId=${peerId}`}
                  size={200}
                  className="mt-4"
                />
                <p className="mt-4">Or enter this ID manually:</p>
                <p className="text-lg font-bold">{peerId}</p>
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
                />

                <h2 className="mt-[70px] text-xl text-center">
                  {selectedChallenge || "Swipe on Phone to Spin!"}
                </h2>
              </div>
            )}
            {gameStarted && (
              <button
                onClick={() => setGameStarted(false)}
                className="mt-4 px-6 py-2 cursor-pointer bg-orange-400 hover:bg-green-600 text-white font-bold rounded-lg"
              >
                Back to Home
              </button>
            )}
          </div>
        </>
      ) : (
        <p>Generating Peer ID...</p>
      )}
    </div>
  );
}
