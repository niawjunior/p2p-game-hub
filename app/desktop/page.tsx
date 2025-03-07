"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";
const SpinWheel = dynamic(
  () => import("spin-wheel-game").then((mod) => mod.SpinWheel),
  {
    ssr: false,
  }
);

// Define challenges as options
const challenges = [
  {
    segmentText: "ดื่ม 2 ช็อต 🍻",
    seqColor: "#ff4757",
  },
  {
    segmentText: "หมุนอีกครั้ง!",
    seqColor: "#1e90ff",
  },
  {
    segmentText: "เลือกคนอื่นให้ดื่ม 🍷",
    seqColor: "#2ed573",
  },
  {
    segmentText: "วิดพื้น 10 ครั้ง 💪",
    seqColor: "#ffa502",
  },
  {
    segmentText: "เล่าเรื่องตลก 🎤",
    seqColor: "#ff6b81",
  },
  {
    segmentText: "ดื่มโดยไม่ใช้มือ! 🙌",
    seqColor: "#3742fa",
  },
  {
    segmentText: "ทำหน้าตลก 30 วินาที 😜",
    seqColor: "#70a1ff",
  },
  {
    segmentText: "ทุกคนต้องดื่ม 🌊",
    seqColor: "#7bed9f",
  },
  {
    segmentText: "สลับเสื้อกับใครสักคน 👕",
    seqColor: "#5352ed",
  },
  {
    segmentText: "หมุนอีกครั้งและดื่ม 2 เท่า! 🔄",
    seqColor: "#eccc68",
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const handleSpinCompleted = (text: string) => {
    console.log("🎯 Winning Segment from Wheel:", text);

    // Find the correct challenge from the stored prizeNumber
    setSelectedChallenge(text); // Set the correct challenge

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
                onFinished={handleSpinCompleted}
                primaryColor="black"
                contrastColor="white"
                buttonText="Spin"
                isOnlyOnce={false}
                size={290}
                upDuration={spinTime / 10} // Adjust based on dynamic spin time
                downDuration={spinTime} // Matches calculated spin time
                fontFamily="Arial"
                arrowLocation="top"
                showTextOnSpin={true}
                isSpinSound={true}
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
