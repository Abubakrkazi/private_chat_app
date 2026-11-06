import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { privateUsers } from "../config/users";

export const login = (req: Request, res: Response) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({
        success: false,
        message: "Phone number and PIN are required.",
      });
    }

    const normalizedPhone = String(phone).replace(/\D/g, "");

    const user = privateUsers.find(
      (item) =>
        item.phone === normalizedPhone &&
        item.pin === String(pin)
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or PIN.",
      });
    }

    const otherUser = privateUsers.find(
      (item) => item.id !== user.id
    );

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
      },
      secret,
      {
        expiresIn: "30d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },

      contact: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.name,
          }
        : null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};