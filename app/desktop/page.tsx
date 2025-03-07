"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
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
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(
    null
  );
  const [startSpin, setStartSpin] = useState(false);
  const [spinTime, setSpinTime] = useState(5000); // Default spin time
  const [spinCount, setSpinCount] = useState(10); // Default number of spins
  const [isEditChallenges, setIsEditChallenges] = useState(false); // Default number of spins
  const [challenges, setChallenges] = useState<string[]>(defaultChallenges);
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
        console.log("🔗 Connected to Phone!");
        setIsConnected(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conn.on("data", (data: any) => {
          if (data.gesture === "swipe" && !startSpin) {
            initiateSpin(data.force);
          }
        });

        conn.on("close", () => {
          console.warn("⚠️ Connection closed! Redirecting...");
          window.location.href = "/"; // Redirect to home if connection is lost
        });

        conn.on("error", () => {
          console.error("❌ Connection error! Redirecting...");
          window.location.href = "/"; // Redirect to home if connection fails
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

  const initiateSpin = (force: number) => {
    console.log("Force:", force);
    setSpinTime(3000 + force * 500); // Adjust spin time based on force
    setSpinCount(5 + Math.floor(force * 3)); // More force = more spins
    setStartSpin(true);
  };

  const handleSpinCompleted = (option: string) => {
    setSelectedChallenge(option);
    setStartSpin(false);
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
          {!isConnected ? (
            <>
              <h1 className="text-2xl">Scan QR Code to Join</h1>
              {peerId && !isConnected && (
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
                  <QRCodeSVG
                    value={`https://drunk-wheel-challenge.vercel.app/phone?peerId=${peerId}`}
                    size={200}
                    className="mt-4"
                  />
                  <p className="mt-4">Or enter this ID manually:</p>
                  <p className="text-lg font-bold">{peerId}</p>
                </>
              )}
            </>
          ) : (
            <>
              <h1 className="text-xl mb-6">🍻 Drunk Challenge Game 🎉</h1>

              {/* Spin Wheel */}
              <SpinWheel
                segments={challenges}
                colors={segmentColors}
                spinTime={spinTime}
                spinCount={spinCount}
                onFinished={handleSpinCompleted}
                startSpin={startSpin}
              />

              <h2 className="mt-[70px] text-xl">
                {selectedChallenge || "Swipe on Phone to Spin!"}
              </h2>
            </>
          )}
        </>
      ) : (
        <p>Generating Peer ID...</p>
      )}
    </div>
  );
}
