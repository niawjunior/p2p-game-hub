"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";

export default function DesktopPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");

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

        conn.on("data", (data) => {
          console.log("📡 Motion Data:", data);
        });
      });
    }
  }, [peer]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl">Scan QR Code to Connect</h1>

      {peerId ? (
        <>
          <QRCodeSVG
            value={`https://remote-desktop-three.vercel.app/phone?peerId=${peerId}`}
            size={200}
            className="mt-4"
          />
          <p className="mt-4">Or enter this ID manually:</p>
          <p className="text-lg font-bold">{peerId}</p>
        </>
      ) : (
        <p>Generating Peer ID...</p>
      )}
    </div>
  );
}
