"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import { SpinWheel, Option } from "react-prize-wheel";

// Define challenges as options
const challenges: Option[] = [
  {
    text: "ดื่ม 2 ช็อต 🍻",
    styles: { backgroundColor: "#ff4757", textColor: "#ffffff" },
  },
  {
    text: "หมุนอีกครั้ง!",
    styles: { backgroundColor: "#1e90ff", textColor: "#ffffff" },
  },
  {
    text: "เลือกคนอื่นให้ดื่ม 🍷",
    styles: { backgroundColor: "#2ed573", textColor: "#ffffff" },
  },
  {
    text: "วิดพื้น 10 ครั้ง 💪",
    styles: { backgroundColor: "#ffa502", textColor: "#ffffff" },
  },
  {
    text: "เล่าเรื่องตลก 🎤",
    styles: { backgroundColor: "#ff6b81", textColor: "#ffffff" },
  },
  {
    text: "ดื่มโดยไม่ใช้มือ! 🙌",
    styles: { backgroundColor: "#3742fa", textColor: "#ffffff" },
  },
  {
    text: "ทำหน้าตลก 30 วินาที 😜",
    styles: { backgroundColor: "#70a1ff", textColor: "#ffffff" },
  },
  {
    text: "ทุกคนต้องดื่ม 🌊",
    styles: { backgroundColor: "#7bed9f", textColor: "#ffffff" },
  },
  {
    text: "สลับเสื้อกับใครสักคน 👕",
    styles: { backgroundColor: "#5352ed", textColor: "#ffffff" },
  },
  {
    text: "หมุนอีกครั้งและดื่ม 2 เท่า! 🔄",
    styles: { backgroundColor: "#eccc68", textColor: "#ffffff" },
  },
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
  const [prizeNumber, setPrizeNumber] = useState(0);

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
    const randomPrizeNumber = Math.floor(Math.random() * challenges.length);
    setPrizeNumber(randomPrizeNumber); // Store the selected prize index

    setSpinTime(3000 + force * 500); // Adjust spin time based on force
    setSpinCount(5 + Math.floor(force * 3)); // More force = more spins
    setStartSpin(true);
  };

  const handleSpinCompleted = () => {
    setSelectedChallenge(challenges[prizeNumber].text); // Use stored prize index
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
                options={challenges}
                startSpin={startSpin}
                spinTime={spinTime}
                spinCount={spinCount}
                styles={{
                  size: 300,
                }}
                onSpinCompleted={handleSpinCompleted}
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
