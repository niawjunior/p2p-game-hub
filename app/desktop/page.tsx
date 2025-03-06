"use client";
import { useEffect, useState, useRef } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";

export default function DesktopPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

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
        setIsConnected(true); // Hide QR Code

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conn.on("data", (data: any) => {
          console.log("📡 Motion Data:", data);
          moveCursor(data.x, data.y);
        });
      });
    }
  }, [peer]);

  const moveCursor = (x: number, y: number) => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${x * 5}px, ${-y * 5}px)`;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      {!isConnected ? (
        <>
          <h1 className="text-2xl">Scan QR Code to Connect</h1>
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
          <h1 className="text-2xl">
            Connected! Move your phone to control the cursor.
          </h1>
          {/* Virtual cursor */}
          <div
            ref={cursorRef}
            className="absolute w-6 h-6 bg-red-500 rounded-full transition-transform duration-50"
            style={{ top: "50%", left: "50%" }}
          />
        </>
      )}
    </div>
  );
}
