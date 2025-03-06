"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export default function PhonePage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const [conn, setConn] = useState<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerIdFromUrl, setPeerIdFromUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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

  const requestMotionPermission = async () => {
    const requestPermission = (
      DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
    ).requestPermission;

    if (requestPermission) {
      const permission = await requestPermission();
      if (permission !== "granted") {
        alert("Motion permission denied. Please enable motion access.");
        return false;
      }
    }
    return true;
  };

  const handleConnect = async () => {
    if (peer && peerIdFromUrl) {
      console.log("🔗 Connecting to:", peerIdFromUrl);
      const connection = peer.connect(peerIdFromUrl);

      connection.on("open", async () => {
        console.log("✅ Connected!");
        setConn(connection);
        setIsConnected(true);

        // Request motion permissions (needed for iOS)
        const permissionGranted = await requestMotionPermission();
        if (!permissionGranted) return;

        // Start sending motion data
        window.addEventListener("devicemotion", (event) => {
          const { accelerationIncludingGravity } = event;
          if (connection.open) {
            connection.send({
              x: accelerationIncludingGravity?.x || 0,
              y: accelerationIncludingGravity?.y || 0,
            });
          }
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
