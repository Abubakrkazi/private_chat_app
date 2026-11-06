import { Router } from "express";

import { uploadPhoto } from "../controllers/upload.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";

const router = Router();

router.post(
  "/image",
  authenticateToken,
  uploadImage.single("image"),
  uploadPhoto
);

export default router;