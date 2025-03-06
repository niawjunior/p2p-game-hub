import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import { mouse, Point } from "@nut-tree-fork/nut-js";

// Disable Edge runtime (WebSockets need Node.js runtime)
export const runtime = "nodejs";

// Store the WebSocket server globally to persist between requests
const globalForSocket = global as unknown as { io?: Server };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!globalForSocket.io) {
    console.log("🔌 Initializing WebSocket server...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const io = new Server(res.socket as any, {
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      console.log("✅ Device connected!");

      socket.on("motionData", async (data) => {
        try {
          const pos = await mouse.getPosition();
          const newX = pos.x + data.x * 5; // Adjust sensitivity
          const newY = pos.y - data.y * 5; // Invert Y-axis

          await mouse.move([new Point(newX, newY)]);
        } catch (error) {
          console.error("❌ Error moving mouse:", error);
        }
      });
    });

    globalForSocket.io = io; // Store the WebSocket server globally
  } else {
    console.log("🟢 WebSocket server already running.");
  }

  res.end();
}
