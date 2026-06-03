import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // ── Socket.IO setup ──────────────────────────────────────────────────────
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // ── Redis adapter — enables multi-instance socket coordination ───────────
  // Interview talking point:
  //   "We use a Redis pub/sub adapter so any server instance can broadcast
  //    to all connected clients. This makes the socket layer horizontally
  //    scalable — you can add more instances behind a load balancer."
  const pubClient = createClient({
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  console.log("✅ Redis adapter connected");

  // ── Socket.IO events ─────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on("join-workspace", (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`[socket] ${socket.id} joined workspace:${workspaceId}`);
    });

    socket.on("leave-workspace", (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    // Forward events to all other members in the workspace room
    socket.on("task-moved", (payload: any) => {
      const rooms = Array.from(socket.rooms).filter((r) => r.startsWith("workspace:"));
      rooms.forEach((room) => {
        socket.to(room).emit("task-moved", payload);
      });
    });

    socket.on("task-created", (payload: any) => {
      const rooms = Array.from(socket.rooms).filter((r) => r.startsWith("workspace:"));
      rooms.forEach((room) => {
        socket.to(room).emit("task-created", payload);
      });
    });

    socket.on("task-deleted", (payload: any) => {
      const rooms = Array.from(socket.rooms).filter((r) => r.startsWith("workspace:"));
      rooms.forEach((room) => {
        socket.to(room).emit("task-deleted", payload);
      });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  // Attach io to global so API routes can emit events
  (global as any).io = io;

  // ── Start server ──────────────────────────────────────────────────────────
  const PORT = parseInt(process.env.PORT ?? "3000", 10);
  httpServer.listen(PORT, () => {
    console.log(`🚀 ProjectFlow running on http://localhost:${PORT}`);
  });
});