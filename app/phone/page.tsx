"use client";
import { useCallback, useEffect, useState } from "react";
import Peer from "peerjs";

export default function PhonePage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conn, setConn] = useState<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerIdFromUrl, setPeerIdFromUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

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

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!conn || !conn.open) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Detect Tap (Short Press)
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        if (touchDuration < 300) {
          console.log("🖱 Tap Detected");
          conn.send({ gesture: "tap" });
        } else {
          console.log("🖱 Long Press Detected");
          conn.send({ gesture: "longpress" });
        }
        return;
      }

      // Detect Swipe Gestures
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) {
          console.log("➡️ Swipe Right");
          conn.send({ gesture: "swipeRight" });
        } else if (deltaX < -50) {
          console.log("⬅️ Swipe Left");
          conn.send({ gesture: "swipeLeft" });
        }
      } else {
        if (deltaY > 50) {
          console.log("⬇️ Swipe Down");
          conn.send({ gesture: "swipeDown" });
        } else if (deltaY < -50) {
          console.log("⬆️ Swipe Up");
          conn.send({ gesture: "swipeUp" });
        }
      }
    },
    [conn, touchStartTime, touchStartX, touchStartY]
  );

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [conn, handleTouchEnd, handleTouchStart]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-2xl">Phone Controller</h1>

      {peerId ? (
        <>
          <p className="mt-4">Your Peer ID: {peerId}</p>
          {isConnected ? (
            <p className="text-green-500 mt-4">✅ Connected! Use gestures.</p>
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
