"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface SpinWheelProps {
  segments: string[]; // List of challenge texts
  colors: string[]; // Colors for each segment
  spinTime: number; // Dynamic spin time
  spinCount: number; // Dynamic number of spins
  onFinished: (winner: string) => void; // Callback when spin stops
  startSpin: boolean; // New: Start spinning trigger
}

export default function SpinWheel({
  segments,
  colors,
  spinTime,
  spinCount,
  onFinished,
  startSpin,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);

  useEffect(() => {
    if (startSpin && !isSpinning) {
      spinWheel();
    }
  }, [startSpin]); // Watch for `startSpin` changes

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const totalRotation = spinCount * 360 + Math.random() * 360; // Add randomness
    const finalAngle = (currentAngle + totalRotation) % 360; // Keep rotation within bounds

    gsap.to(wheelContainerRef.current, {
      rotation: `+=${totalRotation}`,
      duration: spinTime / 1000,
      ease: "power4.out",
      onComplete: () => {
        setIsSpinning(false);

        // Determine winning segment based on final angle
        const segmentSize = 360 / segments.length;
        const winningIndex =
          Math.floor((360 - (finalAngle % 360)) / segmentSize) %
          segments.length;

        console.log(
          "🎯 Winning Index:",
          winningIndex,
          "Segment:",
          segments[winningIndex]
        );

        // Callback with winning result
        onFinished(segments[winningIndex]);

        // Update current angle
        setCurrentAngle(finalAngle);
      },
    });
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawWheel = () => {
      const radius = canvas.width / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "12px Kanit";
      ctx.textAlign = "center";

      segments.forEach((segment, index) => {
        const startAngle = (index * 2 * Math.PI) / segments.length;
        const endAngle = ((index + 1) * 2 * Math.PI) / segments.length;
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startAngle, endAngle);
        ctx.fillStyle = colors[index];
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startAngle + (endAngle - startAngle) / 2);
        ctx.fillStyle = "white";
        ctx.fillText(segment, radius / 1.5, 10);
        ctx.restore();
      });
    };

    drawWheel();
  }, [segments, colors]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Wheel Container (Spins) */}
      <div ref={wheelContainerRef} className="relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-full"
        />
      </div>

      {/* Fixed Red Pointer */}
      <div className="absolute top-0 flex justify-center items-center">
        <div className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-transparent border-b-red-500"></div>
      </div>

      {/* Hidden button to trigger spin externally */}
      <button className="hidden" onClick={spinWheel} disabled={isSpinning}>
        Spin (Hidden)
      </button>
    </div>
  );
}
