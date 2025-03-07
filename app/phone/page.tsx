"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Peer from "peerjs";

export default function PhonePage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerIdFromUrl, setPeerIdFromUrl] = useState<string | null>(null);
  const [manualPeerId, setManualPeerId] = useState<string>(""); // New: Manual input field
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  let touchStartY = 0;
  let touchStartTime = 0;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("peerId");
    setPeerIdFromUrl(idFromUrl);

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

  const handleConnect = (inputPeerId?: string) => {
    const desktopId = inputPeerId || peerIdFromUrl; // Use manual input if provided
    if (peer && desktopId) {
      console.log("🔗 Connecting to:", desktopId);
      setIsConnecting(true);
      const connection = peer.connect(desktopId);

      connection.on("open", () => {
        console.log("✅ Connected!");
        setConn(connection);
        setIsConnected(true);
        setIsConnecting(false);
      });
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!conn || !conn.open) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;
    const swipeTime = Date.now() - touchStartTime;

    if (deltaY < -50) {
      const speed = Math.min(Math.abs(deltaY) / swipeTime, 10);
      console.log(`🎡 Swipe Detected! Speed: ${speed}`);

      conn.send({ gesture: "swipe", force: speed });
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
    <div className="flex flex-col items-center justify-center h-screen bg-black overflow-hidden text-white">
      <h1 className="text-2xl">🍻 Drunk Challenge Game 🎉</h1>

      {peerId ? (
        <>
          <p className="mt-4">Your Peer ID: {peerId}</p>

          {peerIdFromUrl ? (
            <button
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 transition text-white font-semibold rounded-lg"
              onClick={() => handleConnect()}
            >
              Connect to Desktop
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter Desktop Peer ID"
                value={manualPeerId}
                onChange={(e) => setManualPeerId(e.target.value)}
                className="mt-4 px-4 py-2 text-white outline-none rounded-lg border border-white"
              />
              <button
                className="mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-semibold rounded-lg"
                onClick={() => handleConnect(manualPeerId)}
                disabled={!manualPeerId || isConnecting || isConnected}
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            </>
          )}

          {isConnected && (
            <p className="text-green-500 mt-4">
              ✅ Connected! Swipe up to spin!
            </p>
          )}
        </>
      ) : (
        <p>Generating Peer ID...</p>
      )}
    </div>
  );
}
