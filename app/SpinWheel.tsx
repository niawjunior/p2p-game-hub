"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface SpinWheelProps {
  segments: string[]; // List of challenge texts
  colors: string[]; // Colors for each segment
  spinTime: number; // Dynamic spin time
  spinCount: number; // Number of spins before stopping
  startSpin: boolean; // Trigger spinning
  onFinished: (winner: string) => void; // Callback when spin stops
}

export default function SpinWheel({
  segments,
  colors,
  spinTime,
  spinCount,
  startSpin,
  onFinished,
}: SpinWheelProps) {
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const segmentSize = 360 / segments.length; // Each segment size
  const wheelSize = 300; // Set wheel size

  useEffect(() => {
    if (startSpin && !isSpinning) {
      spinWheel();
    }
  }, [startSpin]);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    // 🔹 Generate a random stop position ensuring alignment with the red pointer
    const extraRotation = Math.random() * segmentSize; // Random final stop within a segment
    const totalRotation = spinCount * 360 + extraRotation;

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
        onFinished(segments[winningIndex]);

        // ✅ Store the new stopping angle
        setCurrentAngle(finalAngle);
      },
    });
  };

  return (
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
                    transform={`rotate(${midAngle + 180}, ${textX}, ${textY})`} // Rotate properly
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
    </div>
  );
}
