import {
  Schema,
  model,
} from "mongoose";

export type MessageStatus =
  | "sent"
  | "delivered"
  | "read";

export type MessageType =
  | "text"
  | "image";

const messageSchema =
  new Schema(
    {
      senderId: {
        type: String,
        required: true,
        index: true,
      },

      receiverId: {
        type: String,
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "text",
          "image",
        ],
        default: "text",
        required: true,
      },

      text: {
        type: String,
        default: "",
      },

      image: {
        url: {
          type: String,
          default: "",
        },

        publicId: {
          type: String,
          default: "",
        },

        width: {
          type: Number,
        },

        height: {
          type: Number,
        },
      },

      status: {
        type: String,
        enum: [
          "sent",
          "delivered",
          "read",
        ],
        default: "sent",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

// ==========================================
// INDEX
// ==========================================

messageSchema.index({
  senderId: 1,
  receiverId: 1,
  createdAt: 1,
});

// ==========================================
// MODEL
// ==========================================

const Message =
  model(
    "Message",
    messageSchema
  );

export default Message;