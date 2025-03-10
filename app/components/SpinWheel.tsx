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
  onFinished: (winner: string, payerId: string | null) => void; // Callback when spin stops
  currentSpinner: {
    id: string;
    nickname: string;
    connection: DataConnection;
  } | null;
  players: { id: string; nickname: string; connection: DataConnection }[];
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
  onFinished,
  onSpinStart,
  currentSpinner,
  players,
}: SpinWheelProps) {
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const segmentSize = 360 / segments.length; // Each segment size
  const wheelSize = 300; // Set wheel size
  const [isShowFireworks, setIsShowFireworks] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const tickInterval = useRef<any | null>(null);

  useEffect(() => {
    if (startSpin && !isSpinning) {
      spinWheel();
    }
  }, [startSpin]);

  const spinWheel = async () => {
    setIsShowFireworks(false);
    console.log("Spinning...");
    if (isSpinning) return;
    setIsSpinning(true);

    onSpinStart(currentSpinner);
    await triggerSpinForPlayer(null);
    setIsShowFireworks(true);
    handleCloseFireworks();
  };

  const playTickingSound = (
    time: number,
    frequency: number = 800,
    volume: number = 0.1
  ) => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const osc = audioCtx.current.createOscillator();
    const gainNode = audioCtx.current.createGain();

    osc.type = "triangle"; // More organic "click" sound
    osc.frequency.setValueAtTime(frequency, audioCtx.current.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.current.currentTime);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.current.destination);

    osc.start();
    setTimeout(() => {
      osc.stop();
    }, time);

    // Decay effect for more natural sound
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.current.currentTime + time / 1000
    );
  };

  const startTickingSound = (duration: number) => {
    if (tickInterval.current) clearInterval(tickInterval.current as any);

    const startTime = Date.now();
    let tickIntervalMs = 50; // Start fast
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let tickCount = 0;

    const tickLoop = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        clearInterval(tickInterval.current as any);
        playTickingSound(100, 200, 0.2); // Final "thump" when wheel stops
        return;
      }

      // Adjust tick frequency & volume dynamically
      const progress = elapsed / duration; // 0 (start) → 1 (end)
      const frequency = 800 - progress * 500; // Start high-pitched, end lower
      const volume = Math.max(0.15 - progress * 0.1, 0.02); // Start loud, fade out

      playTickingSound(50, frequency, volume);

      // Dynamically adjust next tick timing
      tickIntervalMs = 50 + progress * 200; // Slows down smoothly
      tickCount++;

      tickInterval.current = setTimeout(tickLoop, tickIntervalMs);
    };

    tickInterval.current = setTimeout(tickLoop, tickIntervalMs);
  };

  const handleCloseFireworks = () => {
    setTimeout(() => {
      setIsShowFireworks(false);
    }, 5000);
  };

  const triggerSpinForPlayer = async (
    playerId: string | null
  ): Promise<void> => {
    return new Promise((resolve) => {
      // 🔹 Generate a random stop position ensuring alignment with the red pointer
      const extraRotation = Math.random() * segmentSize; // Random final stop within a segment
      const totalRotation =
        spinCount * 360 + extraRotation + Math.random() * 100;

      startTickingSound(spinTime); // Adjusted to match spinCount

      gsap.to(wheelContainerRef.current, {
        rotation: `+=${totalRotation}`,
        duration: spinTime / 1000,
        ease: "power4.out",
        onComplete: () => {
          setIsSpinning(false);
          clearTimeout(tickInterval.current as any);
          tickInterval.current = null;
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
          onFinished(segments[calIndex], playerId);

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
                        midAngle + 184
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
        {players.length === 0 && (
          <button
            className="mt-6 absolute bottom-[-60px] bg-blue-500 hover:bg-blue-600 transition cursor-pointer text-white font-semibold rounded-lg px-6 py-2"
            onClick={() => spinWheel()}
          >
            Spin
          </button>
        )}
      </div>
      {isShowFireworks && <Fireworks autorun={{ speed: 3 }} />}
    </>
  );
}
