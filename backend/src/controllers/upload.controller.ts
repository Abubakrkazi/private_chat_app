import { Request, Response } from "express";
import { Readable } from "stream";

import cloudinary from "../config/cloudinary";

export const uploadPhoto = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
    }>((resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder: "private-chat",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary upload failed."
                )
              );
              return;
            }

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        );

      Readable.from(
        req.file.buffer
      ).pipe(uploadStream);
    });

    return res.status(200).json({
      success: true,

      image: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    });
  } catch (error) {
    console.error(
      "Image upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Image upload failed.",
    });
  }
};