/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";

export default function PhonePage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerIdFromUrl, setPeerIdFromUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  let touchStartY = 0;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setPeerIdFromUrl(urlParams.get("peerId"));

    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      setPeerId(id);
      console.log("✅ Phone Peer ID:", id);
      setIsReady(true);
    });

    return () => {
      newPeer.destroy();
    };
  }, []);

  const handleConnect = () => {
    if (peer && peerIdFromUrl) {
      console.log("🔗 Connecting to:", peerIdFromUrl);
      const connection = peer.connect(peerIdFromUrl);

      connection.on("open", () => {
        console.log("✅ Connected!");
        setConn(connection);
        setIsConnected(true);
      });
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!conn || !conn.open) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;

    if (deltaY < -50) {
      console.log("🎡 Swipe Detected! Spinning the wheel...");
      conn.send({ gesture: "swipe" });
    }
  };

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [conn]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-2xl">🍻 Drunk Challenge Game 🎉</h1>

      {peerId ? (
        <>
          <p className="mt-4">Your Peer ID: {peerId}</p>
          {isConnected ? (
            <p className="text-green-500 mt-4">
              ✅ Connected! Swipe up to spin!
            </p>
          ) : isReady ? (
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={handleConnect}
            >
              Connect to Desktop
            </button>
          ) : (
            <p>Initializing...</p>
          )}
        </>
      ) : (
        <p>Generating Peer ID...</p>
      )}
    </div>
  );
}
