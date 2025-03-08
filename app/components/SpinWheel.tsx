"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DataConnection } from "peerjs";
import Fireworks from "react-canvas-confetti/dist/presets/fireworks";

interface SpinWheelProps {
  segments: string[]; // List of challenge texts
  colors: string[]; // Colors for each segment
  spinTime: number; // Dynamic spin time
  spinCount: number; // Number of spins before stopping
  startSpin: boolean; // Trigger spinning
  onFinished: (winner: string, isHost: boolean, payerId: string | null) => void; // Callback when spin stops
  players: { id: string; nickname: string; connection: DataConnection }[];
  currentSpinner: {
    id: string;
    nickname: string;
    connection: DataConnection;
  } | null;
  onSpinStart: (
    spinner: { id: string; nickname: string; connection: DataConnection } | null
  ) => void;
}

export default function SpinWheel({
  segments,
  colors,
  spinTime,
  spinCount,
  startSpin,
  players,
  onFinished,
  onSpinStart,
  currentSpinner,
}: SpinWheelProps) {
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const segmentSize = 360 / segments.length; // Each segment size
  const wheelSize = 300; // Set wheel size
  const [isShowFireworks, setIsShowFireworks] = useState(false);

  useEffect(() => {
    if (startSpin && !isSpinning) {
      spinWheel(false);
    }
  }, [startSpin]);

  const spinWheel = async (isHost: boolean) => {
    setIsShowFireworks(false);
    console.log("Spinning...");
    if (isSpinning) return;
    setIsSpinning(true);
    if (isHost && players.length > 0) {
      for (const player of players) {
        onSpinStart(player);
        await triggerSpinForPlayer(player.id, isHost);
        setIsShowFireworks(true);
        handleCloseFireworks();
      }
    } else {
      onSpinStart(currentSpinner);
      await triggerSpinForPlayer(null, isHost);
      setIsShowFireworks(true);
      handleCloseFireworks();
    }
  };

  const handleCloseFireworks = () => {
    setTimeout(() => {
      setIsShowFireworks(false);
    }, 5000);
  };

  const triggerSpinForPlayer = async (
    playerId: string | null,
    isHost: boolean
  ): Promise<void> => {
    return new Promise((resolve) => {
      // 🔹 Generate a random stop position ensuring alignment with the red pointer
      const extraRotation = Math.random() * segmentSize; // Random final stop within a segment
      const totalRotation = isHost
        ? spinCount * 360 + extraRotation + Math.random() * 100
        : spinCount * 360 + extraRotation;

      gsap.to(wheelContainerRef.current, {
        rotation: `+=${totalRotation}`,
        duration: spinTime / 1000,
        ease: "power4.out",
        onComplete: () => {
          setIsSpinning(false);

          // ✅ Get the exact angle where the wheel stopped
          const finalAngle = (currentAngle + totalRotation) % 360;
          const adjustedAngle = (360 - finalAngle + segmentSize / 2) % 360; // Align with red pointer
          const winningIndex = Math.floor(adjustedAngle / segmentSize);

          console.log(
            "🎯 Winning Index:",
            winningIndex,
            "Segment:",
            segments[winningIndex]
          );

          // ✅ Ensure correct result is sent
          let calIndex = 0;
          if (winningIndex < 3) {
            calIndex = winningIndex + (segments.length - 3);
          } else {
            calIndex = winningIndex - (segments.length - 7);
          }

          console.log("Calculated Index:", calIndex);
          onFinished(segments[calIndex], isHost, playerId);

          // ✅ Store the new stopping angle
          setCurrentAngle(finalAngle);

          resolve();
        },
      });
    });
  };

  return (
    <>
      <div className="relative flex flex-col items-center">
        {/* Wheel Container (Spins) */}
        <div ref={wheelContainerRef} className="relative">
          <svg
            width={wheelSize}
            height={wheelSize}
            viewBox="0 0 300 300"
            className="rounded-full"
          >
            <g transform="translate(150, 150)">
              {segments.map((segment, index) => {
                const startAngle = (index * 360) / segments.length;
                const endAngle = ((index + 1) * 360) / segments.length;
                const midAngle = (startAngle + endAngle) / 2; // Midpoint of slice

                const x1 = 150 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 150 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 150 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 150 * Math.sin((endAngle * Math.PI) / 180);

                const textX = 90 * Math.cos((midAngle * Math.PI) / 180);
                const textY = 90 * Math.sin((midAngle * Math.PI) / 180);

                return (
                  <g key={index}>
                    {/* Segment Background */}
                    <path
                      d={`M0,0 L${x1},${y1} A150,150 0 0,1 ${x2},${y2} Z`}
                      fill={colors[index]}
                      stroke="black"
                    />
                    {/* Segment Text */}
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="12"
                      fontFamily="Kanit"
                      textAnchor="middle"
                      transform={`rotate(${
                        midAngle + 180
                      }, ${textX}, ${textY})`} // Rotate properly
                    >
                      {segments[index]}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Fixed Red Pointer */}
        <div className="absolute top-0 flex justify-center items-center">
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-transparent border-b-red-500"></div>
        </div>

        <button
          className="mt-6 absolute bottom-[-60px] bg-blue-500 hover:bg-blue-600 transition cursor-pointer text-white font-semibold rounded-lg px-6 py-2"
          onClick={() => spinWheel(true)}
        >
          Spin
        </button>
      </div>
      {isShowFireworks && <Fireworks autorun={{ speed: 3 }} />}
    </>
  );
}
