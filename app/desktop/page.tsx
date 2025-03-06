"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://remote-desktop-three.vercel.app");

export default function DesktopPage() {
  const [motion, setMotion] = useState({ x: 0, y: 0 });

  useEffect(() => {
    socket.on("updateCursor", (data) => {
      setMotion(data);
    });

    return () => {
      socket.off("updateCursor");
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl">Receiving Motion Data</h1>
      <p className="text-lg mt-4">X: {motion.x.toFixed(2)}</p>
      <p className="text-lg">Y: {motion.y.toFixed(2)}</p>
    </div>
  );
}
