import "dotenv/config";

import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";

import { connectDatabase } from "./config/database";

import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";
import messageRoutes from "./routes/message.routes";

import {
  AuthenticatedSocket,
  socketAuth,
} from "./socket/socketAuth";

import { registerMessageSocket } from "./socket/message.socket";
import { registerCallSocket } from "./socket/call.socket";

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

const PORT =
  Number(process.env.PORT) || 5000;

// ==========================================
// EXPRESS MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message:
      "Private Chat API is running",
  });
});

// ==========================================
// ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/upload",
  uploadRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

// ==========================================
// HTTP SERVER
// ==========================================

const httpServer =
  http.createServer(app);

// ==========================================
// SOCKET.IO SERVER
// ==========================================

const io = new Server(
  httpServer,
  {
    cors: {
      origin:
        "http://localhost:3000",

      credentials: true,
    },
  }
);

// ==========================================
// SOCKET AUTHENTICATION
// ==========================================

io.use(socketAuth);

// ==========================================
// ONLINE USER TRACKING
// ==========================================

// userId -> number of active
// tabs/devices/connections

const onlineUsers =
  new Map<string, number>();

function addOnlineUser(
  userId: string
) {
  const currentConnections =
    onlineUsers.get(userId) || 0;

  onlineUsers.set(
    userId,
    currentConnections + 1
  );
}

function removeOnlineUser(
  userId: string
) {
  const currentConnections =
    onlineUsers.get(userId) || 0;

  if (
    currentConnections <= 1
  ) {
    onlineUsers.delete(userId);
    return;
  }

  onlineUsers.set(
    userId,
    currentConnections - 1
  );
}

function isUserOnline(
  userId: string
) {
  return onlineUsers.has(
    userId
  );
}

// ==========================================
// SOCKET CONNECTION
// ==========================================

io.on(
  "connection",
  (
    socket: AuthenticatedSocket
  ) => {
    // ======================================
    // CHECK AUTHENTICATED USER
    // ======================================

    if (!socket.user) {
      socket.disconnect(true);
      return;
    }

    const user =
      socket.user;

    // ======================================
    // JOIN USER ROOM
    // ======================================

    socket.join(
      user.id
    );

    // ======================================
    // MARK USER ONLINE
    // ======================================

    addOnlineUser(
      user.id
    );

    console.log(
      `${user.name} connected: ${socket.id}`
    );

    console.log(
      "Online users:",
      Array.from(
        onlineUsers.keys()
      )
    );

    // ======================================
    // SEND CURRENT PRESENCE
    // ======================================

    socket.emit(
      "presence-list",
      {
        onlineUserIds:
          Array.from(
            onlineUsers.keys()
          ),
      }
    );

    // ======================================
    // NOTIFY OTHER USER
    // ======================================

    socket.broadcast.emit(
      "presence-update",
      {
        userId:
          user.id,

        online: true,
      }
    );

    // ======================================
    // MESSAGE EVENTS
    // ======================================

    registerMessageSocket(
      io,
      socket
    );

    // ======================================
    // AUDIO / VIDEO CALL EVENTS
    // ======================================

    registerCallSocket(
      io,
      socket
    );

    // ======================================
    // DISCONNECT
    // ======================================

    socket.on(
      "disconnect",
      () => {
        removeOnlineUser(
          user.id
        );

        const stillOnline =
          isUserOnline(
            user.id
          );

        console.log(
          `${user.name} disconnected: ${socket.id}`
        );

        console.log(
          "Online users:",
          Array.from(
            onlineUsers.keys()
          )
        );

        // Only mark offline when
        // every connection belonging
        // to this user is disconnected.

        if (!stillOnline) {
          socket.broadcast.emit(
            "presence-update",
            {
              userId:
                user.id,

              online: false,
            }
          );
        }
      }
    );
  }
);

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
  try {
    // Connect MongoDB first
    await connectDatabase();

    // Start HTTP + Socket.IO server
    httpServer.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `Private Chat API running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Server startup failed:",
      error
    );

    process.exit(1);
  }
}

startServer();