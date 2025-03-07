"use client";
import { useEffect, useState, useRef } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";

const challenges = [
  "Take 2 shots 🍻",
  "Spin again!",
  "Give a drink to someone 🍷",
  "Do 10 pushups 💪",
  "Tell a funny story 🎤",
  "Drink with no hands! 🙌",
  "Make a silly face for 30 sec 😜",
  "Waterfall! Everyone drinks! 🌊",
  "Switch shirts with someone 👕",
  "Spin again & double! 🔄",
];

export default function DesktopPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

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
          if (data.gesture === "swipe") {
            spinWheel();
          }
        });
      });
    }
  }, [peer]);

  const spinWheel = () => {
    if (wheelRef.current) {
      const randomIndex = Math.floor(Math.random() * challenges.length);
      setCurrentChallenge(challenges[randomIndex]);

      wheelRef.current.style.transition = "transform 2s ease-out";
      wheelRef.current.style.transform = `rotate(${
        Math.random() * 360 + 720
      }deg)`;
    }
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
              <div
                ref={wheelRef}
                className="mt-8 w-40 h-40 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl"
              >
                🎡 Spin Me!
              </div>
              <h2 className="mt-6 text-2xl">
                {currentChallenge || "Swipe on Phone to Spin"}
              </h2>
            </>
          )}
        </>
      ) : (
        <>
          <p>Generating Peer ID...</p>
        </>
      )}
    </div>
  );
}
