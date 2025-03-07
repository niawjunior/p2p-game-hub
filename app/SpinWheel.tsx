"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface SpinWheelProps {
  segments: string[]; // List of challenge texts
  colors: string[]; // Colors for each segment
  spinTime: number; // Dynamic spin time
  spinCount: number; // Dynamic number of spins
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

  useEffect(() => {
    if (startSpin && !isSpinning) {
      spinWheel();
    }
  }, [startSpin]);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const totalRotation = spinCount * 360 + Math.random() * 360;
    const finalAngle = (currentAngle + totalRotation) % 360;

    gsap.to(wheelContainerRef.current, {
      rotation: `+=${totalRotation}`,
      duration: spinTime / 1000,
      ease: "power4.out",
      onComplete: () => {
        setIsSpinning(false);

        // Determine winning segment
        const segmentSize = 360 / segments.length;
        const pointerAngle = 0; // Pointer is always at 0°
        const winningIndex =
          (segments.length -
            Math.floor((finalAngle + pointerAngle) / segmentSize)) %
          segments.length;

        console.log(
          "🎯 Winning Index:",
          winningIndex,
          "Segment:",
          segments[winningIndex]
        );

        // Send winning result
        onFinished(segments[winningIndex]);

        // Store final rotation
        setCurrentAngle(finalAngle);
      },
    });
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Wheel Container (Spins) */}
      <div ref={wheelContainerRef} className="relative">
        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          className="rounded-full"
        >
          <g transform="translate(150, 150)">
            {segments.map((segment, index) => {
              const startAngle = (index * 360) / segments.length;
              const endAngle = ((index + 1) * 360) / segments.length;
              const x1 = 150 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 150 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 150 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 150 * Math.sin((endAngle * Math.PI) / 180);

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
                    x={
                      75 *
                      Math.cos(((startAngle + endAngle) / 2) * (Math.PI / 180))
                    }
                    y={
                      75 *
                      Math.sin(((startAngle + endAngle) / 2) * (Math.PI / 180))
                    }
                    fill="white"
                    fontFamily="Kanit"
                    fontSize="14"
                    textAnchor="middle"
                    transform={`rotate(${(startAngle + endAngle) / 2}, 0, 0)`}
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
