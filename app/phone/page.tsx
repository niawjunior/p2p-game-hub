"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";

export default function PhonePage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<unknown>(null);
  const [peerIdFromUrl, setPeerIdFromUrl] = useState<string | null>(null);

  useEffect(() => {
    // Extract Peer ID from the URL manually
    const urlParams = new URLSearchParams(window.location.search);
    setPeerIdFromUrl(urlParams.get("peerId"));

    if (!peer) {
      const newPeer = new Peer();
      setPeer(newPeer);

      newPeer.on("open", (id) => {
        console.log("✅ Phone Peer ID:", id);
      });
    }
  }, [peer]);

  useEffect(() => {
    if (peer && peerIdFromUrl) {
      console.log("🔗 Auto-connecting to:", peerIdFromUrl);
      const connection = peer.connect(peerIdFromUrl);
      connection.on("open", () => setConn(connection));
    }
  }, [peer, peerIdFromUrl]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-2xl">Phone Controller</h1>
      {conn ? (
        <p className="text-green-500">✅ Connected!</p>
      ) : (
        <p>Waiting for connection...</p>
      )}
    </div>
  );
}
