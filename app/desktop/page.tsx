"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://remote-desktop-three.vercel.app/api/socket");

export default function DesktopPage() {
  const [motion, setMotion] = useState({ x: 0, y: 0 });
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("updateCursor", (data) => {
      setMotion(data);
      moveCursor(data.x, data.y);
    });

    return () => {
      socket.off("updateCursor");
    };
  }, []);

  const moveCursor = (x: number, y: number) => {
    if (cursorRef.current) {
      // Adjust sensitivity
      cursorRef.current.style.transform = `translate(${x * 5}px, ${-y * 5}px)`;
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl">Receiving Motion Data</h1>
      <p className="text-lg mt-4">X: {motion.x.toFixed(2)}</p>
      <p className="text-lg">Y: {motion.y.toFixed(2)}</p>

      {/* Virtual cursor */}
      <div
        ref={cursorRef}
        className="absolute w-6 h-6 bg-red-500 rounded-full transition-transform duration-50"
        style={{ top: "50%", left: "50%" }}
      />
    </div>
  );
}
