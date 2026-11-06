import {
  Request,
  Response,
} from "express";

import Message from "../models/Message";

// ==========================================
// GET CHAT HISTORY
// ==========================================

export async function getMessages(
  req: Request,
  res: Response
) {
  try {
    const user =
      (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const messages =
      await Message.find({
        $or: [
          {
            senderId: user.id,
          },
          {
            receiverId: user.id,
          },
        ],
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    const formattedMessages =
      messages.map(
        (message: any) => ({
          id:
            message._id.toString(),

          senderId:
            message.senderId,

          receiverId:
            message.receiverId,

          type:
            message.type,

          text:
            message.text || "",

          image:
            message.image,

          status:
            message.status,

          createdAt:
            message.createdAt,
        })
      );

    return res.status(200).json({
      success: true,
      messages:
        formattedMessages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load messages.",
    });
  }
}