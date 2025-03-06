import { Server } from "socket.io";

// Store WebSocket server globally
const globalForSocket = global as unknown as { io?: Server };

export const GET = async () => {
  if (!globalForSocket.io) {
    console.log("🔌 Initializing WebSocket server...");
    const io = new Server({
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      console.log("✅ Device connected!");

      socket.on("motionData", (data) => {
        // ✅ Broadcast motion data to all connected clients
        io.emit("updateCursor", data);
      });
    });

    globalForSocket.io = io;
  } else {
    console.log("🟢 WebSocket server already running.");
  }

  return new Response("WebSocket server is running");
};
