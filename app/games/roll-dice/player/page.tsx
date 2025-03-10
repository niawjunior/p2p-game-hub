"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import { useRouter } from "next/navigation";

export default function PhonePage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [manualPeerId, setManualPeerId] = useState<string>(""); // New: Manual input field
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [nickname, setNickname] = useState<string>(""); // User-entered nickname

  const router = useRouter();

  let touchStartY = 0;
  let touchStartTime = 0;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("peerId");
    setManualPeerId(idFromUrl || "");
    const newPeer = new Peer();
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      setPeerId(id);
      console.log("✅ Phone Peer ID:", id);
    });

    return () => {
      newPeer.destroy();
    };
  }, [router]);

  const handleConnect = (inputPeerId?: string) => {
    const hostId = inputPeerId;
    if (peer && hostId && nickname) {
      console.log("🔗 Connecting to:", hostId);
      setIsConnecting(true);
      const connection = peer.connect(hostId);

      connection.on("open", () => {
        console.log("✅ Connected!");
        setConn(connection);
        setIsConnected(true);
        setIsConnecting(false);
        // Send nickname to host
        connection.send({
          event: "join",
          peerId: peerId,
          nickname: String(nickname).trim(),
        });
      });

      connection.on("data", (data: any) => {
        if (data.event === "gameStarted") {
          console.log("🎡 Game started!");
        }
        if (data.event === "diceResult") {
          console.log("🏆 Dice result:", data.result);
          setResult(data.result);
        }

        if (data.event === "gameStarted") {
          console.log("🎮 Game started!");
          setIsGameStarted(true);
        }
      });

      connection.on("close", () => {
        console.warn("⚠️ connection closed! Redirecting...");
        window.location.href = "/"; // Redirect to home if connection is lost
      });

      connection.on("error", () => {
        console.error("❌ Connection error! Redirecting...");
        window.location.href = "/"; // Redirect to home if connection fails
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
      let speed = Math.abs(deltaY) / swipeTime;

      const randomVariation = (Math.random() - 0.5) * 1;
      speed = Math.max(1, Math.min(10, speed + randomVariation)); // Ensure it stays between 1 and 10

      console.log(`🎡 Swipe Detected! Speed: ${speed}`);

      conn.send({ gesture: "swipe", force: speed });
    }
  };

  const handleDisconnect = () => {
    if (conn && conn.open) {
      conn.close();
      setIsConnected(false);
    }
  };
  useEffect(() => {
    if (!isGameStarted) return;
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [conn, isGameStarted]);

  const handleBackToHome = () => {
    // close connection
    handleDisconnect();
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 overflow-hidden text-white">
      <h1 className="text-2xl">🎲 Roll Dice Game 🎲</h1>

      {peerId ? (
        <>
          <p className="mt-4 text-xs">Your ID: {peerId}</p>

          <div className="max-w-md px-4">
            {/* Nickname Input */}
            <input
              type="text"
              disabled={isConnected}
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-4 w-full px-4 py-2 text-white outline-none rounded-lg border border-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              disabled={isConnected}
              type="text"
              placeholder="Enter Host ID"
              value={manualPeerId}
              onChange={(e) => setManualPeerId(e.target.value)}
              className="mt-4 w-full px-4 py-2 text-white outline-none rounded-lg border border-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isConnected && (
              <button
                className="mt-2 w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-semibold rounded-lg"
                onClick={() => handleDisconnect()}
              >
                Disconnect
              </button>
            )}

            {!isConnected && (
              <button
                className="mt-2 w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-semibold rounded-lg"
                onClick={() => handleConnect(manualPeerId)}
                disabled={
                  !manualPeerId || isConnecting || isConnected || !nickname
                }
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            )}
            {!isConnected && (
              <button
                onClick={() => router.push("/games/roll-dice/host?mode=single")}
                className="mt-4 px-4 py-2 cursor-pointer w-full bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg"
              >
                Play without Host
              </button>
            )}
            <button
              onClick={() => handleBackToHome()}
              className="mt-4 px-4 py-2 cursor-pointer w-full bg-indigo-400 hover:bg-indigo-600 text-white font-bold rounded-lg"
            >
              Back to Home
            </button>
          </div>
          {isConnected && !isGameStarted && (
            <p className="text-green-500 mt-4">Waiting for game to start...</p>
          )}
          {isConnected && isGameStarted && (
            <>
              <p className="text-green-500 mt-4">
                ✅ Connected! Swipe up to roll!
              </p>
              <p className="text-purple-600 mt-4">
                Or waiting for the host to roll
              </p>
            </>
          )}
          {result && <h2 className="text-xl mt-4">{result}</h2>}
        </>
      ) : (
        <p>Generating ID...</p>
      )}
    </div>
  );
}
