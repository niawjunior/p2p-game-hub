"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import SpinWheel from "../SpinWheel";

// Define challenges as options

const challenges = [
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

  useEffect(() => {
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
      });
    }
  }, [peer, startSpin]);

  const initiateSpin = (force: number) => {
    console.log("Force:", force);
    setSpinTime(3000 + force * 500); // Adjust spin time based on force
    setSpinCount(5 + Math.floor(force * 3)); // More force = more spins
    setStartSpin(true);
  };

  const handleSpinCompleted = (option: string) => {
    setSelectedChallenge(option); // Use stored prize index
    setStartSpin(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      {peerId ? (
        <>
          {!isConnected ? (
            <>
              <h1 className="text-2xl">Scan QR Code to Join</h1>
              {peerId && (
                <>
                  <QRCodeSVG
                    value={`https://remote-desktop-three.vercel.app/phone?peerId=${peerId}`}
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
              <h1 className="text-3xl">🍻 Drunk Challenge Game 🎉</h1>

              {/* Realistic Spin Wheel */}
              <SpinWheel
                segments={challenges}
                colors={segmentColors}
                spinTime={spinTime}
                spinCount={spinCount}
                onFinished={handleSpinCompleted}
                startSpin={startSpin}
              />

              <h2 className="mt-6 text-2xl">
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
