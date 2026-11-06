import { Server } from "socket.io";

import { privateUsers } from "../config/users";
import Message from "../models/Message";
import { AuthenticatedSocket } from "./socketAuth";

type MessageType =
  | "text"
  | "image";

interface SendMessageData {
  type?: MessageType;

  text?: string;

  image?: {
    url: string;
    publicId?: string;
    width?: number;
    height?: number;
  };
}

export function registerMessageSocket(
  io: Server,
  socket: AuthenticatedSocket
) {
  if (!socket.user) return;

  const currentUser =
    socket.user;

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  socket.on(
    "send-message",
    async (
      data: SendMessageData
    ) => {
      try {
        const receiver =
          privateUsers.find(
            (user) =>
              user.id !==
              currentUser.id
          );

        if (!receiver) {
          return;
        }

        const type: MessageType =
          data?.type === "image"
            ? "image"
            : "text";

        // ======================================
        // TEXT MESSAGE
        // ======================================

        if (type === "text") {
          const text =
            data?.text?.trim();

          if (!text) {
            return;
          }

          // Save message to MongoDB
          const savedMessage =
            await Message.create({
              senderId:
                currentUser.id,

              receiverId:
                receiver.id,

              type: "text",

              text,

              status: "sent",
            });

          const message = {
            id:
              savedMessage._id.toString(),

            senderId:
              savedMessage.senderId,

            receiverId:
              savedMessage.receiverId,

            type:
              "text" as const,

            text:
              savedMessage.text,

            createdAt:
              savedMessage.createdAt.toISOString(),

            status:
              savedMessage.status,
          };

          // Sender confirmation
          socket.emit(
            "message-sent",
            message
          );

          // Send to receiver
          io.to(
            receiver.id
          ).emit(
            "receive-message",
            message
          );

          return;
        }

        // ======================================
        // IMAGE MESSAGE
        // ======================================

        const imageUrl =
          data?.image?.url?.trim();

        if (!imageUrl) {
          return;
        }

        // Only accept HTTPS image URLs.
        if (
          !imageUrl.startsWith(
            "https://"
          )
        ) {
          return;
        }

        // Save image message to MongoDB
        const savedMessage =
          await Message.create({
            senderId:
              currentUser.id,

            receiverId:
              receiver.id,

            type: "image",

            text: "",

            image: {
              url:
                imageUrl,

              publicId:
                data.image?.publicId ||
                "",

              width:
                data.image?.width,

              height:
                data.image?.height,
            },

            status: "sent",
          });

        const message = {
          id:
            savedMessage._id.toString(),

          senderId:
            savedMessage.senderId,

          receiverId:
            savedMessage.receiverId,

          type:
            "image" as const,

          text: "",

          image: {
            url:
              savedMessage.image?.url,

            publicId:
              savedMessage.image
                ?.publicId,

            width:
              savedMessage.image
                ?.width,

            height:
              savedMessage.image
                ?.height,
          },

          createdAt:
            savedMessage.createdAt.toISOString(),

          status:
            savedMessage.status,
        };

        // Sender confirmation
        socket.emit(
          "message-sent",
          message
        );

        // Send to receiver
        io.to(
          receiver.id
        ).emit(
          "receive-message",
          message
        );
      } catch (error) {
        console.error(
          "Send message error:",
          error
        );

        socket.emit(
          "message-error",
          {
            message:
              "Unable to send message.",
          }
        );
      }
    }
  );

  // ==========================================
  // DELIVERED
  // ==========================================

  socket.on(
    "message-delivered",
    async (data: {
      messageId: string;
      senderId: string;
    }) => {
      try {
        if (
          !data?.messageId ||
          !data?.senderId
        ) {
          return;
        }

        if (
          data.senderId ===
          currentUser.id
        ) {
          return;
        }

        const message =
          await Message.findOne({
            _id:
              data.messageId,

            senderId:
              data.senderId,

            receiverId:
              currentUser.id,
          });

        if (!message) {
          return;
        }

        // Do not downgrade read -> delivered
        if (
          message.status !==
          "read"
        ) {
          message.status =
            "delivered";

          await message.save();
        }

        io.to(
          data.senderId
        ).emit(
          "message-status",
          {
            messageId:
              data.messageId,

            status:
              message.status,
          }
        );
      } catch (error) {
        console.error(
          "Message delivered error:",
          error
        );
      }
    }
  );

  // ==========================================
  // READ
  // ==========================================

  socket.on(
    "message-read",
    async (data: {
      messageId: string;
      senderId: string;
    }) => {
      try {
        if (
          !data?.messageId ||
          !data?.senderId
        ) {
          return;
        }

        if (
          data.senderId ===
          currentUser.id
        ) {
          return;
        }

        const message =
          await Message.findOne({
            _id:
              data.messageId,

            senderId:
              data.senderId,

            receiverId:
              currentUser.id,
          });

        if (!message) {
          return;
        }

        message.status =
          "read";

        await message.save();

        io.to(
          data.senderId
        ).emit(
          "message-status",
          {
            messageId:
              data.messageId,

            status: "read",
          }
        );
      } catch (error) {
        console.error(
          "Message read error:",
          error
        );
      }
    }
  );
}