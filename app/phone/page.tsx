"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";

export default function PhonePage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const [conn, setConn] = useState<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerIdFromUrl, setPeerIdFromUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false); // Track when Peer ID is ready
  const [isConnected, setIsConnected] = useState(false); // Track connection state

  useEffect(() => {
    // Extract Peer ID from URL manually
    const urlParams = new URLSearchParams(window.location.search);
    setPeerIdFromUrl(urlParams.get("peerId"));

    // Initialize PeerJS instance
    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      setPeerId(id);
      console.log("✅ Phone Peer ID:", id);
      setIsReady(true); // Now the phone is ready to connect
    });

    return () => {
      newPeer.destroy(); // Cleanup on unmount
    };
  }, []);

  const handleConnect = () => {
    if (peer && peerIdFromUrl) {
      console.log("🔗 Connecting to:", peerIdFromUrl);
      const connection = peer.connect(peerIdFromUrl);

      connection.on("open", () => {
        console.log("✅ Connected!");
        setConn(connection);
        setIsConnected(true); // Mark as connected

        // Start sending motion data
        window.addEventListener("devicemotion", (event) => {
          const { accelerationIncludingGravity } = event;
          connection.send({
            x: accelerationIncludingGravity?.x,
            y: accelerationIncludingGravity?.y,
          });
        });
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-2xl">Phone Controller</h1>

      {peerId ? (
        <>
          <p className="mt-4">Your Peer ID: {peerId}</p>
          {isConnected ? (
            <p className="text-green-500 mt-4">
              ✅ Connected! Move your phone.
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
