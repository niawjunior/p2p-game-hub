"use client";
import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://remote-desktop-three.vercel.app");

export default function PhonePage() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.DeviceMotionEvent) {
      window.addEventListener("devicemotion", (event) => {
        const { accelerationIncludingGravity } = event;
        socket.emit("motionData", {
          x: accelerationIncludingGravity?.x,
          y: accelerationIncludingGravity?.y,
        });
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <h1 className="text-2xl">Move your phone to control the cursor!</h1>
    </div>
  );
}
