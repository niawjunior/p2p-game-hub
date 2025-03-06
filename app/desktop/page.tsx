"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";

export default function DesktopPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);

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
          console.log("📡 Gesture Received:", data);

          switch (data.gesture) {
            case "tap":
              console.log("🖱 Click Action");
              alert("Click Action Triggered!");
              break;
            case "longpress":
              console.log("🖱 Right Click Action");
              alert("Right Click Action Triggered!");
              break;
            case "swipeLeft":
              console.log("⬅️ Swipe Left → Previous Page");
              window.history.back();
              break;
            case "swipeRight":
              console.log("➡️ Swipe Right → Next Page");
              window.history.forward();
              break;
            case "swipeUp":
              console.log("⬆️ Scroll Up");
              window.scrollBy(0, -100);
              break;
            case "swipeDown":
              console.log("⬇️ Scroll Down");
              window.scrollBy(0, 100);
              break;
            default:
              console.log("❓ Unknown Gesture");
          }
        });
      });
    }
  }, [peer]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      {!isConnected ? (
        <>
          <h1 className="text-2xl">Scan QR Code to Connect</h1>
          {peerId && (
            <QRCodeSVG
              value={`https://your-vercel-app.vercel.app/phone?peerId=${peerId}`}
              size={200}
            />
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl">Connected! Use gestures.</h1>
        </>
      )}
    </div>
  );
}
