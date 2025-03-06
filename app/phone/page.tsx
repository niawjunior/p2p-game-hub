"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Peer from "peerjs";

export default function PhonePage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conn, setConn] = useState<any>(null);
  const searchParams = useSearchParams();
  const peerIdFromUrl = searchParams.get("peerId");

  useEffect(() => {
    if (!peer) {
      const newPeer = new Peer();
      setPeer(newPeer);

      newPeer.on("open", (id) => {
        console.log("✅ Phone Peer ID:", id);
      });

      // Auto-connect if Peer ID is in URL
      if (peerIdFromUrl) {
        console.log("🔗 Auto-connecting to:", peerIdFromUrl);
        const connection = newPeer.connect(peerIdFromUrl);
        connection.on("open", () => setConn(connection));
      }
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
