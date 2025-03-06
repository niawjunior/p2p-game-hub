import { Server } from "socket.io";
import { mouse, Point } from "@nut-tree-fork/nut-js";

// Store WebSocket server globally to prevent reinitialization
const globalForSocket = global as unknown as { io?: Server };

export const GET = async () => {
  if (!globalForSocket.io) {
    console.log("🔌 Initializing WebSocket server...");
    const io = new Server({
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      console.log("✅ Device connected!");

      socket.on("motionData", async (data) => {
        try {
          // Move cursor on Mac
          const pos = await mouse.getPosition();
          const newX = pos.x + data.x * 5; // Adjust sensitivity
          const newY = pos.y - data.y * 5; // Invert Y-axis

          await mouse.move([new Point(newX, newY)]);

          // ✅ Emit updateCursor so `/desktop` can see changes
          io.emit("updateCursor", { x: newX, y: newY });
        } catch (error) {
          console.error("❌ Error moving mouse:", error);
        }
      });
    });

    globalForSocket.io = io; // Store the WebSocket server globally
  } else {
    console.log("🟢 WebSocket server already running.");
  }

  return new Response("WebSocket server is running");
};
