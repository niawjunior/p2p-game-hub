"use client";
import { useEffect, useState } from "react";
import Peer from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import { Wheel } from "react-custom-roulette";

const challenges = [
  { option: "Take 2 shots 🍻" },
  { option: "Spin again!" },
  { option: "Give a drink to someone 🍷" },
  { option: "Do 10 pushups 💪" },
  { option: "Tell a funny story 🎤" },
  { option: "Drink with no hands! 🙌" },
  { option: "Make a silly face for 30 sec 😜" },
  { option: "Waterfall! Everyone drinks! 🌊" },
  { option: "Switch shirts with someone 👕" },
  { option: "Spin again & double! 🔄" },
];

const segmentColors = [
  "#ff4757",
  "#1e90ff",
  "#2ed573",
  "#ffa502",
  "#ff6b81",
  "#3742fa",
  "#70a1ff",
  "#7bed9f",
  "#5352ed",
  "#eccc68",
];

export default function DesktopPage() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(
    null
  );
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

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
          if (data.gesture === "swipe" && !mustSpin) {
            const force = data.force || 1;
            initiateSpin(force);
          }
        });
      });
    }
  }, [peer, mustSpin]);

  const initiateSpin = (force: number) => {
    console.log("Force:", force);
    const newPrizeNumber = Math.floor(Math.random() * challenges.length);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
  };

  const handleSpinStop = () => {
    setMustSpin(false);
    setSelectedChallenge(challenges[prizeNumber].option);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      {peerId ? (
        <>
          {!isConnected ? (
            <>
              <h1 className="text-2xl">Scan QR Code to Join</h1>
              {peerId && (
                <>
                  <QRCodeSVG
                    value={`https://remote-desktop-three.vercel.app/phone?peerId=${peerId}`}
                    size={200}
                    className="mt-4"
                  />
                  <p className="mt-4">Or enter this ID manually:</p>
                  <p className="text-lg font-bold">{peerId}</p>
                </>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl">🍻 Drunk Challenge Game 🎉</h1>

              {/* Realistic Spin Wheel */}
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={challenges}
                onStopSpinning={handleSpinStop}
                backgroundColors={segmentColors}
                textColors={["#ffffff"]}
                outerBorderColor="black"
                outerBorderWidth={5}
                innerRadius={0}
                innerBorderColor="black"
                innerBorderWidth={0}
                radiusLineColor="black"
                radiusLineWidth={5}
                fontSize={16}
                perpendicularText={true}
                textDistance={60}
                spinDuration={0.5 + prizeNumber * 0.1} // Adjust spin duration based on prize number
              />

              <h2 className="mt-6 text-2xl">
                {selectedChallenge || "Swipe on Phone to Spin!"}
              </h2>
            </>
          )}
        </>
      ) : (
        <p>Generating Peer ID...</p>
      )}
    </div>
  );
}
