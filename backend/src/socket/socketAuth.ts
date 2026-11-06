import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import { privateUsers } from "../config/users";

interface JwtPayload {
  id: string;
  phone: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name: string;
    phone: string;
  };
}

export function socketAuth(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(new Error("Server configuration error"));
    }

    const decoded = jwt.verify(
      token,
      secret
    ) as JwtPayload;

    const user = privateUsers.find(
      (item) =>
        item.id === decoded.id &&
        item.phone === decoded.phone
    );

    if (!user) {
      return next(new Error("Unauthorized user"));
    }

    socket.user = {
      id: user.id,
      name: user.name,
      phone: user.phone,
    };

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}